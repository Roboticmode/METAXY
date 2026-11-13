import { business, catalog, DEMO_TODAY } from "./data";
import { addDays, describeWeek, fitDate, nextAssessment, studySlots, TOMORROW, weekPlan } from "./planner";
import { detectCollisions, formatDate, rand } from "./tools";
import type { AgentEvent, AgentRole, Approval, Customer, Invoice, Project, SchoolItem, SchoolKind, TraceStatus } from "./types";

/**
 * Owner instructions that change real data, turned into AgentEvents the store replays.
 * Pure and deterministic (no model, no network), so every instruction works offline.
 *
 * Boundaries (docs/archetypes/student-freelancer.md §6):
 * - Do alone, shown as a trace: CRM records, draft projects, capacity maths, logging a received payment.
 * - Ask first, drafted as an Approval with the exact message and changes: quotes + deposit invoices,
 *   thank-you messages, adding or moving calendar events.
 */

export type OpState = {
  customers: Customer[];
  projects: Project[];
  invoices: Invoice[];
  school: SchoolItem[];
  approvals: Approval[];
  examMode: boolean;
};

export type OpResult = { events: AgentEvent[]; say?: string; ok: boolean };

const TODAY_LABEL = "13 Nov";
const first = (name: string) => name.split(" ")[0];
const trace = (agent: AgentRole, tool: string, label: string, detail: string, status: TraceStatus = "ok"): AgentEvent => ({ type: "trace", agent, tool, label, detail, status });
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function nextNumber(ids: string[], re: RegExp, floor: number) {
  return Math.max(floor, ...ids.map((id) => Number(id.match(re)?.[1] ?? 0))) + 1;
}
export const nextClientId = (customers: { id: string }[]) => `c-${nextNumber(customers.map((c) => c.id), /^c-(3\d\d)$/, 300)}`;
const nextProjectId = (projects: Project[]) => `PRJ-${nextNumber(projects.map((p) => p.id), /^PRJ-(\d+)$/, 109)}`;
const nextInvoiceId = (invoices: Invoice[]) => `INV-${nextNumber(invoices.map((i) => i.id), /^INV-(\d+)$/, 2047)}`;
const nextSchoolId = (school: SchoolItem[], extra = 0) => `sch-${nextNumber(school.map((s) => s.id), /^sch-(\d+)$/, 8) + extra}`;

export const PACKAGES = Object.keys(catalog);

/* ------------------------------- Client Desk ------------------------------- */

export type NewClient = { name: string; business: string; phone?: string; packages?: string[]; dueDate?: string; note?: string };

export function addClient(input: NewClient, st: OpState): OpResult {
  const name = input.name.trim();
  const biz = input.business.trim();
  const dupe = st.customers.find((c) => c.name.toLowerCase() === name.toLowerCase() || c.business.toLowerCase() === biz.toLowerCase());
  if (dupe) {
    return {
      ok: false,
      events: [trace("Client Desk", "crm_lookup", "Already in CRM", `${dupe.name} (${dupe.business}) is already client ${dupe.id}; nothing added`, "warn")],
      say: `${dupe.name} (${dupe.business}) is already in your CRM, so I didn't add a duplicate.`,
    };
  }
  const id = nextClientId(st.customers);
  const n = Number(id.slice(2));
  const wants = (input.packages ?? []).filter((p) => p in catalog);
  const customer: Customer = {
    id,
    name,
    business: biz,
    phone: input.phone?.trim() || `+27 64 555 0${String(n).padStart(3, "0").slice(-3)}`,
    orders: 0,
    lastOrder: "—",
    tags: ["new lead"],
    notes: [
      `${TODAY_LABEL}: Added by Client Desk from your instruction.${wants.length ? ` Wants: ${wants.join(", ")}.` : ""}${input.note ? ` ${input.note}` : ""}`,
      "No marketing opt-in yet (ask on first quote, POPIA).",
    ],
    optIn: false,
  };
  const events: AgentEvent[] = [
    { type: "customer_add", customer },
    trace("Client Desk", "crm_add", "New lead added to CRM", `${customer.name} (${customer.business}) · ${customer.id} · ${customer.phone} (synthetic)`),
  ];
  if (!wants.length) return { ok: true, events, say: `${name} from ${biz} is now in your CRM as a new lead.` };
  const project = createProject({ customerId: id, packages: wants, dueDate: input.dueDate }, { ...st, customers: [...st.customers, customer] });
  return { ok: project.ok, events: [...events, ...project.events], say: project.say };
}

