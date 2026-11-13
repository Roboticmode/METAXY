"use client";

import { leads } from "@/lib/agent/data";
import { useMetaxy } from "@/lib/store";
import { Badge, Btn, Panel } from "@/components/ui";

export function OpportunitiesBoard() {
  return (
    <div className="metaxy-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-28 sm:p-5 sm:pb-28 xl:p-6 xl:pb-28">
      <Panel id="opp-radar" title="Opportunity radar · within 15 km of Johannesburg" code="OPP-01" right={<Badge tone="info">Fixture data</Badge>}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {leads.map((l) => (
            <div key={l.name} className="rounded-xl border border-hairline p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[14.5px] font-medium">{l.name}</div>
                  <div className="text-[13px] text-muted-foreground">{l.type}</div>
                </div>
                <Badge tone={l.fit >= 85 ? "ok" : "neutral"}>{l.fit}% fit</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] text-muted-foreground">
                  {l.area} · {l.km} km
                </span>
                <Badge>{l.status}</Badge>
              </div>
              <Btn className="mt-4 w-full">Draft outreach</Btn>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function CrmBoard() {
  const { state } = useMetaxy();
  return (
    <div className="metaxy-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-28 sm:p-5 sm:pb-28 xl:p-6 xl:pb-28">
      <Panel id="crm-memory" title="Client memory & disambiguation" code="CRM-01" right={<Badge tone="info">{state.customers.length} clients</Badge>}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[...state.customers].reverse().map((c) => (
            <div key={c.id} className="rounded-xl border border-hairline p-4">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <div className="min-w-0">
                  <div className="text-[14.5px] font-medium">{c.name}</div>
                  <span className="text-[13px] text-muted-foreground">{c.business}</span>
                </div>
                <span className="text-[13px] text-muted-foreground">
                  {c.orders} projects · last {c.lastOrder}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {c.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
              <ul className="mt-2 space-y-1">
                {c.notes.length === 0 ? <li className="text-[13px] text-muted-foreground">No notes yet.</li> : null}
                {c.notes.map((n, i) => (
                  <li key={i} className="text-[13px] leading-snug">
                    <span className="text-accent-ink">▸</span> {n}
                  </li>
                ))}
              </ul>
              <div className="mt-2 border-t border-hairline pt-2 text-[13px] text-muted-foreground">
                Follow-up: agent drafts a polite check-in 7 days after project delivery (opted-in clients only).
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
