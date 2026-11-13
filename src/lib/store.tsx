"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from "react";
import { initialCustomers, initialSchoolItems, newCustomer } from "@/lib/agent/data";
import type { AgentEvent, AgentResponse, AgentRole, Approval, ComplianceNudge, ComplianceStatus, Customer, Invoice, Project, SchoolItem, Tab, TraceStatus } from "@/lib/agent/types";
import { complianceTasks, currentVault } from "@/lib/compliance/data";
import { defaultAutomations, seedInvoices, seedProjects, seedThreads } from "@/lib/whatsapp/data";

export type ChatMsg = { id: number; customerId: string; from: "customer" | "agent" | "owner" | "system"; text: string; at: string; automation?: string };
export type TraceItem = { id: number; agent?: AgentRole; tool: string; label: string; detail: string; status: TraceStatus; at: string };
export type ComplianceState = { status: ComplianceStatus; prepared?: string[]; missing?: string[] };

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
  engine: "mock" | "grok" | null;
  unseen: Partial<Record<Tab, number>>;
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
  | { type: "busy"; busy: boolean; engine?: "mock" | "grok" }
  | { type: "event"; event: AgentEvent; chat: string }
  | { type: "reset" };

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
      return { ...initialState(), tab: s.tab, engine: s.engine };
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
      }
      return s;
    }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const delayFor = (e: AgentEvent) => (e.type === "reply" ? 900 : e.type === "trace" ? 550 : 380);

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
};

const StoreCtx = createContext<Ctx | null>(null);

export function MetaxyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  /** Call the agent and replay its events with small delays so the owner can follow along. */
  const play = useCallback(async (body: unknown, chat: string) => {
    dispatch({ type: "busy", busy: true });
    try {
      const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json()) as AgentResponse;
      dispatch({ type: "busy", busy: true, engine: data.engine });
      for (const event of data.events) {
        await sleep(delayFor(event));
        dispatch({ type: "event", event, chat });
      }
    } catch (err) {
      dispatch({ type: "event", event: { type: "trace", tool: "error", label: "Agent unreachable", detail: String(err), status: "block" }, chat });
    } finally {
      dispatch({ type: "busy", busy: false });
    }
  }, []);

  const enabledAutomations = () =>
    Object.entries(stateRef.current.automations)
      .filter(([, on]) => on)
      .map(([id]) => id);

  const value = useMemo<Ctx>(
    () => ({
      state,
      setTab: (tab) => dispatch({ type: "tab", tab }),
      reset: () => dispatch({ type: "reset" }),
      openChat: (customerId) => dispatch({ type: "open_chat", customerId }),
      togglePause: (customerId) => dispatch({ type: "toggle_pause", customerId }),
      toggleAutomation: (id) => dispatch({ type: "toggle_automation", id }),
      setComplianceStatus: (id, status) => dispatch({ type: "compliance_set", id, status }),
      sendOwnerMessage: (text) => dispatch({ type: "owner_says", text }),
      sendCustomerMessage: async (text, customerIdOverride) => {
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
          },
          chat,
        );
      },
      checkCollisions: async () => {
        const s = stateRef.current;
        await play({ kind: "check_collisions", projects: s.projects, school: s.school }, s.activeChat);
      },
      chaseOverdue: async () => {
        const s = stateRef.current;
        await play({ kind: "chase_overdue", invoices: s.invoices }, s.activeChat);
      },
      toggleExamMode: async () => {
        const s = stateRef.current;
        const next = !s.examMode;
        dispatch({ type: "set_exam_mode", active: next });
        await play({ kind: "toggle_exam_mode", active: next, projects: s.projects }, s.activeChat);
      },
      runAutomations: async () => {
        const s = stateRef.current;
        await play({ kind: "run_automations", enabled: enabledAutomations(), projects: s.projects, invoices: s.invoices }, s.activeChat);
      },
      prepareCompliance: async (taskId) => {
        dispatch({ type: "preparing", id: taskId });
        const s = stateRef.current;
        const docs = currentVault((id) => s.compliance[id]?.status === "done");
        await play({ kind: "compliance_prepare", taskId, vault: docs }, s.activeChat);
        dispatch({ type: "preparing", id: null });
      },
      decide: async (approvalId, decision) => {
        const s = stateRef.current;
        const approval = s.approvals.find((a) => a.id === approvalId);
        if (!approval) return;
        const project = s.projects.find((p) => p.id === approval.targetId);
        await play({ kind: "approval", decision, approval, project }, approval.customerId ?? s.activeChat);
      },
    }),
    [state, play],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useMetaxy() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useMetaxy must be used inside MetaxyProvider");
  return ctx;
}
