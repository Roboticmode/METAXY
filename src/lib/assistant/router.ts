import { presetMessages } from "@/lib/agent/data";
import { formatDate, rand } from "@/lib/agent/tools";
import type { ApprovalKind, Tab } from "@/lib/agent/types";
import { deadlines } from "@/lib/compliance/data";
import { automationPreview, confirmFor, customerName, firstName, TAB_LABEL } from "./describe";
import type { AssistantResponse, Snapshot, UiAction } from "./types";

/**
 * Offline intent router for the owner's console. Keyword rules only, no model needed,
 * so every suggested prompt works in the demo without an API key.
 * It only ever *proposes* actions; the store runs them, and ask-first ones wait for Confirm.
 */

const CAPABILITIES = [
  "summarise what needs your attention",
  "open a module, a client's chat or a compliance task",
  "check your client deadlines against uni dates and draft a fix",
  "draft a reminder for an overdue invoice",
  "prepare a compliance pack (you sign and submit)",
  "send today's reminders, approve a drafted reply or send a message you dictate, each after you confirm",
];

const TASK_KEYWORDS: [RegExp, string][] = [
  [/\b(cipc|company registration|register (my |the )?(company|business|studio)|bizportal)\b/, "cipc"],
  [/\b(ip agreement|scope (&|and) ip|contract|sla|freelance agreement|service agreement)\b/, "client-contract"],
  [/\b(vat)\b/, "vat"],
  [/\b(consent|opt.?in|privacy notice)\b/, "popia-consent"],
  [/\b(popia|information officer)\b/, "popia-io"],
  [/\b(bank account|business bank)\b/, "bank"],
  [/\b(b-?bbee|bee|affidavit)\b/, "bbbee"],
  [/\b(uif|coida)\b/, "uif"],
  [/\b(provisional|irp6)\b/, "prov-tax"],
  [/\b(income tax|itr12|tax number|tax return)\b/, "sars-it"],
];

const TAB_KEYWORDS: [RegExp, Tab, string][] = [
  [/\b(operations?|ops|projects?|approvals?|dashboard|home)\b/, "operations", "ops-approvals"],
  [/\b(whats ?app|inbox|chats|messages|automations?)\b/, "whatsapp", "wa-inbox"],
  [/\b(compliance|legal|legalities|formali[sz]e|checklist)\b/, "compliance", "comp-checklist"],
  [/\b(opportunit(y|ies)|leads?|radar)\b/, "opportunities", "opp-radar"],
  [/\b(crm|clients|customers?|retention|memory)\b/, "crm", "crm-memory"],
];

/** Coursework belongs to Naledi alone (archetype "Never" rule). */
const COURSEWORK = /\b(assignments?|coursework|essays?|homework|exams?|tests?|capstone|labs?|practicals?|thesis|uml|is30\d|cs310|is399|module|tut(orial)?s?)\b/;
const DO_WORK = /\b(write|do|complete|finish|edit|draft|answer|submit|solve|code|ghostwrite|help me with)\b/;
const CLASH = /\b(clash(es)?|collisions?|collide|conflicts?|double.?booked|overlap)\b/;
const CHASE = /\b(chase|overdue|unpaid|owes?|outstanding|late pay(ment|er)?)\b/;

const reply = (text: string, actions: UiAction[] = [], snap?: Snapshot): AssistantResponse => {
  const confirm = snap ? confirmFor(actions, snap) : undefined;
  return { engine: "scripted", reply: text, actions: actions.filter((a) => !confirm?.actions.includes(a)), confirm };
};

function findTask(m: string): string | null {
  for (const [re, id] of TASK_KEYWORDS) if (re.test(m)) return id;
  return null;
}

/** Best client matches: full name / business / surname beat a bare first name, so "Kagiso" stays ambiguous. */
function findCustomers(m: string, snap: Snapshot) {
  const word = (w: string) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(m);
  const scored = snap.customers
    .map((c) => {
      const [first, ...rest] = c.name.toLowerCase().split(" ");
      const score = word(c.name.toLowerCase()) || word(c.business.toLowerCase()) ? 3 : rest.length && word(rest.join(" ")) ? 2 : word(first) ? 1 : 0;
      return { c, score };
    })
    .filter((x) => x.score > 0);
  const best = Math.max(0, ...scored.map((x) => x.score));
  return scored.filter((x) => x.score === best).map((x) => x.c);
}

