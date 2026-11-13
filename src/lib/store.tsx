"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from "react";
import { initialCustomers, initialSchoolItems, newCustomer } from "@/lib/agent/data";
import { addClient, capacityPlan, createProject, logPayment, planStudy, scheduleSchool, type OpResult, type OpState } from "@/lib/agent/ops";
import { detectCollisions } from "@/lib/agent/tools";
import type { AgentEvent, AgentResponse, AgentRole, Approval, ComplianceNudge, ComplianceStatus, Customer, Invoice, Project, SchoolItem, Tab, TraceStatus } from "@/lib/agent/types";
import { confirmFor, describeAction, taskLabel } from "@/lib/assistant/describe";
import { route } from "@/lib/assistant/router";
import { isAskFirst, type AssistantResponse, type ConfirmCard, type HistoryItem, type Snapshot, type UiAction } from "@/lib/assistant/types";
import { validate } from "@/lib/assistant/validate";
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
  | { id: number; role: "user"; text: string; turnKey?: string }
  | { id: number; role: "assistant"; text: string; engine?: AssistantResponse["engine"] | "openai-live"; turnKey?: string }
  /** a UI action that actually ran ("→ Opened Compliance › CIPC") */
  | { id: number; role: "step"; text: string; tone: "ok" | "warn" }
  | { id: number; role: "confirm"; card: ConfirmCard; status: ConfirmStatus };

/** Roles an owner can spawn in the right-hand panel. One shared business ledger; separate threads. */
export type WorkspaceAgentRole = "Client Desk" | "Planner" | "Books" | "Custom";

export type AgentSession = {
  id: string;
  role: WorkspaceAgentRole;
  title: string;
  messages: AssistantMsg[];
  busy: boolean;
  createdAt: number;
};

const WORKSPACE_ROLES: WorkspaceAgentRole[] = ["Client Desk", "Planner", "Books"];

export function seedWorkspaceAgent(): AgentSession {
  return { id: "agent-1", role: "Client Desk", title: "Client Desk", messages: [], busy: false, createdAt: 0 };
}

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
  /** spawned owner-console agents. The business ledger above stays shared. */
  agents: AgentSession[];
  activeAgentId: string;
  /** at most one agent holds the gpt-live-1 WebRTC session */
  liveAgentId: string | null;
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
  agents: [seedWorkspaceAgent()],
  activeAgentId: "agent-1",
  liveAgentId: null,
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
  | { type: "spawn_agent" }
  | { type: "set_active_agent"; id: string }
  | { type: "close_agent"; id: string }
  | { type: "set_live_agent"; id: string | null }
  | { type: "assistant_msg"; agentId: string; msg: AssistantMsgInput }
  | { type: "live_transcript"; agentId: string; role: "user" | "assistant"; delta: string; turnKey: string }
  | { type: "assistant_busy"; agentId: string; busy: boolean }
  | { type: "confirm_status"; id: number; status: ConfirmStatus };

function patchAgent(s: State, id: string, fn: (agent: AgentSession) => AgentSession): State {
  return { ...s, agents: s.agents.map((agent) => (agent.id === id ? fn(agent) : agent)) };
}

