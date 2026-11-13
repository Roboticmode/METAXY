import { business, catalog, policies } from "@/lib/agent/data";
import { NEXT_MONDAY, TOMORROW } from "@/lib/agent/planner";
import { rand } from "@/lib/agent/tools";
import type { SchoolKind, Tab } from "@/lib/agent/types";
import { ANCHORS, confirmFor, describeAction } from "./describe";
import type { AssistantResponse, HistoryItem, Snapshot, UiAction } from "./types";

/**
 * LLM path for the owner's console: OpenAI / Grok chat completions with one tool per UiAction.
 * Same request style as src/lib/agent/brain.ts. Any failure is thrown so the route can fall back
 * to the scripted router.
 */

const XAI_URL = "https://api.x.ai/v1/chat/completions";
const openaiUrl = () => `${(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "")}/chat/completions`;
const supportsTemperature = (model: string) => !/^(o[134]|gpt-5)/i.test(model);
const TABS: Tab[] = ["operations", "whatsapp", "compliance", "opportunities", "crm"];
const PACKAGES = Object.keys(catalog);
const SCHOOL_KINDS: SchoolKind[] = ["lecture", "assignment", "test", "capstone", "exam", "study"];
const ISO = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "ISO date yyyy-mm-dd" };

const fn = (name: string, description: string, properties: Record<string, unknown> = {}, required: string[] = []) => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required, additionalProperties: false } },
});

const TOOLS = [
  fn("navigate", "Switch the dashboard to a module.", { tab: { type: "string", enum: TABS } }, ["tab"]),
  fn("open_chat", "Open a client's WhatsApp chat in the phone panel.", { customerId: { type: "string" } }, ["customerId"]),
  fn("open_compliance_task", "Open a compliance task's detail in the Compliance module.", { taskId: { type: "string" } }, ["taskId"]),
  fn("focus", "Scroll a panel into view and highlight it for 2 seconds.", { anchorId: { type: "string", enum: Object.keys(ANCHORS) } }, ["anchorId"]),
  fn("set_columns", "Show or hide the left sidebar and/or the right phone panel.", { left: { type: "boolean" }, right: { type: "boolean" } }),
  fn("prepare_compliance", "Prepare a compliance task's paperwork from the document vault (the owner still signs, pays and submits).", { taskId: { type: "string" } }, ["taskId"]),
  fn("check_collisions", "Planner scan: compare client delivery dates with fixed university dates and draft a two-sided fix for the owner to approve. Sends nothing."),
  fn("chase_overdue", "Books scan: find the most overdue invoice and draft a polite EFT reminder for the owner to approve. Sends nothing."),
  fn("simulate_customer", "Demo helper: play a client's WhatsApp message into the simulator.", { customerId: { type: "string" }, text: { type: "string" } }, ["customerId", "text"]),
  fn("run_automations", "ASK-FIRST. Send today's due WhatsApp deposit reminders, project updates and client check-ins. The owner must confirm before it runs."),
  fn(
    "decide_approval",
    "ASK-FIRST. Approve (sends the drafted message) or hold a pending drafted decision from STATE.approvals. The owner must confirm before it runs.",
    { approvalId: { type: "string" }, decision: { type: "string", enum: ["allow", "refuse"] } },
    ["approvalId", "decision"],
  ),
  fn(
    "send_owner_message",
    "ASK-FIRST. Send a WhatsApp message to a client as the owner, using the owner's exact words. The owner must confirm before it is sent.",
    { customerId: { type: "string" }, text: { type: "string" } },
    ["customerId", "text"],
  ),
  fn(
    "add_client",
    "Client Desk: add a NEW client / lead to the CRM (internal, runs alone). If packages are given it also drafts the project and quote; the quote is held for approval.",
    {
      name: { type: "string", description: "person's full name as the owner gave it" },
      business: { type: "string" },
      phone: { type: "string" },
      packages: { type: "array", items: { type: "string", enum: PACKAGES } },
      dueDate: ISO,
    },
    ["name", "business"],
  ),
  fn(
    "create_project",
    "Client Desk + Planner + Books: draft a project for an EXISTING client with catalogue deliverables, price and a 50% deposit; Planner picks an honest delivery date. The quote and deposit invoice are held for approval.",
    { customerId: { type: "string" }, packages: { type: "array", items: { type: "string", enum: PACKAGES }, minItems: 1 }, dueDate: ISO, title: { type: "string" } },
    ["customerId", "packages"],
  ),
  fn(
    "log_payment",
    "Books: record that a client paid an invoice from STATE.invoices (the owner says it came in). Marks it paid, adds a CRM reliability note and drafts a thank-you held for approval. Never moves money.",
    { invoiceId: { type: "string" } },
    ["invoiceId"],
  ),
  fn(
    "schedule_school_item",
    "Planner: capture a new university deadline, or a moved one (moveId = id from STATE.school). Drafts the calendar change for approval; collisions are re-checked after.",
    {
      moveId: { type: "string" },
      module: { type: "string", description: "e.g. IS302 Databases" },
      title: { type: "string" },
      kind: { type: "string", enum: SCHOOL_KINDS },
      date: ISO,
      hours: { type: "number", minimum: 1, maximum: 12 },
    },
    ["module", "title", "kind", "date", "hours"],
  ),
  fn(
    "plan_study_blocks",
    "Planner: propose study blocks before a test/exam (targetId from STATE.school, or omit for the next one), only where client work leaves room. Adding them waits for approval.",
    { targetId: { type: "string" } },
  ),
  fn("capacity_plan", `Planner: one-page week (free vs committed hours, deliveries, collision risks). weekStart is the first day; "next week" is ${NEXT_MONDAY}.`, { weekStart: ISO }, ["weekStart"]),
  fn("set_exam_mode", "Planner: switch Exam Mode on or off (pauses new intake until 5 Dec). When on, it drafts a pause notice per active client, held for approval.", { active: { type: "boolean" } }, ["active"]),
];

