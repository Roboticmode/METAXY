import { catalog, presetMessages } from "@/lib/agent/data";
import { nextAssessment, TOMORROW } from "@/lib/agent/planner";
import { formatDate, rand } from "@/lib/agent/tools";
import type { ApprovalKind, SchoolKind, Tab } from "@/lib/agent/types";
import { INVOICE_RE, KIND_HOURS, parseDate, parseModule, parseNewClient, parsePackages, parseSchoolKind, parseWeek, PHONE_RE } from "./capture";
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
  "plan your week: free hours, client work and clashes",
  "add a client or lead, and draft a project quote with a 50% deposit",
  "log a payment, mark the invoice paid and draft a thank-you",
  "capture a new or moved school deadline and re-check clashes",
  "plan study blocks around client work, or switch on Exam Mode",
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
const STUDY = /\bstudy\b|\brevision (blocks?|time|sessions?)\b/;
const CAPACITY = /\b(next week|this week|week (look|looking)|my week|week of|week after next|capacity|free (hours|time)|how busy|workload)\b/;
const EXAM_MODE = /\bexam mode\b|\bpause (new )?(intake|enquiries|bookings|new work)\b|\b(resume|reopen) (intake|bookings)\b/;
const PAID = /\b(paid|has paid|payment (received|came in|is in|from)|received (the |a |his |her |their )?(payment|eft|deposit|money)|settled|proof of payment|pop)\b/;
const SCHOOL_CHANGE = /\b(moved?|shift(ed)?|postponed?|reschedul\w*|changed?|brought forward|pushed|now (on|due)|is (on|due)|due on|set for|will be|add|new|announced|put)\b/;
const NOT_A_PERSON = new Set(["me", "my", "all", "everyone", "everybody", "the", "a", "an", "her", "him", "them", "clients", "today", "today's", "reminders", "it", "this", "that", "him:", "her:"]);

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
  if (COURSEWORK.test(m) && DO_WORK.test(m) && !CLASH.test(m) && !STUDY.test(m) && !CAPACITY.test(m) && !EXAM_MODE.test(m)) {
    return reply(
      "I can't help with coursework. Writing, editing or submitting university work is yours alone, and that won't change. What I can do is protect your study time: I can check client deadlines against your test and assignment dates, or hold new enquiries during exams.",
    );
  }
  if (/\b(transfer|move|send|withdraw)\b.*\b(money|funds|cash|rand|r\d+)\b|\bpay (the |my )?(sars|cipc|fee|supplier|invoice|bill)\b|\b(refund|reimburse|pay (him|her|them|back))\b/.test(m)) {
    return reply("I never move money. Payments and refunds stay with you. I can record a payment you've received (“Kagiso Molefe paid INV-2041”) or show you what's owed.");
  }
  {
    // never share one client's details with another
    const mentioned = mentionedClients(m, snap);
    if (mentioned.length >= 2 && /\b(send|share|forward|give|show|tell|pass)\b/.test(m) && /'s\b|\b(details|number|phone|invoice|quote|logo|files?|designs?|contact|address|price)\b/.test(m)) {
      return reply(
        `I won't share one client's details or work with another client. ${mentioned.map((c) => firstName(c.name)).join(" and ")} each only see their own projects, invoices and messages.`,
      );
    }
  }
  if (/\b(submit|lodge|file)\b/.test(m) && !/\bprofile\b/.test(m)) {
    const task = findTask(m) ?? "cipc";
    return reply(
      `I can't submit filings for you. Signing, paying and submitting stay with you, but I can prepare everything up to that point. I've opened ${snap.compliance.find((t) => t.id === task)?.label ?? "the task"} so you can see what's left.`,
      [{ type: "navigate", tab: "compliance" }, { type: "open_compliance_task", taskId: task }, { type: "focus", anchorId: "comp-task" }],
    );
  }

  /* ---------- help / greetings ---------- */
  if (/^(help|\?)[\s!.?]*$|^(what can you do|what do you do)/.test(m) || /\bwhat can you\b/.test(m)) {
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

  /* ---------- data capture: clients, quotes, payments, deadlines, study, capacity, exam mode ---------- */
  const captured = capture(message, m, snap);
  if (captured) return captured;

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
    const kinds: ApprovalKind[] | null = CLASH.test(m)
      ? ["collision_fix"]
      : /\b(thank|thanks|thank-you)\b/.test(m)
        ? ["payment_thanks"]
        : CHASE.test(m) || /\binvoice|reminder\b/.test(m)
          ? ["invoice_reminder"]
          : /\b(scope|creep|add.?on|variations?)\b/.test(m)
            ? ["scope_quote"]
            : /\bquote\b/.test(m)
              ? ["quote_send", "scope_quote"]
              : /\bexam\b|\bnotices?\b/.test(m)
                ? ["exam_pause"]
                : /\b(calendar|study|deadline|block)\b/.test(m)
                  ? ["calendar_change"]
                  : /\b(enquiry|inquiry|date|friday|reply)\b/.test(m)
                    ? ["reply_date"]
                    : null;
    const kind = kinds?.[0] ?? null;
    const pending = snap.approvals.filter((p) => (!who.length || who.some((c) => c.id === p.customerId)) && (!kinds || kinds.includes(p.kind)));
    if (pending.length > 1 && pending.every((p) => p.kind === "exam_pause")) {
      return reply(`Here are the ${pending.length} Exam Mode notices. Nothing goes out until you confirm below.`, [
        ...opsApprovals,
        ...pending.map((p): UiAction => ({ type: "decide_approval", approvalId: p.id, decision })),
      ], snap);
    }
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
    if (kind !== "collision_fix" && kind !== "invoice_reminder" && kind !== "exam_pause") {
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

  /* (Exam Mode is handled by capture(): the owner asks, the agent switches it and holds the notices) */
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
    // never contact anyone outside the client list
    const who = target.split(" ")[0];
    if (verb !== "send" && verb !== "reply to" && !NOT_A_PERSON.has(who) && !findTask(target) && !TAB_KEYWORDS.some(([re]) => re.test(target))) {
      const lecturer = /\b(lecturer|prof|professor|tutor|dr)\b/.test(target);
      return reply(
        lecturer
          ? "I don't message lecturers from here: I don't have their contacts, and anything about your coursework stays with you."
          : `${cap(who)} isn't on your client list, and I only message clients. If they're a new lead, say “Add ${cap(who)} from <their business>” first.`,
      );
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

/* ===================== data capture (owner instructions that change real data) ===================== */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const PACKAGE_MENU = Object.entries(catalog)
  .map(([k, v]) => `${k} (${rand(v.price)})`)
  .join(", ");

/** Clients named in a message. Two clients sharing a first name count once unless named in full. */
function mentionedClients(m: string, snap: Snapshot) {
  const word = (w: string) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(m);
  const strong = snap.customers.filter((c) => {
    const [, ...rest] = c.name.toLowerCase().split(" ");
    return word(c.name.toLowerCase()) || word(c.business.toLowerCase()) || (rest.length > 0 && word(rest.join(" ")));
  });
  const weak = snap.customers.filter((c) => !strong.includes(c) && word(firstName(c.name).toLowerCase()) && !strong.some((s) => firstName(s.name) === firstName(c.name)));
  const byFirst = new Map(weak.map((c) => [firstName(c.name), c]));
  return [...strong, ...byFirst.values()];
}

const opsTo = (anchorId: string): UiAction[] => [
  { type: "navigate", tab: "operations" },
  { type: "focus", anchorId },
];

function capture(original: string, m: string, snap: Snapshot): AssistantResponse | null {
  const school = snap.school ?? [];

  /* ---------- Planner: Exam Mode (switch alone, notices ask first) ---------- */
  if (EXAM_MODE.test(m) || /\bi'?m (writing|in|starting) (my )?exams\b/.test(m)) {
    const active = !/\b(off|disable|stop|end|deactivate|resume|reopen|finished|done)\b/.test(m);
    if (active === snap.examMode) {
      return reply(`Exam Mode is already ${active ? "on: new intake is paused until 5 Dec" : "off: intake is open"}.`, opsTo("ops-triggers"));
    }
    const clients = new Set(snap.projects.filter((p) => p.status === "in_progress" || p.status === "awaiting_deposit").map((p) => p.customerId));
    return reply(
      active
        ? `Switching Exam Mode on. Planner pauses new project intake until 5 Dec and drafts a pause notice for each of your ${clients.size} active client${clients.size === 1 ? "" : "s"}. The notices wait for your OK.`
        : "Switching Exam Mode off. Intake reopens at your normal term capacity (8 to 10 hours a week).",
      [{ type: "navigate", tab: "operations" }, { type: "set_exam_mode", active }],
    );
  }

  /* ---------- Planner: weekly capacity plan (alone) ---------- */
  if (CAPACITY.test(m) && !/\b(add|move|moved|book|quote)\b/.test(m)) {
    const weekStart = parseWeek(m);
    return reply(`Here's Planner's view of the week of ${formatDate(weekStart)}.`, [
      { type: "navigate", tab: "operations" },
      { type: "capacity_plan", weekStart },
      { type: "focus", anchorId: "ops-calendar" },
    ]);
  }

  /* ---------- Planner: study blocks around client work (proposal alone, calendar change asks first) ---------- */
  if (STUDY.test(m) && /\b(plan|schedule|block|blocks|find|book|make|add|time|sessions?|when can i)\b/.test(m)) {
    const mod = parseModule(m);
    const kind = parseSchoolKind(m.replace(/\bstudy\b/g, ""));
    const candidates = school
      .filter(
        (s) =>
          s.fixed &&
          s.date >= TOMORROW &&
          (!mod || s.module.startsWith(mod.code) || s.title.startsWith(mod.code)) &&
          (!kind || s.kind === kind || (kind === "test" && s.kind === "exam")),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    const target = mod || kind ? (candidates.find((s) => s.kind === "test" || s.kind === "exam" || s.kind === "capstone") ?? candidates[0]) : nextAssessment(school);
    if (!target) {
      return reply(
        `I couldn't find ${mod ? `a ${mod.code} ${kind ?? "test or exam"}` : "an upcoming test or exam"} on your calendar. Tell me the date first, e.g. “${mod?.code ?? "IS302"} exam is on 2 December”.`,
        opsTo("ops-calendar"),
      );
    }
    return reply(`Planning study time for ${target.title} (${formatDate(target.date)}) around your client work. Adding blocks to your calendar waits for your OK.`, [
      { type: "navigate", tab: "operations" },
      { type: "plan_study_blocks", targetId: target.id },
    ]);
  }

  /* ---------- Books: log a payment that came in (alone; thank-you asks first) ---------- */
  if (PAID.test(m) && !/\b(unpaid|not paid|hasn'?t paid|has not paid|didn'?t pay|never paid)\b/.test(m)) {
    const invId = m.match(INVOICE_RE);
    let invoice = invId ? snap.invoices.find((i) => i.id === `INV-${invId[1]}`) : undefined;
    if (invId && !invoice) return reply(`I can't find INV-${invId[1]} in the ledger. Which invoice was it?`, opsTo("ops-invoices"));
    if (!invoice) {
      const who = findCustomers(m, snap);
      if (who.length > 1) return whichOne(who);
      if (!who.length) return reply("Who paid, and for which invoice? For example “Kagiso Molefe paid INV-2041”.", opsTo("ops-invoices"));
      const open = snap.invoices.filter((i) => i.customerId === who[0].id && i.status !== "paid");
      const wantsDeposit = /\bdeposit\b/.test(m);
      const pick = wantsDeposit ? open.filter((i) => i.status === "deposit_pending") : open;
      if (!pick.length) return reply(`${customerName(snap, who[0].id)} has nothing outstanding${wantsDeposit ? " as a deposit" : ""}, so there's nothing to log.`, opsTo("ops-invoices"));
      if (pick.length > 1) {
        return reply(`${firstName(who[0].name)} has ${pick.length} open invoices: ${pick.map((i) => `${i.id} (${rand(i.amount)})`).join(", ")}. Which one was paid?`, opsTo("ops-invoices"));
      }
      invoice = pick[0];
    }
    const named = findCustomers(m, snap);
    if (named.length === 1 && named[0].id !== invoice.customerId) {
      return reply(`${invoice.id} belongs to ${customerName(snap, invoice.customerId)}, not ${named[0].name}. Which one do you mean?`, opsTo("ops-invoices"));
    }
    if (invoice.status === "paid") return reply(`${invoice.id} is already marked paid.`, opsTo("ops-invoices"));
    const late = invoice.status === "overdue" ? `, ${invoice.daysOverdue} days late` : "";
    return reply(`Logging ${rand(invoice.amount)} from ${customerName(snap, invoice.customerId)} against ${invoice.id}${late}. I only record it; no money moves.`, [
      { type: "navigate", tab: "operations" },
      { type: "log_payment", invoiceId: invoice.id },
    ]);
  }

  /* ---------- Planner: capture a new or moved school deadline (calendar change asks first) ---------- */
  const date = parseDate(m);
  const kind = parseSchoolKind(m);
  const mod = parseModule(m);
  if (date && (kind || mod) && SCHOOL_CHANGE.test(m) && !CLASH.test(m) && !/\b(quote|client|project for|website|logo)\b/.test(m)) {
    const k: SchoolKind = kind ?? "assignment";
    const moving = /\b(moved?|shift(ed)?|postponed?|reschedul\w*|changed?|brought forward|pushed|now (on|due))\b/.test(m);
    const matches = school.filter(
      (s) => (!mod || s.module.startsWith(mod.code) || s.title.startsWith(mod.code)) && (s.kind === k || (k === "capstone" && /capstone/i.test(s.title))),
    );
    if (date < TOMORROW) return reply(`${formatDate(date)} has already passed. Which date did you mean?`);
    if (moving && matches.length > 1) {
      return reply(`Which one moved: ${matches.map((s) => `${s.title} (${s.module}, ${formatDate(s.date)})`).join(" or ")}?`, opsTo("ops-calendar"));
    }
    if (moving && matches.length === 1) {
      const it = matches[0];
      return reply(`Got it: ${it.title} moves from ${formatDate(it.date)} to ${formatDate(date)}. Planner checks it against your client work; the calendar only changes when you approve.`, [
        { type: "navigate", tab: "operations" },
        { type: "schedule_school_item", moveId: it.id, module: it.module, title: it.title, kind: it.kind, date, hours: it.hours },
      ]);
    }
    const dupe = matches.find((s) => s.date === date);
    if (dupe) return reply(`${dupe.title} is already on your calendar for ${formatDate(date)}.`, opsTo("ops-calendar"));
    const module = mod?.name ?? (k === "capstone" ? "IS399 Capstone" : null);
    if (!module) return reply(`Which module is that ${k} for (IS301, IS302, IS304, CS310 or IS399)?`);
    const code = module.split(" ")[0];
    const KIND_TITLE: Record<SchoolKind, string> = { exam: "Final Exam", test: "Test", capstone: "Capstone Milestone", assignment: "Assignment Deadline", lecture: "Lab / Practical", study: "Study Block" };
    const title = `${code} ${KIND_TITLE[k]}`;
    const other = moving ? school.filter((s) => s.module.startsWith(code)) : [];
    const note = moving
      ? ` I don't see ${code.startsWith("I") ? "an" : "a"} ${code} ${k} on your calendar${other.length ? ` (only ${other.map((s) => `${s.title}, ${formatDate(s.date)}`).join("; ")})` : ""}, so I've drafted it as new.`
      : "";
    return reply(`Adding ${title} on ${formatDate(date)}.${note} Planner checks it against your client work; the calendar only changes when you approve.`, [
      { type: "navigate", tab: "operations" },
      { type: "schedule_school_item", module, title, kind: k, date, hours: KIND_HOURS[k] },
    ]);
  }

  /* ---------- Client Desk: add a client / new lead (alone; quote asks first) ---------- */
  const lead = parseNewClient(original.trim());
  if (lead || (/^(please\s+)?(add|new|save|capture)\b/.test(m) && /\b(client|lead|customer)\b/.test(m))) {
    if (!lead) return reply("What's their name and business? For example “Add Lindiwe Dube from Dube Florists, she wants a logo”.");
    const existing = snap.customers.find((c) => c.name.toLowerCase() === lead.name.toLowerCase() || c.business.toLowerCase() === lead.business.toLowerCase());
    if (existing) return reply(`${existing.name} (${existing.business}) is already in your CRM.`, [{ type: "navigate", tab: "crm" }, { type: "focus", anchorId: "crm-memory" }]);
    const packages = parsePackages(lead.rest);
    const due = parseDate(lead.rest) ?? undefined;
    const phone = original.match(PHONE_RE)?.[1];
    const actions: UiAction[] = [
      { type: "add_client", name: lead.name, business: lead.business, ...(phone ? { phone } : {}), ...(packages.length ? { packages } : {}), ...(due ? { dueDate: due } : {}) },
    ];
    if (packages.length) actions.unshift({ type: "navigate", tab: "operations" });
    return reply(
      packages.length
        ? `Adding ${lead.name} (${lead.business}) as a new lead and drafting a ${packages.join(" + ")} quote. Planner picks an honest delivery date; the quote only goes out when you approve it.`
        : `Adding ${lead.name} (${lead.business}) to your CRM as a new lead. Tell me what they need (${PACKAGE_MENU}) and I'll draft a quote.`,
      actions,
    );
  }

  /* ---------- Client Desk: draft a project + quote for an existing client (alone; sending asks first) ---------- */
  if (
    /\b(quote|create (a )?(new )?project|new project|set up (a )?(new )?project|open (a )?project|book (in )?|start (a )?project)\b/.test(m) &&
    !/\b(approve|send the|hold|scope|creep|add.?on|variations?)\b/.test(m)
  ) {
    const who = findCustomers(m, snap);
    if (who.length > 1) return whichOne(who);
    const packages = parsePackages(m);
    if (!who.length) {
      const name = original.match(/\b(?:for|quote)\s+([A-Z][\p{L}'-]+)/u)?.[1];
      return reply(
        name && !/^(a|an|the)$/i.test(name)
          ? `${name} isn't on your client list yet. Say “Add ${name} from <business>, wants ${packages[0] ?? "a logo"}” and I'll add them and draft the quote.`
          : "Which client is the project for?",
      );
    }
    if (!packages.length) return reply(`Which package for ${firstName(who[0].name)}: ${PACKAGE_MENU}?`);
    const dueDate = parseDate(m) ?? undefined;
    return reply(`Drafting a ${packages.join(" + ")} project for ${customerName(snap, who[0].id)} with a 50% deposit. Planner checks the date; the quote only goes out when you approve it.`, [
      { type: "navigate", tab: "operations" },
      { type: "create_project", customerId: who[0].id, packages, ...(dueDate ? { dueDate } : {}) },
    ]);
  }

  return null;
}
