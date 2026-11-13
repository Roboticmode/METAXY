import { business, catalog, initialCustomers, newCustomer, TURNOVER } from "./data";
import type { Brain, ComposeCtx } from "./brain";
import { checkPlannerCapacity, checkPolicy, detectCollisions, findOverdueInvoices, formatDate, priceItems, rand } from "./tools";
import type { AgentEvent, AgentRequest, AgentRole, Customer, Invoice, Project, SchoolItem, Understanding } from "./types";
import { complianceTasks, preparedPacks, vault } from "@/lib/compliance/data";
import { automations, bankingDetails, businessHours, checkinCandidates, deliveryArea } from "@/lib/whatsapp/data";

const allCustomers: Customer[] = [...initialCustomers, newCustomer];
const trace = (agent: AgentRole, tool: string, label: string, detail: string, status: "ok" | "warn" | "block" = "ok"): AgentEvent => ({
  type: "trace",
  agent,
  tool,
  label,
  detail,
  status,
});

async function safe<T>(events: AgentEvent[], agent: AgentRole, tool: string, primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (e) {
    events.push(trace(agent, tool, "Engine fallback", `LLM call failed (${(e as Error).message.slice(0, 70)}) — using scripted engine`, "warn"));
    return fallback();
  }
}

export async function runAgent(brain: Brain, fallbackBrain: Brain, req: AgentRequest): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  const compose = (agent: AgentRole, ctx: ComposeCtx) => safe(events, agent, "compose_reply", () => brain.compose(ctx), () => fallbackBrain.compose(ctx));

  if (req.kind === "compliance_prepare") return prepareCompliance(req.taskId, req.vault);
  if (req.kind === "run_automations") return runAutomations(req.enabled, req.projects, req.invoices);
  if (req.kind === "check_collisions") return runCollisionCheck(brain, fallbackBrain, req.projects, req.school);
  if (req.kind === "chase_overdue") return runChaseOverdue(brain, fallbackBrain, req.invoices);
  if (req.kind === "toggle_exam_mode") return runExamMode(brain, fallbackBrain, req.active, req.projects);

  if (req.kind === "approval") {
    return resolveApproval(req.decision, req.approval);
  }

  // customer_message
  const customer = allCustomers.find((c) => c.id === req.customerId) ?? newCustomer;
  const enabled = new Set(req.enabled ?? automations.map((a) => a.id));
  const projects = req.projects ?? [];

  const u = await safe(events, "Client Desk", "understand_message", () => brain.understand(req.text), () => fallbackBrain.understand(req.text));
  events.push(
    trace(
      "Client Desk",
      "understand_message",
      "Triage incoming WhatsApp",
      [
        `from: ${customer.name} (${customer.business})`,
        `intent: ${u.intent.replace("_", " ")}`,
        u.emotion !== "neutral" ? `urgency/tone: ${u.emotion}` : null,
        u.requestedDate ? `asked for: ${formatDate(u.requestedDate)}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      u.emotion === "frustrated" || u.intent === "academic_integrity" ? "block" : u.emotion === "urgent" ? "warn" : "ok",
    ),
  );

  // Hard boundary: never perform academic coursework
  if (u.intent === "academic_integrity") {
    events.push(trace("Client Desk", "policy_guard", "Academic integrity boundary (P-05)", "Blocked — METAXY schedules around school, never writes or completes coursework", "block"));
    events.push({ type: "reply", text: await compose("Client Desk", { kind: "academic_refusal", customer }) });
    return events;
  }

  events.push(trace("Client Desk", "customer_memory", "Match client ledger", customer.orders === 0 ? `${customer.name} (${customer.business}) — new lead` : `${customer.name} (${customer.business}) — ${customer.orders} past projects`));

  // Exam mode pauses new enquiries cleanly
  if (req.examMode && u.intent === "order") {
    events.push(trace("Planner", "exam_mode", "Exam Mode active", "New project intake paused until 5 Dec — drafting polite away reply", "warn"));
    const draft = `Hi ${customer.name.split(" ")[0]}! Thanks for reaching out to ${business.name}. I'm in university exams until 4 Dec so new bookings reopen on 5 Dec — can I pencil you in for the week of 7 Dec?`;
    events.push({
      type: "approval",
      approval: {
        id: `APR-EXM-${Date.now().toString().slice(-4)}`,
        kind: "reply_date",
        targetId: "exam",
        customerId: customer.id,
        agent: "Planner",
        title: "Exam Mode enquiry reply",
        detail: `${customer.name} asked for a new project while Exam Mode is on.`,
        draftMessage: draft,
        policy: "P-04 · Ask first before sending external client messages",
        status: "pending",
      },
    });
    return events;
  }

  // Scenario 4: Scope creep check against active project deliverables
  if (u.intent === "scope_change" && enabled.has("scope_guard")) {
    const activeProject = projects.find((p) => p.customerId === customer.id && p.status !== "delivered") ?? projects[0];
    const addOnTotal = catalog["logo add-on"].price;
    const addOnText = "3 extra logo variations + Instagram launch pack";
    events.push(
      trace(
        "Client Desk",
        "compare_deliverables",
        "Scope-creep detected",
        `${activeProject.id} agreed deliverables: [${activeProject.deliverables.join(", ")}] → request adds "${addOnText}"`,
        "warn",
      ),
    );
    const draft = await compose("Client Desk", { kind: "scope_quote", customer, project: activeProject, addOnTotal, addOnText });
    events.push(trace("Books", "draft_addon_quote", "Calculate change quote", `Add-on priced at ${rand(addOnTotal)} (3h studio work · 50% deposit ${rand(Math.round(addOnTotal * 0.5))}) — held for owner approval`));
    events.push({
      type: "project_update",
      projectId: activeProject.id,
      patch: { scopeFlag: `Out-of-scope ask: +${rand(addOnTotal)} quote pending` },
    });
    events.push({
      type: "approval",
      approval: {
        id: `APR-SCP-${activeProject.id}`,
        kind: "scope_quote",
        targetId: activeProject.id,
        customerId: customer.id,
        agent: "Client Desk",
        title: `Scope-creep add-on quote · ${customer.name}`,
        detail: `Requested "${addOnText}" outside ${activeProject.id} deliverables. Drafted transparent ${rand(addOnTotal)} change quote.`,
        draftMessage: draft,
        policy: "P-03 · Out-of-scope requests require owner-approved change quote",
        status: "pending",
      },
    });
    events.push({ type: "memory", customerId: customer.id, note: `13 Nov: Asked for ${addOnText} outside ${activeProject.id} scope — change quote prepared.` });
    return events;
  }

  // FAQs, status & handoffs
  if (u.intent !== "order" || !enabled.has("order_intake")) {
    const myProjects = projects.filter((p) => p.customerId === customer.id);
    const info = u.intent === "order" ? null : answerFor(u, myProjects);
    if (info && enabled.has("faq")) {
      events.push(trace("Client Desk", "answer_faq", "Answer from studio brief", `${info.topic} — instant reply, zero owner time`));
      events.push({ type: "reply", text: await compose("Client Desk", { kind: "info", customer, understanding: u, topic: info.topic, facts: info.facts }) });
      return events;
    }
    const reason =
      u.intent === "complaint"
        ? "Client complaint — Naledi should respond personally"
        : info || u.intent === "order"
          ? "Automation paused by owner"
          : "Question outside studio brief";
    events.push(trace("Client Desk", "escalate", "Hand off to owner", reason, u.intent === "complaint" ? "block" : "warn"));
    events.push({ type: "handoff", customerId: customer.id, reason });
    events.push({ type: "reply", text: await compose("Client Desk", { kind: "handoff", customer, understanding: u, reason }) });
    if (u.intent === "complaint") events.push({ type: "memory", customerId: customer.id, note: `13 Nov complaint: “${req.text.slice(0, 75)}” — handed to Naledi.` });
    return events;
  }

  // Scenario 1: New enquiry -> Client Desk + Planner two-sided capacity check + Books deposit quote -> Approval card
  const { priced, total, hours, deliverables } = priceItems(u.items);
  const capCheck = checkPlannerCapacity(u.requestedDate, hours);
  events.push(
    trace(
      "Planner",
      "check_capacity",
      "Check university + studio calendar",
      capCheck.available
        ? `${capCheck.label}: ${capCheck.freeHours}h free (needs ${hours}h) → AVAILABLE`
        : `${capCheck.label}: BLOCKED (${capCheck.blocker}) → proposing ${formatDate(capCheck.proposedDate)}`,
      capCheck.available ? "ok" : "warn",
    ),
  );

  const policy = checkPolicy({ priorOrders: customer.orders, paymentTerm: u.paymentTerm, total });
  events.push(trace("Books", "price_and_deposit", "Draft quote & deposit rule", `${rand(total)} total · 50% deposit ${rand(policy.deposit)} (${policy.rule})`));

  const assignedDate = capCheck.available ? capCheck.date : capCheck.proposedDate;
  const project: Project = {
    id: `PRJ-${110 + Math.floor(Math.random() * 40)}`,
    customerId: customer.id,
    customerName: `${customer.name} · ${customer.business}`,
    title: priced.map((i) => i.name).join(" + "),
    items: priced,
    deliverables,
    total,
    deposit: policy.deposit,
    dueDate: assignedDate,
    hoursNeeded: hours,
    status: "awaiting_approval",
    payment: `Quote ${rand(total)} · 50% deposit ${rand(policy.deposit)} (pending approval)`,
  };
  events.push({ type: "project", project });

  const draft = await compose("Client Desk", {
    kind: "enquiry_reply",
    customer,
    understanding: u,
    capacity: { label: capCheck.label, available: capCheck.available, blocker: capCheck.blocker, proposedDate: capCheck.proposedDate },
    project,
  });

  events.push(trace("Client Desk", "stage_approval", "Hold outbound message for approval", "Drafted honest reply — waiting for Naledi before sending on WhatsApp", "warn"));
  events.push({
    type: "approval",
    approval: {
      id: `APR-${project.id}`,
      kind: "reply_date",
      targetId: project.id,
      customerId: customer.id,
      agent: "Planner",
      title: capCheck.available ? `Approve quote & date · ${customer.name}` : `Test-week capacity alert · propose ${formatDate(capCheck.proposedDate)}`,
      detail: capCheck.available
        ? `${project.title} (${rand(total)}) fits on ${capCheck.label}.`
        : `${capCheck.blocker}. Proposing ${formatDate(capCheck.proposedDate)} (${hours}h studio block) + 50% deposit ${rand(policy.deposit)}.`,
      draftMessage: draft,
      policy: "P-02 & P-04 · Two-sided capacity verified; owner approves all outbound replies",
      status: "pending",
    },
  });
  events.push({
    type: "memory",
    customerId: customer.id,
    note: `13 Nov: Urgent ${project.title} enquiry. Offered ${formatDate(assignedDate ?? capCheck.proposedDate)} due to IS302 test week.`,
  });

  return events;
}

/* ------------------------- Scenario 2: Collision week check ------------------------- */

async function runCollisionCheck(brain: Brain, fallback: Brain, projects: Project[], school: SchoolItem[]): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  const compose = (ctx: ComposeCtx) => safe(events, "Planner", "compose_reply", () => brain.compose(ctx), () => fallback.compose(ctx));

  events.push(trace("Planner", "scan_commitments", "Scan Client + School calendars", `Checking ${projects.length} active projects against ${school.length} academic deadlines`));
  const hits = detectCollisions(projects, school);
  if (!hits.length) {
    events.push(trace("Planner", "scan_commitments", "No collisions found", "All active deliveries fit around fixed university commitments", "ok"));
    return events;
  }

  for (const h of hits) {
    const customer = allCustomers.find((c) => c.id === h.project.customerId) ?? initialCustomers[3];
    events.push(
      trace(
        "Planner",
        "collision_detected",
        "Deadline collision found!",
        `${h.project.id} (${h.project.customerName}) & ${h.school.title} both fall on ${formatDate(h.school.date)}`,
        "block",
      ),
    );
    const studyNote = h.studyToShift ? `Shift "${h.studyToShift.title}" to Sat 21 Nov` : "Rebalance 2h revision block";
    events.push(
      trace(
        "Planner",
        "propose_fix",
        "Propose 2-sided resolution",
        `${studyNote} + ask ${customer.name.split(" ")[0]} for +1 day to ${formatDate(h.proposedDue)}`,
        "warn",
      ),
    );
    const draft = await compose({ kind: "collision_extension", customer, project: h.project, school: h.school, newDate: h.proposedDue });
    events.push({
      type: "approval",
      approval: {
        id: `APR-COL-${h.project.id}`,
        kind: "collision_fix",
        targetId: h.project.id,
        customerId: customer.id,
        agent: "Planner",
        title: `Resolve ${formatDate(h.school.date)} collision · ${h.school.title}`,
        detail: `${h.project.id} (${h.project.customerName}) collides with ${h.school.title}. Approve moving study block & requesting +1 day (${formatDate(h.proposedDue)})?`,
        draftMessage: draft,
        policy: "P-02 & P-04 · Protect fixed university milestones; owner approves schedule shifts & messages",
        status: "pending",
      },
    });
  }
  return events;
}

