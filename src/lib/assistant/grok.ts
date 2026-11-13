import { business, catalog, policies } from "@/lib/agent/data";
import { NEXT_MONDAY } from "@/lib/agent/planner";
import { rand } from "@/lib/agent/tools";
import type { Tab } from "@/lib/agent/types";
import { ANCHORS, confirmFor, describeAction } from "./describe";
import type { AssistantResponse, HistoryItem, Snapshot, UiAction } from "./types";
import { PACKAGES, SCHOOL_KINDS, validate } from "./validate";

export { validate };

/**
 * LLM path for the owner's console:
 * - OpenAI: Responses API (/v1/responses) defaulting to gpt-6-luna with reasoning.effort = "high"
 * - Grok (xAI): Chat Completions API
 * Any failure is thrown so the route can fall back to the offline scripted router.
 */

export const DEFAULT_OPENAI_MODEL = "gpt-6-luna";
export const DEFAULT_OPENAI_REASONING_EFFORT = "high";
export const DEFAULT_OPENAI_LIVE_MODEL = "gpt-live-1";

const XAI_URL = "https://api.x.ai/v1/chat/completions";
export const openaiBaseUrl = () => (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");

export const supportsReasoningEffort = (model: string) => /^(o[134]|gpt-5|gpt-6)/i.test(model);
const supportsTemperature = (model: string, effort: string | null) => !supportsReasoningEffort(model) || effort === "none";

export function resolveOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function resolveReasoningEffort(model: string): "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | null {
  if (!supportsReasoningEffort(model)) return null;
  const raw = process.env.OPENAI_REASONING_EFFORT?.trim().toLowerCase();
  if (raw === "none" || raw === "minimal" || raw === "low" || raw === "medium" || raw === "high" || raw === "xhigh" || raw === "max") {
    return raw;
  }
  return DEFAULT_OPENAI_REASONING_EFFORT;
}

const TABS: Tab[] = ["operations", "whatsapp", "compliance", "opportunities", "crm"];
const ISO = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "ISO date yyyy-mm-dd" };

type ToolSpec = {
  name: string;
  description: string;
  properties: Record<string, unknown>;
  required: string[];
};

const spec = (name: string, description: string, properties: Record<string, unknown> = {}, required: string[] = []): ToolSpec => ({
  name,
  description,
  properties,
  required,
});

