"use client";

import { ArrowUpRight, CalendarClock, Check, GraduationCap, Receipt, ShieldAlert, Sparkles, X } from "lucide-react";
import { business, policies } from "@/lib/agent/data";
import { detectCollisions, formatDate, rand } from "@/lib/agent/tools";
import type { Approval, Invoice, Project } from "@/lib/agent/types";
import { useMetaxy } from "@/lib/store";
import { AgentOrb, orbStateForTool } from "@/components/agent-orb";
import { Badge, Btn, MonoLabel, Panel, boardGrid, cn } from "@/components/ui";

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

const approvalStatus: Record<Approval["status"], { label: string; tone: "warn" | "ok" | "block" }> = {
  pending: { label: "Waiting for you", tone: "warn" },
  allowed: { label: "Approved", tone: "ok" },
  refused: { label: "Held", tone: "block" },
};

const sentence = (s: string) => {
  const t = s.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};




export function OperationsBoard() {
  const { state, decide, setTab, checkCollisions, chaseOverdue, toggleExamMode } = useMetaxy();
  const pending = state.approvals.filter((a) => a.status === "pending");
  const collisions = detectCollisions(state.projects, state.school);
  const lastTool = state.trace.length ? state.trace[state.trace.length - 1].tool : null;

  return (
    <div className={boardGrid}>
      <TodayStrip className="min-[1400px]:col-span-5" />

      <div className="min-w-0 space-y-4 min-[1400px]:col-span-3 xl:space-y-5">
        <div id="ops-triggers" className="flex scroll-mt-4 flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl">
          <MonoLabel className="text-muted-foreground">Ask the agents</MonoLabel>
          <div className="flex flex-wrap items-center gap-2">
            <Btn disabled={state.busy} onClick={() => void checkCollisions()}>
              <CalendarClock /> Check collisions <span className="text-muted-foreground">· Planner</span>
            </Btn>
            <Btn disabled={state.busy} onClick={() => void chaseOverdue()}>
              <Receipt /> Chase overdue <span className="text-muted-foreground">· Books</span>
            </Btn>
            <Btn variant={state.examMode ? "accent" : "default"} aria-pressed={state.examMode} disabled={state.busy} onClick={() => void toggleExamMode()}>
              <GraduationCap /> Exam mode {state.examMode ? "on" : "off"}
            </Btn>
          </div>
        </div>

        {state.nudges.length ? (
          <div id="ops-nudge" className="scroll-mt-4 rounded-2xl border border-accent/30 bg-accent/[0.07] p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="size-4 text-accent-ink" />
              <MonoLabel className="text-accent-ink">Compliance · agent suggestion</MonoLabel>
            </div>
            <h3 className="mt-2 text-[17px] leading-snug font-medium tracking-[-0.02em]">{state.nudges[0].title}</h3>
            <p className="mt-1 max-w-[62ch] text-[14px] leading-relaxed text-ink-3">{state.nudges[0].detail}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Btn variant="accent" onClick={() => setTab("compliance")}>
                Open checklist <ArrowUpRight />
              </Btn>
              <span className="text-[12.5px] text-muted-foreground">{state.nudges[0].source}</span>
            </div>
          </div>
        ) : null}

        <Panel
          id="ops-approvals"
          tone="hero"
          title="Decisions waiting for you"
          code="OPS-01 · Approval queue"
          right={pending.length ? <Badge tone="warn">{pending.length} waiting</Badge> : <Badge tone="ok">All clear</Badge>}
        >
          {state.approvals.length === 0 ? (
            <p className="max-w-[60ch] text-[14.5px] leading-relaxed text-muted-foreground">
              Nothing needs your decision yet. Simulate a WhatsApp enquiry, run <span className="font-medium text-foreground">Check collisions</span>, or{" "}
              <span className="font-medium text-foreground">Chase overdue</span> above. Drafts always pause here first.
            </p>
          ) : (
            <div className="space-y-3">
              {state.approvals.map((a) => (
                <ApprovalCard key={a.id} a={a} busy={state.busy} onDecide={(d) => void decide(a.id, d)} />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          id="ops-calendar"
          title="University & studio calendar"
          code="OPS-00 · Shared commitments"
          right={<Badge tone={collisions.length ? "block" : "ok"}>{collisions.length ? `${collisions.length} conflict${collisions.length === 1 ? "" : "s"}` : "In sync"}</Badge>}
        >
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[...state.school]
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 6)
              .map((s) => {
                const hit = collisions.find((c) => c.school.date === s.date);
                return (
                  <div key={s.id} className={cn("rounded-xl border p-3.5", hit ? "border-destructive/30 bg-destructive/[0.05]" : "border-hairline bg-paper/50")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-medium text-muted-foreground">{formatDate(s.date)}</span>
                      <Badge tone={hit ? "block" : s.fixed ? "info" : "neutral"}>{hit ? "Collision" : sentence(s.kind)}</Badge>
                    </div>
                    <div className="mt-1.5 text-[14.5px] leading-snug font-medium">{s.title}</div>
                    <div className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                      {s.module} · {s.hours}h {s.fixed ? "fixed" : "flexible"}
                      {hit ? ` · overlaps ${hit.project.id}` : ""}
                    </div>
                  </div>
                );
              })}
          </div>
        </Panel>

        <Panel id="ops-orders" title="Projects, scope & invoices" code="OPS-02">
          <div className="space-y-5">
            <div className="space-y-2.5">
              {state.projects.map((p) => (
                <div key={p.id} className="rounded-xl border border-hairline p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span className="font-mono text-[11.5px] text-muted-foreground">{p.id}</span>
                        <span className="min-w-0 truncate text-[13px] text-muted-foreground">{p.customerName}</span>
                      </div>
                      <div className="mt-0.5 text-[15px] leading-snug font-medium tracking-[-0.01em]">{p.title}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {p.scopeFlag ? <Badge tone="warn">{p.scopeFlag}</Badge> : null}
                      <Badge tone={projectTone[p.status]}>{sentence(p.status)}</Badge>
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {p.deliverables.map((d) => (
                      <span key={d} className="rounded-full bg-paper-2 px-2.5 py-0.5 text-[12.5px] text-ink-3">
                        {d}
                      </span>
                    ))}
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-hairline pt-3">
                    <div>
                      <dt className="text-[12px] text-muted-foreground">Target</dt>
                      <dd className="text-[14px] font-medium">{p.dueDate ? formatDate(p.dueDate) : "TBC"}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-muted-foreground">Value</dt>
                      <dd className="text-[14px] font-medium tabular-nums">{rand(p.total)}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-muted-foreground">Payment</dt>
                      <dd className={cn("text-[14px] font-medium break-words", p.payment.includes("OVERDUE") ? "text-destructive-ink" : "")}>{p.payment}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>

            <div>
              <MonoLabel className="mb-2 block text-muted-foreground">Invoice ledger · Books</MonoLabel>
              <div id="ops-invoices" className="scroll-mt-4 divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
                {state.invoices.map((inv) => (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 text-[14px]">
                    <div className="min-w-0 break-words">
                      <span className="font-mono text-[12px] text-muted-foreground">{inv.id}</span> <span className="ml-1">{inv.customerName}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="font-medium tabular-nums">{rand(inv.amount)}</span>
                      <Badge tone={invoiceTone[inv.status]}>{inv.status === "overdue" ? `${inv.daysOverdue}d overdue` : sentence(inv.status)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="min-w-0 space-y-4 min-[1400px]:col-span-2 xl:space-y-5">
        <Panel
          id="ops-activity"
          title="Agent activity"
          code="AGENT · Live trace"
          right={
            state.busy ? (
              <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-accent/12 pr-2.5 pl-1 text-[12px] font-medium text-accent-ink" role="status">
                <AgentOrb state={orbStateForTool(lastTool)} /> Working
              </span>
            ) : (
              <Badge>Idle</Badge>
            )
          }
        >
          {state.trace.length === 0 ? (
            <p className="text-[14px] leading-relaxed text-muted-foreground">Every tool call by Client Desk, Books and Planner shows up here, so you can verify it.</p>
          ) : (
            <ol className="relative space-y-3.5 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-hairline">
              {state.trace.map((t) => (
                <li key={t.id} className="relative flex gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-card",
                      t.status === "ok" ? "bg-accent" : t.status === "warn" ? "bg-[var(--warning)]" : "bg-destructive",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      {t.agent ? <span className="text-[12.5px] font-medium text-accent-ink">{t.agent}</span> : null}
                      <span className="text-[14px] leading-snug font-medium">{t.label}</span>
                    </div>
                    <div className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{t.detail}</div>
                    <span className="mt-1 inline-block font-mono text-[11px] text-muted-foreground/90">{t.tool}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel id="ops-policies" tone="quiet" title={`Agent brief · ${business.name}`} code="POLICY">
          <ul className="space-y-2.5">
            {policies.map((p) => (
              <li key={p.code} className="flex gap-3 text-[13.5px] leading-snug text-ink-3">
                <span className="mt-px shrink-0 font-mono text-[11.5px] whitespace-nowrap text-accent-ink">{p.code}</span>
                <span>{p.rule}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function ApprovalCard({ a, busy, onDecide }: { a: Approval; busy: boolean; onDecide: (d: "allow" | "refuse") => void }) {
  const pending = a.status === "pending";
  const st = approvalStatus[a.status];
  return (
    <article className={cn("rounded-xl border p-4 sm:p-5", pending ? "border-[var(--warning)]/35 bg-[oklch(0.985_0.014_80)]" : "border-hairline bg-paper/60")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
          <ShieldAlert className={cn("size-4 shrink-0", pending ? "text-warning-ink" : "text-muted-foreground")} />
          <span className="truncate">
            <span className="font-medium text-foreground">{a.agent}</span> {pending ? "needs your OK" : "asked"}
          </span>
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>
      <h4 className={cn("mt-2 leading-snug font-medium tracking-[-0.02em] text-pretty", pending ? "text-[18px] sm:text-[20px]" : "text-[16px]")}>{a.title}</h4>
      <p className="mt-1 max-w-[64ch] text-[14px] leading-relaxed text-ink-3">{a.detail}</p>
      {a.draftMessage ? (
        <figure className="mt-4 rounded-2xl rounded-tl-md border border-[#25D366]/20 bg-[#e7f8e2] px-4 py-3">
          <figcaption className="mb-1 text-[12px] font-medium text-[#0d6b3a]">Draft WhatsApp message</figcaption>
          <blockquote className="text-[14.5px] leading-relaxed text-ink">&ldquo;{a.draftMessage}&rdquo;</blockquote>
        </figure>
      ) : null}
      <p className="mt-3 text-[12.5px] leading-snug break-words text-muted-foreground">
        <span className="font-mono text-[11px]">Policy</span> · {a.policy}
      </p>
      {pending ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Btn variant="accent" disabled={busy} onClick={() => onDecide("allow")} className="min-h-11 px-5 text-[14.5px]">
            <Check /> Approve &amp; send
          </Btn>
          <Btn variant="destructive" disabled={busy} onClick={() => onDecide("refuse")} className="min-h-11 px-5 text-[14.5px]">
            <X /> Hold
          </Btn>
        </div>
      ) : null}
    </article>
  );
}

/** The day at a glance, in the landing's Outcomes-tile language: big numerals on an ink band. */
function TodayStrip({ className }: { className?: string }) {
  const { state, focusAnchor } = useMetaxy();
  const pending = state.approvals.filter((a) => a.status === "pending").length;
  const handoffs = Object.keys(state.handoffs).length;
  const needsYou = pending + handoffs;
  const collisions = detectCollisions(state.projects, state.school).length;
  const overdue = state.invoices.filter((i) => i.status === "overdue");
  const sum = (xs: Invoice[]) => xs.reduce((n, i) => n + i.amount, 0);
  // Deposits: invoiced ones, plus quoted projects still waiting on a deposit that has no invoice yet.
  const depositInvoices = state.invoices.filter((i) => i.status === "deposit_pending");
  const quotedDeposits = state.projects.filter((p) => p.status === "awaiting_deposit" && !depositInvoices.some((i) => i.projectId === p.id));
  const deposits = { length: depositInvoices.length + quotedDeposits.length, total: sum(depositInvoices) + quotedDeposits.reduce((n, p) => n + p.deposit, 0) };

  const tiles = [
    {
      key: "needs",
      value: needsYou,
      label: needsYou === 1 ? "decision needs you" : "decisions need you",
      hint: handoffs ? `${pending} approval${pending === 1 ? "" : "s"} · ${handoffs} hand-off${handoffs === 1 ? "" : "s"}` : "Approvals & hand-offs",
      anchor: "ops-approvals",
      hot: needsYou > 0,
    },
    { key: "coll", value: collisions, label: collisions === 1 ? "calendar collision" : "calendar collisions", hint: "Study vs. client deadlines", anchor: "ops-calendar", hot: collisions > 0 },
    { key: "over", value: overdue.length, label: "overdue invoices", hint: overdue.length ? `${rand(sum(overdue))} outstanding` : "Nothing outstanding", anchor: "ops-invoices", hot: overdue.length > 0 },
    { key: "dep", value: deposits.length, label: deposits.length === 1 ? "deposit pending" : "deposits pending", hint: deposits.length ? `${rand(deposits.total)} to book work` : "All deposits in", anchor: "ops-orders", hot: false },
  ];

  const headline = needsYou ? `${needsYou} ${needsYou === 1 ? "thing needs" : "things need"} your call.` : "All clear. The agents are on it.";

  return (
    <section aria-labelledby="today-title" id="ops-today" className={cn("metaxy-ink metaxy-grain scroll-mt-4 overflow-clip rounded-2xl bg-ink text-paper shadow-lift", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-5 pt-5 sm:px-6 sm:pt-6">
        <div>
          <p className="flex items-center gap-3 font-mono text-[11px] font-medium tracking-[0.14em] uppercase text-paper/65">
            <span className="text-accent">Today</span>
            <span aria-hidden className="h-px w-8 bg-current opacity-40" />
            <span>{business.name}</span>
          </p>
          <h2 id="today-title" className="mt-2 text-[clamp(1.4rem,2.4vw,2rem)] leading-tight font-medium tracking-[-0.035em] text-balance">
            {headline}
          </h2>
        </div>
        <p className="flex items-center gap-2 pb-1 text-[13px] text-paper/65" aria-live="polite">
          {state.busy ? (
            <>
              <AgentOrb theme="dark" state={orbStateForTool(state.trace[state.trace.length - 1]?.tool)} /> Agents working
            </>
          ) : (
            <>
              <span aria-hidden className="size-2 rounded-full bg-accent" /> Agents standing by
            </>
          )}
        </p>
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 lg:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.key} className="bg-ink">
            <button
              type="button"
              onClick={() => void focusAnchor(t.anchor)}
              className="group flex h-full w-full cursor-pointer flex-col gap-3 p-5 text-left transition-colors hover:bg-white/[0.04] sm:p-6"
            >
              <span className={cn("order-1 block text-[clamp(2.4rem,4.4vw,3.5rem)] leading-none font-medium tracking-[-0.05em] tabular-nums", t.hot ? "text-paper" : "text-paper/55")}>
                {t.value}
              </span>
              <span className="order-2 block">
                <span className="block text-[14.5px] leading-snug text-paper/85">{t.label}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[12.5px] text-paper/55">
                  {t.hint}
                  <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
