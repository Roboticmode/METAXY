import type { Tab } from "@/lib/agent/types";
import { ANCHORS } from "./describe";
import type { Snapshot, UiAction } from "./types";

const TABS: Tab[] = ["operations", "whatsapp", "compliance", "opportunities", "crm"];

/** Keep only well-formed UI actions that point at entities present in the current snapshot. */
export function validate(name: string, args: Record<string, unknown>, snap: Snapshot): UiAction | null {
  const str = (k: string) => (typeof args[k] === "string" ? (args[k] as string) : "");
  const customer = (id: string) => snap.customers.some((c) => c.id === id);
  const task = (id: string) => snap.compliance.some((t) => t.id === id);
  switch (name) {
    case "navigate":
      return TABS.includes(str("tab") as Tab) ? { type: "navigate", tab: str("tab") as Tab } : null;
    case "open_chat":
      return customer(str("customerId")) ? { type: "open_chat", customerId: str("customerId") } : null;
    case "open_compliance_task":
      return task(str("taskId")) ? { type: "open_compliance_task", taskId: str("taskId") } : null;
    case "focus":
      return str("anchorId") in ANCHORS ? { type: "focus", anchorId: str("anchorId") } : null;
    case "set_columns": {
      const a: UiAction = { type: "set_columns" };
      if (typeof args.left === "boolean") a.left = args.left;
      if (typeof args.right === "boolean") a.right = args.right;
      return a.left === undefined && a.right === undefined ? null : a;
    }
    case "prepare_compliance":
      return task(str("taskId")) ? { type: "prepare_compliance", taskId: str("taskId") } : null;
    case "check_collisions":
      return { type: "check_collisions" };
    case "chase_overdue":
      return { type: "chase_overdue" };
    case "simulate_customer":
      return customer(str("customerId")) && str("text") ? { type: "simulate_customer", customerId: str("customerId"), text: str("text") } : null;
    case "run_automations":
      return { type: "run_automations" };
    case "decide_approval":
      return snap.approvals.some((p) => p.id === str("approvalId")) && (args.decision === "allow" || args.decision === "refuse")
        ? { type: "decide_approval", approvalId: str("approvalId"), decision: args.decision }
        : null;
    case "send_owner_message":
      return customer(str("customerId")) && str("text").trim() ? { type: "send_owner_message", customerId: str("customerId"), text: str("text").trim() } : null;
  }
  return null;
}