function agentByMessage(s: State, messageId: number) {
  return s.agents.find((agent) => agent.messages.some((m) => m.id === messageId));
}

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
      return { ...initialState(), tab: s.tab, engine: s.engine, ui: s.ui, agents: s.agents, activeAgentId: s.activeAgentId, liveAgentId: s.liveAgentId };
    case "ui":
      return { ...s, ui: { ...s.ui, ...a.patch } };
    case "spawn_agent": {
      const n = s.agents.length + 1;
      const used = new Set(s.agents.map((agent) => agent.role));
      const role = WORKSPACE_ROLES.find((item) => !used.has(item)) ?? "Custom";
      const id = `agent-${seq++}`;
      const agent: AgentSession = {
        id,
        role,
        title: role === "Custom" ? `Agent ${n}` : role,
        messages: [],
        busy: false,
        createdAt: Date.now(),
      };
      return { ...s, agents: [...s.agents, agent], activeAgentId: id };
    }
    case "set_active_agent":
      return s.agents.some((agent) => agent.id === a.id) ? { ...s, activeAgentId: a.id } : s;
    case "close_agent": {
      if (s.agents.length <= 1) return s;
      const agents = s.agents.filter((agent) => agent.id !== a.id);
      return {
        ...s,
        agents,
        activeAgentId: s.activeAgentId === a.id ? agents[agents.length - 1].id : s.activeAgentId,
        liveAgentId: s.liveAgentId === a.id ? null : s.liveAgentId,
      };
    }
    case "set_live_agent":
      return { ...s, liveAgentId: a.id };
    case "assistant_msg":
      return patchAgent(s, a.agentId, (agent) => ({ ...agent, messages: [...agent.messages, { ...a.msg, id: seq++ } as AssistantMsg] }));
    case "live_transcript": {
      const agent = s.agents.find((item) => item.id === a.agentId);
      if (!agent) return s;
      const msgs = agent.messages;
      const last = msgs[msgs.length - 1];
      if (last && (last.role === "user" || last.role === "assistant") && last.role === a.role && last.turnKey === a.turnKey) {
        const updated = { ...last, text: `${last.text}${a.delta}` };
        return patchAgent(s, a.agentId, (current) => ({ ...current, messages: [...msgs.slice(0, -1), updated] }));
      }
      const nextMsg: AssistantMsg =
        a.role === "assistant"
          ? { id: seq++, role: "assistant", text: a.delta, engine: "openai-live", turnKey: a.turnKey }
          : { id: seq++, role: "user", text: a.delta, turnKey: a.turnKey };
      return patchAgent(s, a.agentId, (current) => ({ ...current, messages: [...current.messages, nextMsg] }));
    }
    case "assistant_busy":
      return patchAgent(s, a.agentId, (agent) => ({ ...agent, busy: a.busy }));
    case "confirm_status": {
      const owner = agentByMessage(s, a.id);
      if (!owner) return s;
      return patchAgent(s, owner.id, (agent) => ({
        ...agent,
        messages: agent.messages.map((m) => (m.id === a.id && m.role === "confirm" ? { ...m, status: a.status } : m)),
      }));
    }
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
  spawnAgent: () => void;
  setActiveAgent: (id: string) => void;
  closeAgent: (id: string) => void;
  setLiveAgent: (id: string | null) => void;
  askAssistant: (text: string, agentId?: string) => Promise<void>;
  confirmAction: (messageId: number) => Promise<void>;
  cancelAction: (messageId: number) => void;
  /* live voice (gpt-live-1) */
  getSnapshot: () => Snapshot;
  pushLiveTranscript: (role: "user" | "assistant", delta: string, turnKey: string) => void;
  pushLiveMessage: (role: "user" | "assistant", text: string) => void;
  pushLiveStep: (text: string, tone?: "ok" | "warn") => void;
  runLiveTool: (name: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>;
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

    const say = (agentId: string, msg: AssistantMsgInput) => dispatch({ type: "assistant_msg", agentId, msg });
    const step = (agentId: string, text: string, tone: "ok" | "warn" = "ok") => say(agentId, { role: "step", text, tone });
    const pendingIds = () => new Set(stateRef.current.approvals.filter((a) => a.status === "pending").map((a) => a.id));
    const liveTarget = () => stateRef.current.liveAgentId ?? stateRef.current.activeAgentId;

    /**
     * After a scan, an instruction or a simulated message drafts new approvals, show them as confirm cards
     * (one card each, or one batch card). Nothing runs without Confirm; the drafts also wait in the approval queue.
     */
    const offerNewApprovals = (agentId: string, before: Set<string>, batchTitle?: (n: number) => string) => {
      const snap = buildSnapshot(stateRef.current);
      const fresh = snap.approvals.filter((a) => !before.has(a.id));
      if (batchTitle && fresh.length > 1) {
        const card = confirmFor(fresh.map((ap): UiAction => ({ type: "decide_approval", approvalId: ap.id, decision: "allow" })), snap);
        if (card) say(agentId, { role: "confirm", card: { ...card, title: batchTitle(fresh.length), confirmLabel: `Approve & send ${fresh.length}` }, status: "pending" });
        return fresh.length;
      }
      for (const ap of fresh) {
        const card = confirmFor([{ type: "decide_approval", approvalId: ap.id, decision: "allow" }], snap);
        if (card) say(agentId, { role: "confirm", card, status: "pending" });
      }
      return fresh.length;
    };

    /** Run a data op, show it as a step tagged with its agent, then offer whatever it drafted. */
    const dataStep = async (agentId: string, label: string, op: (st: OpState) => OpResult, focus: string[]) => {
      const before = pendingIds();
      const result = await runOp(op);
      await settle();
      if (result.ok) step(agentId, label);
      if (result.say) say(agentId, { role: "assistant", text: result.say });
      for (const anchorId of focus) await focusAnchor(anchorId);
      if (offerNewApprovals(agentId, before)) step(agentId, "Drafted for your OK: nothing is sent or changed until you confirm");
      return result;
    };

    /** Run actions one by one so the owner can follow. Ask-first actions only run when `confirmed`. */
    const execute = async (agentId: string, actions: UiAction[], confirmed: boolean) => {
      for (const a of actions) {
        if (isAskFirst(a) && !confirmed) continue;
        const label = describeAction(a, buildSnapshot(stateRef.current));
        await sleep(320);
        switch (a.type) {
          case "navigate":
            setTab(a.tab);
            step(agentId, label);
            break;
          case "open_chat":
            openChat(a.customerId);
            step(agentId, label);
            break;
          case "open_compliance_task":
            openComplianceTask(a.taskId);
            step(agentId, label);
            break;
          case "focus":
            if (await focusAnchor(a.anchorId)) step(agentId, label);
            break;
          case "set_columns":
            setColumns(a);
            step(agentId, label);
            break;
          case "prepare_compliance": {
            await prepareCompliance(a.taskId);
            await settle();
            const st = stateRef.current.compliance[a.taskId];
            const task = complianceTasks.find((t) => t.id === a.taskId);
            if (st?.status === "ready") {
              step(agentId, label);
              const parts = [`${taskLabel(buildSnapshot(stateRef.current), a.taskId)} is ready for you.`];
              if (st.prepared?.length) parts.push(`I prepared:\n• ${st.prepared.join("\n• ")}`);
              if (st.missing?.length) parts.push(`Still needed from you: ${st.missing.join(", ")}.`);
              if (task && task.ownerMust !== "—") parts.push(`Only you can: ${task.ownerMust}`);
              say(agentId, { role: "assistant", text: parts.join("\n\n") });
            } else {
              step(agentId, `Couldn't prepare ${task?.label ?? a.taskId}. Check Agent activity`, "warn");
            }
            break;
          }
          case "check_collisions":
          case "chase_overdue": {
            const before = pendingIds();
            await (a.type === "check_collisions" ? checkCollisions() : chaseOverdue());
            await settle();
            const drafted = offerNewApprovals(agentId, before);
            step(agentId, drafted ? `${label}: drafted ${drafted} decision${drafted > 1 ? "s" : ""} for you` : `${label}: nothing new to decide`, drafted ? "ok" : "warn");
            break;
          }
          case "simulate_customer": {
            const before = pendingIds();
            openChat(a.customerId);
            step(agentId, label);
            await sendCustomerMessage(a.text, a.customerId);
            await settle();
            if (offerNewApprovals(agentId, before)) step(agentId, "The agent drafted a reply and is holding it for your OK");
            break;
          }
          case "run_automations": {
            const before = stateRef.current.messages.filter((m) => m.automation).length;
            await runAutomations();
            await settle();
            const sent = stateRef.current.messages.filter((m) => m.automation).length - before;
            step(agentId, `${label}: ${sent} message${sent === 1 ? "" : "s"} sent`, sent ? "ok" : "warn");
            break;
          }
          case "decide_approval": {
            const before = pendingIds();
            const kind = stateRef.current.approvals.find((p) => p.id === a.approvalId)?.kind;
            await decide(a.approvalId, a.decision);
            await settle();
            const after = stateRef.current.approvals.find((p) => p.id === a.approvalId)?.status;
            if (after === (a.decision === "allow" ? "allowed" : "refused")) step(agentId, label);
            else step(agentId, `Couldn't record the decision on ${a.approvalId}`, "warn");
            if (kind === "calendar_change" && a.decision === "allow") {
              const n = offerNewApprovals(agentId, before);
              step(agentId, n ? `Planner re-checked your deadlines: ${n} clash${n > 1 ? "es" : ""} to decide` : "Planner re-checked your deadlines: no new clashes", n ? "warn" : "ok");
            }
            break;
          }
          case "send_owner_message":
            openChat(a.customerId);
            sendOwnerMessage(a.text);
            step(agentId, label);
            break;
          case "add_client": {
            const r = await dataStep(agentId, label, (st) => addClient(a, st), []);
            if (r.ok && !a.packages?.length) {
              setTab("crm");
              await focusAnchor("crm-memory");
            }
            break;
          }
          case "create_project":
            await dataStep(agentId, label, (st) => createProject(a, st), ["ops-orders"]);
            break;
          case "log_payment":
            await dataStep(agentId, label, (st) => logPayment(a.invoiceId, st), ["ops-invoices"]);
            break;
          case "schedule_school_item":
            await dataStep(agentId, label, (st) => scheduleSchool(a, st), ["ops-calendar"]);
            break;
          case "plan_study_blocks":
            await dataStep(agentId, label, (st) => planStudy(a.targetId, st), ["ops-calendar"]);
            break;
          case "capacity_plan": {
            const r = await runOp((st) => capacityPlan(a.weekStart, st));
            step(agentId, label);
            if (r.say) say(agentId, { role: "assistant", text: `• ${r.say}` });
            break;
          }
          case "set_exam_mode": {
            if (stateRef.current.examMode === a.active) {
              step(agentId, `Exam Mode is already ${a.active ? "on" : "off"}`, "warn");
              break;
            }
            const before = pendingIds();
            await toggleExamMode();
            await settle();
            step(agentId, label);
            await focusAnchor("ops-triggers");
            if (a.active) {
              const n = offerNewApprovals(agentId, before, (k) => `Send ${k} Exam Mode notices to active clients`);
              step(agentId, n ? `Drafted ${n} pause notice${n > 1 ? "s" : ""}: nothing is sent until you confirm` : "No active clients to notify", n ? "ok" : "warn");
            }
            break;
          }
        }
      }
    };

    const askAssistant = async (text: string, agentId?: string) => {
      const id = agentId ?? stateRef.current.activeAgentId;
      const agent = stateRef.current.agents.find((item) => item.id === id);
      const msg = text.trim();
      if (!agent || !msg || agent.busy) return;
      const history: HistoryItem[] = agent.messages
        .flatMap((m) => (m.role === "user" || m.role === "assistant" ? [{ role: m.role, text: m.text }] : []))
        .slice(-10);
      say(id, { role: "user", text: msg });
      dispatch({ type: "assistant_busy", agentId: id, busy: true });
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
        say(id, { role: "assistant", text: res.reply, engine: res.engine });
        await execute(id, res.actions ?? [], false);
        if (res.confirm?.actions.length) say(id, { role: "confirm", card: res.confirm, status: "pending" });
      } finally {
        dispatch({ type: "assistant_busy", agentId: id, busy: false });
      }
    };

    const confirmAction = async (messageId: number) => {
      const owner = agentByMessage(stateRef.current, messageId);
      const m = owner?.messages.find((x) => x.id === messageId);
      if (!owner || !m || m.role !== "confirm" || m.status !== "pending" || owner.busy) return;
      dispatch({ type: "confirm_status", id: messageId, status: "running" });
      dispatch({ type: "assistant_busy", agentId: owner.id, busy: true });
      try {
        await execute(owner.id, m.card.actions, true);
      } finally {
        dispatch({ type: "confirm_status", id: messageId, status: "confirmed" });
        dispatch({ type: "assistant_busy", agentId: owner.id, busy: false });
      }
    };

    const cancelAction = (messageId: number) => {
      const owner = agentByMessage(stateRef.current, messageId);
      const m = owner?.messages.find((x) => x.id === messageId);
      if (!owner || !m || m.role !== "confirm" || m.status !== "pending") return;
      dispatch({ type: "confirm_status", id: messageId, status: "cancelled" });
      step(owner.id, "Cancelled. Nothing was sent or changed", "warn");
    };

    const getSnapshot = () => buildSnapshot(stateRef.current);

    const pushLiveTranscript = (role: "user" | "assistant", delta: string, turnKey: string) => {
      if (!delta) return;
      dispatch({ type: "live_transcript", agentId: liveTarget(), role, delta, turnKey });
    };

    const pushLiveMessage = (role: "user" | "assistant", text: string) => {
      if (!text.trim()) return;
      const agentId = liveTarget();
      say(agentId, role === "assistant" ? { role: "assistant", text, engine: "openai-live" } : { role: "user", text });
    };

    const pushLiveStep = (text: string, tone: "ok" | "warn" = "ok") => step(liveTarget(), text, tone);

    const runLiveTool = async (name: string, args: Record<string, unknown>): Promise<Record<string, unknown>> => {
      const snap = buildSnapshot(stateRef.current);
      if (name === "get_dashboard_state") {
        return { ok: true, state: snap };
      }
      const action = validate(name, args, snap);
      if (!action) {
        return { ok: false, error: `Invalid arguments or unknown id for "${name}". Check state ids before retrying.`, state: snap };
      }
      if (isAskFirst(action)) {
        const card = confirmFor([action], snap);
        if (card) {
          say(liveTarget(), { role: "confirm", card, status: "pending" });
          return {
            ok: true,
            status: "awaiting_owner_confirmation",
            title: card.title,
            effects: card.effects,
            message: "Confirmation card placed on screen. Ask the owner to click Confirm.",
            state: buildSnapshot(stateRef.current),
          };
        }
        return { ok: false, error: "Nothing pending to confirm.", state: snap };
      }
      await execute(liveTarget(), [action], false);
      await settle();
      return {
        ok: true,
        executed: describeAction(action, snap),
        state: buildSnapshot(stateRef.current),
      };
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
      spawnAgent: () => dispatch({ type: "spawn_agent" }),
      setActiveAgent: (id: string) => dispatch({ type: "set_active_agent", id }),
      closeAgent: (id: string) => dispatch({ type: "close_agent", id }),
      setLiveAgent: (id: string | null) => dispatch({ type: "set_live_agent", id }),
      askAssistant,
      confirmAction,
      cancelAction,
      getSnapshot,
      pushLiveTranscript,
      pushLiveMessage,
      pushLiveStep,
      runLiveTool,
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
