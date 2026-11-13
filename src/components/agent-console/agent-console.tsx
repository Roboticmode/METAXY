"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Mic, MicOff, PhoneOff, Radio, Send, ShieldAlert, Sparkles, X } from "lucide-react";
import { SUGGESTED_PROMPTS } from "@/lib/assistant/types";
import { useMetaxy, type AssistantMsg } from "@/lib/store";
import { Badge, Btn, MonoLabel, cn } from "@/components/ui";
import { useLiveVoice } from "./use-live-voice";

/**
 * "Ask METAXY" — the owner talks to the agent (text via GPT-6 Luna or live voice via GPT-Live 1),
 * and the agent moves around the dashboard. Launcher sits bottom-right (reserved corner, z-50).
 */
export function AgentConsole() {
  const { state, askAssistant, confirmAction, cancelAction, getSnapshot, pushLiveTranscript, pushLiveStep, runLiveTool } = useMetaxy();
  const { messages, busy } = state.assistant;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const live = useLiveVoice({ getSnapshot, pushLiveTranscript, pushLiveStep, runLiveTool });

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
  }, [messages.length, busy, open, live.status]);

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

  const toggleLive = () => {
    if (live.status === "live" || live.status === "connecting") {
      live.disconnect();
    } else {
      void live.connect();
    }
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
        {open ? (
          <X className="size-4" />
        ) : live.status === "live" ? (
          <Radio className="size-4 animate-pulse text-emerald-400" />
        ) : (
          <Sparkles className="size-4 text-accent" />
        )}
        <span className="text-xs font-bold uppercase tracking-widest">
          {open ? "Close" : live.status === "live" ? "Live · METAXY" : "Ask METAXY"}
        </span>
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
              <div className={cn("size-2.5", live.status === "live" ? "animate-pulse rounded-full bg-emerald-500" : "bg-accent")} aria-hidden />
              <h2 className="text-xs font-bold uppercase tracking-tight">Ask METAXY</h2>
              <MonoLabel className="text-muted-foreground">Agents prepare · you decide</MonoLabel>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleLive}
                disabled={live.status === "connecting"}
                title={live.status === "live" ? "End live voice session" : "Start live voice with GPT-Live 1"}
                className={cn(
                  "flex h-7 cursor-pointer items-center gap-1 rounded-sm border px-2 font-mono text-[10px] font-bold uppercase transition-colors disabled:cursor-wait disabled:opacity-60",
                  live.status === "live"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : live.status === "connecting"
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {live.status === "live" ? <PhoneOff className="size-3" /> : <Mic className="size-3" />}
                <span>{live.status === "live" ? "End" : live.status === "connecting" ? "Linking…" : "Go Live"}</span>
              </button>
              <button type="button" onClick={close} className="grid size-7 cursor-pointer place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close console">
                <X className="size-4" />
              </button>
            </div>
          </header>

          {live.status === "live" || live.status === "connecting" ? (
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px]">
              <div className="flex min-w-0 items-center gap-1.5">
                <Radio className="size-3.5 shrink-0 animate-pulse text-emerald-600 dark:text-emerald-400" />
                <span className="truncate font-medium">
                  {live.status === "connecting"
                    ? "Connecting GPT-Live 1 voice…"
                    : `Live voice · ${live.models?.live ?? "gpt-live-1"} + ${live.models?.backend ?? "gpt-6-luna"}`}
                </span>
              </div>
              {live.status === "live" ? (
                <button
                  type="button"
                  onClick={live.toggleMute}
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-sm border border-border bg-background/80 px-2 py-0.5 font-mono text-[10px] uppercase hover:bg-background"
                >
                  {live.muted ? <MicOff className="size-3 text-[var(--warning)]" /> : <Mic className="size-3" />}
                  <span>{live.muted ? "Muted" : "Mute"}</span>
                </button>
              ) : null}
            </div>
          ) : live.status === "error" && live.error ? (
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--warning)]/40 bg-[var(--warning)]/10 px-3 py-1.5 text-[11px] text-[var(--warning)]">
              <span className="min-w-0 truncate">{live.error}</span>
              <button type="button" onClick={() => void live.connect()} className="shrink-0 cursor-pointer font-mono text-[10px] font-bold uppercase underline">
                Retry
              </button>
            </div>
          ) : null}

          <div ref={threadRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Ask me about the business, or hit <span className="font-semibold text-foreground">Go Live</span> to talk in real time. I&apos;ll move around the dashboard and prepare the work. Anything sent to a customer or binding waits for your confirm.
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

function engineLabel(engine: Extract<AssistantMsg, { role: "assistant" }>["engine"]) {
  if (engine === "openai-live") return "GPT-Live 1";
  if (engine === "openai") return "GPT-6 Luna";
  if (engine === "grok") return "Grok";
  return "Offline engine";
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
        {m.engine ? <MonoLabel className="px-1 text-muted-foreground">{engineLabel(m.engine)}</MonoLabel> : null}
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
