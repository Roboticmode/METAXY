"use client";

import { useEffect, useRef, useState } from "react";
import { Send, RotateCcw, MessageCircle } from "lucide-react";
import { newCustomer, presetMessages } from "@/lib/agent/data";
import { useMetexi } from "@/lib/store";
import { Badge, Btn, MonoLabel, cn } from "@/components/ui";

export function WhatsAppPanel() {
  const { state, sendCustomerMessage, reset } = useMetexi();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages.length, state.busy]);

  const send = (t: string) => {
    const v = t.trim();
    if (!v || state.busy) return;
    setText("");
    void sendCustomerMessage(v);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-full bg-[#25D366]/15 text-[#128C4B]">
            <MessageCircle className="size-4" />
          </div>
          <div className="leading-tight">
            <div className="text-xs font-bold">{newCustomer.name}</div>
            <MonoLabel className="text-muted-foreground">{newCustomer.phone} · mirrored live</MonoLabel>
          </div>
        </div>
        <button onClick={reset} title="Reset demo" className="cursor-pointer text-muted-foreground hover:text-foreground">
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-[#efeae2]/60 p-3">
        {state.messages.length === 0 ? (
          <div className="mt-8 text-center text-xs text-muted-foreground">
            No messages yet. Use a preset below to simulate a customer on WhatsApp.
          </div>
        ) : null}
        {state.messages.map((m) => (
          <div key={m.id} className={cn("flex", m.from === "agent" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[88%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed shadow-sm",
                m.from === "agent" ? "bg-[#d9fdd3] text-foreground" : "bg-white text-foreground",
              )}
            >
              {m.from === "agent" ? <div className="mb-0.5 font-mono text-[9px] font-bold uppercase text-accent">Metexi agent</div> : null}
              {m.text}
              <div className="mt-0.5 text-right font-mono text-[9px] text-muted-foreground">{m.at}</div>
            </div>
          </div>
        ))}
        {state.busy ? (
          <div className="flex justify-end">
            <div className="rounded-lg bg-[#d9fdd3] px-3 py-2 text-xs text-muted-foreground">agent working…</div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="space-y-2 border-t border-border p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <MonoLabel className="text-muted-foreground">Simulate customer</MonoLabel>
          {state.engine ? <Badge tone={state.engine === "grok" ? "ok" : "neutral"}>{state.engine === "grok" ? "Grok live" : "scripted engine"}</Badge> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          {presetMessages.map((p) => (
            <Btn key={p.label} disabled={state.busy} onClick={() => send(p.text)} className="justify-start text-left normal-case tracking-normal">
              {p.label}
            </Btn>
          ))}
        </div>
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
            placeholder="Type as the customer…"
            className="h-8 flex-1 rounded-sm border border-input bg-card px-2 text-xs outline-none focus:border-accent"
          />
          <Btn type="submit" variant="accent" disabled={state.busy || !text.trim()}>
            <Send className="size-3" />
          </Btn>
        </form>
      </div>
    </div>
  );
}