/* ------------------------- Scenario 3: Chase overdue invoices (Books) ------------------------- */

async function runChaseOverdue(brain: Brain, fallback: Brain, invoices: Invoice[]): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  const compose = (ctx: ComposeCtx) => safe(events, "Books", "compose_reply", () => brain.compose(ctx), () => fallback.compose(ctx));

  events.push(trace("Books", "scan_ledger", "Scan invoice ledger", `Checking ${invoices.length} seeded invoices for overdue balances`));
  const overdue = findOverdueInvoices(invoices);
  if (!overdue.length) {
    events.push(trace("Books", "scan_ledger", "Ledger clean", "No overdue invoices right now", "ok"));
    return events;
  }

  const top = overdue[0]; // INV-2041 (21 days overdue, Kagiso Molefe)
  const customer = allCustomers.find((c) => c.id === top.customerId) ?? initialCustomers[1];
  events.push(trace("Books", "flag_overdue", "Overdue invoice flagged", `${top.id} · ${customer.name} (${customer.business}) · ${rand(top.amount)} is ${top.daysOverdue} days overdue`, "block"));

  const draft = await compose({ kind: "invoice_reminder", customer, invoice: top });
  events.push({
    type: "approval",
    approval: {
      id: `APR-INV-${top.id}`,
      kind: "invoice_reminder",
      targetId: top.id,
      customerId: customer.id,
      agent: "Books",
      title: `Send overdue EFT reminder · ${top.id} (${rand(top.amount)})`,
      detail: `${customer.name} (${customer.business}) is ${top.daysOverdue} days overdue. Drafted polite EFT nudge.`,
      draftMessage: draft,
      policy: "P-04 · Owner approves outbound payment reminders",
      status: "pending",
    },
  });
  return events;
}

