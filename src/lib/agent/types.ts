export type Tab = "operations" | "whatsapp" | "compliance" | "opportunities" | "crm";

/** What the customer is trying to do — decides which pipeline branch runs. */
export type Intent = "order" | "faq_menu" | "faq_hours" | "faq_location" | "banking_details" | "order_status" | "complaint" | "other";

export type Understanding = {
  intent: Intent;
  greeting: boolean;
  emotion: "neutral" | "bereavement" | "urgent" | "frustrated";
  items: { name: string; qty: number }[];
  requestedDate: string | null; // ISO yyyy-mm-dd
  paymentTerm: "on_delivery" | "deposit" | "unspecified";
};

export type OrderStatus = "draft" | "awaiting_deposit" | "awaiting_approval" | "confirmed" | "delivered" | "declined";

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  items: { name: string; qty: number; unit: number }[];
  total: number;
  deposit: number;
  date: string | null;
  status: OrderStatus;
  payment: string;
};

export type Approval = {
  id: string;
  orderId: string;
  title: string;
  detail: string;
  policy: string;
  status: "pending" | "allowed" | "refused";
};

export type ComplianceNudge = {
  title: string;
  detail: string;
  source: string;
};

/**
 * Lifecycle of a legal / formalisation task.
 * The agent can only take a task to "ready" — the owner signs, pays and submits herself.
 */
export type ComplianceStatus = "todo" | "ready" | "submitted" | "done" | "na";

export type TraceStatus = "ok" | "warn" | "block";

/** Events the agent emits. The UI is purely a projection of these. */
export type AgentEvent =
  | { type: "trace"; tool: string; label: string; detail: string; status: TraceStatus }
  /** customerId defaults to the conversation the request came from; automation names the rule that sent it */
  | { type: "reply"; text: string; customerId?: string; automation?: string }
  | { type: "order"; order: Order }
  | { type: "order_status"; orderId: string; status: OrderStatus; payment: string }
  | { type: "approval"; approval: Approval }
  | { type: "approval_resolved"; id: string; status: "allowed" | "refused" }
  | { type: "memory"; customerId: string; note: string }
  | { type: "compliance"; nudge: ComplianceNudge }
  | { type: "compliance_task"; id: string; status: ComplianceStatus; prepared?: string[]; missing?: string[] }
  | { type: "handoff"; customerId: string; reason: string };

export type AgentRequest =
  /** orders = this customer's known orders; enabled = automation ids the owner has switched on */
  | { kind: "customer_message"; text: string; customerId: string; orders?: Order[]; enabled?: string[] }
  | { kind: "approval"; decision: "allow" | "refuse"; approvalId: string; order: Order }
  /** vault = documents the owner currently has, incl. certificates from finished tasks */
  | { kind: "compliance_prepare"; taskId: string; vault: string[] }
  | { kind: "run_automations"; enabled: string[]; orders: Order[] };

export type AgentResponse = { engine: "mock" | "grok"; events: AgentEvent[]; note?: string };

export type Customer = {
  id: string;
  name: string;
  phone: string;
  orders: number;
  lastOrder: string;
  tags: string[];
  notes: string[];
  /** POPIA s69: marketing messages (e.g. re-order nudges) only go to customers who opted in */
  optIn?: boolean;
};
