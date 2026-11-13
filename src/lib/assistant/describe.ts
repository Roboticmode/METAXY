import { formatDate, rand } from "@/lib/agent/tools";
import type { Tab } from "@/lib/agent/types";
import { automations, checkinCandidates } from "@/lib/whatsapp/data";
import type { ConfirmCard, Snapshot, UiAction } from "./types";
import { isAskFirst } from "./types";

export const TAB_LABEL: Record<Tab, string> = {
  operations: "Operations",
  whatsapp: "WhatsApp",
  compliance: "Compliance",
  opportunities: "Opportunities",
  crm: "CRM & Retention",
};

/** Stable panel ids (contract #4 in docs/tasks/README.md). Missing ids are skipped quietly. */
export const ANCHORS: Record<string, string> = {
  "ops-approvals": "Approvals",
  "ops-calendar": "Shared calendar",
  "ops-orders": "Projects & invoices",
  "ops-invoices": "Invoice ledger",
  "ops-triggers": "Agent triggers & Exam Mode",
  "ops-activity": "Agent activity",
  "ops-policies": "Agent brief",
  "wa-inbox": "WhatsApp inbox",
  "wa-automations": "Automations",
  "wa-setup": "WhatsApp setup",
  "comp-checklist": "Compliance checklist",
  "comp-task": "Task detail",
  "comp-deadlines": "Legal dates",
  "comp-vat": "VAT threshold",
  "comp-vault": "Document vault",
  "opp-radar": "Opportunity radar",
  "crm-memory": "Client memory",
  "phone-panel": "Phone panel",
};

export const firstName = (name: string) => name.split(" ")[0];

/** "Thabo Nkosi", or "Kagiso Molefe (Molefe Logistics)" when two clients share a first name. */
export function customerName(snap: Snapshot, id: string) {
  const c = snap.customers.find((x) => x.id === id);
  if (!c) return id;
  const clash = snap.customers.some((x) => x.id !== c.id && firstName(x.name) === firstName(c.name));
  return clash ? `${c.name} (${c.business})` : c.name;
}

export function taskLabel(snap: Snapshot, id: string) {
  return snap.compliance.find((t) => t.id === id)?.label ?? id;
}

/** Past-tense label for a step the console shows once an action has actually run. */
export function describeAction(a: UiAction, snap: Snapshot): string {
  switch (a.type) {
    case "navigate":
      return `Opened ${TAB_LABEL[a.tab]}`;
    case "open_chat":
      return `Opened ${customerName(snap, a.customerId)}'s chat`;
    case "open_compliance_task":
      return `Opened Compliance › ${taskLabel(snap, a.taskId)}`;
    case "focus":
      return `Highlighted ${ANCHORS[a.anchorId] ?? a.anchorId}`;
    case "set_columns": {
      const parts = [a.left !== undefined ? `${a.left ? "showed" : "hid"} the left sidebar` : null, a.right !== undefined ? `${a.right ? "showed" : "hid"} the phone panel` : null].filter(Boolean);
      return `Layout: ${parts.join(", ") || "no change"}`;
    }
    case "prepare_compliance":
      return `Prepared ${taskLabel(snap, a.taskId)}`;
    case "check_collisions":
      return "Checked client deadlines against your university calendar";
    case "chase_overdue":
      return "Checked invoices for overdue balances";
    case "simulate_customer":
      return `Played ${customerName(snap, a.customerId)}'s message into the simulator`;
    case "run_automations":
      return "Ran today's automations";
    case "decide_approval": {
      const ap = snap.approvals.find((p) => p.id === a.approvalId);
      return `${a.decision === "allow" ? "Approved" : "Held"}: ${ap ? ap.title : a.approvalId}`;
    }
    case "send_owner_message":
      return `Sent your message to ${customerName(snap, a.customerId)}`;
    case "add_client":
      return `Client Desk added ${a.name} (${a.business}) to your CRM`;
    case "create_project":
      return `Client Desk drafted a project for ${customerName(snap, a.customerId)}`;
    case "log_payment":
      return `Books logged payment on ${a.invoiceId}`;
    case "schedule_school_item":
      return `Planner drafted a calendar change: ${a.title} on ${formatDate(a.date)}`;
    case "plan_study_blocks":
      return "Planner proposed study blocks around client work";
    case "capacity_plan":
      return `Planner worked out the week of ${formatDate(a.weekStart)}`;
    case "set_exam_mode":
      return `Exam Mode turned ${a.active ? "on" : "off"}`;
  }
}

/* ------------------------- ask-first previews ------------------------- */

