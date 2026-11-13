export type Tab = "operations" | "compliance" | "opportunities" | "crm";

export type Understanding = {
  greeting: boolean;
  emotion: "neutral" | "bereavement" | "urgent" | "frustrated";
  items: { name: string; qty: number }[];
  requestedDate: string | null; // ISO yyyy-mm-dd
  paymentTerm: "on_delivery" | "deposit" | "unspecified";
};

export type OrderStatus = "draft" | "awaiting_deposit" | "awaiting_approval" | "confirmed" | "declined";

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

export type TraceStatus = "ok" | "warn" | "block";

/** Events the agent emits. The UI is purely a projection of these. */
export type AgentEvent =
  | { type: "trace"; tool: string; label: string; detail: string; status: TraceStatus }
  | { type: "reply"; text: string }
  | { type: "order"; order: Order }
  | { type: "order_status"; orderId: string; status: OrderStatus; payment: string }
  | { type: "approval"; approval: Approval }
  | { type: "approval_resolved"; id: string; status: "allowed" | "refused" }
  | { type: "memory"; customerId: string; note: string }
  | { type: "compliance"; nudge: ComplianceNudge };

export type AgentRequest =
  | { kind: "customer_message"; text: string; customerId: string }
  | { kind: "approval"; decision: "allow" | "refuse"; approvalId: string; order: Order };

export type AgentResponse = { engine: "mock" | "grok"; events: AgentEvent[]; note?: string };

export type Customer = {
  id: string;
  name: string;
  phone: string;
  orders: number;
  lastOrder: string;
  tags: string[];
  notes: string[];
};
