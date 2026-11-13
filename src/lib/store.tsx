"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from "react";
import { initialCustomers, initialSchoolItems, newCustomer } from "@/lib/agent/data";
import { addClient, capacityPlan, createProject, logPayment, planStudy, scheduleSchool, type OpResult, type OpState } from "@/lib/agent/ops";
import { detectCollisions } from "@/lib/agent/tools";
import type { AgentEvent, AgentResponse, AgentRole, Approval, ComplianceNudge, ComplianceStatus, Customer, Invoice, Project, SchoolItem, Tab, TraceStatus } from "@/lib/agent/types";
import { confirmFor, describeAction, taskLabel } from "@/lib/assistant/describe";
import { route } from "@/lib/assistant/router";
import { isAskFirst, type AssistantResponse, type ConfirmCard, type HistoryItem, type Snapshot, type UiAction } from "@/lib/assistant/types";
import { complianceTasks, currentVault } from "@/lib/compliance/data";
import { defaultAutomations, seedInvoices, seedProjects, seedThreads } from "@/lib/whatsapp/data";

export type ChatMsg = { id: number; customerId: string; from: "customer" | "agent" | "owner" | "system"; text: string; at: string; automation?: string };
export type TraceItem = { id: number; agent?: AgentRole; tool: string; label: string; detail: string; status: TraceStatus; at: string };
export type ComplianceState = { status: ComplianceStatus; prepared?: string[]; missing?: string[] };

/** Layout + "where the owner is looking". Lives in the store so the agent console can drive it. */
export type UiState = {
  leftOpen: boolean;
  rightOpen: boolean;
  /** anchor id currently highlighted (cleared after 2 s) */
  focus: string | null;
  /** compliance task open in the detail panel */
  complianceTask: string;
};

export type ConfirmStatus = "pending" | "running" | "confirmed" | "cancelled";

export type AssistantMsg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; text: string; engine?: AssistantResponse["engine"] }
  /** a UI action that actually ran ("→ Opened Compliance › CIPC") */
  | { id: number; role: "step"; text: string; tone: "ok" | "warn" }
  | { id: number; role: "confirm"; card: ConfirmCard; status: ConfirmStatus };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type AssistantMsgInput = DistributiveOmit<AssistantMsg, "id">;

type State = {
  tab: Tab;
  messages: ChatMsg[];
  /** customer whose WhatsApp chat is open in the phone panel */
  activeChat: string;
  /** chats where the owner took over — the agent stays quiet */
  paused: Record<string, boolean>;
  /** chats the agent handed to the owner, with the reason */
  handoffs: Record<string, string>;
  unread: Record<string, number>;
  automations: Record<string, boolean>;
  trace: TraceItem[];
  projects: Project[];
  invoices: Invoice[];
  school: SchoolItem[];
  examMode: boolean;
  approvals: Approval[];
  customers: Customer[];
  nudges: ComplianceNudge[];
  compliance: Record<string, ComplianceState>;
  /** compliance task the agent is preparing right now */
  preparing: string | null;
  busy: boolean;
  engine: "mock" | "grok" | "openai" | null;
  unseen: Partial<Record<Tab, number>>;
  ui: UiState;
  /** the owner's conversation with METAXY (agent console) */
  assistant: { messages: AssistantMsg[]; busy: boolean };
};

let seq = 1;
const now = () => new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });

const seedMessages = (): ChatMsg[] =>
  Object.entries(seedThreads).flatMap(([customerId, msgs]) => msgs.map((m) => ({ id: seq++, customerId, from: m.from, text: m.text, at: m.at })));