/* ------------------------- Scenario 5 (Bonus): Exam mode ------------------------- */

async function runExamMode(brain: Brain, fallback: Brain, active: boolean, projects: Project[]): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  const compose = (ctx: ComposeCtx) => safe(events, "Planner", "compose_reply", () => brain.compose(ctx), () => fallback.compose(ctx));

  if (!active) {
    events.push(trace("Planner", "exam_mode", "Exam Mode turned off", "Studio intake reopened at normal term capacity (8–10 hrs/wk)", "ok"));
    return events;
  }
  const activeProj = projects.find((p) => p.status === "in_progress");
  events.push(trace("Planner", "exam_mode", "Exam Mode enabled", "New project intake paused until 5 Dec · preparing client status notice", "warn"));
  if (activeProj) {
    const customer = allCustomers.find((c) => c.id === activeProj.customerId) ?? initialCustomers[3];
    const draft = await compose({ kind: "exam_notice", customer, project: activeProj });
    events.push({
      type: "approval",
      approval: {
        id: `APR-EXM-BATCH`,
        kind: "exam_pause",
        targetId: activeProj.id,
        customerId: customer.id,
        agent: "Planner",
        title: "Exam Mode client notice",
        detail: `Notify active client ${customer.name} that intake is paused 1–4 Dec while keeping ${activeProj.id} on track.`,
        draftMessage: draft,
        policy: "P-04 · Owner approves batch client notices",
        status: "pending",
      },
    });
  }
  return events;
}

