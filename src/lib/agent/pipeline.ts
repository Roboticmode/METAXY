import { business, catalog, initialCustomers, newCustomer, TURNOVER } from "./data";
import type { Brain, ComposeCtx } from "./brain";
import { checkCalendar, checkPolicy, formatDate, priceItems, rand } from "./tools";
import type { AgentEvent, AgentRequest, Customer, Order, Understanding } from "./types";
import { complianceTasks, preparedPacks, vault } from "@/lib/compliance/data";
import { automations, bankingDetails, businessHours, deliveryArea, reorderCandidates, TOMORROW, YESTERDAY } from "@/lib/whatsapp/data";

const allCustomers: Customer[] = [...initialCustomers, newCustomer];
const trace = (tool: string, label: string, detail: string, status: "ok" | "warn" | "block" = "ok"): AgentEvent => ({ type: "trace", tool, label, detail, status });

/** Fallback when an LLM step fails: keep the demo alive and say so. */
async function safe<T>(events: AgentEvent[], tool: string, primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (e) {
    events.push(trace(tool, "Engine fallback", `LLM call failed (${(e as Error).message.slice(0, 80)}) — using scripted engine`, "warn"));
    return fallback();
  }
}

export async function runAgent(brain: Brain, fallbackBrain: Brain, req: AgentRequest): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  const compose = (ctx: ComposeCtx) => safe(events, "compose_reply", () => brain.compose(ctx), () => fallbackBrain.compose(ctx));

  if (req.kind === "compliance_prepare") return prepareCompliance(req.taskId, req.vault);
  if (req.kind === "run_automations") return runAutomations(req.enabled, req.orders);

  if (req.kind === "customer_message") {
    const customer = allCustomers.find((c) => c.id === req.customerId) ?? newCustomer;
    const enabled = new Set(req.enabled ?? automations.map((a) => a.id));

    const u = await safe(events, "understand_message", () => brain.understand(req.text), () => fallbackBrain.understand(req.text));
    const isOrder = u.intent === "order";
    events.push(
      trace(
        "understand_message",
        "Read message",
        [
          `intent: ${u.intent.replace("_", " ")}`,
          u.greeting ? "greeted" : "no greeting — went straight to request",
          u.emotion !== "neutral" ? `emotional context: ${u.emotion}` : null,
          isOrder ? `items: ${u.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}` : null,
          u.requestedDate ? `date: ${formatDate(u.requestedDate)}` : isOrder ? "no date" : null,
          isOrder ? `payment: ${u.paymentTerm.replace("_", " ")}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        u.emotion === "bereavement" || u.emotion === "frustrated" ? "warn" : "ok",
      ),
    );

    events.push(trace("customer_memory", "Look up customer", customer.orders === 0 ? `${customer.name} — new customer, no history` : `${customer.name} — ${customer.orders} previous orders`));

    // Repetitive questions & things only the owner should handle
    if (!isOrder || !enabled.has("order_intake")) {
      const myOrders = (req.orders ?? []).filter((o) => o.customerId === customer.id);
      const info = isOrder ? null : answerFor(u, myOrders);
      if (info && enabled.has("faq")) {
        events.push(trace("answer_faq", "Answer from brief", `${info.topic} — no owner time needed`));
        events.push({ type: "reply", text: await compose({ kind: "info", customer, understanding: u, topic: info.topic, facts: info.facts }) });
        return events;
      }
      const reason =
        u.intent === "complaint"
          ? "Complaint — owner should respond personally"
          : info || isOrder
            ? "Automation switched off by owner"
            : "Question not covered by the agent brief";
      events.push(trace("escalate", "Hand off to owner", reason, u.intent === "complaint" ? "block" : "warn"));
      events.push({ type: "handoff", customerId: customer.id, reason });
      events.push({ type: "reply", text: await compose({ kind: "handoff", customer, understanding: u, reason }) });
      if (u.intent === "complaint") events.push({ type: "memory", customerId: customer.id, note: `Complaint 13 Nov: “${req.text.slice(0, 80)}” — owner following up` });
      return events;
    }

    const cal = checkCalendar(u.requestedDate);
    events.push(
      trace(
        "check_calendar",
        "Check calendar",
        cal.date ? `${cal.label}: ${cal.used}/4 bake slots used → ${cal.available ? "AVAILABLE" : `FULL (next free: ${cal.alternative ? formatDate(cal.alternative) : "n/a"})`}` : "no date to check",
        cal.available ? "ok" : "warn",
      ),
    );

    const { priced, total } = priceItems(u.items);
    const policy = checkPolicy({ priorOrders: customer.orders, paymentTerm: u.paymentTerm, total });
    events.push(
      trace(
        "check_policy",
        "Check payment policy",
        policy.blocked ? `BLOCKED — customer asked to pay on delivery. ${policy.rule}` : `OK — ${policy.rule}`,
        policy.blocked ? "block" : "ok",
      ),
    );

    const date = cal.available ? cal.date : cal.alternative;
    const order: Order = {
      id: `ORD-${1040 + Math.floor(Math.random() * 50)}`,
      customerId: customer.id,
      customerName: customer.name,
      items: priced,
      total,
      deposit: policy.deposit,
      date,
      status: policy.blocked ? "awaiting_approval" : policy.returning ? "confirmed" : "awaiting_deposit",
      payment: policy.blocked ? "Pay on delivery — BLOCKED by policy" : policy.returning ? "Pay on delivery" : `50% deposit ${rand(policy.deposit)} due`,
    };
    events.push(trace("create_order", "Draft order", `${order.id} · ${rand(total)} total · ${rand(order.deposit)} deposit`));
    events.push({ type: "order", order });

    events.push({ type: "reply", text: await compose({ kind: "order_reply", customer, understanding: u, calendar: cal, policy, order }) });

    if (policy.blocked) {
      events.push({
        type: "approval",
        approval: {
          id: `APR-${order.id}`,
          orderId: order.id,
          title: "Payment exception requested",
          detail: `${customer.name} wants to pay ${rand(total)} on delivery. ${u.emotion === "bereavement" ? "Context: recently bereaved." : ""}`.trim(),
          policy: policy.rule,
          status: "pending",
        },
      });
    }

    const note = [
      u.emotion === "bereavement" ? "Recently bereaved (mother) — keep tone gentle" : null,
      u.paymentTerm === "on_delivery" ? "Asked to pay on delivery — cash-tight" : null,
      u.requestedDate ? `First order: ${formatDate(u.requestedDate)}` : null,
    ]
      .filter(Boolean)
      .join(". ");
    if (note) events.push({ type: "memory", customerId: customer.id, note });
    return events;
  }

  // approval decision by the owner
  const customer = allCustomers.find((c) => c.id === req.order.customerId) ?? newCustomer;
  const allow = req.decision === "allow";
  events.push({ type: "approval_resolved", id: req.approvalId, status: allow ? "allowed" : "refused" });
  events.push(trace("owner_decision", allow ? "Owner allowed exception" : "Owner kept policy", allow ? "Allow once — pay on delivery for this order only" : "Refuse — deposit still required", allow ? "ok" : "warn"));
  events.push({
    type: "order_status",
    orderId: req.order.id,
    status: allow ? "confirmed" : "awaiting_deposit",
    payment: allow ? "Pay on delivery (owner exception)" : `50% deposit ${rand(req.order.deposit)} due`,
  });
  events.push({ type: "reply", text: await compose({ kind: allow ? "exception_allowed" : "exception_refused", customer, order: req.order }) });
  events.push({
    type: "memory",
    customerId: customer.id,
    note: allow ? "Exception granted once (13 Nov). Reliable? — review after delivery" : "Declined pay-on-delivery; holds slot 24h pending deposit",
  });
  if (allow) {
    events.push(trace("compliance_watch", "Check business growth", `Trailing 12-mo turnover ≈ ${rand(TURNOVER.last12)} — growing orders; buyers & banks will soon ask for a registered business`));
    events.push({
      type: "compliance",
      nudge: {
        title: "You're ready to formalise",
        detail: `Thandi's Bakes has earned about ${rand(TURNOVER.last12)} in 12 months and orders keep growing. Registering with CIPC unlocks a business bank account, bigger buyers (cafés, schools, corporates) and supplier credit. I've prepared your checklist.`,
        source: "CIPC / SARS public guidance — not legal or tax advice",
      },
    });
  }
  return events;
}

/* ------------------------- WhatsApp: repetitive questions ------------------------- */

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Facts for the questions the owner answers 20× a week. null = not a question the agent may answer. */
function answerFor(u: Understanding, myOrders: Order[]): { topic: string; facts: string } | null {
  const open = myOrders.filter((o) => o.status !== "declined" && o.status !== "delivered");
  switch (u.intent) {
    case "faq_menu":
      return {
        topic: "Menu & prices",
        facts: `Here's our menu: ${Object.entries(catalog)
          .map(([name, price]) => `${name}${name === "cupcake" ? "s" : ""} ${rand(price)}${name === "cupcake" ? " each" : ""}`)
          .join(" · ")}. We need 3 days' notice — just tell me what you'd like and the date! 🧁`,
      };
    case "faq_hours":
      return { topic: "Hours", facts: `${businessHours}. You can message an order any time and I'll check the calendar for you.` };
    case "faq_location":
      return { topic: "Location & delivery", facts: `We're in ${business.area}. Delivery: ${deliveryArea}.` };
    case "banking_details": {
      const due = open.find((o) => o.status === "awaiting_deposit");
      return {
        topic: "Banking details",
        facts: `Here are our banking details: ${bankingDetails}. ${
          due ? `Please use ${due.id} as the reference — the deposit is ${rand(due.deposit)}.` : "Please use your name as the reference."
        } Send the proof of payment here and I'll confirm. 🙏`,
      };
    }
    case "order_status": {
      const o = open[0];
      if (!o) return { topic: "Order status", facts: "I can't see an open order on this number — would you like to place one? Tell me what you need and the date." };
      const when = o.date ? formatDate(o.date) : "your date";
      const status =
        o.status === "confirmed"
          ? `is confirmed for ${when} ✅`
          : o.status === "awaiting_deposit"
            ? `is reserved for ${when} — we're just waiting for the ${rand(o.deposit)} deposit to confirm it`
            : `is waiting for Thandi to confirm (${when})`;
      return { topic: "Order status", facts: `Your order ${o.id} (${o.items.map((i) => `${i.qty} × ${i.name}`).join(", ")}) ${status}.` };
    }
    default:
      return null;
  }
}

/* ------------------------- WhatsApp: scheduled automations ------------------------- */

function runAutomations(enabledIds: string[], orders: Order[]): AgentEvent[] {
  const events: AgentEvent[] = [];
  const enabled = new Set(enabledIds);
  const cust = (id: string) => allCustomers.find((c) => c.id === id) ?? newCustomer;
  const firstName = (id: string) => cust(id).name.split(" ")[0];
  let sent = 0;

  events.push(trace("scheduler", "Run today's automations", `${enabled.size} rules on · checking ${orders.length} orders & ${allCustomers.length} customers`));

  const send = (ruleId: string, customerId: string, text: string, why: string) => {
    const rule = automations.find((a) => a.id === ruleId)!;
    events.push(trace(ruleId, rule.label, `${cust(customerId).name} — ${why}${rule.template ? ` · template ${rule.template}` : ""}`));
    events.push({ type: "reply", customerId, text, automation: rule.label });
    sent++;
  };

  if (enabled.has("deposit_reminder")) {
    for (const o of orders.filter((o) => o.status === "awaiting_deposit")) {
      send(
        "deposit_reminder",
        o.customerId,
        `Hi ${firstName(o.customerId)}, just a friendly reminder 😊 Your ${o.items.map((i) => i.name).join(" & ")} for ${o.date ? formatDate(o.date) : "your date"} is reserved. Please pay the ${rand(o.deposit)} deposit (ref ${o.id}) to lock it in — reply "bank" for our details.`,
        `${rand(o.deposit)} deposit unpaid on ${o.id}`,
      );
    }
  }
  if (enabled.has("delivery_reminder")) {
    for (const o of orders.filter((o) => o.status === "confirmed" && o.date === TOMORROW)) {
      send(
        "delivery_reminder",
        o.customerId,
        `Hi ${firstName(o.customerId)}! Your ${o.items.map((i) => i.name).join(" & ")} will be ready tomorrow (${formatDate(o.date!)}). Is 10:00 delivery to the usual address still good? 🎂`,
        `${o.id} due tomorrow`,
      );
    }
  }
  if (enabled.has("thank_you")) {
    for (const o of orders.filter((o) => o.status === "delivered" && o.date === YESTERDAY)) {
      send(
        "thank_you",
        o.customerId,
        `Thank you for your order, ${firstName(o.customerId)}! 🙏 We hope everyone enjoyed it. If you have a moment, a quick review on our Facebook page would mean the world to Thandi.`,
        `${o.id} delivered yesterday`,
      );
      events.push({ type: "memory", customerId: o.customerId, note: "Thank-you sent 13 Nov; review requested" });
    }
  }
  if (enabled.has("reorder")) {
    for (const id of reorderCandidates) {
      const c = cust(id);
      if (!c.optIn) {
        events.push(trace("reorder", "Re-order nudge skipped", `${c.name} — no marketing opt-in (POPIA s69). Agent won't send promotions.`, "warn"));
        continue;
      }
      send("reorder", id, `Hi ${firstName(id)} 👋 It's been a few weeks — craving something sweet? We have slots open next week. Reply with what you'd like, or STOP to opt out.`, `last order ${c.lastOrder}, opted in`);
    }
  }

  events.push(trace("scheduler", "Automations done", sent ? `${sent} messages sent — ≈${sent * 3} min of typing saved` : "Nothing due right now", "ok"));
  return events;
}

/* ------------------------- Compliance: prepare a legal task ------------------------- */

function prepareCompliance(taskId: string, have: string[] = vault): AgentEvent[] {
  const events: AgentEvent[] = [];
  const task = complianceTasks.find((t) => t.id === taskId);
  if (!task) return [trace("compliance", "Unknown task", taskId, "block")];

  events.push(trace("load_requirements", `Load requirements · ${task.label}`, `${task.steps.length} steps · source: ${task.where.label}`));

  const missing = task.docs.filter((d) => !have.includes(d));
  events.push(
    trace(
      "check_vault",
      "Check document vault",
      missing.length ? `${task.docs.length - missing.length}/${task.docs.length} found — missing: ${missing.join(", ")}` : `All ${task.docs.length} documents found`,
      missing.length ? "warn" : "ok",
    ),
  );

  const prepared = preparedPacks[task.id] ?? task.steps.filter((s) => s.startsWith("Agent")).map((s) => cap(s.replace(/^Agent\s+/, "")));
  events.push(trace("prefill_forms", "Pre-fill from business profile", `${business.name} · ${business.owner} · ${business.area}`));
  events.push(trace("estimate", "Cost & time", `${task.cost} · ${task.time}`));
  events.push(trace("handoff_to_owner", "Your turn — agent never signs or pays", task.ownerMust, "warn"));
  events.push({ type: "compliance_task", id: task.id, status: "ready", prepared, missing });
  return events;
}
