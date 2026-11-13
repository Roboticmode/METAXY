"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Send, RotateCcw, MessageCircle, Bot, Pause, Play } from "lucide-react";
import { business, initialCustomers, newCustomer, presetMessages } from "@/lib/agent/data";
import { useMetaxy } from "@/lib/store";
import { AgentOrb } from "@/components/agent-orb";
import { Badge, Btn, cn } from "@/components/ui";

const ownerFirst = business.owner.split(" ")[0];

/** The live WhatsApp phone. `headerAction` is the shell's collapse / close button. */
export function WhatsAppPanel({ headerAction }: { headerAction?: ReactNode }) {
  const { state, sendCustomerMessage, sendOwnerMessage, togglePause, reset } = useMetaxy();
  const [text, setText] = useState("");
  const [as, setAs] = useState<"customer" | "owner">("customer");
  const endRef = useRef<HTMLDivElement>(null);

  const chat = state.activeChat;
  const customer = state.customers.find((c) => c.id === chat) ?? initialCustomers.find((c) => c.id === chat) ?? newCustomer;
  const messages = state.messages.filter((m) => m.customerId === chat);
  const paused = !!state.paused[chat];
  const handoff = state.handoffs[chat];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, state.busy, chat]);

  const send = (t: string, who = as, customerIdOverride?: string) => {
    const v = t.trim();
    if (!v) return;
    if (who === "owner") {
      setText("");
      sendOwnerMessage(v);
      return;
    }
    if (state.busy) return;
    setText("");
    void sendCustomerMessage(v, customerIdOverride);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-hairline px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#25D366]/15 text-[#128C4B]">
            <MessageCircle className="size-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[14.5px] font-medium tracking-[-0.01em]">{customer.name}</div>
            <span className="block truncate text-[12.5px] text-muted-foreground">
              {customer.business} · {customer.phone}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => togglePause(chat)}
            title={paused ? "Let the agent reply again" : "Pause the agent for this chat"}
            aria-pressed={paused}
            className={cn("flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors pointer-coarse:h-10", paused ? "bg-[var(--info)]/10 text-info-ink hover:bg-[var(--info)]/15" : "bg-accent/12 text-accent-ink hover:bg-accent/20")}
          >
            {paused ? <Pause className="size-3.5" /> : <Bot className="size-3.5" />}
            {paused ? "You" : "Agent"}
          </button>
          <button onClick={reset} title="Reset demo" aria-label="Reset demo" className="grid size-9 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-ink/5 hover:text-foreground pointer-coarse:size-10">
            <RotateCcw className="size-3.5" />
          </button>
          {headerAction}
        </div>
      </div>

      {handoff ? (
        <div className="flex items-center justify-between gap-2 border-b border-[var(--warning)]/30 bg-[var(--warning)]/10 px-4 py-2 text-[13px] leading-snug text-warning-ink">
          <span className="min-w-0">Agent handed this to you — {handoff}</span>
          <button className="shrink-0 cursor-pointer rounded-full bg-card px-3 py-1 font-medium shadow-sm pointer-coarse:min-h-10" onClick={() => setAs("owner")}>
            Reply
          </button>
        </div>
      ) : null}

      <div className="metaxy-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain bg-[#f1ece4] p-4">
        {messages.length === 0 ? (
          <div className="mx-auto mt-10 max-w-[26ch] text-center text-[13.5px] leading-relaxed text-muted-foreground">No messages yet. Use a preset below to simulate a client on WhatsApp.</div>
        ) : null}
        {messages.map((m) => {
          const outgoing = m.from === "agent" || m.from === "owner";
          return (
            <div key={m.id} className={cn("flex", outgoing ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[86%] rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed text-ink shadow-[0_1px_1px_oklch(0.155_0.008_130/0.08)]", outgoing ? "rounded-tr-md bg-[#d9fdd3]" : "rounded-tl-md bg-white")}>
                {m.from === "agent" ? (
                  <div className="mb-0.5 text-[11.5px] font-medium text-[#0d6b3a]">{m.automation ? `METAXY agent · ${m.automation}` : "METAXY agent"}</div>
                ) : m.from === "owner" ? (
                  <div className="mb-0.5 text-[11.5px] font-medium text-info-ink">{ownerFirst} (you)</div>
                ) : null}
                {m.text}
                <div className="mt-0.5 text-right text-[11px] text-muted-foreground tabular-nums">{m.at}</div>
              </div>
            </div>
          );
        })}
        {state.busy && !paused ? (
          <div className="flex justify-end">
            <div className="flex items-center gap-2 rounded-2xl rounded-tr-md bg-[#d9fdd3] py-1.5 pr-3.5 pl-2 text-[13px] text-[#0d6b3a]" role="status">
              <AgentOrb state="composing" /> Agent drafting a reply…
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 space-y-3 border-t border-hairline p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex min-w-0 rounded-full bg-paper-2 p-1" role="group" aria-label="Send as">
            {(["customer", "owner"] as const).map((who) => (
              <button
                key={who}
                onClick={() => setAs(who)}
                aria-pressed={as === who}
                className={cn("min-h-7 cursor-pointer rounded-full px-3 text-[12.5px] font-medium whitespace-nowrap transition-colors pointer-coarse:min-h-9", as === who ? "bg-ink text-paper shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                {who === "customer" ? "Simulate client" : `Reply as ${ownerFirst}`}
              </button>
            ))}
          </div>
          {state.engine ? (
            <Badge tone={state.engine === "mock" ? "neutral" : "ok"}>
              {state.engine === "openai" ? "OpenAI live" : state.engine === "grok" ? "Grok live" : "scripted"}
            </Badge>
          ) : null}
        </div>
        {as === "customer" ? (
          <div className="metaxy-scroll flex max-h-32 flex-wrap gap-1.5 overflow-y-auto overscroll-contain pointer-coarse:max-h-48">
            {presetMessages.map((p) => (
              <Btn key={p.label} disabled={state.busy} onClick={() => send(p.text, "customer", p.customerId)} className="min-h-8 px-3 py-1 text-[12.5px]">
                {p.label}
              </Btn>
            ))}
          </div>
        ) : (
          <p className="text-[13px] leading-snug text-muted-foreground">
            {paused ? "The agent is paused for this chat." : "Sending a reply pauses the agent for this chat."}{" "}
            {paused ? (
              <button className="inline-flex cursor-pointer items-center gap-1 font-medium text-accent-ink underline underline-offset-2 pointer-coarse:min-h-10" onClick={() => togglePause(chat)}>
                <Play className="size-3" /> Hand back to agent
              </button>
            ) : null}
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={as === "customer" ? `Type as ${customer.name.split(" ")[0]}…` : `Reply as ${ownerFirst}…`}
            aria-label={as === "customer" ? "Customer message" : "Your reply"}
            className="h-10 min-w-0 flex-1 rounded-full border border-hairline bg-paper px-4 text-[14px] transition-colors outline-none placeholder:text-muted-foreground focus:border-accent-ink focus:bg-card pointer-coarse:text-base"
          />
          <Btn type="submit" variant="accent" aria-label="Send" disabled={(as === "customer" && state.busy) || !text.trim()} className="size-10 shrink-0 p-0 pointer-coarse:size-10">
            <Send className="size-4" />
          </Btn>
        </form>
      </div>
    </div>
  );
}