/* ------------------------- Approval resolution ------------------------- */

function resolveApproval(decision: "allow" | "refuse", approval: Extract<AgentRequest, { kind: "approval" }>["approval"]): AgentEvent[] {
  const events: AgentEvent[] = [];
  const allow = decision === "allow";
  events.push({ type: "approval_resolved", id: approval.id, status: allow ? "allowed" : "refused" });
  events.push(
    trace(
      approval.agent,
      "owner_decision",
      allow ? "Approved by Naledi" : "Held by Naledi",
      allow ? `Executed ${approval.title}` : `Did not send — ${approval.title} cancelled`,
      allow ? "ok" : "warn",
    ),
  );

  if (!allow) {
    if (approval.kind === "reply_date" && approval.targetId !== "exam") {
      events.push({ type: "project_update", projectId: approval.targetId, patch: { status: "declined", payment: "Declined by owner" } });
    }
    return events;
  }

  // Send the exact approved WhatsApp message!
  if (approval.draftMessage && approval.customerId) {
    events.push({ type: "reply", customerId: approval.customerId, text: approval.draftMessage });
  }

  switch (approval.kind) {
    case "reply_date":
      if (approval.targetId !== "exam") {
        events.push({
          type: "project_update",
          projectId: approval.targetId,
          patch: { status: "awaiting_deposit", payment: "Quote sent · awaiting 50% EFT deposit" },
        });
        events.push(trace("Planner", "reserve_slot", "Provisional studio block added", `Reserved capacity on shared calendar pending 50% deposit`));
      }
      break;
    case "collision_fix":
      events.push({ type: "project_update", projectId: approval.targetId, patch: { dueDate: "2026-11-26" } });
      events.push({ type: "school_update", id: "sch-6", date: "2026-11-21", note: "Shifted to Sat 21 Nov studio/study window" });
      events.push(trace("Planner", "clear_collision", "Collision cleared", "Moved PRJ-109 to Thu 26 Nov & shifted revision block to Sat 21 Nov", "ok"));
      break;
    case "invoice_reminder":
      events.push({ type: "invoice_update", invoiceId: approval.targetId, status: "paid", daysOverdue: 0 });
      events.push({ type: "project_update", projectId: "PRJ-102", patch: { payment: "Paid in full after reminder (13 Nov)" } });
      if (approval.customerId) {
        events.push({ type: "memory", customerId: approval.customerId, note: "13 Nov: Paid INV-2041 (21d overdue) promptly after reminder — keep polite 7d nudge rule." });
      }
      break;
    case "scope_quote":
      events.push({
        type: "project_update",
        projectId: approval.targetId,
        patch: {
          total: 2150,
          scopeFlag: "Add-on quoted (+R950) — awaiting EFT",
          payment: "Original R600 paid · R475 add-on deposit due",
        },
      });
      break;
    case "exam_pause":
      break;
  }

  // Nudge formalisation when business hits steady traction
  if (approval.kind === "reply_date" || approval.kind === "invoice_reminder") {
    events.push(trace("Books", "compliance_watch", "Check formalisation readiness", `Trailing 12-mo turnover ≈ ${rand(TURNOVER.last12)} — corporate clients & CIPC readiness available`));
    events.push({
      type: "compliance",
      nudge: {
        title: "Ready to formalise Naledi Studio",
        detail: `Studio turnover is ≈${rand(TURNOVER.last12)} across 12 months. Registering with CIPC unlocks a separate business bank account and corporate retainers (and keeps your student finances cleanly separate).`,
        source: "CIPC / SARS public guidance — not legal or tax advice",
      },
    });
  }

  return events;
}

