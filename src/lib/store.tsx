"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from "react";
import { initialCustomers, newCustomer } from "@/lib/agent/data";
import type { AgentEvent, AgentResponse, Approval, ComplianceNudge, ComplianceStatus, Customer, Order, Tab, TraceStatus } from "@/lib/agent/types";
import { complianceTasks, currentVault } from "@/lib/compliance/data";
import { defaultAutomations, seedOrders, seedThreads } from "@/lib/whatsapp/data";

export type ChatMsg = { id: number; customerId: string; from: "customer" | "agent" | "owner" | "system"; text: string; at: string; automation?: string };
export type TraceItem = { id: number; tool: string; label: string; detail: string; status: TraceStatus; at: string };
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
  orders: Order[];
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
  orders: [...seedOrders],
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
  | { type: "customer_says"; text: string }
  | { type: "owner_says"; text: string }
  | { type: "open_chat"; customerId: string }
  | { type: "toggle_pause"; customerId: string }
  | { type: "toggle_automation"; id: string }
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
    case "customer_says":
      return addMsg(s, { customerId: s.activeChat, from: "customer", text: a.text });
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
    case "compliance_set":
      return { ...s, compliance: { ...s.compliance, [a.id]: { ...s.compliance[a.id], status: a.status } } };
    case "reset":
      return { ...initialState(), tab: s.tab, engine: s.engine };
    case "event": {
      const e = a.event;
      switch (e.type) {
        case "trace":
          return { ...s, trace: [...s.trace, { id: seq++, tool: e.tool, label: e.label, detail: e.detail, status: e.status, at: now() }] };
        case "reply": {
          const next = addMsg(s, { customerId: e.customerId ?? a.chat, from: "agent", text: e.text, automation: e.automation });
          return e.automation ? { ...next, unseen: bump(s, "whatsapp") } : next;
        }
        case "order":
          return { ...s, orders: [e.order, ...s.orders], unseen: bump(s, "operations") };
        case "order_status":
          return { ...s, orders: s.orders.map((o) => (o.id === e.orderId ? { ...o, status: e.status, payment: e.payment } : o)) };
        case "approval":
          return { ...s, approvals: [e.approval, ...s.approvals] };
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
const delayFor = (e: AgentEvent) => (e.type === "reply" ? 1100 : e.type === "trace" ? 650 : 450);

type Ctx = {
  state: State;
  setTab: (t: Tab) => void;
  sendCustomerMessage: (text: string) => Promise<void>;
  sendOwnerMessage: (text: string) => void;
  openChat: (customerId: string) => void;
  togglePause: (customerId: string) => void;
  toggleAutomation: (id: string) => void;
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
      sendCustomerMessage: async (text) => {
        const s = stateRef.current;
        const chat = s.activeChat;
        dispatch({ type: "customer_says", text });
        if (s.paused[chat]) {
          dispatch({
            type: "event",
            chat,
            event: { type: "trace", tool: "agent_paused", label: "Agent paused", detail: "You're handling this chat — the agent won't reply", status: "warn" },
          });
          return;
        }
        await play({ kind: "customer_message", text, customerId: chat, orders: s.orders.filter((o) => o.customerId === chat), enabled: enabledAutomations() }, chat);
      },
      runAutomations: async () => {
        await play({ kind: "run_automations", enabled: enabledAutomations(), orders: stateRef.current.orders }, stateRef.current.activeChat);
      },
      prepareCompliance: async (taskId) => {
        dispatch({ type: "preparing", id: taskId });
        const s = stateRef.current;
        const docs = currentVault((id) => s.compliance[id]?.status === "done");
        await play({ kind: "compliance_prepare", taskId, vault: docs }, s.activeChat);
        dispatch({ type: "preparing", id: null });
      },
      decide: async (approvalId, decision) => {
        const approval = stateRef.current.approvals.find((a) => a.id === approvalId);
        const order = stateRef.current.orders.find((o) => o.id === approval?.orderId);
        if (!approval || !order) return;
        await play({ kind: "approval", decision, approvalId, order }, order.customerId);
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