export type NewProject = { customerId: string; packages: string[]; dueDate?: string; title?: string };

export function createProject(input: NewProject, st: OpState): OpResult {
  const customer = st.customers.find((c) => c.id === input.customerId);
  const pk = input.packages.filter((p) => p in catalog);
  if (!customer || !pk.length) {
    return { ok: false, events: [trace("Client Desk", "draft_project", "Couldn't draft project", "Missing client or package", "warn")], say: "I need a client on your list and at least one package (logo kit, social pack, 3-page website or logo add-on)." };
  }
  const items = pk.map((name) => ({ name, qty: 1, unit: catalog[name].price }));
  const total = items.reduce((n, i) => n + i.unit, 0);
  const hours = pk.reduce((n, p) => n + catalog[p].hours, 0);
  const deposit = Math.round(total * 0.5);
  const deliverables = pk.flatMap((p) => catalog[p].deliverables);
  const fit = fitDate(hours, input.dueDate ?? null, st.school, st.projects, st.examMode);
  const id = nextProjectId(st.projects);
  const invoiceId = nextInvoiceId(st.invoices);
  const title = input.title?.trim() || pk.map(titleCase).join(" + ");
  const name = first(customer.name);

  const project: Project = {
    id,
    customerId: customer.id,
    customerName: `${customer.name} · ${customer.business}`,
    title,
    items,
    deliverables,
    total,
    deposit,
    dueDate: fit.date,
    hoursNeeded: hours,
    status: "scoping",
    payment: `Quote drafted · ${rand(deposit)} deposit on approval`,
  };

  const dateLine = !fit.feasible
    ? `my calendar is fully booked for the next few weeks, so I'll confirm a delivery date with you before taking it on`
    : fit.fits
    ? `${formatDate(fit.date)} works for delivery`
    : input.dueDate
      ? `${formatDate(input.dueDate)} would mean rushing (${fit.reason}), so I can deliver on ${formatDate(fit.date)}`
      : `I can deliver on ${formatDate(fit.date)}`;
  const draft = `Hi ${name}! Thanks for choosing ${business.name}. Here's your quote for ${title}: ${deliverables.join(", ")}. Total ${rand(total)}. ${dateLine}. A 50% deposit of ${rand(deposit)} by EFT locks in your slot; I'll send invoice ${invoiceId} with the banking details.`;

  // the deposit falls due a week out, but always before work starts (and never before tomorrow)
  const depositDue = [addDays(DEMO_TODAY, 7), addDays(fit.date, -2)].sort()[0];
  const invoice: Invoice = {
    id: invoiceId,
    projectId: id,
    customerId: customer.id,
    customerName: project.customerName,
    amount: deposit,
    dueDate: depositDue < TOMORROW ? TOMORROW : depositDue,
    daysOverdue: 0,
    status: "deposit_pending",
  };

  const approval: Approval = {
    id: `APR-QTE-${id}`,
    kind: "quote_send",
    targetId: id,
    customerId: customer.id,
    agent: "Client Desk",
    title: `Send quote · ${title} for ${customer.name} (${rand(total)})`,
    detail: `${id}: ${deliverables.length} deliverables, ${hours}h of studio time, ${rand(deposit)} deposit (P-01). Planner: ${fit.fits ? "fits" : fit.reason}; delivery ${formatDate(fit.date)}.`,
    draftMessage: draft,
    policy: "P-01 & P-04 · 50% deposit; owner approves every quote and invoice before it goes out",
    status: "pending",
    effects: [
      `${id} moves to awaiting a 50% deposit, due for delivery ${formatDate(fit.date)}`,
      `Books issues ${invoiceId} for ${rand(deposit)} (deposit), due ${formatDate(invoice.dueDate)}`,
    ],
    refuseEffects: [`${id} stays a draft in Projects (marked "quote held")`],
    onAllow: [
      { type: "project_update", projectId: id, patch: { status: "awaiting_deposit", payment: `Quote sent · ${rand(deposit)} deposit due (${invoiceId})` } },
      { type: "invoice_add", invoice },
      trace("Books", "issue_invoice", "Deposit invoice issued", `${invoiceId} · ${customer.name} · ${rand(deposit)} due ${formatDate(invoice.dueDate)}`),
      trace("Planner", "reserve_slot", "Studio time reserved", `${hours}h before ${formatDate(fit.date)} for ${id}, pending deposit`),
      { type: "memory", customerId: customer.id, note: `${TODAY_LABEL}: Quote sent for ${title} (${rand(total)}), ${invoiceId} deposit ${rand(deposit)} due ${formatDate(invoice.dueDate)}.` },
    ],
    onRefuse: [
      { type: "project_update", projectId: id, patch: { payment: "Quote held by Naledi · nothing sent" } },
      trace("Client Desk", "owner_decision", "Quote held", `${id} kept as a draft; nothing sent to ${customer.name}`, "warn"),
    ],
  };

  const events: AgentEvent[] = [
    trace("Client Desk", "draft_project", "Project drafted from your instruction", `${id} · ${customer.name} · ${title} · ${rand(total)} (${hours}h)`),
    trace(
      "Planner",
      "check_capacity",
      fit.fits ? "Delivery date fits" : "Delivery date adjusted",
      `${input.dueDate ? `Asked ${formatDate(input.dueDate)}: ` : ""}${fit.fits ? fit.reason : `${fit.reason} → propose ${formatDate(fit.date)}`}`,
      fit.fits ? "ok" : "warn",
    ),
    { type: "project", project },
    trace("Books", "deposit_rule", "50% deposit applied (P-01)", `${rand(deposit)} of ${rand(total)} · invoice ${invoiceId} drafted, not issued`),
    { type: "approval", approval },
  ];
  return {
    ok: true,
    events,
    say: `Drafted ${id} for ${customer.name}: ${title}, ${rand(total)} with a ${rand(deposit)} deposit, delivery ${formatDate(fit.date)}${fit.fits || !input.dueDate ? "" : ` (not ${formatDate(input.dueDate)}: ${fit.reason})`}.`,
  };
}

