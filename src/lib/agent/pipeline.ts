import { initialCustomers, newCustomer, TURNOVER } from "./data";
import type { Brain } from "./brain";
import { checkCalendar, checkPolicy, formatDate, priceItems, rand } from "./tools";
import type { AgentEvent, AgentRequest, Customer, Order } from "./types";

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

  if (req.kind === "customer_message") {
    const customer = allCustomers.find((c) => c.id === req.customerId) ?? newCustomer;

    const u = await safe(events, "understand_message", () => brain.understand(req.text), () => fallbackBrain.understand(req.text));
    events.push(
      trace(
        "understand_message",
        "Read message",
        [
          u.greeting ? "greeted" : "no greeting — went straight to request",
          u.emotion !== "neutral" ? `emotional context: ${u.emotion}` : null,
          `items: ${u.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}`,
          u.requestedDate ? `date: ${formatDate(u.requestedDate)}` : "no date",
          `payment: ${u.paymentTerm.replace("_", " ")}`,
        ]
          .filter(Boolean)
          .join(" · "),
        u.emotion === "bereavement" ? "warn" : "ok",
      ),
    );

    events.push(trace("customer_memory", "Look up customer", customer.orders === 0 ? `${customer.name} — new customer, no history` : `${customer.name} — ${customer.orders} previous orders`));

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

    const text = await safe(
      events,
      "compose_reply",
      () => brain.compose({ kind: "order_reply", customer, understanding: u, calendar: cal, policy, order }),
      () => fallbackBrain.compose({ kind: "order_reply", customer, understanding: u, calendar: cal, policy, order }),
    );
    events.push({ type: "reply", text });

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
  const text = await safe(
    events,
    "compose_reply",
    () => brain.compose({ kind: allow ? "exception_allowed" : "exception_refused", customer, order: req.order }),
    () => fallbackBrain.compose({ kind: allow ? "exception_allowed" : "exception_refused", customer, order: req.order }),
  );
  events.push({ type: "reply", text });
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