const initialState = (): State => ({
  tab: "operations",
  messages: seedMessages(),
  activeChat: newCustomer.id,
  paused: {},
  handoffs: {},
  unread: {},
  automations: { ...defaultAutomations },
  trace: [],
  projects: [...seedProjects],
  invoices: [...seedInvoices],
  school: [...initialSchoolItems],
  examMode: false,
  approvals: [],
  customers: initialCustomers,
  nudges: [],
  compliance: Object.fromEntries(complianceTasks.map((t) => [t.id, { status: t.status }])),
  preparing: null,
  busy: false,
  engine: null,
  unseen: {},
  ui: { leftOpen: true, rightOpen: true, focus: null, complianceTask: "cipc" },
  assistant: { messages: [], busy: false },
});

type Action =
  | { type: "tab"; tab: Tab }
  | { type: "customer_says"; text: string; customerId?: string }
  | { type: "owner_says"; text: string }
  | { type: "open_chat"; customerId: string }
  | { type: "toggle_pause"; customerId: string }
  | { type: "toggle_automation"; id: string }
  | { type: "set_exam_mode"; active: boolean }
  | { type: "compliance_set"; id: string; status: ComplianceStatus }
  | { type: "preparing"; id: string | null }
  | { type: "busy"; busy: boolean; engine?: "mock" | "grok" | "openai" }
  | { type: "event"; event: AgentEvent; chat: string }
  | { type: "reset" }
  | { type: "ui"; patch: Partial<UiState> }
  | { type: "assistant_msg"; msg: AssistantMsgInput }
  | { type: "assistant_busy"; busy: boolean }
  | { type: "confirm_status"; id: number; status: ConfirmStatus };

function bump(s: State, tab: Tab): State["unseen"] {
  return s.tab === tab ? s.unseen : { ...s.unseen, [tab]: (s.unseen[tab] ?? 0) + 1 };
}