/** What "run today's automations" would send right now. Mirrors the scheduler rules in the pipeline. */
export function automationPreview(snap: Snapshot): string[] {
  const on = new Set(snap.automations);
  const lines: string[] = [];
  const label = (id: string) => automations.find((a) => a.id === id)?.label ?? id;
  if (on.has("deposit_reminder"))
    for (const p of snap.projects.filter((x) => x.status === "awaiting_deposit"))
      lines.push(`${label("deposit_reminder")} → ${customerName(snap, p.customerId)}: ${rand(p.deposit)} deposit for ${p.title} (${p.id})`);
  if (on.has("progress_update")) {
    const active = snap.projects.find((p) => p.status === "in_progress");
    if (active) lines.push(`${label("progress_update")} → ${customerName(snap, active.customerId)}: ${active.title} (${active.id}) is on track`);
  }
  if (on.has("reorder"))
    for (const id of checkinCandidates) {
      const c = snap.customers.find((x) => x.id === id);
      if (c?.optIn) lines.push(`${label("reorder")} → ${c.name} (opted in to marketing)`);
    }
  return lines;
}

export function automationSkips(snap: Snapshot): string[] {
  if (!snap.automations.includes("reorder")) return [];
  return checkinCandidates
    .map((id) => snap.customers.find((x) => x.id === id))
    .filter((c) => c && !c.optIn)
    .map((c) => `${c!.name} won't get a check-in: no marketing opt-in (POPIA)`);
}

/** Exact effect of approving or holding a drafted decision. Mirrors resolveApproval in the pipeline. */
function decisionEffects(snap: Snapshot, approvalId: string, decision: "allow" | "refuse"): string[] {
  const ap = snap.approvals.find((p) => p.id === approvalId);
  if (!ap) return ["This decision is no longer pending"];
  const who = ap.customerId ? firstName(customerName(snap, ap.customerId)) : "the client";
  const project = snap.projects.find((p) => p.id === ap.targetId);
  if (decision === "refuse") {
    const out = [ap.customerId ? `Nothing is sent to ${who}` : "Nothing changes on your calendar"];
    if (ap.refuseEffects) return [...out, ...ap.refuseEffects];
    if (ap.kind === "reply_date" && ap.targetId !== "exam") out.push(`${ap.targetId} is marked declined`);
    return out;
  }
  const out: string[] = [];
  if (ap.draftMessage && ap.customerId) out.push(`Sends ${who} this WhatsApp message: “${ap.draftMessage}”`);
  else out.push("No message is sent");
  if (ap.effects) return [...out, ...ap.effects];
  switch (ap.kind) {
    case "reply_date":
      if (ap.targetId !== "exam") out.push(`${ap.targetId} moves to awaiting a 50% deposit, and a provisional studio block is reserved`);
      break;
    case "collision_fix":
      out.push(`${ap.targetId}${project ? ` (${project.title})` : ""} delivery moves to ${formatDate("2026-11-26")}`);
      out.push(`Your Revision Study Block shifts to ${formatDate("2026-11-21")}`);
      break;
    case "invoice_reminder":
      out.push(`Demo only: the client pays after the reminder, so ${ap.targetId} is marked paid`);
      break;
    case "scope_quote":
      out.push(`${ap.targetId} total becomes ${rand(2150)} with a ${rand(950)} add-on, and a ${rand(475)} add-on deposit falls due`);
      break;
    case "exam_pause":
      break;
  }
  return out;
}

/** Build the confirmation card for a set of ask-first actions. Returns undefined if none are valid. */
export function confirmFor(actions: UiAction[], snap: Snapshot): ConfirmCard | undefined {
  const askFirst = actions.filter(isAskFirst);
  if (!askFirst.length) return undefined;
  const effects: string[] = [];
  const titles: string[] = [];
  let confirmLabel = "Confirm";
  for (const a of askFirst) {
    if (a.type === "run_automations") {
      const preview = automationPreview(snap);
      titles.push(`Send ${preview.length} WhatsApp message${preview.length === 1 ? "" : "s"} now`);
      effects.push(...preview, ...automationSkips(snap));
      confirmLabel = `Send ${preview.length}`;
    } else if (a.type === "decide_approval") {
      const ap = snap.approvals.find((p) => p.id === a.approvalId);
      titles.push(`${a.decision === "allow" ? "Approve" : "Hold"}: ${ap?.title ?? a.approvalId}`);
      effects.push(...decisionEffects(snap, a.approvalId, a.decision));
      confirmLabel = a.decision === "allow" ? (ap?.draftMessage ? "Approve & send" : "Approve") : "Hold";
    } else if (a.type === "send_owner_message") {
      const name = customerName(snap, a.customerId);
      titles.push(`Send a WhatsApp message to ${name}`);
      effects.push(`Sent as you: “${a.text}”`);
      effects.push(`You take over ${firstName(name)}'s chat. The agent stays quiet there until you hand it back`);
      confirmLabel = "Send";
    }
  }
  return { title: titles.join(" · "), effects, confirmLabel, actions: askFirst };
}
