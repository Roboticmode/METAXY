export type Tab = "operations" | "whatsapp" | "compliance" | "opportunities" | "crm";

export type AgentRole = "Client Desk" | "Books" | "Planner";

/** What the customer is trying to do — decides which pipeline branch runs. */
export type Intent =
  | "order"
  | "scope_change"
  | "faq_rates"
  | "faq_hours"
  | "faq_location"
  | "banking_details"
  | "order_status"
  | "complaint"
  | "academic_integrity"
  | "other";

export type Understanding = {
  intent: Intent;
  greeting: boolean;
  emotion: "neutral" | "bereavement" | "urgent" | "frustrated";
  items: { name: string; qty: number }[];
  requestedDate: string | null; // ISO yyyy-mm-dd
  paymentTerm: "on_delivery" | "deposit" | "unspecified";
};

export type ProjectStatus = "scoping" | "awaiting_deposit" | "awaiting_approval" | "in_progress" | "delivered" | "declined";

export type Project = {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  items: { name: string; qty: number; unit: number }[];
  deliverables: string[];
  total: number;
  deposit: number;
  dueDate: string | null;
  hoursNeeded: number;
  status: ProjectStatus;
  payment: string;
  scopeFlag?: string;
};

export type InvoiceStatus = "paid" | "due_soon" | "deposit_pending" | "overdue";

export type Invoice = {
  id: string;
  projectId: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  status: InvoiceStatus;
};

export type SchoolItem = {
  id: string;
  module: string;
  title: string;
  kind: "lecture" | "assignment" | "test" | "capstone" | "exam";
  date: string;
  hours: number;
  fixed: boolean;
};

export type ApprovalKind = "reply_date" | "collision_fix" | "invoice_reminder" | "scope_quote" | "exam_pause" | "payment_exception";

export type Approval = {
  id: string;
  kind: ApprovalKind;
  targetId: string; // projectId, invoiceId, or "exam"
  customerId?: string;
  agent: AgentRole;
  title: string;
  detail: string;
  draftMessage?: string;
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
  | { type: "trace"; agent?: AgentRole; tool: string; label: string; detail: string; status: TraceStatus }
  | { type: "reply"; text: string; customerId?: string; automation?: string }
  | { type: "project"; project: Project }
  | { type: "project_update"; projectId: string; patch: Partial<Project> }
  | { type: "invoice_update"; invoiceId: string; status: InvoiceStatus; daysOverdue?: number }
  | { type: "school_update"; id: string; date: string; note?: string }
  | { type: "approval"; approval: Approval }
  | { type: "approval_resolved"; id: string; status: "allowed" | "refused" }
  | { type: "memory"; customerId: string; note: string }
  | { type: "compliance"; nudge: ComplianceNudge }
  | { type: "compliance_task"; id: string; status: ComplianceStatus; prepared?: string[]; missing?: string[] }
  | { type: "handoff"; customerId: string; reason: string };

export type AgentRequest =
  | { kind: "customer_message"; text: string; customerId: string; projects?: Project[]; enabled?: string[]; examMode?: boolean }
  | { kind: "approval"; decision: "allow" | "refuse"; approval: Approval; project?: Project }
  | { kind: "check_collisions"; projects: Project[]; school: SchoolItem[] }
  | { kind: "chase_overdue"; invoices: Invoice[] }
  | { kind: "toggle_exam_mode"; active: boolean; projects: Project[] }
  | { kind: "compliance_prepare"; taskId: string; vault: string[] }
  | { kind: "run_automations"; enabled: string[]; projects: Project[]; invoices: Invoice[] };

export type AgentResponse = { engine: "mock" | "grok"; events: AgentEvent[]; note?: string };

export type Customer = {
  id: string;
  name: string;
  business: string;
  phone: string;
  orders: number;
  lastOrder: string;
  tags: string[];
  notes: string[];
  /** POPIA s69: marketing messages only go to customers who opted in */
  optIn?: boolean;
};