/* ------------------------- WhatsApp: repetitive questions ------------------------- */

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function answerFor(u: Understanding, myProjects: Project[]): { topic: string; facts: string } | null {
  const open = myProjects.filter((p) => p.status !== "declined" && p.status !== "delivered");
  switch (u.intent) {
    case "faq_rates":
      return {
        topic: "Studio rates",
        facts: `Here are my packages: ${Object.entries(catalog)
          .filter(([k]) => k !== "logo add-on")
          .map(([name, v]) => `${cap(name)} ${rand(v.price)}`)
          .join(" · ")}. We work on a 50% deposit to book a slot — tell me what you need and your ideal date!`,
      };
    case "faq_hours":
      return { topic: "Studio hours", facts: `${businessHours}. Send your brief anytime and Planner will check the next open slot.` };
    case "faq_location":
      return { topic: "Location & delivery", facts: `${deliveryArea}.` };
    case "banking_details": {
      const due = open.find((p) => p.status === "awaiting_deposit");
      return {
        topic: "Banking details",
        facts: `Here are the studio EFT details: ${bankingDetails}. ${
          due ? `Please use ${due.id} as the reference — the 50% deposit is ${rand(due.deposit)}.` : "Please use your business name as reference."
        } Pop proof of payment here when done! 🙏`,
      };
    }
    case "order_status": {
      const p = open[0];
      if (!p) return { topic: "Project status", facts: "I don't see an active project on this number — send over what you'd like to build and your target date!" };
      const when = p.dueDate ? formatDate(p.dueDate) : "TBC";
      return { topic: "Project status", facts: `Your project ${p.id} (${p.title}) is ${p.status.replace("_", " ")} with target date ${when}.` };
    }
    default:
      return null;
  }
}