const SYSTEM = (snap: Snapshot) => `You are METAXY, the owner's assistant inside the command centre of ${business.name}, run by ${business.owner} (${business.degree}) around her studies. Today is Friday 13 November 2026.
You talk to the OWNER, not to clients. You can move around the dashboard with tools: switch modules, open chats and compliance tasks, highlight panels, prepare compliance packs, and run the Planner (deadline clashes) and Books (overdue invoices) scans, which only draft decisions. You can also capture data the owner gives you: new clients and quotes (Client Desk), payments received (Books), school deadlines, study blocks, weekly capacity and Exam Mode (Planner).
Rules (agents prepare, the owner decides):
- Do alone: navigate, open, highlight, summarise, explain, prepare, run scans that draft.
- Ask first (run_automations, decide_approval, send_owner_message): call the tool; the owner sees a confirmation card and must click Confirm. Never say these already happened; say they are ready for the owner to confirm.
- Data capture (add_client, create_project, log_payment, schedule_school_item, plan_study_blocks, capacity_plan, set_exam_mode) runs alone because it only changes internal records or drafts. Anything external or binding it produces (quote + deposit invoice, thank-you, calendar change, exam notices) is held as an approval for the owner. Say what you drafted and that it waits for their OK.
- Only use catalogue packages and prices. If a client, invoice, package, module or date is missing or ambiguous, ask one short question instead of guessing.
- "Paid" means the owner received money: log_payment. Never move money, refund, or pay anyone.
- Never: write, edit or submit university coursework (assignments, tests, capstone, exams), submit filings, move money, invent prices/dates/policies, share one client's details with another, write text for a client that the owner didn't dictate.
- Two clients are both called Kagiso (Mokoena of Kasi Brew Coffee, Molefe of Molefe Logistics). If the owner just says "Kagiso", ask which one.
- If you can't do something with the tools, say "I can't do that yet" plainly.
- Use only ids that appear in STATE. When you open something, also call focus on the matching panel (${Object.keys(ANCHORS).join(", ")}).
- Always include a brief, natural reply to the owner alongside any tool calls.
Style: brief (max 4 short sentences or a short bullet list), plain South African English, no emoji, no em dashes.
Studio packages: ${Object.entries(catalog).map(([k, v]) => `${k} ${rand(v.price)} (${v.hours}h)`).join(", ")}.
Studio policies:
${policies.map((p) => `- ${p.code}: ${p.rule}`).join("\n")}
STATE:
${JSON.stringify(snap)}`;

