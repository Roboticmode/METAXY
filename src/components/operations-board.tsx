"use client";

import { CalendarClock, Check, CircleAlert, GraduationCap, Receipt, ShieldAlert, Sparkles, X } from "lucide-react";
import { business, policies } from "@/lib/agent/data";
import { detectCollisions, formatDate, rand } from "@/lib/agent/tools";
import type { Invoice, Project } from "@/lib/agent/types";
import { useMetaxy } from "@/lib/store";
import { Badge, Btn, MonoLabel, Panel, cn } from "@/components/ui";
import { ThinkingOrb } from "@/components/ui/thinking-orbs";

const projectTone: Record<Project["status"], "ok" | "warn" | "block" | "info" | "neutral"> = {
  scoping: "neutral",
  awaiting_deposit: "info",
  awaiting_approval: "warn",
  in_progress: "ok",
  delivered: "neutral",
  declined: "block",
};

const invoiceTone: Record<Invoice["status"], "ok" | "warn" | "block" | "info" | "neutral"> = {
  paid: "ok",
  due_soon: "neutral",
  deposit_pending: "info",
  overdue: "block",
};

export function OperationsBoard() {
  const { state, decide, setTab, checkCollisions, chaseOverdue, toggleExamMode } = useMetaxy();
  const pending = state.approvals.filter((a) => a.status === "pending");
  const collisions = detectCollisions(state.projects, state.school);
  const overdueCount = state.invoices.filter((i) => i.status === "overdue").length;

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-3 overflow-y-auto overscroll-contain p-3 pb-24 md:gap-4 md:p-4 md:pb-24 xl:grid-cols-5">
      <div className="min-w-0 space-y-3 md:space-y-4 xl:col-span-3">
        <div id="ops-triggers" className="flex scroll-mt-4 flex-wrap items-center justify-between gap-2 rounded border border-border bg-secondary/40 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <MonoLabel className="text-muted-foreground">Agent triggers</MonoLabel>
            {collisions.length ? <Badge tone="block">{collisions.length} calendar collision</Badge> : <Badge tone="ok">Calendar clear</Badge>}
            {overdueCount ? <Badge tone="warn">{overdueCount} overdue</Badge> : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Btn disabled={state.busy} onClick={() => void checkCollisions()}>
              <CalendarClock className="size-3" /> Check collisions (Planner)
            </Btn>
            <Btn disabled={state.busy} onClick={() => void chaseOverdue()}>
              <Receipt className="size-3" /> Chase overdue (Books)
            </Btn>
            <Btn variant={state.examMode ? "accent" : "default"} disabled={state.busy} onClick={() => void toggleExamMode()}>
              <GraduationCap className="size-3" /> Exam Mode: {state.examMode ? "ON" : "OFF"}
            </Btn>
          </div>
        </div>

        {state.nudges.length ? (
          <div id="ops-nudge" className="scroll-mt-4 rounded border border-accent/40 bg-accent/10 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              <h3 className="text-xs font-bold uppercase">{state.nudges[0].title}</h3>
              <Badge tone="ok">Compliance</Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed">{state.nudges[0].detail}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Btn variant="accent" onClick={() => setTab("compliance")}>
                Open checklist
              </Btn>
              <MonoLabel className="text-muted-foreground">{state.nudges[0].source}</MonoLabel>
            </div>
          </div>
        ) : null}

        <Panel
          id="ops-approvals"
          title="Approval queue"
          code="OPS-01"
          right={pending.length ? <Badge tone="warn">{pending.length} waiting</Badge> : <Badge>clear</Badge>}
        >
          {state.approvals.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nothing needs your decision yet. Simulate a WhatsApp enquiry, run <span className="font-semibold text-foreground">Check collisions</span>, or click{" "}
              <span className="font-semibold text-foreground">Chase overdue</span> above — drafts always pause here first.
            </p>
          ) : (
            <div className="space-y-2">
              {state.approvals.map((a) => (
                <div key={a.id} className={cn("rounded border p-3", a.status === "pending" ? "border-[var(--warning)]/50 bg-[var(--warning)]/5" : "border-border bg-secondary/40")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-bold">{a.title}</span>
                          <Badge tone="info">{a.agent}</Badge>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{a.detail}</div>
                      </div>
                    </div>
                    <Badge tone={a.status === "pending" ? "warn" : a.status === "allowed" ? "ok" : "block"}>{a.status}</Badge>
                  </div>
                  {a.draftMessage ? (
                    <div className="mt-2 rounded border border-border bg-card px-2.5 py-2 text-[11px] leading-relaxed">
                      <MonoLabel className="mb-0.5 block text-muted-foreground">Draft WhatsApp message</MonoLabel>
                      <span>&ldquo;{a.draftMessage}&rdquo;</span>
                    </div>
                  ) : null}
                  <div className="mt-2 font-mono text-[10px] break-words text-muted-foreground">{a.policy}</div>
                  {a.status === "pending" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Btn variant="accent" disabled={state.busy} onClick={() => void decide(a.id, "allow")}>
                        <Check className="size-3" /> Approve &amp; send
                      </Btn>
                      <Btn variant="destructive" disabled={state.busy} onClick={() => void decide(a.id, "refuse")}>
                        <X className="size-3" /> Hold
                      </Btn>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          id="ops-calendar"
          title="Shared commitment & university calendar"
          code="OPS-00"
          right={<Badge tone={collisions.length ? "block" : "ok"}>{collisions.length ? `${collisions.length} conflict` : "in sync"}</Badge>}
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[...state.school]
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 6)
              .map((s) => {
                const hit = collisions.find((c) => c.school.date === s.date);
                return (
                  <div key={s.id} className={cn("rounded border p-2 text-xs", hit ? "border-destructive/50 bg-destructive/5" : "border-border")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold text-muted-foreground">{formatDate(s.date)}</span>
                      <Badge tone={hit ? "block" : s.fixed ? "info" : "neutral"}>{hit ? "COLLISION" : s.kind}</Badge>
                    </div>
                    <div className="mt-1 font-semibold">{s.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {s.module} · {s.hours}h {s.fixed ? "fixed" : "flexible"}
                      {hit ? ` · overlaps ${hit.project.id}` : ""}
                    </div>
                  </div>
                );
              })}
          </div>
        </Panel>

        <Panel id="ops-orders" title="Projects, scope & invoices" code="OPS-02">
          <div className="space-y-3">
            <div className="space-y-2">
              {state.projects.map((p) => (
                <div key={p.id} className="rounded border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-xs font-bold">{p.id}</span>
                      <span className="min-w-0 truncate text-xs font-semibold">{p.customerName}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {p.scopeFlag ? <Badge tone="warn">{p.scopeFlag}</Badge> : null}
                      <Badge tone={projectTone[p.status]}>{p.status.replace("_", " ")}</Badge>
                    </div>
                  </div>
                  <div className="mt-1 text-xs font-medium">{p.title}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {p.deliverables.map((d) => (
                      <span key={d} className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border pt-2">
                    <div>
                      <MonoLabel className="text-muted-foreground">Target</MonoLabel>
                      <div className="text-xs font-semibold">{p.dueDate ? formatDate(p.dueDate) : "TBC"}</div>
                    </div>
                    <div>
                      <MonoLabel className="text-muted-foreground">Value</MonoLabel>
                      <div className="font-mono text-xs font-bold">{rand(p.total)}</div>
                    </div>
                    <div>
                      <MonoLabel className="text-muted-foreground">Payment</MonoLabel>
                      <div className={cn("text-xs font-semibold break-words", p.payment.includes("OVERDUE") ? "text-destructive" : "")}>{p.payment}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3">
              <MonoLabel className="mb-2 block text-muted-foreground">Invoice ledger (Books)</MonoLabel>
              <div id="ops-invoices" className="scroll-mt-4 divide-y divide-border rounded border border-border">
                {state.invoices.map((inv) => (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-3 py-2 text-xs">
                    <div className="min-w-0 break-words">
                      <span className="font-mono font-bold">{inv.id}</span> · <span className="text-muted-foreground">{inv.customerName}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono font-semibold">{rand(inv.amount)}</span>
                      <Badge tone={invoiceTone[inv.status]}>{inv.status === "overdue" ? `${inv.daysOverdue}d overdue` : inv.status.replace("_", " ")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="min-w-0 space-y-3 md:space-y-4 xl:col-span-2">
        <Panel
          id="ops-activity"
          title="Agent activity"
          code="AGENT"
          right={
            state.busy ? (
              <span className="inline-flex items-center gap-1.5">
                <ThinkingOrb state={state.preparing ? "shaping" : "searching"} size={20} theme="light" color="#10b981" aria-hidden />
                <Badge tone="info">working</Badge>
              </span>
            ) : (
              <Badge>idle</Badge>
            )
          }
        >
          {state.trace.length === 0 ? (
            <p className="text-xs text-muted-foreground">Every tool call by Client Desk, Books, and Planner shows up here so you can verify it.</p>
          ) : (
            <ol className="space-y-2">
              {state.trace.map((t) => (
                <li key={t.id} className="flex gap-2">
                  <CircleAlert
                    className={cn("mt-0.5 size-3.5 shrink-0", t.status === "ok" ? "text-accent" : t.status === "warn" ? "text-[var(--warning)]" : "text-destructive")}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {t.agent ? <Badge tone="neutral">{t.agent}</Badge> : null}
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

        <Panel id="ops-policies" title={`Agent brief · ${business.name}`} code="POLICY">
          <ul className="space-y-1.5">
            {policies.map((p) => (
              <li key={p.code} className="flex gap-2 text-[11px] leading-snug">
                <MonoLabel className="mt-0.5 shrink-0 whitespace-nowrap text-accent">{p.code}</MonoLabel>
                <span>{p.rule}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
