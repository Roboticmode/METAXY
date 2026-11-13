"use client";

import { CheckCircle2, CircleDashed, Hand, Lock, MessageCircle, Play, UserRound } from "lucide-react";
import { newCustomer } from "@/lib/agent/data";
import { automations, setupSteps } from "@/lib/whatsapp/data";
import { useMetaxy } from "@/lib/store";
import { Badge, Btn, MonoLabel, Panel, cn } from "@/components/ui";

export function WhatsAppBoard() {
  const { state, openChat, toggleAutomation, runAutomations } = useMetaxy();

  const people = state.customers.some((c) => c.id === newCustomer.id) ? state.customers : [newCustomer, ...state.customers];
  const lastMsg = (id: string) => [...state.messages].reverse().find((m) => m.customerId === id);
  const inbox = [...people].sort((a, b) => (lastMsg(b.id)?.id ?? 0) - (lastMsg(a.id)?.id ?? 0));

  const byAgent = state.messages.filter((m) => m.from === "agent").length;
  const byOwner = state.messages.filter((m) => m.from === "owner").length;
  const needsYou = Object.keys(state.handoffs).length;

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 xl:grid-cols-5">
      <div className="space-y-4 xl:col-span-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="Replies by agent" value={byAgent} />
          <Stat label="Replies by you" value={byOwner} />
          <Stat label="Needs you" value={needsYou} tone={needsYou ? "warn" : undefined} />
          <Stat label="Typing saved" value={`≈${byAgent * 3} min`} />
        </div>

        <Panel title="Customer chats" code="WA-01" right={<Badge tone="info">{inbox.length} chats</Badge>}>
          <ul className="divide-y divide-border">
            {inbox.map((c) => {
              const m = lastMsg(c.id);
              const unread = state.unread[c.id] ?? 0;
              const handoff = state.handoffs[c.id];
              const active = state.activeChat === c.id;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => openChat(c.id)}
                    className={cn("flex w-full cursor-pointer items-start gap-3 px-2 py-2.5 text-left transition-colors hover:bg-secondary/60", active && "bg-secondary")}
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#25D366]/15 text-[10px] font-bold text-[#128C4B]">
                      {c.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{c.name}</span>
                        {handoff ? <Badge tone="warn">needs you</Badge> : null}
                        {state.paused[c.id] ? <Badge tone="info">you&apos;re handling</Badge> : null}
                        {c.optIn ? null : <MonoLabel className="text-muted-foreground">no marketing</MonoLabel>}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {handoff ? `Agent: ${handoff}` : m ? `${m.from === "agent" ? "Agent: " : m.from === "owner" ? "You: " : ""}${m.text}` : "No messages yet"}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <MonoLabel className="text-muted-foreground">{m?.at ?? ""}</MonoLabel>
                      {unread ? <span className="grid size-4 place-items-center rounded-full bg-[#25D366] font-mono text-[9px] font-bold text-white">{unread}</span> : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">Click a chat to open it in the phone on the right. You can step in and reply yourself at any time — the agent pauses for that chat.</p>
        </Panel>
      </div>

      <div className="space-y-4 xl:col-span-2">
        <Panel
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
                <li key={a.id} className="flex items-start gap-2">
                  <button
                    role="switch"
                    aria-checked={on}
                    aria-label={a.label}
                    disabled={a.locked}
                    onClick={() => toggleAutomation(a.id)}
                    className={cn("mt-0.5 flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors disabled:cursor-not-allowed", on ? "bg-accent" : "bg-border")}
                  >
                    <span className={cn("size-3 rounded-full bg-white shadow transition-transform", on && "translate-x-3")} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {a.label}
                      {a.locked ? <Lock className="size-3 text-muted-foreground" /> : null}
                    </div>
                    <div className="text-[11px] leading-snug text-muted-foreground">{a.detail}</div>
                    {a.template ? <MonoLabel className="text-muted-foreground">template · {a.template}</MonoLabel> : null}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
            Messages the business starts (reminders, nudges) use WhatsApp-approved templates. Promotions only go to customers who opted in.
          </p>
        </Panel>

        <Panel title="WhatsApp Business setup" code="WA-03" right={<Badge tone="info">{setupSteps.filter((s) => s.status === "done").length}/{setupSteps.length}</Badge>}>
          <ul className="space-y-2">
            {setupSteps.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                {s.status === "done" ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />
                ) : s.status === "progress" ? (
                  <CircleDashed className="mt-0.5 size-3.5 shrink-0 text-[var(--warning)]" />
                ) : (
                  <CircleDashed className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <div className="text-xs font-semibold">{s.label}</div>
                  <div className="text-[11px] leading-snug text-muted-foreground">{s.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex items-start gap-2 rounded border border-border bg-secondary/40 p-3 text-[11px] leading-snug text-muted-foreground">
          <Hand className="mt-0.5 size-3.5 shrink-0" />
          The agent never promises refunds, discounts or exceptions on its own — those come to you as approvals or hand-offs.
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "warn" }) {
  return (
    <div className={cn("rounded border border-border p-2.5", tone === "warn" && "border-[var(--warning)]/50 bg-[var(--warning)]/5")}>
      <MonoLabel className="text-muted-foreground">{label}</MonoLabel>
      <div className="mt-0.5 flex items-center gap-1.5 font-mono text-lg font-bold">
        {label === "Needs you" ? <UserRound className="size-4" /> : label.startsWith("Replies") ? <MessageCircle className="size-4" /> : null}
        {value}
      </div>
    </div>
  );
}