function addMsg(s: State, m: Omit<ChatMsg, "id" | "at">): State {
  const unread = m.customerId === s.activeChat ? s.unread : { ...s.unread, [m.customerId]: (s.unread[m.customerId] ?? 0) + 1 };
  return { ...s, messages: [...s.messages, { ...m, id: seq++, at: now() }], unread };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "tab":
      return { ...s, tab: a.tab, unseen: { ...s.unseen, [a.tab]: 0 } };
    case "busy":
      return { ...s, busy: a.busy, engine: a.engine ?? s.engine };
    case "preparing":
      return { ...s, preparing: a.id };
    case "customer_says": {
      const target = a.customerId ?? s.activeChat;
      const next = { ...s, activeChat: target, unread: { ...s.unread, [target]: 0 } };
      return addMsg(next, { customerId: target, from: "customer", text: a.text });
    }
    case "owner_says": {
      const { [s.activeChat]: _, ...handoffs } = s.handoffs;
      return { ...addMsg(s, { customerId: s.activeChat, from: "owner", text: a.text }), handoffs, paused: { ...s.paused, [s.activeChat]: true } };
    }
    case "open_chat":
      return { ...s, activeChat: a.customerId, unread: { ...s.unread, [a.customerId]: 0 } };
    case "toggle_pause":
      return { ...s, paused: { ...s.paused, [a.customerId]: !s.paused[a.customerId] } };
    case "toggle_automation":
      return { ...s, automations: { ...s.automations, [a.id]: !s.automations[a.id] } };
    case "set_exam_mode":
      return { ...s, examMode: a.active };
    case "compliance_set":
      return { ...s, compliance: { ...s.compliance, [a.id]: { ...s.compliance[a.id], status: a.status } } };
    case "reset":
      return { ...initialState(), tab: s.tab, engine: s.engine, ui: s.ui, assistant: s.assistant };
    case "ui":
      return { ...s, ui: { ...s.ui, ...a.patch } };
    case "assistant_msg":
      return { ...s, assistant: { ...s.assistant, messages: [...s.assistant.messages, { ...a.msg, id: seq++ } as AssistantMsg] } };
    case "assistant_busy":
      return { ...s, assistant: { ...s.assistant, busy: a.busy } };
    case "confirm_status":
      return {
        ...s,
        assistant: { ...s.assistant, messages: s.assistant.messages.map((m) => (m.id === a.id && m.role === "confirm" ? { ...m, status: a.status } : m)) },
      };
    case "event": {
      const e = a.event;
      switch (e.type) {
        case "trace":
          return { ...s, trace: [...s.trace, { id: seq++, agent: e.agent, tool: e.tool, label: e.label, detail: e.detail, status: e.status, at: now() }] };
        case "reply": {
          const next = addMsg(s, { customerId: e.customerId ?? a.chat, from: "agent", text: e.text, automation: e.automation });
          return e.automation ? { ...next, unseen: bump(s, "whatsapp") } : next;
        }
        case "project":
          return { ...s, projects: [e.project, ...s.projects], unseen: bump(s, "operations") };
        case "project_update":
          return { ...s, projects: s.projects.map((p) => (p.id === e.projectId ? { ...p, ...e.patch } : p)) };
        case "invoice_update":
          return {
            ...s,
            invoices: s.invoices.map((inv) =>
              inv.id === e.invoiceId ? { ...inv, status: e.status, daysOverdue: e.daysOverdue ?? inv.daysOverdue } : inv,
            ),
          };
        case "school_update":
          return {
            ...s,
            school: s.school.map((item) =>
              item.id === e.id ? { ...item, date: e.date, title: e.note ? `${item.title} (${e.note})` : item.title } : item,
            ),
          };
        case "approval":
          return {
            ...s,
            approvals: [e.approval, ...s.approvals.filter((existing) => existing.id !== e.approval.id)],
          };
        case "approval_resolved":
          return { ...s, approvals: s.approvals.map((p) => (p.id === e.id ? { ...p, status: e.status } : p)) };
        case "memory": {
          const exists = s.customers.some((c) => c.id === e.customerId);
          const customers = exists
            ? s.customers.map((c) => (c.id === e.customerId ? { ...c, notes: [...c.notes, e.note] } : c))
            : [...s.customers, { ...newCustomer, id: e.customerId, orders: 1, lastOrder: "Today", notes: [e.note] }];
          return { ...s, customers, unseen: bump(s, "crm") };
        }
        case "compliance":
          return { ...s, nudges: [e.nudge, ...s.nudges], unseen: bump(s, "compliance") };
        case "compliance_task":
          return { ...s, compliance: { ...s.compliance, [e.id]: { status: e.status, prepared: e.prepared, missing: e.missing } } };
        case "handoff":
          return { ...s, handoffs: { ...s.handoffs, [e.customerId]: e.reason }, unseen: bump(s, "whatsapp") };
        case "customer_add":
          return s.customers.some((c) => c.id === e.customer.id) ? s : { ...s, customers: [...s.customers, e.customer], unseen: bump(s, "crm") };
        case "invoice_add":
          return s.invoices.some((i) => i.id === e.invoice.id) ? s : { ...s, invoices: [e.invoice, ...s.invoices], unseen: bump(s, "operations") };
        case "school_add":
          return s.school.some((i) => i.id === e.item.id) ? s : { ...s, school: [...s.school, e.item], unseen: bump(s, "operations") };
      }
      return s;
    }
  }
}

