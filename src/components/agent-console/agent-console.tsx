"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Send, ShieldAlert, Sparkles, X } from "lucide-react";
import { SUGGESTED_PROMPTS } from "@/lib/assistant/types";
import { useMetaxy, type AssistantMsg } from "@/lib/store";
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
          "fixed right-4 bottom-4 z-50 flex cursor-pointer items-center gap-2 rounded-full border border-foreground bg-foreground px-4 py-2.5 text-background shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          open && "max-sm:hidden",
        )}
      >
        {open ? <X className="size-4" /> : <Sparkles className="size-4 text-accent" />}
        <span className="text-xs font-bold uppercase tracking-widest">{open ? "Close" : "Ask METAXY"}</span>
        {!open ? <kbd className="hidden rounded-sm border border-background/30 px-1 font-mono text-[10px] text-background/70 sm:inline">Ctrl K</kbd> : null}
        {!open && pendingConfirms(messages) ? <span className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-background bg-[var(--warning)]" aria-label="Waiting for your confirmation" /> : null}
      </button>

      {open ? (
        <section
          id="agent-console"
          role="dialog"
          aria-label="Ask METAXY"
          className="fixed inset-0 z-50 flex flex-col bg-card text-foreground sm:inset-auto sm:right-4 sm:bottom-18 sm:h-[min(620px,calc(100vh-6.5rem))] sm:w-[400px] sm:rounded sm:border sm:border-border sm:shadow-2xl"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="size-2.5 bg-accent" aria-hidden />
              <h2 className="text-xs font-bold uppercase tracking-tight">Ask METAXY</h2>
              <MonoLabel className="text-muted-foreground">Agents prepare · you decide</MonoLabel>
            </div>
            <button type="button" onClick={close} className="grid size-7 cursor-pointer place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close console">
              <X className="size-4" />
            </button>
          </header>

          <div ref={threadRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Ask me about the business, or tell me where to go. I&apos;ll move around the dashboard and prepare the work. Anything sent to a customer or binding waits for your confirm.
                </p>
                <div>
                  <MonoLabel className="text-muted-foreground">Try</MonoLabel>
                  <ul className="mt-1 space-y-1">
                    {SUGGESTED_PROMPTS.map((p) => (
                      <li key={p}>
                        <button
                          type="button"
                          onClick={() => submit(p)}
                          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm border border-border px-2.5 py-2 text-left text-xs hover:bg-secondary"
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
              <div className="flex items-center gap-1.5 px-1 py-1 text-muted-foreground" aria-label="METAXY is working">
                <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                <MonoLabel>working…</MonoLabel>
              </div>
            ) : null}
          </div>

          {messages.length > 0 ? (
            <div className="flex shrink-0 gap-1.5 overflow-x-auto border-t border-border px-3 py-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={busy}
                  onClick={() => submit(p)}
                  className="shrink-0 cursor-pointer rounded-full border border-border px-2.5 py-1 text-[11px] whitespace-nowrap text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="flex shrink-0 items-center gap-2 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
              className="min-w-0 flex-1 rounded-sm border border-border bg-background px-3 py-2 text-base outline-none focus:border-foreground sm:text-xs"
            />
            <Btn type="submit" variant="accent" disabled={busy || !draft.trim()} aria-label="Send">
              <Send className="size-3" />
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
        <div className="max-w-[85%] rounded bg-foreground px-3 py-2 text-xs leading-relaxed text-background">{m.text}</div>
      </div>
    );
  }
  if (m.role === "assistant") {
    return (
      <div className="max-w-[92%] space-y-1">
        <div className="rounded border border-border bg-secondary/60 px-3 py-2 text-xs leading-relaxed whitespace-pre-line">{m.text}</div>
        {m.engine ? <MonoLabel className="px-1 text-muted-foreground">{m.engine === "grok" ? "Grok" : "Offline engine"}</MonoLabel> : null}
      </div>
    );
  }
  if (m.role === "step") {
    return (
      <div className={cn("flex items-start gap-1.5 px-1 font-mono text-[11px] leading-snug", m.tone === "warn" ? "text-[var(--warning)]" : "text-muted-foreground")}>
        <span className={m.tone === "warn" ? "" : "text-accent"} aria-hidden>
          →
        </span>
        <span>{m.text}</span>
      </div>
    );
  }
  const { card, status } = m;
  return (
    <div className={cn("rounded border p-3 text-xs", status === "pending" ? "border-[var(--warning)]/50 bg-[var(--warning)]/5" : "border-border bg-secondary/40")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="size-3.5 text-[var(--warning)]" />
          <MonoLabel className="text-[var(--warning)]">Needs your OK</MonoLabel>
        </div>
        {status === "confirmed" ? <Badge tone="ok">Done</Badge> : status === "cancelled" ? <Badge>Cancelled</Badge> : status === "running" ? <Badge tone="info">Running…</Badge> : null}
      </div>
      <div className="mb-1.5 font-semibold">{card.title}</div>
      <ul className="space-y-1">
        {card.effects.map((e) => (
          <li key={e} className="flex gap-1.5 text-[11px] leading-snug">
            <span className="text-muted-foreground">•</span>
            <span>{e}</span>
          </li>
        ))}
      </ul>
      {status === "pending" ? (
        <div className="mt-3 flex gap-2">
          <Btn variant="accent" disabled={busy} onClick={() => onConfirm(m.id)}>
            <Check className="size-3" /> {card.confirmLabel}
          </Btn>
          <Btn onClick={() => onCancel(m.id)}>Cancel</Btn>
        </div>
      ) : null}
    </div>
  );
}