type ToolCall = { function?: { name?: string; arguments?: string } };

/** Keep only well-formed actions that point at things that exist. */
export function validate(name: string, args: Record<string, unknown>, snap: Snapshot): UiAction | null {
  const str = (k: string) => (typeof args[k] === "string" ? (args[k] as string) : "");
  const customer = (id: string) => snap.customers.some((c) => c.id === id);
  const task = (id: string) => snap.compliance.some((t) => t.id === id);
  switch (name) {
    case "navigate":
      return TABS.includes(str("tab") as Tab) ? { type: "navigate", tab: str("tab") as Tab } : null;
    case "open_chat":
      return customer(str("customerId")) ? { type: "open_chat", customerId: str("customerId") } : null;
    case "open_compliance_task":
      return task(str("taskId")) ? { type: "open_compliance_task", taskId: str("taskId") } : null;
    case "focus":
      return str("anchorId") in ANCHORS ? { type: "focus", anchorId: str("anchorId") } : null;
    case "set_columns": {
      const a: UiAction = { type: "set_columns" };
      if (typeof args.left === "boolean") a.left = args.left;
      if (typeof args.right === "boolean") a.right = args.right;
      return a.left === undefined && a.right === undefined ? null : a;
    }
    case "prepare_compliance":
      return task(str("taskId")) ? { type: "prepare_compliance", taskId: str("taskId") } : null;
    case "check_collisions":
      return { type: "check_collisions" };
    case "chase_overdue":
      return { type: "chase_overdue" };
    case "simulate_customer":
      return customer(str("customerId")) && str("text") ? { type: "simulate_customer", customerId: str("customerId"), text: str("text") } : null;
    case "run_automations":
      return { type: "run_automations" };
    case "decide_approval":
      return snap.approvals.some((p) => p.id === str("approvalId")) && (args.decision === "allow" || args.decision === "refuse")
        ? { type: "decide_approval", approvalId: str("approvalId"), decision: args.decision }
        : null;
    case "send_owner_message":
      return customer(str("customerId")) && str("text").trim() ? { type: "send_owner_message", customerId: str("customerId"), text: str("text").trim() } : null;
    case "add_client": {
      const name = str("name").trim();
      const biz = str("business").trim();
      if (!name || !biz || snap.customers.some((c) => c.name.toLowerCase() === name.toLowerCase() || c.business.toLowerCase() === biz.toLowerCase())) return null;
      const pk = packages(args.packages);
      const due = date(str("dueDate"));
      return { type: "add_client", name, business: biz, ...(str("phone").trim() ? { phone: str("phone").trim() } : {}), ...(pk.length ? { packages: pk } : {}), ...(due ? { dueDate: due } : {}) };
    }
    case "create_project": {
      const pk = packages(args.packages);
      const due = date(str("dueDate"));
      return customer(str("customerId")) && pk.length
        ? { type: "create_project", customerId: str("customerId"), packages: pk, ...(due ? { dueDate: due } : {}), ...(str("title").trim() ? { title: str("title").trim().slice(0, 60) } : {}) }
        : null;
    }
    case "log_payment": {
      const inv = snap.invoices.find((i) => i.id === str("invoiceId"));
      return inv && inv.status !== "paid" ? { type: "log_payment", invoiceId: inv.id } : null;
    }
    case "schedule_school_item": {
      const d = date(str("date"));
      const kind = str("kind") as SchoolKind;
      const hours = typeof args.hours === "number" ? Math.min(12, Math.max(1, Math.round(args.hours))) : 0;
      const move = str("moveId") ? (snap.school ?? []).find((s) => s.id === str("moveId")) : undefined;
      if (!d || (str("moveId") && !move)) return null;
      if (move) return { type: "schedule_school_item", moveId: move.id, module: move.module, title: move.title, kind: move.kind, date: d, hours: move.hours };
      return SCHOOL_KINDS.includes(kind) && str("module").trim() && str("title").trim() && hours
        ? { type: "schedule_school_item", module: str("module").trim(), title: str("title").trim().slice(0, 60), kind, date: d, hours }
        : null;
    }
    case "plan_study_blocks": {
      const id = str("targetId");
      if (!id) return { type: "plan_study_blocks" };
      return (snap.school ?? []).some((s) => s.id === id) ? { type: "plan_study_blocks", targetId: id } : null;
    }
    case "capacity_plan":
      return { type: "capacity_plan", weekStart: date(str("weekStart"), true) ?? NEXT_MONDAY };
    case "set_exam_mode":
      return typeof args.active === "boolean" ? { type: "set_exam_mode", active: args.active } : null;
  }
  return null;
}