/* ------------------------- WhatsApp: scheduled automations ------------------------- */

function runAutomations(enabledIds: string[], projects: Project[], invoices: Invoice[]): AgentEvent[] {
  const events: AgentEvent[] = [];
  const enabled = new Set(enabledIds);
  const cust = (id: string) => allCustomers.find((c) => c.id === id) ?? newCustomer;
  const firstName = (id: string) => cust(id).name.split(" ")[0];
  let sent = 0;

  events.push(trace("Books", "scheduler", "Run today's studio automations", `${enabled.size} rules on · checking ${projects.length} projects & ${invoices.length} invoices`));

  const send = (agent: AgentRole, ruleId: string, customerId: string, text: string, why: string) => {
    const rule = automations.find((a) => a.id === ruleId)!;
    events.push(trace(agent, ruleId, rule.label, `${cust(customerId).name} — ${why}${rule.template ? ` · template ${rule.template}` : ""}`));
    events.push({ type: "reply", customerId, text, automation: rule.label });
    sent++;
  };

  if (enabled.has("deposit_reminder")) {
    for (const p of projects.filter((x) => x.status === "awaiting_deposit")) {
      send(
        "Books",
        "deposit_reminder",
        p.customerId,
        `Hi ${firstName(p.customerId)}, friendly nudge 😊 Your slot for ${p.title} (${p.dueDate ? formatDate(p.dueDate) : "TBC"}) is pencilled in — EFT the ${rand(p.deposit)} deposit (ref ${p.id}) whenever you're ready to lock it in.`,
        `${rand(p.deposit)} deposit pending on ${p.id}`,
      );
    }
  }
  if (enabled.has("progress_update")) {
    const active = projects.find((p) => p.status === "in_progress");
    if (active) {
      send(
        "Client Desk",
        "progress_update",
        active.customerId,
        `Hi ${firstName(active.customerId)}! Quick update on ${active.title} (${active.id}): still on track for ${active.dueDate ? formatDate(active.dueDate) : "next week"} — I'll send the next preview right after Thursday's uni test. ✨`,
        `${active.id} proactive test-week check-in`,
      );
    }
  }
  if (enabled.has("reorder")) {
    for (const id of checkinCandidates) {
      const c = cust(id);
      if (!c.optIn) {
        events.push(trace("Client Desk", "reorder", "Check-in skipped (POPIA s69)", `${c.name} — no marketing opt-in`, "warn"));
        continue;
      }
      send("Client Desk", "reorder", id, `Hi ${firstName(id)} 👋 Hope ${c.business} is booming! If you need Q4 holiday graphics or promos before December exams, I have a few studio hours open next week. Reply STOP to opt out.`, `dormant since ${c.lastOrder}, opted in`);
    }
  }

  events.push(trace("Books", "scheduler", "Automations complete", sent ? `${sent} client updates sent — ≈${sent * 4} min saved` : "Nothing due right now", "ok"));
  return events;
}

/* ------------------------- Compliance: prepare a legal task ------------------------- */

function prepareCompliance(taskId: string, have: string[] = vault): AgentEvent[] {
  const events: AgentEvent[] = [];
  const task = complianceTasks.find((t) => t.id === taskId);
  if (!task) return [trace("Books", "compliance", "Unknown task", taskId, "block")];

  events.push(trace("Books", "load_requirements", `Load requirements · ${task.label}`, `${task.steps.length} steps · source: ${task.where.label}`));
  const missing = task.docs.filter((d) => !have.includes(d));
  events.push(
    trace(
      "Books",
      "check_vault",
      "Check document vault",
      missing.length ? `${task.docs.length - missing.length}/${task.docs.length} found — missing: ${missing.join(", ")}` : `All ${task.docs.length} documents found`,
      missing.length ? "warn" : "ok",
    ),
  );

  const prepared = preparedPacks[task.id] ?? task.steps.map((s) => cap(s));
  events.push(trace("Books", "prefill_forms", "Pre-fill from studio profile", `${business.name} · ${business.owner} · ${business.area}`));
  events.push(trace("Books", "handoff_to_owner", "Your turn — agent never signs or pays", task.ownerMust, "warn"));
  events.push({ type: "compliance_task", id: task.id, status: "ready", prepared, missing });
  return events;
}
