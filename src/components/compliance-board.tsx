"use client";

import { ArrowUpRight, Check, Circle, Clock, FileCheck2, FileWarning, Lock, Minus, Sparkles } from "lucide-react";
import { TURNOVER } from "@/lib/agent/data";
import { rand } from "@/lib/agent/tools";
import type { ComplianceStatus } from "@/lib/agent/types";
import { COMPLIANCE_SOURCE, complianceTasks, currentVault, deadlines, type ComplianceTask } from "@/lib/compliance/data";
import { useMetaxy } from "@/lib/store";
import { AgentOrb } from "@/components/agent-orb";
import { Badge, Btn, MonoLabel, Panel, boardGrid, cn } from "@/components/ui";

const statusMeta: Record<ComplianceStatus, { label: string; tone: "ok" | "warn" | "info" | "neutral" }> = {
  todo: { label: "To do", tone: "neutral" },
  ready: { label: "Ready for you", tone: "warn" },
  submitted: { label: "Submitted", tone: "info" },
  done: { label: "Done", tone: "ok" },
  na: { label: "Not needed", tone: "neutral" },
};

const priorityRank = { high: 0, medium: 1, low: 2 };

export function ComplianceBoard() {
  const { state, openComplianceTask } = useMetaxy();
  const status = (id: string) => state.compliance[id]?.status ?? "todo";
  const nudged = state.nudges.length > 0;

  const applicable = complianceTasks.filter((t) => status(t.id) !== "na");
  const done = applicable.filter((t) => status(t.id) === "done").length;
  const nextUp = [...applicable].filter((t) => status(t.id) === "todo" && !blockedBy(t, status)).sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])[0];
  // The selected task lives in the store so the agent console can open a specific one.
  const selected = state.ui.complianceTask;
  // In the single-column layout (< 1400 px) the task detail sits below the checklist, so bring it into view.
  const setSelected = (id: string) => {
    openComplianceTask(id);
    if (typeof window === "undefined" || window.matchMedia("(min-width: 1400px)").matches) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => document.getElementById("comp-task")?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }));
  };
  const task = complianceTasks.find((t) => t.id === selected) ?? complianceTasks[0];

  const categories = [...new Set(complianceTasks.map((t) => t.category))];
  const pct = Math.min(100, (TURNOVER.last12 / TURNOVER.vatThreshold) * 100);
  const docs = currentVault((id) => status(id) === "done");

  return (
    <div className={boardGrid}>
      <div className="min-w-0 space-y-4 xl:space-y-5 min-[1400px]:col-span-3">
        {nudged ? (
          <div className="rounded-2xl border border-accent/30 bg-accent/[0.07] p-4 text-[14px] leading-relaxed text-ink-3 sm:p-5">
            <div className="mb-1 flex items-center gap-2">
              <Badge tone="ok">Agent suggestion</Badge>
              <span className="text-[16px] font-medium tracking-[-0.01em] text-foreground">{state.nudges[0].title}</span>
            </div>
            {state.nudges[0].detail}
            <div className="mt-2 text-[12.5px] text-muted-foreground">{state.nudges[0].source}</div>
          </div>
        ) : null}

        <Panel id="comp-checklist" title="Business legalities" code="COMP-01" right={<Badge tone="info">{done} of {applicable.length} complete</Badge>}>
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-paper-2">
            <div className="h-2 rounded-full bg-accent transition-all" style={{ width: `${(done / applicable.length) * 100}%` }} />
          </div>
          {nextUp ? (
            <p className="mb-3 text-[13px] text-muted-foreground">
              Next most important: <button className="cursor-pointer font-semibold text-foreground underline pointer-coarse:inline-flex pointer-coarse:min-h-10 pointer-coarse:items-center" onClick={() => setSelected(nextUp.id)}>{nextUp.label}</button>
            </p>
          ) : null}
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat}>
                <MonoLabel className="text-muted-foreground">{cat}</MonoLabel>
                <ul className="mt-1 divide-y divide-hairline rounded-xl border border-hairline">
                  {complianceTasks
                    .filter((t) => t.category === cat)
                    .map((t) => {
                      const st = status(t.id);
                      const blocker = st === "todo" ? blockedBy(t, status) : null;
                      const highlight = nudged && t.id === "cipc";
                      return (
                        <li key={t.id}>
                          <button
                            onClick={() => setSelected(t.id)}
                            className={cn(
                              "flex min-h-11 w-full cursor-pointer items-start gap-3 px-3 py-2 text-left transition-colors hover:bg-paper",
                              selected === t.id && "bg-paper-2",
                              highlight && selected !== t.id && "bg-accent/10",
                            )}
                          >
                            <StatusIcon status={st} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 text-[14px] font-medium">
                                {t.label}
                                {t.priority === "high" && st === "todo" ? <span className="size-1.5 rounded-full bg-[var(--warning)]" title="High priority" /> : null}
                              </div>
                              <div className="text-[13px] text-muted-foreground">{blocker ? `Waiting on: ${blocker.label}` : t.note}</div>
                            </div>
                            {blocker ? <Lock className="mt-0.5 size-3 text-muted-foreground" /> : <Badge tone={statusMeta[st].tone}>{statusMeta[st].label}</Badge>}
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] leading-snug text-muted-foreground">{COMPLIANCE_SOURCE}</p>
        </Panel>
      </div>

      <div className="min-w-0 space-y-4 xl:space-y-5 min-[1400px]:col-span-2">
        <TaskDetail task={task} docs={docs} />

        <Panel id="comp-deadlines" title="Upcoming legal dates" code="COMP-02">
          <ul className="space-y-1.5">
            {deadlines.map((d) => (
              <li key={d.what} className="flex items-start gap-2 text-[13px] leading-snug">
                <Clock className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <button className="min-w-0 flex-1 cursor-pointer text-left hover:underline pointer-coarse:min-h-10" onClick={() => setSelected(d.taskId)}>
                  {d.what}
                </button>
                <Badge tone={d.tone}>{d.when}</Badge>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel id="comp-vat" title="Turnover vs VAT threshold" code="COMP-03">
          <div className="flex flex-wrap items-end justify-between gap-x-2">
            <div className="text-[2rem] leading-none font-medium tracking-[-0.04em] tabular-nums">{rand(TURNOVER.last12)}</div>
            <MonoLabel className="text-muted-foreground">of {rand(TURNOVER.vatThreshold)} / 12 mo</MonoLabel>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-paper-2">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.max(pct, 2)}%` }} />
          </div>
          <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
            Mandatory VAT registration applies above R1 million in 12 months (voluntary from R50,000). The agent watches this so you never get caught out.
          </p>
        </Panel>

        <Panel id="comp-vault" title="Document vault" code="COMP-04" right={<Badge>{docs.length} documents</Badge>}>
          <ul className="space-y-1.5 text-[14px]">
            {docs.map((d) => (
              <li key={d} className="flex items-center justify-between gap-2 rounded-xl border border-hairline px-3 py-2">
                <span className="min-w-0 break-words">{d}</span>
                <Badge tone="ok">Stored</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function blockedBy(t: ComplianceTask, status: (id: string) => ComplianceStatus) {
  if (!t.dependsOn || status(t.dependsOn) === "done") return null;
  return complianceTasks.find((x) => x.id === t.dependsOn) ?? null;
}

function StatusIcon({ status }: { status: ComplianceStatus }) {
  return (
    <div
      className={cn(
        "mt-0.5 grid size-4 shrink-0 place-items-center rounded-md border",
        status === "done" ? "border-accent bg-accent text-accent-foreground" : status === "ready" ? "border-[var(--warning)] text-warning-ink" : status === "submitted" ? "border-[var(--info)] text-info-ink" : "border-hairline",
      )}
    >
      {status === "done" ? (
        <Check className="size-3" />
      ) : status === "na" ? (
        <Minus className="size-3 text-muted-foreground" />
      ) : status === "ready" ? (
        <Sparkles className="size-2.5" />
      ) : status === "submitted" ? (
        <Clock className="size-2.5" />
      ) : (
        <Circle className="size-2 text-muted-foreground" />
      )}
    </div>
  );
}

function TaskDetail({ task, docs }: { task: ComplianceTask; docs: string[] }) {
  const { state, prepareCompliance, setComplianceStatus } = useMetaxy();
  const st = state.compliance[task.id] ?? { status: task.status };
  const status = (id: string) => state.compliance[id]?.status ?? "todo";
  const blocker = st.status === "todo" ? blockedBy(task, status) : null;
  const preparing = state.preparing === task.id;

  return (
    <Panel id="comp-task" title={task.label} code="TASK" right={<Badge tone={statusMeta[st.status].tone}>{statusMeta[st.status].label}</Badge>}>
      <div className="space-y-3 text-[14px]">
        <p className="leading-relaxed">{task.why}</p>

        {task.steps.length ? (
          <div>
            <MonoLabel className="text-muted-foreground">Steps</MonoLabel>
            <ol className="mt-1 space-y-1">
              {task.steps.map((s, i) => (
                <li key={s} className="flex gap-2 text-[13px] leading-snug">
                  <span className="font-mono text-muted-foreground">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {task.docs.length ? (
          <div>
            <MonoLabel className="text-muted-foreground">Documents</MonoLabel>
            <ul className="mt-1 space-y-0.5">
              {task.docs.map((d) => {
                const have = docs.includes(d);
                return (
                  <li key={d} className={cn("flex items-center gap-1.5 text-[13px]", !have && "text-warning-ink")}>
                    {have ? <FileCheck2 className="size-3 text-accent-ink" /> : <FileWarning className="size-3" />}
                    {d}
                    {!have ? <span className="text-muted-foreground">— not in vault yet</span> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 border-t border-hairline pt-2">
          <div>
            <MonoLabel className="text-muted-foreground">Cost</MonoLabel>
            <div className="text-[14px] font-medium">{task.cost}</div>
          </div>
          <div>
            <MonoLabel className="text-muted-foreground">Time</MonoLabel>
            <div className="text-[14px] font-medium">{task.time}</div>
          </div>
        </div>

        {st.status === "ready" && st.prepared?.length ? (
          <div className="rounded-xl border border-accent/40 bg-accent/5 p-2">
            <div className="mb-1 flex items-center gap-1.5">
              <Sparkles className="size-3 text-accent-ink" />
              <MonoLabel className="text-accent-ink">Prepared by agent</MonoLabel>
            </div>
            <ul className="space-y-1">
              {st.prepared.map((p) => (
                <li key={p} className="text-[13px] leading-snug">
                  <span className="text-accent-ink">✓</span> {p}
                </li>
              ))}
            </ul>
            {st.missing?.length ? <p className="mt-1.5 text-[13px] text-warning-ink">Still needed: {st.missing.join(", ")}</p> : null}
          </div>
        ) : null}

        {task.ownerMust !== "—" && st.status !== "done" ? (
          <div className="rounded-xl border border-hairline bg-paper-2/60 p-2 text-[13px] leading-snug">
            <MonoLabel className="text-muted-foreground">Only you can do this</MonoLabel>
            <div>{task.ownerMust}</div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {st.status === "todo" ? (
            <Btn variant="accent" disabled={!!blocker || state.busy} onClick={() => void prepareCompliance(task.id)}>
              {preparing ? <AgentOrb state="shaping" theme="dark" /> : <Sparkles />} {preparing ? "Preparing…" : blocker ? `Do ${blocker.label} first` : "Prepare with agent"}
            </Btn>
          ) : null}
          {st.status === "ready" ? (
            <Btn variant="accent" onClick={() => setComplianceStatus(task.id, "submitted")}>
              <Check className="size-3" /> I&apos;ve submitted it
            </Btn>
          ) : null}
          {st.status === "submitted" ? (
            <Btn variant="accent" onClick={() => setComplianceStatus(task.id, "done")}>
              <Check className="size-3" /> Mark approved
            </Btn>
          ) : null}
          <a href={task.where.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[14px] font-medium text-info-ink hover:underline pointer-coarse:min-h-10">
            {task.where.label} <ArrowUpRight className="size-3" />
          </a>
        </div>
      </div>
    </Panel>
  );
}
