"use client";

import { Check, Circle, Minus } from "lucide-react";
import { complianceItems, TURNOVER } from "@/lib/agent/data";
import { rand } from "@/lib/agent/tools";
import { useMetaxy } from "@/lib/store";
import { Badge, Btn, MonoLabel, Panel, cn } from "@/components/ui";

export function ComplianceBoard() {
  const { state } = useMetaxy();
  const nudged = state.nudges.length > 0;
  const pct = Math.min(100, (TURNOVER.last12 / TURNOVER.vatThreshold) * 100);
  const done = complianceItems.filter((i) => i.status === "done").length;
  const applicable = complianceItems.filter((i) => i.status !== "na").length;

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 xl:grid-cols-5">
      <div className="space-y-4 xl:col-span-3">
        {nudged ? (
          <div className="rounded border border-accent/40 bg-accent/10 p-3 text-xs leading-relaxed">
            <div className="mb-1 flex items-center gap-2">
              <Badge tone="ok">Agent suggestion</Badge>
              <span className="font-bold uppercase">{state.nudges[0].title}</span>
            </div>
            {state.nudges[0].detail}
            <div className="mt-2 font-mono text-[10px] text-muted-foreground">{state.nudges[0].source}</div>
          </div>
        ) : null}
        <Panel title="Formalisation checklist" code="COMP-01" right={<Badge tone="info">{done}/{applicable} complete</Badge>}>
          <ul className="divide-y divide-border">
            {complianceItems.map((i) => {
              const highlight = nudged && i.id === "cipc";
              return (
                <li key={i.id} className={cn("flex items-start gap-3 py-2.5", highlight && "-mx-3 bg-accent/10 px-3")}>
                  <div
                    className={cn(
                      "mt-0.5 grid size-4 shrink-0 place-items-center rounded-sm border",
                      i.status === "done" ? "border-accent bg-accent text-accent-foreground" : "border-border",
                    )}
                  >
                    {i.status === "done" ? <Check className="size-3" /> : i.status === "na" ? <Minus className="size-3 text-muted-foreground" /> : <Circle className="size-2 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold">{i.label}</div>
                    <div className="text-[11px] text-muted-foreground">{i.note}</div>
                  </div>
                  {i.status === "todo" ? (
                    <Btn variant={highlight ? "accent" : "default"}>{highlight ? "Prepare with agent" : "Start"}</Btn>
                  ) : (
                    <Badge tone={i.status === "done" ? "ok" : "neutral"}>{i.status === "done" ? "done" : "n/a"}</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="space-y-4 xl:col-span-2">
        <Panel title="Turnover vs VAT threshold" code="COMP-02">
          <div className="flex items-end justify-between">
            <div className="font-mono text-lg font-bold">{rand(TURNOVER.last12)}</div>
            <MonoLabel className="text-muted-foreground">of {rand(TURNOVER.vatThreshold)} / 12 mo</MonoLabel>
          </div>
          <div className="mt-2 h-1.5 w-full bg-secondary">
            <div className="h-1.5 bg-accent" style={{ width: `${Math.max(pct, 2)}%` }} />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            Mandatory VAT registration applies above R1 million in 12 months (voluntary from R50,000). The agent watches this so you never get caught out.
          </p>
        </Panel>
        <Panel title="Document vault" code="COMP-03">
          <ul className="space-y-1.5 text-xs">
            {["ID document (Smart ID)", "Proof of address — Soweto", "SARS income tax registration", "Bakery menu & price list"].map((d) => (
              <li key={d} className="flex items-center justify-between rounded border border-border px-2 py-1.5">
                {d}
                <Badge tone="ok">stored</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
