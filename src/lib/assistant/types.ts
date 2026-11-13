import type { ApprovalKind, ComplianceStatus, InvoiceStatus, ProjectStatus, Tab } from "@/lib/agent/types";

/**
 * Things the owner's assistant can do to the dashboard.
 * "Do alone" actions run straight away; ask-first actions only run after the owner clicks Confirm.
 */
export type UiAction =
  | { type: "navigate"; tab: Tab }
  | { type: "open_chat"; customerId: string }
  | { type: "open_compliance_task"; taskId: string }
  /** scroll a panel into view and ring it for 2 s; quietly does nothing if the anchor isn't on screen */
  | { type: "focus"; anchorId: string }
  | { type: "set_columns"; left?: boolean; right?: boolean }
  | { type: "prepare_compliance"; taskId: string }
  /** Planner scan: client deadlines vs fixed university dates. Only drafts a decision for the owner. */
  | { type: "check_collisions" }
  /** Books scan: overdue invoices. Only drafts a reminder for the owner. */
  | { type: "chase_overdue" }
  /** demo helper: play a client message into the WhatsApp simulator */
  | { type: "simulate_customer"; customerId: string; text: string }
  // ask-first ↓
  | { type: "run_automations" }
  | { type: "decide_approval"; approvalId: string; decision: "allow" | "refuse" }
  | { type: "send_owner_message"; customerId: string; text: string };

export type UiActionType = UiAction["type"];

export const ASK_FIRST: readonly UiActionType[] = ["run_automations", "decide_approval", "send_owner_message"];
export const isAskFirst = (a: UiAction) => ASK_FIRST.includes(a.type);

/** Shown in the console before anything external or binding happens. */
export type ConfirmCard = {
  title: string;
  /** exactly what will happen, one line each */
  effects: string[];
  confirmLabel: string;
  /** only ask-first actions; executed in order after Confirm */
  actions: UiAction[];
};

/** Compact, synthetic view of the dashboard sent with every request. */
export type Snapshot = {
  tab: Tab;
  activeChat: string;
  complianceTask: string;
  examMode: boolean;
  customers: { id: string; name: string; business: string; optIn: boolean }[];
  /** pending only */
  approvals: { id: string; kind: ApprovalKind; targetId: string; customerId: string; customerName: string; title: string; detail: string; draftMessage?: string }[];
  handoffs: { customerId: string; name: string; reason: string }[];
  unread: number;
  projects: { id: string; customerId: string; title: string; status: ProjectStatus; payment: string; dueDate: string | null; total: number; deposit: number; scopeFlag?: string }[];
  invoices: { id: string; customerId: string; amount: number; dueDate: string; daysOverdue: number; status: InvoiceStatus }[];
  /** client deliveries that land on a fixed university date */
  collisions: { projectId: string; customerId: string; schoolTitle: string; date: string; proposedDue: string }[];
  /** university schedule items (lectures, labs, assignments, tests, capstone, exams) */
  school?: { id: string; module: string; title: string; kind: string; date: string; hours: number; fixed: boolean }[];
  compliance: { id: string; label: string; status: ComplianceStatus; dependsOn?: string }[];
  automations: string[];
};

export type HistoryItem = { role: "user" | "assistant"; text: string };

export type AssistantRequest = { message: string; history: HistoryItem[]; snapshot: Snapshot };

export type AssistantResponse = {
  engine: "scripted" | "grok" | "openai";
  reply: string;
  actions: UiAction[];
  confirm?: ConfirmCard;
};

export const SUGGESTED_PROMPTS = [
  "What needs my attention today?",
  "Show me Thabo's chat",
  "Take me to CIPC registration",
  "Prepare my scope & IP agreement",
  "Sort out the Capstone clash",
  "Chase Kagiso Molefe's overdue invoice",
  "Send today's reminders",
  "Write my IS302 assignment",
] as const;
