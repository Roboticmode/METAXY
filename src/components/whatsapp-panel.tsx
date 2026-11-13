"use client";

import { useEffect, useRef, useState } from "react";
import { Send, RotateCcw, MessageCircle, Bot, Pause, Play } from "lucide-react";
import { business, initialCustomers, newCustomer, presetMessages } from "@/lib/agent/data";
import { useMetaxy } from "@/lib/store";
import { Badge, Btn, MonoLabel, cn } from "@/components/ui";

const ownerFirst = business.owner.split(" ")[0];

export function WhatsAppPanel() {
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
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, state.busy, chat]);

  const send = (t: string, who = as) => {
    const v = t.trim();
    if (!v) return;
    if (who === "owner") {
      setText("");
      sendOwnerMessage(v);
      return;
    }
    if (state.busy) return;
    setText("");
    void sendCustomerMessage(v);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-7 shrink-0 place-items-center rounded-full bg-[#25D366]/15 text-[#128C4B]">
            <MessageCircle className="size-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-xs font-bold">{customer.name}</div>
            <MonoLabel className="text-muted-foreground">{customer.phone} · mirrored live</MonoLabel>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => togglePause(chat)}
            title={paused ? "Let the agent reply again" : "Pause the agent for this chat"}
            className={cn("flex cursor-pointer items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase", paused ? "border-[var(--info)]/40 text-[var(--info)]" : "border-accent/40 text-accent")}
          >
            {paused ? <Pause className="size-2.5" /> : <Bot className="size-2.5" />}
            {paused ? "You" : "Agent"}
          </button>
          <button onClick={reset} title="Reset demo" className="cursor-pointer text-muted-foreground hover:text-foreground">
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {handoff ? (
        <div className="flex items-center justify-between gap-2 border-b border-[var(--warning)]/40 bg-[var(--warning)]/10 px-3 py-1.5 text-[11px] text-[var(--warning)]">
          <span>Agent handed this to you — {handoff}</span>
          <button className="cursor-pointer font-bold underline" onClick={() => setAs("owner")}>
            Reply
          </button>
        </div>
      ) : null}

      <div className="flex-1 space-y-2 overflow-y-auto bg-[#efeae2]/60 p-3">
        {messages.length === 0 ? (
          <div className="mt-8 text-center text-xs text-muted-foreground">No messages yet. Use a preset below to simulate a customer on WhatsApp.</div>
        ) : null}
        {messages.map((m) => {
          const outgoing = m.from === "agent" || m.from === "owner";
          return (
            <div key={m.id} className={cn("flex", outgoing ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[88%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed shadow-sm", outgoing ? "bg-[#d9fdd3] text-foreground" : "bg-white text-foreground")}>
                {m.from === "agent" ? (
                  <div className="mb-0.5 font-mono text-[9px] font-bold uppercase text-accent">{m.automation ? `Metaxy agent · ${m.automation}` : "Metaxy agent"}</div>
                ) : m.from === "owner" ? (
                  <div className="mb-0.5 font-mono text-[9px] font-bold uppercase text-[var(--info)]">{ownerFirst} (you)</div>
                ) : null}
                {m.text}
                <div className="mt-0.5 text-right font-mono text-[9px] text-muted-foreground">{m.at}</div>
              </div>
            </div>
          );
        })}
        {state.busy && !paused ? (
          <div className="flex justify-end">
            <div className="rounded-lg bg-[#d9fdd3] px-3 py-2 text-xs text-muted-foreground">agent working…</div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="space-y-2 border-t border-border p-3">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex rounded-sm border border-border p-0.5">
            {(["customer", "owner"] as const).map((who) => (
              <button
                key={who}
                onClick={() => setAs(who)}
                className={cn("cursor-pointer rounded-sm px-2 py-0.5 font-mono text-[9px] font-bold uppercase", as === who ? "bg-foreground text-background" : "text-muted-foreground")}
              >
                {who === "customer" ? "Simulate customer" : `Reply as ${ownerFirst}`}
              </button>
            ))}
          </div>
          {state.engine ? <Badge tone={state.engine === "grok" ? "ok" : "neutral"}>{state.engine === "grok" ? "Grok live" : "scripted"}</Badge> : null}
        </div>
        {as === "customer" ? (
          <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
            {presetMessages.map((p) => (
              <Btn key={p.label} disabled={state.busy} onClick={() => send(p.text, "customer")} className="px-2 py-1 text-[10px] normal-case tracking-normal">
                {p.label}
              </Btn>
            ))}
          </div>
        ) : (
          <p className="text-[11px] leading-snug text-muted-foreground">
            {paused ? "The agent is paused for this chat." : "Sending a reply pauses the agent for this chat."}{" "}
            {paused ? (
              <button className="inline-flex cursor-pointer items-center gap-0.5 font-semibold text-accent underline" onClick={() => togglePause(chat)}>
                <Play className="size-2.5" /> Hand back to agent
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
            className="h-8 flex-1 rounded-sm border border-input bg-card px-2 text-xs outline-none focus:border-accent"
          />
          <Btn type="submit" variant="accent" disabled={(as === "customer" && state.busy) || !text.trim()}>
            <Send className="size-3" />
          </Btn>
        </form>
      </div>
    </div>
  );
}