/* ---------------------------------- Books ---------------------------------- */

export function logPayment(invoiceId: string, st: OpState): OpResult {
  const inv = st.invoices.find((i) => i.id === invoiceId);
  if (!inv) return { ok: false, events: [], say: `I can't find ${invoiceId} in the ledger.` };
  const customer = st.customers.find((c) => c.id === inv.customerId);
  if (inv.status === "paid") {
    return { ok: false, events: [trace("Books", "log_payment", "Already paid", `${inv.id} was already marked paid; nothing changed`, "warn")], say: `${inv.id} is already marked paid.` };
  }
  const name = customer ? first(customer.name) : "there";
  const project = st.projects.find((p) => p.id === inv.projectId);
  const deposit = inv.status === "deposit_pending";
  const late = inv.daysOverdue > 0;
  const note = late
    ? `${TODAY_LABEL}: Paid ${inv.id} (${rand(inv.amount)}) ${inv.daysOverdue} days late. Late-payer pattern: keep the 7-day reminder rule and take the deposit upfront.`
    : `${TODAY_LABEL}: Paid ${inv.id} (${rand(inv.amount)}) on time. Reliable payer.`;

  const events: AgentEvent[] = [
    trace("Books", "log_payment", "Payment logged", `${inv.id} · ${inv.customerName} · ${rand(inv.amount)} received by EFT (recorded, no money moved)`),
    { type: "invoice_update", invoiceId: inv.id, status: "paid", daysOverdue: 0 },
  ];
  if (project) {
    events.push({
      type: "project_update",
      projectId: project.id,
      patch: deposit
        ? { payment: `50% deposit ${rand(inv.amount)} paid (${TODAY_LABEL})`, ...(project.status === "awaiting_deposit" ? { status: "in_progress" as const } : {}) }
        : { payment: `Paid in full (${TODAY_LABEL})` },
    });
  }
  if (customer) {
    events.push({ type: "memory", customerId: customer.id, note });
    events.push(trace("Client Desk", "crm_note", "Reliability note added", note, late ? "warn" : "ok"));
  }
  for (const ap of st.approvals.filter((a) => a.status === "pending" && a.kind === "invoice_reminder" && a.targetId === inv.id)) {
    events.push({ type: "approval_resolved", id: ap.id, status: "refused" });
    events.push(trace("Books", "withdraw_reminder", "Reminder withdrawn", `${ap.id} not sent: ${inv.id} is paid`, "ok"));
  }
  if (customer) {
    const draft = `Hi ${name}, payment for ${inv.id} (${rand(inv.amount)}) received, thank you! ${deposit && project ? `Your slot for ${project.title} is locked in and I'm starting right away.` : `Always a pleasure working with ${customer.business}.`}`;
    events.push({
      type: "approval",
      approval: {
        id: `APR-THX-${inv.id}`,
        kind: "payment_thanks",
        targetId: inv.id,
        customerId: customer.id,
        agent: "Books",
        title: `Send thank-you · ${inv.id} paid (${rand(inv.amount)})`,
        detail: `${customer.name} (${customer.business}) paid ${inv.id}${late ? ` after ${inv.daysOverdue} days overdue` : ""}. Drafted a short thank-you.`,
        draftMessage: draft,
        policy: "P-04 · Owner approves every outbound message",
        status: "pending",
        effects: [],
        onAllow: [trace("Books", "thank_you", "Thank-you sent", `${customer.name} · ${inv.id}`)],
      },
    });
  }
  return { ok: true, events, say: `${inv.id} is now Paid${project ? ` and ${project.id} is updated` : ""}. ${customer ? `I added a reliability note to ${customer.name}'s CRM card and drafted a thank-you.` : ""}`.trim() };
}

/* --------------------------------- Planner --------------------------------- */

export type SchoolChange = { moveId?: string; module: string; title: string; kind: SchoolKind; date: string; hours: number };

/** Preview which client deliveries would land on the new date. */
function clashPreview(st: OpState, school: SchoolItem[]) {
  const before = new Set(detectCollisions(st.projects, st.school).map((c) => `${c.project.id}|${c.school.id}`));
  return detectCollisions(st.projects, school).filter((c) => !before.has(`${c.project.id}|${c.school.id}`));
}

export function scheduleSchool(input: SchoolChange, st: OpState): OpResult {
  const existing = input.moveId ? st.school.find((s) => s.id === input.moveId) : undefined;
  if (input.moveId && !existing) return { ok: false, events: [], say: "I can't find that calendar item." };
  if (existing && existing.date === input.date) return { ok: false, events: [], say: `${existing.title} is already on ${formatDate(input.date)}.` };

  const fixed = input.kind !== "study";
  const item: SchoolItem = existing ? { ...existing, date: input.date } : { id: nextSchoolId(st.school), module: input.module, title: input.title, kind: input.kind, date: input.date, hours: input.hours, fixed };
  const school = existing ? st.school.map((s) => (s.id === existing.id ? item : s)) : [...st.school, item];
  const clashes = clashPreview(st, school);
  const what = existing ? `${existing.title} moves from ${formatDate(existing.date)} to ${formatDate(input.date)}` : `${item.title} (${item.module}) is added on ${formatDate(item.date)}, ${item.fixed ? "fixed" : "flexible"}, ${item.hours}h`;
  const effects = [`Your calendar: ${what}`];
  if (clashes.length) for (const c of clashes) effects.push(`Heads-up: ${c.project.id} (${c.project.title}) is due that day. Planner drafts a fix for you after this`);
  else effects.push("Planner re-checks client deadlines straight after; nothing clashes with the new date");

  const onAllow: AgentEvent[] = existing
    ? [{ type: "school_update", id: existing.id, date: input.date }]
    : [{ type: "school_add", item }];
  onAllow.push(trace("Planner", "calendar_update", existing ? "Calendar event moved" : "Calendar event added", what));

  return {
    ok: true,
    events: [
      trace("Planner", "capture_deadline", existing ? "Deadline change captured" : "New deadline captured", `${what} · waiting for your OK`, clashes.length ? "warn" : "ok"),
      {
        type: "approval",
        approval: {
          id: `APR-CAL-${item.id}-${input.date}`,
          kind: "calendar_change",
          targetId: item.id,
          agent: "Planner",
          title: existing ? `Move ${existing.title} to ${formatDate(input.date)}` : `Add ${item.title} on ${formatDate(item.date)}`,
          detail: clashes.length ? `Lands on the same day as ${clashes.map((c) => c.project.id).join(", ")}.` : "No client delivery lands on that day.",
          policy: "P-04 · Owner approves adding or moving real calendar events",
          status: "pending",
          effects,
          onAllow,
        },
      },
    ],
    say: `${what}.${clashes.length ? ` That lands on ${clashes.map((c) => `${c.project.id} (${c.project.title})`).join(", ")}, so Planner will draft a fix once you approve.` : " No client deliveries clash with it."}`,
  };
}

export function planStudy(targetId: string | undefined, st: OpState): OpResult {
  const target = targetId ? st.school.find((s) => s.id === targetId) : nextAssessment(st.school);
  if (!target) return { ok: false, events: [], say: "I couldn't find an upcoming test or exam to plan for." };
  const slots = studySlots(target, st.school);
  if (!slots.length) {
    return {
      ok: false,
      events: [trace("Planner", "plan_study", "No free study window", `Client work and fixed classes fill the week before ${target.title}`, "warn")],
      say: `There's no free window before ${target.title} (${formatDate(target.date)}): client work and classes fill that week. Want me to look at moving a client delivery instead?`,
    };
  }
  const items: SchoolItem[] = slots.map((s, i) => ({
    id: nextSchoolId(st.school, i),
    module: target.module,
    title: `Study: ${target.title}`,
    kind: "study",
    date: s.date,
    hours: s.hours,
    fixed: false,
  }));
  const lines = items.map((i) => `${formatDate(i.date)}: ${i.hours}h study block for ${target.title}`);
  return {
    ok: true,
    events: [
      trace("Planner", "plan_study", "Study blocks proposed", `${lines.join(" · ")} (only where client work leaves room)`),
      {
        type: "approval",
        approval: {
          id: `APR-STD-${target.id}-${items.map((i) => i.date.slice(5)).join("-")}`,
          kind: "calendar_change",
          targetId: target.id,
          agent: "Planner",
          title: `Add ${items.length} study block${items.length > 1 ? "s" : ""} for ${target.title}`,
          detail: `Before ${formatDate(target.date)}, placed around client work.`,
          policy: "P-04 · Owner approves adding real calendar events",
          status: "pending",
          effects: lines.map((l) => `Your calendar: ${l}`),
          onAllow: [...items.map((item): AgentEvent => ({ type: "school_add", item })), trace("Planner", "calendar_update", "Study blocks added", lines.join(" · "))],
        },
      },
    ],
    say: `Planner found ${items.length} window${items.length > 1 ? "s" : ""} before ${target.title} (${formatDate(target.date)}): ${lines.join("; ")}.${items.length < 2 ? " The other days that week are full with client work and classes." : ""}`,
  };
}

export function capacityPlan(weekStart: string, st: OpState): OpResult {
  const w = weekPlan(weekStart, st.school, st.projects);
  const nameOf = (id: string) => st.customers.find((c) => c.id === id)?.name ?? id;
  return {
    ok: true,
    events: [
      trace(
        "Planner",
        "weekly_capacity",
        `Capacity plan · week of ${formatDate(w.start)}`,
        `${w.free}h free · ${w.clientBooked}h client · ${w.schoolHours}h university · ${w.risks.length} risk${w.risks.length === 1 ? "" : "s"}`,
        w.risks.length ? "warn" : "ok",
      ),
    ],
    say: describeWeek(w, nameOf),
  };
}
