"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Send, ShieldAlert, Sparkles, X } from "lucide-react";
import { SUGGESTED_PROMPTS } from "@/lib/assistant/types";
import { useMetaxy, type AssistantMsg } from "@/lib/store";
import { AgentOrb } from "@/components/agent-orb";
import { Badge, Btn, MonoLabel, cn } from "@/components/ui";

/**
 * "Ask METAXY" — the owner talks to the agent, and the agent moves around the dashboard.
 * Launcher sits bottom-right (reserved corner, z-50). Ctrl/⌘+K toggles, Esc closes.
 */
export function AgentConsole() {
  const { state, askAssistant, confirmAction, cancelAction } = useMetaxy();
  const { messages, busy } = state.assistant;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // keyboard: Ctrl/⌘+K toggles, Esc closes and hands focus back to the launcher
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (o) requestAnimationFrame(() => launcherRef.current?.focus());
          return !o;
        });
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, busy, open]);

  const submit = (text: string) => {
    if (!text.trim() || busy) return;
    setDraft("");
    void askAssistant(text);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(draft);
  };
  const close = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="agent-console"
        aria-keyshortcuts="Control+K Meta+K"
        className={cn(
          "metaxy-launcher fixed right-4 bottom-[calc(var(--metaxy-bottom-inset)+1rem)] z-50 flex h-12 min-w-12 cursor-pointer items-center justify-center gap-2.5 rounded-full border border-white/10 bg-ink px-3.5 text-paper sm:pr-3 sm:pl-4 shadow-[0_20px_40px_-20px_oklch(0_0_0/0.6)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink motion-reduce:transition-none",
          open && "max-sm:hidden",
        )}
      >
        {open ? <X className="size-4" /> : busy ? <AgentOrb theme="dark" /> : <Sparkles className="size-4 text-accent" />}
        <span className="text-[14px] font-medium max-sm:sr-only">{open ? "Close" : "Ask METAXY"}</span>
        {!open ? <kbd className="hidden rounded-full border border-white/15 px-2 py-0.5 font-mono text-[11px] text-paper/70 sm:inline">Ctrl K</kbd> : null}
        {!open && pendingConfirms(messages) ? <span className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-paper bg-[var(--warning)]" aria-label="Waiting for your confirmation" /> : null}
      </button>

      {open ? (
        <section
          id="agent-console"
          role="dialog"
          aria-label="Ask METAXY"
          className="metaxy-app metaxy-console fixed inset-0 z-50 flex flex-col bg-card text-foreground sm:inset-auto sm:right-4 sm:bottom-[calc(var(--metaxy-bottom-inset)+4.5rem)] sm:h-[min(640px,calc(100dvh-var(--metaxy-bottom-inset)-6.5rem))] sm:w-[420px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-hairline sm:shadow-lift"
        >
          <header className="metaxy-ink metaxy-grain flex shrink-0 items-center justify-between gap-3 bg-ink px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 text-paper">
            <div className="flex min-w-0 items-center gap-3">
              {busy ? <AgentOrb theme="dark" /> : <span className="grid size-5 place-items-center" aria-hidden><span className="size-2.5 bg-paper" /></span>}
              <div className="min-w-0"><h2 className="text-[16px] leading-tight font-medium tracking-[-0.01em]">Ask METAXY</h2>
              <p className="truncate text-[12.5px] text-paper/65">Agents prepare. You decide.</p></div>
            </div>
            <button type="button" onClick={close} className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-paper/70 transition-colors hover:bg-white/[0.08] hover:text-paper" aria-label="Close console">
              <X className="size-4" />
            </button>
          </header>

          <div ref={threadRef} className="metaxy-scroll min-h-0 flex-1 space-y-3 overflow-y-auto bg-paper/50 p-4" aria-live="polite">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-[14px] leading-relaxed text-ink-3">
                  Ask me about the business, or tell me where to go. I&apos;ll move around the dashboard and prepare the work. Anything sent to a customer or binding waits for your confirm.
                </p>
                <div>
                  <MonoLabel className="text-muted-foreground">Try</MonoLabel>
                  <ul className="mt-2 space-y-1.5">
                    {SUGGESTED_PROMPTS.map((p) => (
                      <li key={p}>
                        <button
                          type="button"
                          onClick={() => submit(p)}
                          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-hairline bg-card px-3.5 py-2.5 text-left text-[14px] transition-colors hover:border-ink/25"
                        >
                          {p}
                          <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              messages.map((m) => <Message key={m.id} m={m} busy={busy} onConfirm={confirmAction} onCancel={cancelAction} />)
            )}
            {busy ? (
              <div className="flex items-center gap-2 px-1 py-1 text-[13px] text-accent-ink" role="status" aria-label="METAXY is working">
                <AgentOrb state="working" />
                <span>Working…</span>
              </div>
            ) : null}
          </div>

          {messages.length > 0 ? (
            <div className="metaxy-scroll flex shrink-0 gap-1.5 overflow-x-auto border-t border-hairline px-4 py-2.5">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={busy}
                  onClick={() => submit(p)}
                  className="min-h-8 shrink-0 cursor-pointer rounded-full border border-hairline px-3 py-1 text-[12.5px] whitespace-nowrap text-ink-3 transition-colors hover:border-ink/25 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="flex shrink-0 items-center gap-2 border-t border-hairline bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <label htmlFor="agent-console-input" className="sr-only">
              Message METAXY
            </label>
            <input
              id="agent-console-input"
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask or tell METAXY…"
              autoComplete="off"
              className="h-11 min-w-0 flex-1 rounded-full border border-hairline bg-paper px-4 text-base transition-colors outline-none placeholder:text-muted-foreground focus:border-accent-ink focus:bg-card sm:text-[14px]"
            />
            <Btn type="submit" variant="accent" disabled={busy || !draft.trim()} aria-label="Send" className="size-11 shrink-0 p-0">
              <Send className="size-4" />
            </Btn>
          </form>
        </section>
      ) : null}
    </>
  );
}

function pendingConfirms(messages: AssistantMsg[]) {
  return messages.some((m) => m.role === "confirm" && m.status === "pending");
}

function Message({ m, busy, onConfirm, onCancel }: { m: AssistantMsg; busy: boolean; onConfirm: (id: number) => void; onCancel: (id: number) => void }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-ink px-3.5 py-2.5 text-[14px] leading-relaxed text-paper">{m.text}</div>
      </div>
    );
  }
  if (m.role === "assistant") {
    return (
      <div className="max-w-[92%] space-y-1">
        <div className="rounded-2xl rounded-tl-md border border-hairline bg-card px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-line shadow-[0_1px_2px_oklch(0.155_0.008_130/0.05)]">{m.text}</div>
        {m.engine ? (
          <MonoLabel className="px-1 text-[10.5px] text-muted-foreground">{m.engine === "openai" ? "OpenAI" : m.engine === "grok" ? "Grok" : "Offline engine"}</MonoLabel>
        ) : null}
      </div>
    );
  }
  if (m.role === "step") {
    return (
      <div className={cn("flex items-start gap-2 px-1 text-[13px] leading-snug", m.tone === "warn" ? "text-warning-ink" : "text-muted-foreground")}>
        <span className={m.tone === "warn" ? "" : "text-accent-ink"} aria-hidden>
          →
        </span>
        <span>{m.text}</span>
      </div>
    );
  }
  const { card, status } = m;
  return (
    <div className={cn("rounded-2xl border p-4 text-[14px]", status === "pending" ? "border-[var(--warning)]/35 bg-[oklch(0.985_0.014_80)]" : "border-hairline bg-card")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="size-4 text-warning-ink" />
          <span className="text-[13px] font-medium text-warning-ink">Needs your OK</span>
        </div>
        {status === "confirmed" ? <Badge tone="ok">Done</Badge> : status === "cancelled" ? <Badge>Cancelled</Badge> : status === "running" ? <Badge tone="info">Running…</Badge> : null}
      </div>
      <div className="mb-2 text-[15.5px] leading-snug font-medium tracking-[-0.01em]">{card.title}</div>
      <ul className="space-y-1">
        {card.effects.map((e) => (
          <li key={e} className="flex gap-2 text-[13.5px] leading-snug text-ink-3">
            <span className="text-muted-foreground">•</span>
            <span>{e}</span>
          </li>
        ))}
      </ul>
      {status === "pending" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Btn variant="accent" disabled={busy} onClick={() => onConfirm(m.id)}>
            <Check /> {card.confirmLabel}
          </Btn>
          <Btn onClick={() => onCancel(m.id)}>Cancel</Btn>
        </div>
      ) : null}
    </div>
  );
}
