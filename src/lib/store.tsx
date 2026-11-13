"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from "react";
import { initialCustomers, newCustomer } from "@/lib/agent/data";
import type { AgentEvent, AgentResponse, Approval, ComplianceNudge, Customer, Order, Tab, TraceStatus } from "@/lib/agent/types";

export type ChatMsg = { id: number; from: "customer" | "agent" | "system"; text: string; at: string };
export type TraceItem = { id: number; tool: string; label: string; detail: string; status: TraceStatus; at: string };

type State = {
  tab: Tab;
  messages: ChatMsg[];
  trace: TraceItem[];
  orders: Order[];
  approvals: Approval[];
  customers: Customer[];
  nudges: ComplianceNudge[];
  busy: boolean;
  engine: "mock" | "grok" | null;
  unseen: Partial<Record<Tab, number>>;
};

const initial: State = {
  tab: "operations",
  messages: [],
  trace: [],
  orders: [],
  approvals: [],
  customers: initialCustomers,
  nudges: [],
  busy: false,
  engine: null,
  unseen: {},
};

type Action =
  | { type: "tab"; tab: Tab }
  | { type: "customer_says"; text: string }
  | { type: "busy"; busy: boolean; engine?: "mock" | "grok" }
  | { type: "event"; event: AgentEvent }
  | { type: "reset" };

const now = () => new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
let seq = 1;

function bump(s: State, tab: Tab): State["unseen"] {
  return s.tab === tab ? s.unseen : { ...s.unseen, [tab]: (s.unseen[tab] ?? 0) + 1 };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "tab":
      return { ...s, tab: a.tab, unseen: { ...s.unseen, [a.tab]: 0 } };
    case "busy":
      return { ...s, busy: a.busy, engine: a.engine ?? s.engine };
    case "customer_says":
      return { ...s, messages: [...s.messages, { id: seq++, from: "customer", text: a.text, at: now() }] };
    case "reset":
      return { ...initial, tab: s.tab, engine: s.engine };
    case "event": {
      const e = a.event;
      switch (e.type) {
        case "trace":
          return { ...s, trace: [...s.trace, { id: seq++, tool: e.tool, label: e.label, detail: e.detail, status: e.status, at: now() }] };
        case "reply":
          return { ...s, messages: [...s.messages, { id: seq++, from: "agent", text: e.text, at: now() }] };
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
      }
    }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const delayFor = (e: AgentEvent) => (e.type === "reply" ? 1100 : e.type === "trace" ? 650 : 450);

type Ctx = {
  state: State;
  setTab: (t: Tab) => void;
  sendCustomerMessage: (text: string) => Promise<void>;
  decide: (approvalId: string, decision: "allow" | "refuse") => Promise<void>;
  reset: () => void;
};

const StoreCtx = createContext<Ctx | null>(null);

export function MetexiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  stateRef.current = state;

  const play = useCallback(async (body: unknown) => {
    dispatch({ type: "busy", busy: true });
    try {
      const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json()) as AgentResponse;
      dispatch({ type: "busy", busy: true, engine: data.engine });
      for (const event of data.events) {
        await sleep(delayFor(event));
        dispatch({ type: "event", event });
      }
    } catch (err) {
      dispatch({ type: "event", event: { type: "trace", tool: "error", label: "Agent unreachable", detail: String(err), status: "block" } });
    } finally {
      dispatch({ type: "busy", busy: false });
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      setTab: (tab) => dispatch({ type: "tab", tab }),
      reset: () => dispatch({ type: "reset" }),
      sendCustomerMessage: async (text) => {
        dispatch({ type: "customer_says", text });
        await play({ kind: "customer_message", text, customerId: newCustomer.id });
      },
      decide: async (approvalId, decision) => {
        const approval = stateRef.current.approvals.find((a) => a.id === approvalId);
        const order = stateRef.current.orders.find((o) => o.id === approval?.orderId);
        if (!approval || !order) return;
        await play({ kind: "approval", decision, approvalId, order });
      },
    }),
    [state, play],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useMetexi() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useMetexi must be used inside MetexiProvider");
  return ctx;
}