function whichOne(list: Snapshot["customers"]) {
  return reply(`Which one do you mean: ${list.map((c) => `${c.name} (${c.business})`).join(" or ")}?`);
}

const opsApprovals: UiAction[] = [
  { type: "navigate", tab: "operations" },
  { type: "focus", anchorId: "ops-approvals" },
];

export function route(message: string, snap: Snapshot): AssistantResponse {
  const m = message.toLowerCase().replace(/[’']/g, "'").trim();

  if (!m) return reply("Ask me anything about the studio, or pick one of the suggestions.");

  /* ---------- never: coursework, money and filings stay with Naledi ---------- */
  if (COURSEWORK.test(m) && DO_WORK.test(m) && !CLASH.test(m)) {
    return reply(
      "I can't help with coursework. Writing, editing or submitting university work is yours alone, and that won't change. What I can do is protect your study time: I can check client deadlines against your test and assignment dates, or hold new enquiries during exams.",
    );
  }
  if (/\b(transfer|move|send|withdraw)\b.*\b(money|funds|cash|rand|r\d+)\b|\bpay (the |my )?(sars|cipc|fee|supplier|invoice|bill)\b/.test(m)) {
    return reply("I never move money. Payments stay with you. I can show you what's owed: try “What needs my attention today?”.");
  }
  if (/\b(submit|lodge|file)\b/.test(m) && !/\bprofile\b/.test(m)) {
    const task = findTask(m) ?? "cipc";
    return reply(
      `I can't submit filings for you. Signing, paying and submitting stay with you, but I can prepare everything up to that point. I've opened ${snap.compliance.find((t) => t.id === task)?.label ?? "the task"} so you can see what's left.`,
      [{ type: "navigate", tab: "compliance" }, { type: "open_compliance_task", taskId: task }, { type: "focus", anchorId: "comp-task" }],
    );
  }

  /* ---------- help / greetings ---------- */
  if (/^(help|\?|what can you do|what do you do)/.test(m) || /\bwhat can you\b/.test(m)) {
    return reply(`I can:\n• ${CAPABILITIES.join("\n• ")}\n\nAnything sent to a client or binding waits for your Confirm.`);
  }
  if (/^(hi|hello|hey|howzit|sawubona|molo|dumela|thanks|thank you|cheers)\b/.test(m) && m.split(" ").length <= 3) {
    return reply(/^(thanks|thank|cheers)/.test(m) ? "Pleasure! Anything else?" : "Hi Naledi! What can I help with? Try “What needs my attention today?”.");
  }

  /* ---------- tour ---------- */
  if (/\b(show me around|tour|walk me through)\b/.test(m)) {
    const stops: [Tab, string][] = [
      ["operations", "ops-approvals"],
      ["whatsapp", "wa-inbox"],
      ["compliance", "comp-checklist"],
      ["opportunities", "opp-radar"],
      ["crm", "crm-memory"],
    ];
    return reply(
      "Quick tour: Operations is where drafted replies and decisions wait for you, WhatsApp is the client inbox and automations, Compliance is your path to a formal studio, Opportunities finds clients nearby, and CRM remembers every client.",
      stops.flatMap(([tab, anchorId]) => [{ type: "navigate", tab } as UiAction, { type: "focus", anchorId } as UiAction]),
    );
  }

  /* ---------- attention summary ---------- */
  if (/\b(attention|today|to ?do|summar|overview|catch me up|what'?s (up|new|pending|happening)|status|brief)\b/.test(m) && !/\b(remind|automation|send)\b/.test(m)) {
    return attention(snap);
  }

  /* ---------- simulate a client message (demo helper) ---------- */
  if (/\b(simulate|play|demo|pretend)\b/.test(m)) {
    const matches = findCustomers(m, snap);
    if (matches.length > 1) return whichOne(matches);
    const c = matches[0] ?? (/\b(scope|creep|add.?on|extra)\b/.test(m) ? snap.customers.find((x) => x.id === "c-103") : snap.customers.find((x) => x.id === "c-200"));
    const preset = c && presetMessages.find((p) => p.customerId === c.id);
    if (!c || !preset) return reply(`I don't have a scripted message for ${c ? firstName(c.name) : "that client"}. Try Buhle's enquiry or Zanele's scope creep.`);
    return reply(`Playing a message from ${customerName(snap, c.id)} into the WhatsApp simulator. The agent drafts its reply and holds anything binding for your OK.`, [
      { type: "navigate", tab: "whatsapp" },
      { type: "open_chat", customerId: c.id },
      { type: "focus", anchorId: "phone-panel" },
      { type: "simulate_customer", customerId: c.id, text: preset.text },
    ]);
  }

  /* ---------- decisions on drafted approvals (ask first) ---------- */
  const decision = /\b(refuse|decline|reject|deny|say no|hold|don'?t send)\b/.test(m) ? "refuse" : /\b(approve|allow|accept|grant|say yes|go ahead with|sort out|fix|resolve)\b/.test(m) ? "allow" : null;
  if (decision) {
    const who = findCustomers(m, snap);
    const kind: ApprovalKind | null = CLASH.test(m)
      ? "collision_fix"
      : CHASE.test(m) || /\binvoice|reminder\b/.test(m)
        ? "invoice_reminder"
        : /\b(scope|creep|add.?on|quote|variations?)\b/.test(m)
          ? "scope_quote"
          : /\bexam\b/.test(m)
            ? "exam_pause"
            : /\b(enquiry|inquiry|date|friday|reply)\b/.test(m)
              ? "reply_date"
              : null;
    const pending = snap.approvals.filter((p) => (!who.length || who.some((c) => c.id === p.customerId)) && (!kind || p.kind === kind));
    if (pending.length === 1) {
      const ap = pending[0];
      return reply(`Here's what the agent drafted for ${ap.customerId ? firstName(customerName(snap, ap.customerId)) : "you"}. Nothing goes out until you confirm below.`, [
        ...opsApprovals,
        { type: "decide_approval", approvalId: ap.id, decision },
      ], snap);
    }
    if (pending.length > 1) {
      return reply(`${pending.length} decisions match: ${pending.map((p) => p.title).join("; ")}. Which one?`, opsApprovals);
    }
    if (kind !== "collision_fix" && kind !== "invoice_reminder") {
      const hint = kind === "scope_quote" ? " Zanele's add-on request arrives when she messages: say “Simulate Zanele's scope creep”." : kind === "reply_date" ? " Buhle's enquiry arrives when he messages: say “Simulate Buhle's enquiry”." : "";
      if (who.length > 1) return whichOne(who);
      return reply(`There's no drafted decision${who.length ? ` for ${firstName(who[0].name)}` : ""} waiting right now.${hint}`, opsApprovals);
    }
    // collision / invoice with nothing drafted yet: fall through to the scans below, which draft one
  }

  /* ---------- Planner: client deadlines vs university calendar ---------- */
  if (CLASH.test(m) || /\b(capstone|calendar|schedule)\b/.test(m)) {
    if (!snap.collisions.length) return reply("No clashes: every client delivery fits around your fixed university dates.", opsApprovals);
    const c = snap.collisions[0];
    const proj = snap.projects.find((p) => p.id === c.projectId);
    return reply(
      `${c.projectId}${proj ? ` (${proj.title}, ${customerName(snap, c.customerId)})` : ""} is due on ${formatDate(c.date)}, the same day as ${c.schoolTitle}. I'll ask Planner to draft a fix. Nothing goes to ${firstName(customerName(snap, c.customerId))} and nothing moves until you approve.`,
      [{ type: "navigate", tab: "operations" }, { type: "check_collisions" }, { type: "focus", anchorId: "ops-approvals" }],
    );
  }

  /* ---------- Books: overdue invoices ---------- */
  if (CHASE.test(m) || (/\binvoices?\b/.test(m) && /\b(chase|remind|nudge|follow)\b/.test(m))) {
    const overdue = snap.invoices.filter((i) => i.status === "overdue").sort((a, b) => b.daysOverdue - a.daysOverdue);
    const who = findCustomers(m, snap);
    if (who.length > 1) return whichOne(who);
    if (!overdue.length) return reply("Nothing is overdue. All invoices are paid or not yet due.", [{ type: "navigate", tab: "operations" }, { type: "focus", anchorId: "ops-orders" }]);
    const mine = who.length ? overdue.filter((i) => i.customerId === who[0].id) : overdue;
    if (who.length && !mine.length) return reply(`${customerName(snap, who[0].id)} has nothing overdue.`, [{ type: "navigate", tab: "operations" }, { type: "focus", anchorId: "ops-orders" }]);
    if (mine[0].id !== overdue[0].id) {
      return reply(
        `${mine[0].id} (${rand(mine[0].amount)}, ${mine[0].daysOverdue} days) is overdue, but Books drafts the most overdue invoice first: ${overdue[0].id} for ${customerName(snap, overdue[0].customerId)}. I can't draft a reminder for ${mine[0].id} on its own yet.`,
        [{ type: "navigate", tab: "operations" }, { type: "focus", anchorId: "ops-orders" }],
      );
    }
    const top = overdue[0];
    return reply(
      `${top.id} for ${customerName(snap, top.customerId)} is ${rand(top.amount)}, ${top.daysOverdue} days overdue. I'll ask Books to draft a polite EFT reminder. It only goes out when you approve it.`,
      [{ type: "navigate", tab: "operations" }, { type: "chase_overdue" }, { type: "focus", anchorId: "ops-approvals" }],
    );
  }

  /* ---------- reminders / automations (ask first) ---------- */
  if (/\b(remind|reminders|automations?|follow.?ups?|nudges?|check.?ins?)\b/.test(m) && /\b(send|run|fire|do|go)\b/.test(m)) {
    const preview = automationPreview(snap);
    const nav: UiAction[] = [{ type: "navigate", tab: "whatsapp" }, { type: "focus", anchorId: "wa-automations" }];
    if (!preview.length) return reply("Nothing is due to go out right now: no pending deposits, active-project updates or client check-ins.", nav);
    return reply(`${preview.length} message${preview.length === 1 ? " is" : "s are"} due. Check exactly what will go out below. Nothing is sent until you confirm.`, [...nav, { type: "run_automations" }], snap);
  }

  /* ---------- prepare a compliance task ---------- */
  if (/\b(prepare|draft|get .* ready|fill (in|out)|start)\b/.test(m) && (findTask(m) || /\b(application|registration|compliance)\b/.test(m))) {
    return prepare(findTask(m) ?? "cipc", snap);
  }

  /* ---------- exam mode: the owner flips it herself ---------- */
  if (/\bexam mode\b/.test(m)) {
    return reply(`Exam Mode is ${snap.examMode ? "on" : "off"}. It's a switch you flip on Operations, so I've opened it for you. When it's on, I draft a notice to active clients and hold it for your OK.`, [
      { type: "navigate", tab: "operations" },
      { type: "focus", anchorId: "ops-approvals" },
    ]);
  }

  /* ---------- message a client (ask first) ---------- */
  // "tell Thabo (that) …" → reported speech, turned into "you/your"; "message Thabo: …" / "… saying …" → exact words.
  // Anything else ("send Thabo the banking details") gets a question back: the agent never writes client text itself.
  const say = m.match(/\b(tell|message|text|reply to|send|whatsapp)\s+(\w+(?:\s\w+)?)(\s*:|\s+(?:that|to say|saying|a message saying)\b)?\s*(.*)$/);
  if (say) {
    const [, verb, target, sep, rest] = say;
    const list = findCustomers(target, snap);
    if (list.length > 1) return whichOne(list);
    const c = list[0];
    if (c) {
      const surnameUsed = target.split(" ").length > 1 && list.length === 1 && c.name.toLowerCase() === target;
      const body = surnameUsed ? rest : `${target.split(" ").slice(1).join(" ")} ${rest}`.trim();
      const raw = message.trim().slice(message.trim().length - body.length).trim().replace(/^["“]|["”]$/g, "");
      const nav: UiAction[] = [{ type: "navigate", tab: "whatsapp" }, { type: "open_chat", customerId: c.id }, { type: "focus", anchorId: "phone-panel" }];
      const quoted = /^["“]/.test(body);
      if (raw.length < 3 || (!sep && !quoted && verb !== "tell")) {
        return reply(`What exactly should I send ${firstName(c.name)}? Give me the words (e.g. “Message ${firstName(c.name)}: …”) and I'll show you before it goes.`, nav);
      }
      const text = quoted || sep?.includes(":") ? raw : toSecondPerson(raw.replace(/^that\s+/i, ""));
      return reply(`Here's the message for ${firstName(c.name)}. It only goes out when you confirm.`, [...nav, { type: "send_owner_message", customerId: c.id, text }], snap);
    }
  }

  /* ---------- open a chat ---------- */
  const people = findCustomers(m, snap);
  if (people.length && /\b(show|open|go|take|pull|view|see|chat|conversation|messages|check)\b/.test(m)) {
    if (people.length > 1) return whichOne(people);
    const c = people[0];
    const handoff = snap.handoffs.find((h) => h.customerId === c.id);
    const project = snap.projects.find((p) => p.customerId === c.id && p.status !== "delivered" && p.status !== "declined");
    const overdue = snap.invoices.find((i) => i.customerId === c.id && i.status === "overdue");
    const extra = handoff
      ? ` The agent handed this chat to you: ${handoff.reason}.`
      : overdue
        ? ` ${overdue.id} (${rand(overdue.amount)}) is ${overdue.daysOverdue} days overdue.`
        : project
          ? ` Active project ${project.id}: ${project.title}, due ${project.dueDate ? formatDate(project.dueDate) : "TBC"}.`
          : "";
    return reply(`Here's ${firstName(c.name)}'s chat.${extra}`, [
      { type: "navigate", tab: "whatsapp" },
      { type: "open_chat", customerId: c.id },
      { type: "focus", anchorId: "phone-panel" },
    ]);
  }

  /* ---------- open a compliance task ---------- */
  const task = findTask(m);
  if (task) {
    const t = snap.compliance.find((x) => x.id === task)!;
    return reply(`Here's ${t.label}. Status: ${statusText(t.status)}.${t.status === "todo" ? " Say “Prepare it” and I'll get the paperwork ready for you to sign." : ""}`, [
      { type: "navigate", tab: "compliance" },
      { type: "open_compliance_task", taskId: task },
      { type: "focus", anchorId: "comp-task" },
    ]);
  }
  if (/\b(prepare|do) it\b/.test(m) && snap.tab === "compliance") return prepare(snap.complianceTask, snap);

  /* ---------- layout ---------- */
  const hide = /\b(hide|collapse|close)\b/.test(m);
  const show = /\b(show|open|expand)\b/.test(m);
  if ((hide || show) && /\b(side ?bar|left|right|phone|panel|columns?|menu|nav|focus mode)\b/.test(m)) {
    const left = /\b(side ?bar|left|menu|nav|columns?|both|focus mode)\b/.test(m);
    const right = /\b(right|phone|panel|columns?|both|focus mode)\b/.test(m);
    return reply(hide ? "Making room." : "Bringing them back.", [{ type: "set_columns", ...(left ? { left: !hide } : {}), ...(right ? { right: !hide } : {}) }]);
  }

  /* ---------- open a module (needs a "go/show" verb, or just the module name) ---------- */
  if (/\b(go|open|show|take|switch|view|see|navigate|back)\b/.test(m) || m.split(/\s+/).length <= 2) {
    for (const [re, tab, anchorId] of TAB_KEYWORDS) {
      if (re.test(m)) return reply(`Here's ${TAB_LABEL[tab]}.`, [{ type: "navigate", tab }, { type: "focus", anchorId }]);
    }
  }

  return reply(`I can't do that yet. Right now I can ${CAPABILITIES.slice(0, 5).join(", ")}.`);
}

/** "his site is ready" → "Your site is ready". Shown verbatim on the confirm card before anything is sent. */
function toSecondPerson(s: string) {
  const out = s
    .replace(/\b(she|he|they) (is|are)\b/gi, "you are")
    .replace(/\b(she|he)'s\b/gi, "you're")
    .replace(/\bthey're\b/gi, "you're")
    .replace(/\b(she|he|they) (was|were)\b/gi, "you were")
    .replace(/\b(she|he|they) has\b/gi, "you have")
    .replace(/\bher\b(?=\s*([.,!?]|$))/gi, "you")
    .replace(/\b(her|his|their)\b/gi, "your")
    .replace(/\b(she|he|they)\b/gi, "you")
    .replace(/\b(him|them)\b/gi, "you");
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function statusText(s: string) {
  return ({ todo: "to do", ready: "ready for you to submit", submitted: "submitted, waiting for approval", done: "done", na: "not applicable" } as Record<string, string>)[s] ?? s;
}

function attention(snap: Snapshot): AssistantResponse {
  const lines: string[] = [];
  const next: string[] = [];
  const overdue = snap.invoices.filter((i) => i.status === "overdue").sort((a, b) => b.daysOverdue - a.daysOverdue);
  const deposits = snap.projects.filter((p) => p.status === "awaiting_deposit");
  if (snap.approvals.length) lines.push(`${snap.approvals.length} drafted decision${snap.approvals.length > 1 ? "s" : ""} waiting for you: ${snap.approvals.map((a) => a.title).join("; ")}`);
  for (const c of snap.collisions) {
    lines.push(`Clash: ${c.projectId} for ${customerName(snap, c.customerId)} is due ${formatDate(c.date)}, the same day as ${c.schoolTitle}`);
    next.push("“Sort out the Capstone clash”");
  }
  if (overdue.length) {
    lines.push(`Overdue: ${overdue.map((i) => `${i.id} ${customerName(snap, i.customerId)} ${rand(i.amount)} (${i.daysOverdue} days)`).join("; ")}`);
    next.push(`“Chase ${customerName(snap, overdue[0].customerId).replace(/ \(.*\)$/, "")}'s overdue invoice”`);
  }
  if (deposits.length) lines.push(`Deposit pending: ${deposits.map((p) => `${customerName(snap, p.customerId)} ${rand(p.deposit)} on ${p.id}`).join("; ")}`);
  if (snap.handoffs.length) lines.push(`${snap.handoffs.length} chat${snap.handoffs.length > 1 ? "s" : ""} handed to you: ${snap.handoffs.map((h) => `${h.name} (${h.reason})`).join("; ")}`);
  const due = automationPreview(snap).length;
  if (due) lines.push(`${due} client update${due > 1 ? "s" : ""} ready to send: say “Send today's reminders”`);
  const ready = snap.compliance.filter((t) => t.status === "ready");
  if (ready.length) lines.push(`Ready for you to submit: ${ready.map((t) => t.label).join(", ")}`);
  const status = (id: string) => snap.compliance.find((t) => t.id === id)?.status;
  const legal = deadlines.find((d) => status(d.taskId) !== "done" && status(d.taskId) !== "ready");
  if (legal) lines.push(`Next legal date: ${legal.what} (${legal.when})`);

  let actions: UiAction[];
  if (snap.approvals.length) actions = opsApprovals;
  else if (snap.collisions.length || overdue.length || deposits.length) actions = [{ type: "navigate", tab: "operations" }, { type: "focus", anchorId: "ops-orders" }];
  else if (snap.handoffs.length || snap.unread) actions = [{ type: "navigate", tab: "whatsapp" }, { type: "focus", anchorId: "wa-inbox" }];
  else actions = [{ type: "navigate", tab: "compliance" }, { type: "focus", anchorId: "comp-checklist" }];

  const where = actions[0].type === "navigate" ? TAB_LABEL[actions[0].tab] : "";
  const tail = next.length ? `\n\nTry ${next.join(" or ")}.` : "";
  return reply(lines.length ? `Here's today:\n• ${lines.join("\n• ")}\n\nI've opened ${where}, the busiest spot.${tail}` : `All quiet. Nothing is waiting on you. I've opened ${where}.`, actions);
}

function prepare(taskId: string, snap: Snapshot): AssistantResponse {
  const t = snap.compliance.find((x) => x.id === taskId);
  if (!t) return reply("I couldn't find that compliance task.");
  const open: UiAction[] = [{ type: "navigate", tab: "compliance" }, { type: "open_compliance_task", taskId }, { type: "focus", anchorId: "comp-task" }];
  if (t.status === "done") return reply(`${t.label} is already done. Nothing to prepare.`, open);
  if (t.status === "submitted") return reply(`${t.label} is already submitted. We're waiting on the authority.`, open);
  if (t.status === "ready") return reply(`${t.label} is already prepared and waiting for you to sign and submit.`, open);
  if (t.status === "na") return reply(`${t.label} doesn't apply to the studio right now.`, open);
  const blocker = t.dependsOn ? snap.compliance.find((x) => x.id === t.dependsOn && x.status !== "done") : undefined;
  if (blocker) {
    return reply(`${t.label} has to wait for ${blocker.label}. I've opened that one instead. Say “Prepare ${blocker.label}” to start there.`, [
      { type: "navigate", tab: "compliance" },
      { type: "open_compliance_task", taskId: blocker.id },
      { type: "focus", anchorId: "comp-task" },
    ]);
  }
  return reply(`Preparing ${t.label} from your document vault. I'll fill in what I can; signing, paying and submitting stay with you.`, [...open, { type: "prepare_compliance", taskId }]);
}