/** Compact view of the dashboard the assistant reasons over. All synthetic. */
export function buildSnapshot(s: State): Snapshot {
  const customers = s.customers.some((c) => c.id === newCustomer.id) ? s.customers : [...s.customers, newCustomer];
  const nameOf = (id: string) => customers.find((c) => c.id === id)?.name ?? id;
  return {
    tab: s.tab,
    activeChat: s.activeChat,
    complianceTask: s.ui.complianceTask,
    examMode: s.examMode,
    customers: customers.map((c) => ({ id: c.id, name: c.name, business: c.business, optIn: !!c.optIn })),
    approvals: s.approvals
      .filter((a) => a.status === "pending")
      .map((a) => ({
        id: a.id,
        kind: a.kind,
        agent: a.agent,
        effects: a.effects,
        refuseEffects: a.refuseEffects,
        targetId: a.targetId,
        customerId: a.customerId ?? "",
        customerName: a.customerId ? nameOf(a.customerId) : "",
        title: a.title,
        detail: a.detail,
        draftMessage: a.draftMessage,
      })),
    handoffs: Object.entries(s.handoffs).map(([customerId, reason]) => ({ customerId, name: nameOf(customerId), reason })),
    unread: Object.values(s.unread).reduce((n, x) => n + x, 0),
    projects: s.projects.map((p) => ({
      id: p.id,
      customerId: p.customerId,
      title: p.title,
      status: p.status,
      payment: p.payment,
      dueDate: p.dueDate,
      total: p.total,
      deposit: p.deposit,
      hoursNeeded: p.hoursNeeded,
      deliverables: p.deliverables,
      scopeFlag: p.scopeFlag,
    })),
    invoices: s.invoices.map((i) => ({ id: i.id, projectId: i.projectId, customerId: i.customerId, amount: i.amount, dueDate: i.dueDate, daysOverdue: i.daysOverdue, status: i.status })),
    collisions: detectCollisions(s.projects, s.school).map((c) => ({ projectId: c.project.id, customerId: c.project.customerId, schoolTitle: c.school.title, date: c.school.date, proposedDue: c.proposedDue })),
    school: s.school.map((item) => ({ id: item.id, module: item.module, title: item.title, kind: item.kind, date: item.date, hours: item.hours, fixed: item.fixed })),
    compliance: complianceTasks.map((t) => ({ id: t.id, label: t.label, status: s.compliance[t.id]?.status ?? t.status, dependsOn: t.dependsOn })),
    automations: Object.entries(s.automations)
      .filter(([, on]) => on)
      .map(([id]) => id),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const delayFor = (e: AgentEvent) => (e.type === "reply" ? 900 : e.type === "trace" ? 550 : 380);
/** next paint, or 60 ms when the tab is hidden (rAF is paused in background tabs) */
const nextFrame = () =>
  new Promise<void>((r) => {
    const t = setTimeout(r, 60);
    requestAnimationFrame(() => {
      clearTimeout(t);
      r();
    });
  });
/** let React commit pending dispatches so stateRef is current */
const settle = async () => {
  await sleep(30);
  await nextFrame();
};

/** Tailwind classes for the 2 s highlight ring (written out in full so Tailwind generates them). */
const FOCUS_RING = ["ring-2", "ring-accent", "ring-offset-2", "ring-offset-background", "transition-shadow"];

type Ctx = {
  state: State;
  setTab: (t: Tab) => void;
  sendCustomerMessage: (text: string, customerId?: string) => Promise<void>;
  sendOwnerMessage: (text: string) => void;
  openChat: (customerId: string) => void;
  togglePause: (customerId: string) => void;
  toggleAutomation: (id: string) => void;
  checkCollisions: () => Promise<void>;
  chaseOverdue: () => Promise<void>;
  toggleExamMode: () => Promise<void>;
  runAutomations: () => Promise<void>;
  prepareCompliance: (taskId: string) => Promise<void>;
  setComplianceStatus: (taskId: string, status: ComplianceStatus) => void;
  decide: (approvalId: string, decision: "allow" | "refuse") => Promise<void>;
  reset: () => void;
  /* layout (driven by the owner or by the agent console) */
  setColumns: (cols: { left?: boolean; right?: boolean }) => void;
  /** scroll to a panel and ring it for 2 s; resolves false (and does nothing) if the panel isn't on screen */
  focusAnchor: (anchorId: string) => Promise<boolean>;
  openComplianceTask: (taskId: string) => void;
  /* agent console */
  askAssistant: (text: string) => Promise<void>;
  confirmAction: (messageId: number) => Promise<void>;
  cancelAction: (messageId: number) => void;
};

const StoreCtx = createContext<Ctx | null>(null);

export function MetaxyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const focusTimer = useRef<{ el: HTMLElement; timer: ReturnType<typeof setTimeout> } | null>(null);

  /** Replay agent events with small delays so the owner can follow along. */
  const replay = useCallback(async (events: AgentEvent[], chat: string) => {
    for (const event of events) {
      await sleep(delayFor(event));
      dispatch({ type: "event", event, chat });
    }
  }, []);

  /** Call the agent and replay its events. */
  const play = useCallback(async (body: unknown, chat: string) => {
    dispatch({ type: "busy", busy: true });
    try {
      const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AgentResponse;
      dispatch({ type: "busy", busy: true, engine: data.engine });
      await replay(data.events, chat);
    } catch (err) {
      dispatch({ type: "event", event: { type: "trace", tool: "error", label: "Agent unreachable", detail: String(err), status: "block" }, chat });
    } finally {
      dispatch({ type: "busy", busy: false });
    }
  }, [replay]);

  const ops = useMemo(() => {
    const enabledAutomations = () =>
      Object.entries(stateRef.current.automations)
        .filter(([, on]) => on)
        .map(([id]) => id);

    const setTab = (tab: Tab) => dispatch({ type: "tab", tab });
    const openChat = (customerId: string) => dispatch({ type: "open_chat", customerId });
    const sendOwnerMessage = (text: string) => dispatch({ type: "owner_says", text });

    const sendCustomerMessage = async (text: string, customerIdOverride?: string) => {
      const s = stateRef.current;
      const chat = customerIdOverride ?? s.activeChat;
      dispatch({ type: "customer_says", text, customerId: chat });
      if (s.paused[chat]) {
        dispatch({
          type: "event",
          chat,
          event: { type: "trace", agent: "Client Desk", tool: "agent_paused", label: "Agent paused", detail: "You're handling this chat — the agent won't reply", status: "warn" },
        });
        return;
      }
      await play(
        {
          kind: "customer_message",
          text,
          customerId: chat,
          projects: s.projects,
          enabled: enabledAutomations(),
          examMode: s.examMode,
          customers: s.customers,
        },
        chat,
      );
    };
    const checkCollisions = async () => {
      const s = stateRef.current;
      await play({ kind: "check_collisions", projects: s.projects, school: s.school, customers: s.customers }, s.activeChat);
    };
    const chaseOverdue = async () => {
      const s = stateRef.current;
      await play({ kind: "chase_overdue", invoices: s.invoices, customers: s.customers }, s.activeChat);
    };
    const toggleExamMode = async () => {
      const s = stateRef.current;
      const next = !s.examMode;
      dispatch({ type: "set_exam_mode", active: next });
      await play({ kind: "toggle_exam_mode", active: next, projects: s.projects, customers: s.customers }, s.activeChat);
    };
    const runAutomations = async () => {
      const s = stateRef.current;
      await play({ kind: "run_automations", enabled: enabledAutomations(), projects: s.projects, invoices: s.invoices, customers: s.customers }, s.activeChat);
    };
    /** Run a local, deterministic data operation (ops.ts) and replay its events. */
    const runOp = async (op: (st: OpState) => OpResult): Promise<OpResult> => {
      const s = stateRef.current;
      const result = op({ customers: s.customers, projects: s.projects, invoices: s.invoices, school: s.school, approvals: s.approvals, examMode: s.examMode });
      dispatch({ type: "busy", busy: true });
      try {
        await replay(result.events, s.activeChat);
      } finally {
        dispatch({ type: "busy", busy: false });
      }
      return result;
    };
    const prepareCompliance = async (taskId: string) => {
      dispatch({ type: "preparing", id: taskId });
      const s = stateRef.current;
      const docs = currentVault((id) => s.compliance[id]?.status === "done");
      await play({ kind: "compliance_prepare", taskId, vault: docs }, s.activeChat);
      dispatch({ type: "preparing", id: null });
    };
    const decide = async (approvalId: string, decision: "allow" | "refuse") => {
      const s = stateRef.current;
      const approval = s.approvals.find((a) => a.id === approvalId);
      if (!approval) return;
      const project = s.projects.find((p) => p.id === approval.targetId);
      await play({ kind: "approval", decision, approval, project }, approval.customerId ?? s.activeChat);
      // a real calendar change can create a new clash: Planner re-checks straight away (drafts only)
      if (decision === "allow" && approval.kind === "calendar_change") {
        await settle();
        await checkCollisions();
      }
    };

    const setColumns = (cols: { left?: boolean; right?: boolean }) =>
      dispatch({ type: "ui", patch: { ...(cols.left !== undefined ? { leftOpen: cols.left } : {}), ...(cols.right !== undefined ? { rightOpen: cols.right } : {}) } });
    const openComplianceTask = (taskId: string) => dispatch({ type: "ui", patch: { complianceTask: taskId } });

    const focusAnchor = async (anchorId: string) => {
      // let a tab switch render first
      await nextFrame();
      await nextFrame();
      const el = typeof document !== "undefined" ? document.getElementById(anchorId) : null;
      if (!el) return false;
      if (focusTimer.current) {
        clearTimeout(focusTimer.current.timer);
        focusTimer.current.el.classList.remove(...FOCUS_RING);
      }
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      el.classList.add(...FOCUS_RING);
      dispatch({ type: "ui", patch: { focus: anchorId } });
      focusTimer.current = {
        el,
        timer: setTimeout(() => {
          el.classList.remove(...FOCUS_RING);
          focusTimer.current = null;
          if (stateRef.current.ui.focus === anchorId) dispatch({ type: "ui", patch: { focus: null } });
        }, 2000),
      };
      return true;
    };

    /* ----------------------------- agent console ----------------------------- */

    const say = (msg: AssistantMsgInput) => dispatch({ type: "assistant_msg", msg });
    const step = (text: string, tone: "ok" | "warn" = "ok") => say({ role: "step", text, tone });
    const pendingIds = () => new Set(stateRef.current.approvals.filter((a) => a.status === "pending").map((a) => a.id));

    /**
     * After a scan, an instruction or a simulated message drafts new approvals, show them as confirm cards
     * (one card each, or one batch card). Nothing runs without Confirm; the drafts also wait in the approval queue.
     */
    const offerNewApprovals = (before: Set<string>, batchTitle?: (n: number) => string) => {
      const snap = buildSnapshot(stateRef.current);
      const fresh = snap.approvals.filter((a) => !before.has(a.id));
      if (batchTitle && fresh.length > 1) {
        const card = confirmFor(fresh.map((ap): UiAction => ({ type: "decide_approval", approvalId: ap.id, decision: "allow" })), snap);
        if (card) say({ role: "confirm", card: { ...card, title: batchTitle(fresh.length), confirmLabel: `Approve & send ${fresh.length}` }, status: "pending" });
        return fresh.length;
      }
      for (const ap of fresh) {
        const card = confirmFor([{ type: "decide_approval", approvalId: ap.id, decision: "allow" }], snap);
        if (card) say({ role: "confirm", card, status: "pending" });
      }
      return fresh.length;
    };

    /** Run a data op, show it as a step tagged with its agent, then offer whatever it drafted. */
    const dataStep = async (label: string, op: (st: OpState) => OpResult, focus: string[]) => {
      const before = pendingIds();
      const result = await runOp(op);
      await settle();
      if (result.ok) step(label);
      if (result.say) say({ role: "assistant", text: result.say });
      for (const anchorId of focus) await focusAnchor(anchorId);
      if (offerNewApprovals(before)) step("Drafted for your OK: nothing is sent or changed until you confirm");
      return result;
    };

    /** Run actions one by one so the owner can follow. Ask-first actions only run when `confirmed`. */
    const execute = async (actions: UiAction[], confirmed: boolean) => {
      for (const a of actions) {
        if (isAskFirst(a) && !confirmed) continue;
        const label = describeAction(a, buildSnapshot(stateRef.current));
        await sleep(320);
        switch (a.type) {
          case "navigate":
            setTab(a.tab);
            step(label);
            break;
          case "open_chat":
            openChat(a.customerId);
            step(label);
            break;
          case "open_compliance_task":
            openComplianceTask(a.taskId);
            step(label);
            break;
          case "focus":
            if (await focusAnchor(a.anchorId)) step(label);
            break;
          case "set_columns":
            setColumns(a);
            step(label);
            break;
          case "prepare_compliance": {
            await prepareCompliance(a.taskId);
            await settle();
            const st = stateRef.current.compliance[a.taskId];
            const task = complianceTasks.find((t) => t.id === a.taskId);
            if (st?.status === "ready") {
              step(label);
              const parts = [`${taskLabel(buildSnapshot(stateRef.current), a.taskId)} is ready for you.`];
              if (st.prepared?.length) parts.push(`I prepared:\n• ${st.prepared.join("\n• ")}`);
              if (st.missing?.length) parts.push(`Still needed from you: ${st.missing.join(", ")}.`);
              if (task && task.ownerMust !== "—") parts.push(`Only you can: ${task.ownerMust}`);
              say({ role: "assistant", text: parts.join("\n\n") });
            } else {
              step(`Couldn't prepare ${task?.label ?? a.taskId}. Check Agent activity`, "warn");
            }
            break;
          }
          case "check_collisions":
          case "chase_overdue": {
            const before = pendingIds();
            await (a.type === "check_collisions" ? checkCollisions() : chaseOverdue());
            await settle();
            const drafted = offerNewApprovals(before);
            step(drafted ? `${label}: drafted ${drafted} decision${drafted > 1 ? "s" : ""} for you` : `${label}: nothing new to decide`, drafted ? "ok" : "warn");
            break;
          }
          case "simulate_customer": {
            const before = pendingIds();
            openChat(a.customerId);
            step(label);
            await sendCustomerMessage(a.text, a.customerId);
            await settle();
            if (offerNewApprovals(before)) step("The agent drafted a reply and is holding it for your OK");
            break;
          }
          case "run_automations": {
            const before = stateRef.current.messages.filter((m) => m.automation).length;
            await runAutomations();
            await settle();
            const sent = stateRef.current.messages.filter((m) => m.automation).length - before;
            step(`${label}: ${sent} message${sent === 1 ? "" : "s"} sent`, sent ? "ok" : "warn");
            break;
          }
          case "decide_approval": {
            const before = pendingIds();
            const kind = stateRef.current.approvals.find((p) => p.id === a.approvalId)?.kind;
            await decide(a.approvalId, a.decision);
            await settle();
            const after = stateRef.current.approvals.find((p) => p.id === a.approvalId)?.status;
            if (after === (a.decision === "allow" ? "allowed" : "refused")) step(label);
            else step(`Couldn't record the decision on ${a.approvalId}`, "warn");
            if (kind === "calendar_change" && a.decision === "allow") {
              const n = offerNewApprovals(before);
              step(n ? `Planner re-checked your deadlines: ${n} clash${n > 1 ? "es" : ""} to decide` : "Planner re-checked your deadlines: no new clashes", n ? "warn" : "ok");
            }
            break;
          }
          case "send_owner_message":
            openChat(a.customerId);
            sendOwnerMessage(a.text);
            step(label);
            break;
          case "add_client": {
            const r = await dataStep(label, (st) => addClient(a, st), []);
            if (r.ok && !a.packages?.length) {
              setTab("crm");
              await focusAnchor("crm-memory");
            }
            break;
          }
          case "create_project":
            await dataStep(label, (st) => createProject(a, st), ["ops-orders"]);
            break;
          case "log_payment":
            await dataStep(label, (st) => logPayment(a.invoiceId, st), ["ops-invoices"]);
            break;
          case "schedule_school_item":
            await dataStep(label, (st) => scheduleSchool(a, st), ["ops-calendar"]);
            break;
          case "plan_study_blocks":
            await dataStep(label, (st) => planStudy(a.targetId, st), ["ops-calendar"]);
            break;
          case "capacity_plan": {
            const r = await runOp((st) => capacityPlan(a.weekStart, st));
            step(label);
            if (r.say) say({ role: "assistant", text: `• ${r.say}` });
            break;
          }
          case "set_exam_mode": {
            if (stateRef.current.examMode === a.active) {
              step(`Exam Mode is already ${a.active ? "on" : "off"}`, "warn");
              break;
            }
            const before = pendingIds();
            await toggleExamMode();
            await settle();
            step(label);
            await focusAnchor("ops-triggers");
            if (a.active) {
              const n = offerNewApprovals(before, (k) => `Send ${k} Exam Mode notices to active clients`);
              step(n ? `Drafted ${n} pause notice${n > 1 ? "s" : ""}: nothing is sent until you confirm` : "No active clients to notify", n ? "ok" : "warn");
            }
            break;
          }
        }
      }
    };

    const askAssistant = async (text: string) => {
      const msg = text.trim();
      if (!msg || stateRef.current.assistant.busy) return;
      const history: HistoryItem[] = stateRef.current.assistant.messages
        .flatMap((m) => (m.role === "user" || m.role === "assistant" ? [{ role: m.role, text: m.text }] : []))
        .slice(-10);
      say({ role: "user", text: msg });
      dispatch({ type: "assistant_busy", busy: true });
      try {
        const snapshot = buildSnapshot(stateRef.current);
        let res: AssistantResponse;
        try {
          const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, history, snapshot }) });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          res = (await r.json()) as AssistantResponse;
        } catch {
          // offline / server down: the router is pure, so run it right here
          res = route(msg, snapshot);
        }
        say({ role: "assistant", text: res.reply, engine: res.engine });
        await execute(res.actions ?? [], false);
        if (res.confirm?.actions.length) say({ role: "confirm", card: res.confirm, status: "pending" });
      } finally {
        dispatch({ type: "assistant_busy", busy: false });
      }
    };

    const confirmAction = async (messageId: number) => {
      const m = stateRef.current.assistant.messages.find((x) => x.id === messageId);
      if (!m || m.role !== "confirm" || m.status !== "pending" || stateRef.current.assistant.busy) return;
      dispatch({ type: "confirm_status", id: messageId, status: "running" });
      dispatch({ type: "assistant_busy", busy: true });
      try {
        await execute(m.card.actions, true);
      } finally {
        dispatch({ type: "confirm_status", id: messageId, status: "confirmed" });
        dispatch({ type: "assistant_busy", busy: false });
      }
    };

    const cancelAction = (messageId: number) => {
      const m = stateRef.current.assistant.messages.find((x) => x.id === messageId);
      if (!m || m.role !== "confirm" || m.status !== "pending") return;
      dispatch({ type: "confirm_status", id: messageId, status: "cancelled" });
      step("Cancelled. Nothing was sent or changed", "warn");
    };

    return {
      setTab,
      reset: () => dispatch({ type: "reset" }),
      openChat,
      togglePause: (customerId: string) => dispatch({ type: "toggle_pause", customerId }),
      toggleAutomation: (id: string) => dispatch({ type: "toggle_automation", id }),
      setComplianceStatus: (id: string, status: ComplianceStatus) => dispatch({ type: "compliance_set", id, status }),
      sendOwnerMessage,
      sendCustomerMessage,
      checkCollisions,
      chaseOverdue,
      toggleExamMode,
      runAutomations,
      prepareCompliance,
      decide,
      setColumns,
      focusAnchor,
      openComplianceTask,
      askAssistant,
      confirmAction,
      cancelAction,
    };
  }, [play]);

  const value = useMemo<Ctx>(() => ({ state, ...ops }), [state, ops]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useMetaxy() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useMetaxy must be used inside MetaxyProvider");
  return ctx;
}
