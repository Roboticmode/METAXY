"use client";

import { CheckCircle2, CircleDashed, Hand, Lock, MessageCircle, Play, UserRound } from "lucide-react";
import { newCustomer } from "@/lib/agent/data";
import { automations, setupSteps } from "@/lib/whatsapp/data";
import { useMetaxy } from "@/lib/store";
import { Badge, Btn, Panel, boardGrid, cn } from "@/components/ui";

export function WhatsAppBoard() {
  const { state, openChat, toggleAutomation, runAutomations } = useMetaxy();

  const people = state.customers.some((c) => c.id === newCustomer.id) ? state.customers : [newCustomer, ...state.customers];
  const lastMsg = (id: string) => [...state.messages].reverse().find((m) => m.customerId === id);
  const inbox = [...people].sort((a, b) => (lastMsg(b.id)?.id ?? 0) - (lastMsg(a.id)?.id ?? 0));

  const byAgent = state.messages.filter((m) => m.from === "agent").length;
  const byOwner = state.messages.filter((m) => m.from === "owner").length;
  const needsYou = Object.keys(state.handoffs).length;

  return (
    <div className={boardGrid}>
      <div className="@container min-w-0 space-y-4 xl:space-y-5 min-[1400px]:col-span-3">
        <div className="grid grid-cols-2 gap-2 @lg:grid-cols-4">
          <Stat label="Replies by agent" value={byAgent} />
          <Stat label="Replies by you" value={byOwner} />
          <Stat label="Needs you" value={needsYou} tone={needsYou ? "warn" : undefined} />
          <Stat label="Typing saved" value={`≈${byAgent * 3} min`} />
        </div>

        <Panel id="wa-inbox" title="Customer chats" code="WA-01" right={<Badge tone="info">{inbox.length} chats</Badge>}>
          <ul className="divide-y divide-hairline">
            {inbox.map((c) => {
              const m = lastMsg(c.id);
              const unread = state.unread[c.id] ?? 0;
              const handoff = state.handoffs[c.id];
              const active = state.activeChat === c.id;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => openChat(c.id)}
                    className={cn("flex min-h-12 w-full cursor-pointer items-start gap-3 px-2 py-2.5 text-left transition-colors hover:bg-paper", active && "bg-paper-2")}
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#25D366]/15 text-[12px] font-semibold text-[#0d6b3a]">
                      {c.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[14.5px] font-medium">{c.name}</span>
                        <span className="text-[13px] text-muted-foreground">{c.business}</span>
                        {handoff ? <Badge tone="warn">Needs you</Badge> : null}
                        {state.paused[c.id] ? <Badge tone="info">You&apos;re handling</Badge> : null}
                        {c.optIn ? null : <Badge>No marketing</Badge>}
                      </div>
                      <div className="truncate text-[13px] text-muted-foreground">
                        {handoff ? `Agent: ${handoff}` : m ? `${m.from === "agent" ? "Agent: " : m.from === "owner" ? "You: " : ""}${m.text}` : "No messages yet"}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[12px] text-muted-foreground tabular-nums">{m?.at ?? ""}</span>
                      {unread ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#25D366] px-1 text-[11px] font-semibold text-ink">{unread}</span> : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[13px] text-muted-foreground">Open a chat to see it in the WhatsApp phone<span className="hidden xl:inline"> on the right</span>. You can step in and reply yourself at any time — the agent pauses for that chat.</p>
        </Panel>
      </div>

      <div className="min-w-0 space-y-4 xl:space-y-5 min-[1400px]:col-span-2">
        <Panel
          id="wa-automations"
          title="Automations"
          code="WA-02"
          right={
            <Btn variant="accent" disabled={state.busy} onClick={() => void runAutomations()}>
              <Play className="size-3" /> Run today&apos;s
            </Btn>
          }
        >
          <ul className="space-y-2">
            {automations.map((a) => {
              const on = state.automations[a.id];
              return (
                <li key={a.id} className="flex items-start gap-3">
                  <button
                    role="switch"
                    aria-checked={on}
                    aria-label={a.label}
                    disabled={a.locked}
                    onClick={() => toggleAutomation(a.id)}
                    className={cn("relative mt-0.5 flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors before:absolute before:-inset-x-2 before:-inset-y-3 before:content-[''] disabled:cursor-not-allowed", on ? "bg-accent" : "bg-border")}
                  >
                    <span className={cn("size-3 rounded-full bg-white shadow transition-transform motion-reduce:transition-none", on && "translate-x-3")} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[14px] font-medium">
                      {a.label}
                      {a.locked ? <Lock className="size-3 text-muted-foreground" /> : null}
                    </div>
                    <div className="text-[13px] leading-snug text-muted-foreground">{a.detail}</div>
                    {a.template ? <span className="mt-0.5 inline-block font-mono text-[11.5px] text-muted-foreground">template · {a.template}</span> : null}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[13px] leading-snug text-muted-foreground">
            Messages the studio starts (reminders, nudges) use WhatsApp-approved templates. Promotions only go to clients who opted in.
          </p>
        </Panel>

        <Panel id="wa-setup" title="WhatsApp Business setup" code="WA-03" right={<Badge tone="info">{setupSteps.filter((s) => s.status === "done").length}/{setupSteps.length}</Badge>}>
          <ul className="space-y-2">
            {setupSteps.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                {s.status === "done" ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent-ink" />
                ) : s.status === "progress" ? (
                  <CircleDashed className="mt-0.5 size-3.5 shrink-0 text-warning-ink" />
                ) : (
                  <CircleDashed className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <div className="text-[14px] font-medium">{s.label}</div>
                  <div className="text-[13px] leading-snug text-muted-foreground">{s.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex items-start gap-2 rounded-xl border border-hairline bg-paper-2/60 p-3 text-[13px] leading-snug text-muted-foreground">
          <Hand className="mt-0.5 size-3.5 shrink-0" />
          METAXY never promises dates, sends quotes or overdue reminders, or writes coursework on its own — those come to Naledi as approvals or hand-offs.
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "warn" }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-hairline bg-card p-4 shadow-soft", tone === "warn" && "border-[var(--warning)]/35 bg-[oklch(0.985_0.014_80)]")}>
      <div className="flex items-center gap-2 text-[2.25rem] leading-none font-medium tracking-[-0.05em] tabular-nums">{value}</div>
      <div className="flex items-center gap-1.5 text-[13.5px] leading-snug text-muted-foreground">
        {label === "Needs you" ? <UserRound className="size-3.5" /> : label.startsWith("Replies") ? <MessageCircle className="size-3.5" /> : null}
        {label}
      </div>
    </div>
  );
}
