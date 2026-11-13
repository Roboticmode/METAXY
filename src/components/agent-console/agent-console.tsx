"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Mic, MicOff, PhoneOff, Send, ShieldAlert, Sparkles, X } from "lucide-react";
import { SUGGESTED_PROMPTS } from "@/lib/assistant/types";
import { useMetaxy, type AssistantMsg } from "@/lib/store";
import { AgentOrb } from "@/components/agent-orb";
import { Badge, Btn, MonoLabel, cn } from "@/components/ui";
import { ThinkingOrb } from "@/components/ui/thinking-orbs";
import { useLiveVoice } from "./use-live-voice";

/**
 * "Ask METAXY" — the owner talks to the agent (text via GPT-6 Luna or live voice via GPT-Live 1),
 * and the agent moves around the dashboard.
 * Launcher sits bottom-right (reserved corner, z-50). Ctrl/⌘+K toggles, Esc closes.
 */
export function AgentConsole() {
  const { state, askAssistant, confirmAction, cancelAction, getSnapshot, pushLiveTranscript, pushLiveMessage, pushLiveStep, runLiveTool } = useMetaxy();
  const { messages, busy } = state.assistant;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const live = useLiveVoice({ getSnapshot, pushLiveTranscript, pushLiveMessage, pushLiveStep, runLiveTool });
  const liveOn = live.status === "live" || live.status === "connecting";
  const liveOrb = live.status === "live" ? (live.muted ? "breathing" : "listening") : live.status === "connecting" ? "connecting" : "working";

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
    if (live.status === "live" && live.sendTextTurn(text)) return;
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
          "metaxy-launcher fixed right-4 bottom-[calc(var(--metaxy-bottom-inset)+1rem)] z-50 flex h-12 min-w-12 cursor-pointer items-center justify-center gap-2.5 rounded-full border border-white/10 bg-ink px-3.5 text-paper sm:pr-3 sm:pl-4 shadow-[0_20px_40px_-20px_oklch(0_0_0/0.6)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink motion-reduce:transition-none",
          open && "max-sm:hidden",
        )}
      >
        {open ? <X className="size-4" /> : liveOn || busy ? <AgentOrb theme="dark" state={liveOrb} /> : <Sparkles className="size-4 text-accent" />}
        <span className="text-[14px] font-medium max-sm:sr-only">{open ? "Close" : live.status === "live" ? "Live · METAXY" : "Ask METAXY"}</span>
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
              {liveOn || busy ? (
                <AgentOrb theme="dark" state={liveOrb} />
              ) : (
                <span className="grid size-5 place-items-center" aria-hidden>
                  <span className="size-2.5 bg-paper" />
                </span>
              )}
              <div className="min-w-0">
                <h2 className="text-[16px] leading-tight font-medium tracking-[-0.01em]">Ask METAXY</h2>
                <p className="truncate text-[12.5px] text-paper/65">Agents prepare. You decide.</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={toggleLive}
                disabled={live.status === "connecting"}
                aria-pressed={live.status === "live"}
                title={live.status === "live" ? "End live voice session" : "Start live voice with GPT-Live 1"}
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors disabled:cursor-wait disabled:opacity-70",
                  live.status === "live"
                    ? "border-transparent bg-accent text-ink hover:bg-accent/90"
                    : live.status === "connecting"
                      ? "border-accent/40 bg-accent/15 text-paper"
                      : "border-white/15 text-paper hover:border-white/35 hover:bg-white/5",
                )}
              >
                {live.status === "live" ? <PhoneOff className="size-3.5" /> : <Mic className="size-3.5" />}
                <span>{live.status === "live" ? "End" : live.status === "connecting" ? "Linking…" : "Go live"}</span>
              </button>
              <button type="button" onClick={close} className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-paper/70 transition-colors hover:bg-white/[0.08] hover:text-paper" aria-label="Close console">
                <X className="size-4" />
              </button>
            </div>
          </header>

          {liveOn ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-accent/25 bg-accent/[0.08] px-5 py-2.5 text-[13px]" role="status">
              <div className="flex min-w-0 items-center gap-2">
                <AgentOrb state={liveOrb} />
                <span className="truncate font-medium text-accent-ink">
                  {live.status === "connecting"
                    ? "Connecting GPT-Live 1…"
                    : live.audioMode === "text-only"
                      ? `Live (text → voice) · ${live.models?.live ?? "gpt-live-1"}`
                      : `Live voice · ${live.models?.live ?? "gpt-live-1"} + ${live.models?.backend ?? "gpt-6-luna"}`}
                </span>
              </div>
              {live.status === "live" && live.audioMode === "mic" ? (
                <button
                  type="button"
                  onClick={live.toggleMute}
                  aria-pressed={live.muted}
                  className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-hairline bg-card px-3 text-[12.5px] font-medium transition-colors hover:border-ink/25"
                >
                  {live.muted ? <MicOff className="size-3.5 text-warning-ink" /> : <Mic className="size-3.5" />}
                  <span>{live.muted ? "Muted" : "Mute"}</span>
                </button>
              ) : live.status === "live" ? (
                <span className="shrink-0 text-[12.5px] text-accent-ink">Type below</span>
              ) : null}
            </div>
          ) : live.status === "error" && live.error ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--warning)]/30 bg-[var(--warning)]/10 px-5 py-2.5 text-[13px] text-warning-ink" role="alert">
              <span className="min-w-0 truncate">{live.error}</span>
              <button type="button" onClick={() => void live.connect()} className="h-8 shrink-0 cursor-pointer rounded-full bg-card px-3 text-[12.5px] font-medium shadow-sm">
                Retry
              </button>
            </div>
          ) : null}

          <div ref={threadRef} className="metaxy-scroll min-h-0 flex-1 space-y-3 overflow-y-auto bg-paper/50 p-4" aria-live="polite">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-card px-4 py-3 shadow-soft">
                  <ThinkingOrb state={live.status === "live" ? "listening" : live.status === "connecting" ? "connecting" : "composing"} size={32} theme="light" color="#1f8a5f" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-[15px] leading-snug font-medium">{live.status === "live" ? "Listening live" : "Ready when you are"}</p>
                    <p className="text-[13px] leading-snug text-muted-foreground">
                      Ask below, or press <span className="font-medium text-foreground">Go live</span> to talk in real time.
                    </p>
                  </div>
                </div>
                <p className="text-[14px] leading-relaxed text-ink-3">
                  I&apos;ll move around the dashboard and prepare the work. Anything sent to a customer or binding waits for your confirm.
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
                <AgentOrb state={live.status === "live" ? "solving" : "working"} />
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
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-ink px-3.5 py-2.5 text-[14px] leading-relaxed text-paper">{m.text}</div>
      </div>
    );
  }
  if (m.role === "assistant") {
    return (
      <div className="max-w-[92%] space-y-1">
        <div className="rounded-2xl rounded-tl-md border border-hairline bg-card px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-line shadow-[0_1px_2px_oklch(0.155_0.008_130/0.05)]">{m.text}</div>
        {m.engine ? <MonoLabel className="px-1 text-[10.5px] text-muted-foreground">{engineLabel(m.engine)}</MonoLabel> : null}
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
