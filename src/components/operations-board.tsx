"use client";

import { Check, CircleAlert, ShieldAlert, Sparkles, X } from "lucide-react";
import { business, policies } from "@/lib/agent/data";
import { formatDate, rand } from "@/lib/agent/tools";
import { useMetexi } from "@/lib/store";
import { Badge, Btn, MonoLabel, Panel, cn } from "@/components/ui";
import type { Order } from "@/lib/agent/types";

const statusTone: Record<Order["status"], "ok" | "warn" | "block" | "info" | "neutral"> = {
  draft: "neutral",
  awaiting_deposit: "info",
  awaiting_approval: "warn",
  confirmed: "ok",
  declined: "block",
};

export function OperationsBoard() {
  const { state, decide, setTab } = useMetexi();
  const pending = state.approvals.filter((a) => a.status === "pending");

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 xl:grid-cols-5">
      <div className="space-y-4 xl:col-span-3">
        {state.nudges.length ? (
          <div className="rounded border border-accent/40 bg-accent/10 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              <h3 className="text-xs font-bold uppercase">{state.nudges[0].title}</h3>
              <Badge tone="ok">Compliance</Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed">{state.nudges[0].detail}</p>
            <div className="mt-2 flex items-center gap-3">
              <Btn variant="accent" onClick={() => setTab("compliance")}>
                Open checklist
              </Btn>
              <MonoLabel className="text-muted-foreground">{state.nudges[0].source}</MonoLabel>
            </div>
          </div>
        ) : null}

        <Panel
          title="Approval queue"
          code="OPS-01"
          right={pending.length ? <Badge tone="warn">{pending.length} pending</Badge> : <Badge>clear</Badge>}
        >
          {state.approvals.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nothing needs your decision. The agent will ask when a customer goes against your policies.</p>
          ) : (
            <div className="space-y-2">
              {state.approvals.map((a) => (
                <div key={a.id} className={cn("rounded border p-3", a.status === "pending" ? "border-[var(--warning)]/50 bg-[var(--warning)]/5" : "border-border bg-secondary/40")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="size-4 text-[var(--warning)]" />
                      <div>
                        <div className="text-xs font-bold">{a.title}</div>
                        <div className="text-xs text-muted-foreground">{a.detail}</div>
                      </div>
                    </div>
                    <Badge tone={a.status === "pending" ? "warn" : a.status === "allowed" ? "ok" : "block"}>{a.status}</Badge>
                  </div>
                  <div className="mt-2 font-mono text-[10px] text-muted-foreground">Policy: {a.policy}</div>
                  {a.status === "pending" ? (
                    <div className="mt-3 flex gap-2">
                      <Btn variant="accent" disabled={state.busy} onClick={() => void decide(a.id, "allow")}>
                        <Check className="size-3" /> Allow once
                      </Btn>
                      <Btn variant="destructive" disabled={state.busy} onClick={() => void decide(a.id, "refuse")}>
                        <X className="size-3" /> Refuse
                      </Btn>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Order & payment surface" code="OPS-02">
          {state.orders.length === 0 ? (
            <p className="text-xs text-muted-foreground">No live orders. Send a customer message to watch the agent build one.</p>
          ) : (
            <div className="space-y-2">
              {state.orders.map((o) => (
                <div key={o.id} className="rounded border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">{o.id}</span>
                      <span className="text-xs">{o.customerName}</span>
                    </div>
                    <Badge tone={statusTone[o.status]}>{o.status.replace("_", " ")}</Badge>
                  </div>
                  <ul className="mt-2 space-y-0.5 text-xs">
                    {o.items.map((i) => (
                      <li key={i.name} className="flex justify-between">
                        <span>
                          {i.qty} × {i.name}
                        </span>
                        <span className="font-mono">{rand(i.qty * i.unit)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border pt-2">
                    <div>
                      <MonoLabel className="text-muted-foreground">Delivery</MonoLabel>
                      <div className="text-xs font-semibold">{o.date ? formatDate(o.date) : "TBC"}</div>
                    </div>
                    <div>
                      <MonoLabel className="text-muted-foreground">Total</MonoLabel>
                      <div className="font-mono text-xs font-bold">{rand(o.total)}</div>
                    </div>
                    <div>
                      <MonoLabel className="text-muted-foreground">Payment</MonoLabel>
                      <div className={cn("text-xs font-semibold", o.payment.includes("BLOCKED") ? "text-destructive" : "")}>{o.payment}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="space-y-4 xl:col-span-2">
        <Panel title="Agent activity" code="AGENT" right={state.busy ? <Badge tone="info">working</Badge> : <Badge>idle</Badge>}>
          {state.trace.length === 0 ? (
            <p className="text-xs text-muted-foreground">Every tool call the agent makes shows up here so you can verify it.</p>
          ) : (
            <ol className="space-y-2">
              {state.trace.map((t) => (
                <li key={t.id} className="flex gap-2">
                  <CircleAlert
                    className={cn("mt-0.5 size-3.5 shrink-0", t.status === "ok" ? "text-accent" : t.status === "warn" ? "text-[var(--warning)]" : "text-destructive")}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{t.label}</span>
                      <MonoLabel className="text-muted-foreground">{t.tool}</MonoLabel>
                    </div>
                    <div className="text-[11px] leading-snug text-muted-foreground">{t.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title={`Agent brief · ${business.name}`} code="POLICY">
          <ul className="space-y-1.5">
            {policies.map((p) => (
              <li key={p.code} className="flex gap-2 text-[11px] leading-snug">
                <MonoLabel className="mt-0.5 text-accent">{p.code}</MonoLabel>
                <span>{p.rule}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