/** Only real catalogue packages. */
function packages(v: unknown): string[] {
  return Array.isArray(v) ? [...new Set(v.filter((p): p is string => typeof p === "string" && PACKAGES.includes(p)))] : [];
}

/** A valid ISO date from tomorrow on (or today, for a capacity week). */
function date(s: string, allowToday = false): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) return undefined;
  return s >= (allowToday ? "2026-11-13" : TOMORROW) ? s : undefined;
}

type ProviderConfig = {
  engine: "openai" | "grok";
  label: string;
  url: string;
  apiKey: string;
  model: string;
};

async function askProvider(provider: ProviderConfig, message: string, history: HistoryItem[], snap: Snapshot): Promise<AssistantResponse> {
  const res = await fetch(provider.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({
      model: provider.model,
      ...(supportsTemperature(provider.model) ? { temperature: 0.3 } : {}),
      tools: TOOLS,
      tool_choice: "auto",
      messages: [
        { role: "system", content: SYSTEM(snap) },
        ...history.slice(-8).map((h) => ({ role: h.role, content: h.text })),
        { role: "user", content: message },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`${provider.label} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const msg = data.choices?.[0]?.message ?? {};
  const calls: ToolCall[] = msg.tool_calls ?? [];

  const actions: UiAction[] = [];
  for (const c of calls) {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(c.function?.arguments || "{}");
    } catch {
      continue;
    }
    const a = validate(c.function?.name ?? "", args, snap);
    if (a) actions.push(a);
  }

  const rawReply = String(msg.content ?? "").trim();
  if (!rawReply && !actions.length) throw new Error(`${provider.label} returned nothing usable`);

  const confirm = confirmFor(actions, snap);
  const immediateActions = actions.filter((a) => !confirm?.actions.includes(a));
  const fallbackSummary = confirm
    ? "Ready for your go-ahead below."
    : immediateActions
        .filter((a) => a.type !== "focus")
        .map((a) => describeAction(a, snap))
        .join(". ") || "Done.";

  return {
    engine: provider.engine,
    reply: rawReply || fallbackSummary,
    actions: immediateActions,
    confirm,
  };
}

export async function askOpenAI(message: string, history: HistoryItem[], snap: Snapshot): Promise<AssistantResponse> {
  return askProvider(
    {
      engine: "openai",
      label: "OpenAI",
      url: openaiUrl(),
      apiKey: process.env.OPENAI_API_KEY ?? "",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },
    message,
    history,
    snap,
  );
}

export async function askGrok(message: string, history: HistoryItem[], snap: Snapshot): Promise<AssistantResponse> {
  return askProvider(
    {
      engine: "grok",
      label: "xAI",
      url: XAI_URL,
      apiKey: process.env.XAI_API_KEY ?? "",
      model: process.env.GROK_MODEL || "grok-4",
    },
    message,
    history,
    snap,
  );
}

export function resolveAssistantProvider(): "openai" | "grok" | "scripted" {
  const pref = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (pref === "scripted" || pref === "mock") return "scripted";
  if (pref === "grok" && process.env.XAI_API_KEY) return "grok";
  if (pref === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.XAI_API_KEY) return "grok";
  return "scripted";
}