const UI_TOOL_SPECS: ToolSpec[] = [
  spec("navigate", "Switch the dashboard to a module.", { tab: { type: "string", enum: TABS } }, ["tab"]),
  spec("open_chat", "Open a client's WhatsApp chat in the phone panel.", { customerId: { type: "string" } }, ["customerId"]),
  spec("open_compliance_task", "Open a compliance task's detail in the Compliance module.", { taskId: { type: "string" } }, ["taskId"]),
  spec("focus", "Scroll a panel into view and highlight it for 2 seconds.", { anchorId: { type: "string", enum: Object.keys(ANCHORS) } }, ["anchorId"]),
  spec("set_columns", "Show or hide the left sidebar and/or the right phone panel.", { left: { type: "boolean" }, right: { type: "boolean" } }),
  spec("prepare_compliance", "Prepare a compliance task's paperwork from the document vault (the owner still signs, pays and submits).", { taskId: { type: "string" } }, ["taskId"]),
  spec("check_collisions", "Planner scan: compare client delivery dates with fixed university dates and draft a two-sided fix for the owner to approve. Sends nothing."),
  spec("chase_overdue", "Books scan: find the most overdue invoice and draft a polite EFT reminder for the owner to approve. Sends nothing."),
  spec("simulate_customer", "Demo helper: play a client's WhatsApp message into the simulator.", { customerId: { type: "string" }, text: { type: "string" } }, ["customerId", "text"]),
  spec("run_automations", "ASK-FIRST. Send today's due WhatsApp deposit reminders, project updates and client check-ins. The owner must confirm before it runs."),
  spec(
    "decide_approval",
    "ASK-FIRST. Approve (sends the drafted message) or hold a pending drafted decision from STATE.approvals. The owner must confirm before it runs.",
    { approvalId: { type: "string" }, decision: { type: "string", enum: ["allow", "refuse"] } },
    ["approvalId", "decision"],
  ),
  spec(
    "send_owner_message",
    "ASK-FIRST. Send a WhatsApp message to a client as the owner, using the owner's exact words. The owner must confirm before it is sent.",
    { customerId: { type: "string" }, text: { type: "string" } },
    ["customerId", "text"],
  ),
  spec(
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
  spec(
    "create_project",
    "Client Desk + Planner + Books: draft a project for an EXISTING client with catalogue deliverables, price and a 50% deposit; Planner picks an honest delivery date. The quote and deposit invoice are held for approval.",
    { customerId: { type: "string" }, packages: { type: "array", items: { type: "string", enum: PACKAGES }, minItems: 1 }, dueDate: ISO, title: { type: "string" } },
    ["customerId", "packages"],
  ),
  spec(
    "log_payment",
    "Books: record that a client paid an invoice from STATE.invoices (the owner says it came in). Marks it paid, adds a CRM reliability note and drafts a thank-you held for approval. Never moves money.",
    { invoiceId: { type: "string" } },
    ["invoiceId"],
  ),
  spec(
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
  spec(
    "plan_study_blocks",
    "Planner: propose study blocks before a test/exam (targetId from STATE.school, or omit for the next one), only where client work leaves room. Adding them waits for approval.",
    { targetId: { type: "string" } },
  ),
  spec("capacity_plan", `Planner: one-page week (free vs committed hours, deliveries, collision risks). weekStart is the first day; "next week" is ${NEXT_MONDAY}.`, { weekStart: ISO }, ["weekStart"]),
  spec("set_exam_mode", "Planner: switch Exam Mode on or off (pauses new intake until 5 Dec). When on, it drafts a pause notice per active client, held for approval.", { active: { type: "boolean" } }, ["active"]),
  spec("present_slide", "Presenter mode: show slide n of the 12-slide pitch deck (opens presenter mode if it is off).", { n: { type: "integer", minimum: 1, maximum: 12 } }, ["n"]),
  spec("next_slide", "Presenter mode: advance the pitch deck one slide."),
  spec("prev_slide", "Presenter mode: go back one slide."),
  spec("show_demo", "Presenter mode: hide the deck and show the live dashboard for the demo (one action)."),
  spec("show_slides", "Presenter mode: bring the deck back over the dashboard, on the current slide."),
  spec("end_presenter", "Leave presenter mode and close the deck."),
];

/** Live path only (the typed path gets the same data in STATE.presenter). */
const SLIDE_READER_SPEC = spec(
  "get_slide",
  "Presenter mode: read the current slide number, title, speaker notes (data-notes), timing (data-time), the scripted line to say, and whether the deck or the live demo is showing.",
);

const STATE_READER_SPEC = spec(
  "get_dashboard_state",
  "Read the latest live dashboard state (active tab, open chat, pending approvals, projects, invoices, deadline collisions, university dates, compliance tasks, automations). Call this whenever you need current information after earlier changes.",
);

export function toResponsesTools(includeStateReader = false) {
  const list = includeStateReader ? [...UI_TOOL_SPECS, STATE_READER_SPEC, SLIDE_READER_SPEC] : UI_TOOL_SPECS;
  return list.map((t) => ({
    type: "function" as const,
    name: t.name,
    description: t.description,
    strict: false,
    parameters: {
      type: "object",
      properties: t.properties,
      required: t.required,
      additionalProperties: false,
    },
  }));
}

const CHAT_COMPLETIONS_TOOLS = UI_TOOL_SPECS.map((t) => ({
  type: "function" as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: {
      type: "object",
      properties: t.properties,
      required: t.required,
      additionalProperties: false,
    },
  },
}));

export const assistantSystemPrompt = (snap: Snapshot) => `You are METAXY, the owner's assistant inside the command centre of ${business.name}, run by ${business.owner} (${business.degree}) around her studies. Today is Friday 13 November 2026.
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
- Presenter mode (when STATE.presenter is present): you are presenting the pitch. Use present_slide, next_slide, show_demo and show_slides. STATE.presenter has the current slide, its speaker notes and timing. Never approve on stage: say that a person clicks Approve & send.
- Always include a brief, natural reply to the owner alongside any tool calls.
Style: brief (max 4 short sentences or a short bullet list), plain South African English, no emoji, no em dashes.
Studio packages: ${Object.entries(catalog).map(([k, v]) => `${k} ${rand(v.price)} (${v.hours}h)`).join(", ")}.
Studio policies:
${policies.map((p) => `- ${p.code}: ${p.rule}`).join("\n")}
STATE:
${JSON.stringify(snap)}`;

type ChatToolCall = { function?: { name?: string; arguments?: string } };
type ResponseOutputItem = {
  type?: string;
  name?: string;
  arguments?: string;
  content?: { type?: string; text?: string }[];
};

function finalizeAssistantResponse(engine: "openai" | "grok", rawReply: string, actions: UiAction[], snap: Snapshot): AssistantResponse {
  const confirm = confirmFor(actions, snap);
  const immediateActions = actions.filter((a) => !confirm?.actions.includes(a));
  const fallbackSummary = confirm
    ? "Ready for your go-ahead below."
    : immediateActions
        .filter((a) => a.type !== "focus")
        .map((a) => describeAction(a, snap))
        .join(". ") || "Done.";

  return {
    engine,
    reply: rawReply || fallbackSummary,
    actions: immediateActions,
    confirm,
  };
}

export async function askOpenAI(message: string, history: HistoryItem[], snap: Snapshot): Promise<AssistantResponse> {
  const model = resolveOpenAIModel();
  const effort = resolveReasoningEffort(model);

  const res = await fetch(`${openaiBaseUrl()}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}` },
    body: JSON.stringify({
      model,
      ...(effort ? { reasoning: { effort } } : {}),
      ...(supportsTemperature(model, effort) ? { temperature: 0.3 } : {}),
      instructions: assistantSystemPrompt(snap),
      input: [
        ...history.slice(-8).map((h) => ({ role: h.role, content: h.text })),
        { role: "user", content: message },
      ],
      tools: toResponsesTools(false),
      tool_choice: "auto",
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = (await res.json()) as { output?: ResponseOutputItem[]; output_text?: string };
  const output = Array.isArray(data.output) ? data.output : [];

  const actions: UiAction[] = [];
  const textParts: string[] = [];

  for (const item of output) {
    if (item.type === "function_call") {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(item.arguments || "{}");
      } catch {
        continue;
      }
      const a = validate(item.name ?? "", args, snap);
      if (a) actions.push(a);
    } else if (item.type === "message" && Array.isArray(item.content)) {
      for (const c of item.content) {
        if (c.type === "output_text" && typeof c.text === "string" && c.text) textParts.push(c.text);
      }
    }
  }

  const rawReply = (textParts.join("\n") || String(data.output_text ?? "")).trim();
  if (!rawReply && !actions.length) throw new Error("OpenAI returned nothing usable");

  return finalizeAssistantResponse("openai", rawReply, actions, snap);
}

export async function askGrok(message: string, history: HistoryItem[], snap: Snapshot): Promise<AssistantResponse> {
  const model = process.env.GROK_MODEL || "grok-4";
  const res = await fetch(XAI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.XAI_API_KEY ?? ""}` },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      tools: CHAT_COMPLETIONS_TOOLS,
      tool_choice: "auto",
      messages: [
        { role: "system", content: assistantSystemPrompt(snap) },
        ...history.slice(-8).map((h) => ({ role: h.role, content: h.text })),
        { role: "user", content: message },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`xAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const msg = data.choices?.[0]?.message ?? {};
  const calls: ChatToolCall[] = msg.tool_calls ?? [];

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
  if (!rawReply && !actions.length) throw new Error("xAI returned nothing usable");

  return finalizeAssistantResponse("grok", rawReply, actions, snap);
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
