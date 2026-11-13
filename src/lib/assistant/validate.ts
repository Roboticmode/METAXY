import { catalog } from "@/lib/agent/data";
import { NEXT_MONDAY, TOMORROW } from "@/lib/agent/planner";
import type { SchoolKind, Tab } from "@/lib/agent/types";
import { ANCHORS } from "./describe";
import type { Snapshot, UiAction } from "./types";

const TABS: Tab[] = ["operations", "whatsapp", "compliance", "opportunities", "crm"];
export const PACKAGES = Object.keys(catalog);
export const SCHOOL_KINDS: SchoolKind[] = ["lecture", "assignment", "test", "capstone", "exam", "study"];

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
    /* data capture: these run alone; whatever binding they produce is drafted as an approval (ask first) */
    case "add_client": {
      const name = str("name").trim();
      const biz = str("business").trim();
      if (!name || !biz || snap.customers.some((c) => c.name.toLowerCase() === name.toLowerCase() || c.business.toLowerCase() === biz.toLowerCase())) return null;
      const pk = packages(args.packages);
      const due = date(str("dueDate"));
      return { type: "add_client", name, business: biz, ...(str("phone").trim() ? { phone: str("phone").trim() } : {}), ...(pk.length ? { packages: pk } : {}), ...(due ? { dueDate: due } : {}) };
    }
    case "create_project": {
      const pk = packages(args.packages);
      const due = date(str("dueDate"));
      return customer(str("customerId")) && pk.length
        ? { type: "create_project", customerId: str("customerId"), packages: pk, ...(due ? { dueDate: due } : {}), ...(str("title").trim() ? { title: str("title").trim().slice(0, 60) } : {}) }
        : null;
    }
    case "log_payment": {
      const inv = snap.invoices.find((i) => i.id === str("invoiceId"));
      return inv && inv.status !== "paid" ? { type: "log_payment", invoiceId: inv.id } : null;
    }
    case "schedule_school_item": {
      const d = date(str("date"));
      const kind = str("kind") as SchoolKind;
      const hours = typeof args.hours === "number" ? Math.min(12, Math.max(1, Math.round(args.hours))) : 0;
      const move = str("moveId") ? (snap.school ?? []).find((s) => s.id === str("moveId")) : undefined;
      if (!d || (str("moveId") && !move)) return null;
      if (move) return { type: "schedule_school_item", moveId: move.id, module: move.module, title: move.title, kind: move.kind, date: d, hours: move.hours };
      return SCHOOL_KINDS.includes(kind) && str("module").trim() && str("title").trim() && hours
        ? { type: "schedule_school_item", module: str("module").trim(), title: str("title").trim().slice(0, 60), kind, date: d, hours }
        : null;
    }
    case "plan_study_blocks": {
      const id = str("targetId");
      if (!id) return { type: "plan_study_blocks" };
      return (snap.school ?? []).some((s) => s.id === id) ? { type: "plan_study_blocks", targetId: id } : null;
    }
    case "capacity_plan":
      return { type: "capacity_plan", weekStart: date(str("weekStart"), true) ?? NEXT_MONDAY };
    case "set_exam_mode":
      return typeof args.active === "boolean" ? { type: "set_exam_mode", active: args.active } : null;
  }
  return null;
}

/** Only real catalogue packages. */
function packages(v: unknown): string[] {
  return Array.isArray(v) ? [...new Set(v.filter((p): p is string => typeof p === "string" && PACKAGES.includes(p)))] : [];
}

/** A valid ISO date from tomorrow on (or today, for a capacity week). */
function date(s: string, allowToday = false): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) return undefined;
  return s >= (allowToday ? "2026-11-13" : TOMORROW) ? s : undefined;
}
