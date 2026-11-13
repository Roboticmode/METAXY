"use client";

import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowRight, Check, Mic, MicOff, PanelRightClose, PanelRightOpen, PhoneOff, Plus, Presentation, Send, ShieldAlert, X } from "lucide-react";
import { SUGGESTED_PROMPTS } from "@/lib/assistant/types";
import { presenterCue } from "@/lib/presenter/script";
import { useMetaxy, type AgentSession, type AssistantMsg, type WorkspaceAgentRole } from "@/lib/store";
import { Badge, Btn, MonoLabel, cn } from "@/components/ui";
import { ThinkingOrb, type OrbState } from "@/components/ui/thinking-orbs";
import { AGENT_WIDTH_MAX, AGENT_WIDTH_MIN } from "@/components/use-columns";
import { useLiveVoice } from "./use-live-voice";

/**
 * Right-hand multi-agent rail. Mirrors the left navigation: same surface, collapsible,
 * and wide enough to spawn several agents. One of them can hold the live voice session.
 */
export function AgentDock({
  open,
  sheet,
  width,
  onOpenChange,
  onWidth,
}: {
  open: boolean;
  sheet: boolean;
  width: number;
  onOpenChange: (open: boolean) => void;
  onWidth: (width: number) => void;
}) {
  const {
    state,
    askAssistant,
    confirmAction,
    cancelAction,
    spawnAgent,
    setActiveAgent,
    closeAgent,
    setLiveAgent,
    setPresenter,
    getSnapshot,
    pushLiveTranscript,
    pushLiveMessage,
    pushLiveStep,
    runLiveTool,
  } = useMetaxy();
  const active = state.agents.find((agent) => agent.id === state.activeAgentId) ?? state.agents[0];
  const messages = active?.messages ?? [];
  const busy = active?.busy ?? false;
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const handoff = useRef(false);

  const live = useLiveVoice({ getSnapshot, pushLiveTranscript, pushLiveMessage, pushLiveStep, runLiveTool });
  const liveHere = !!active && state.liveAgentId === active.id && (live.status === "live" || live.status === "connecting");
  const pending = state.agents.reduce((n, agent) => n + (pendingConfirms(agent.messages) ? 1 : 0), 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open && sheet) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange, open, sheet]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, active?.id]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, busy, open, live.status, active?.id]);

  useEffect(() => {
    if (!handoff.current || live.status !== "idle") return;
    handoff.current = false;
    void live.connect();
  }, [live]);

  useEffect(() => {
    if (state.liveAgentId) return;
    if (live.status === "live" || live.status === "connecting") live.disconnect();
  }, [live, state.liveAgentId]);

  // presenter cue: sent once each time presenter mode starts during a live session
  // (a session opened while presenting already has it in its instructions)
  const cueSent = useRef(false);
  const presenting = state.presenter.on;
  useEffect(() => {
    if (!presenting) {
      cueSent.current = false;
      return;
    }
    if (live.status === "connecting") cueSent.current = true;
    if (cueSent.current || live.status !== "live") return;
    cueSent.current = true;
    live.sendCue(`${presenterCue()}\nPresenter mode has started on slide ${state.presenter.slide}. Call get_slide, then present from there.`);
  }, [presenting, live, state.presenter.slide]);

  const togglePresenter = () => {
    if (state.presenter.on) setPresenter({ on: false });
    else setPresenter({ on: true, view: "slides" });
  };

  const submit = (text: string) => {
    if (!active || !text.trim() || busy) return;
    setDraft("");
    if (liveHere && live.status === "live" && live.sendTextTurn(text)) return;
    void askAssistant(text, active.id);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(draft);
  };
  const toggleLive = () => {
    if (!active) return;
    const sessionOpen = live.status === "live" || live.status === "connecting";
    if (sessionOpen && state.liveAgentId === active.id) {
      handoff.current = false;
      live.disconnect();
      setLiveAgent(null);
      return;
    }
    if (sessionOpen) {
      live.disconnect();
      setLiveAgent(active.id);
      handoff.current = true;
      return;
    }
    setLiveAgent(active.id);
    void live.connect();
  };

  const startResize = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;
    const move = (ev: PointerEvent) => {
      onWidth(Math.min(AGENT_WIDTH_MAX, Math.max(AGENT_WIDTH_MIN, startW - (ev.clientX - startX))));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const liveAgent = state.agents.find((agent) => agent.id === state.liveAgentId);

  return (
    <aside
      id="agent-dock"
      aria-label="Agents"
      className={cn(
        "bg-secondary text-foreground",
        open && sheet && "fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-border pt-[env(safe-area-inset-top)] shadow-2xl",
        !open && "relative hidden w-10 shrink-0 flex-col border-l border-border xl:flex",
        open && !sheet && "relative flex min-h-0 shrink-0 flex-col border-l border-border",
      )}
      style={open && !sheet ? { width } : undefined}
    >
      {!open ? (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          aria-expanded={false}
          aria-controls="agent-console"
          className="flex h-full cursor-pointer flex-col items-center gap-3 py-3 hover:bg-foreground/5"
        >
          <PanelRightOpen className="size-4 text-muted-foreground" />
          <span className="relative">
            <ThinkingOrb state={live.status === "live" ? "listening" : "breathing"} size={20} theme="light" color="#10b981" aria-hidden />
            {pending ? <span className="absolute -top-1 -right-1 size-2 rounded-full bg-[var(--warning)]" /> : null}
          </span>
          <MonoLabel className="text-muted-foreground [writing-mode:vertical-rl]">Agents · live</MonoLabel>
        </button>
      ) : active ? (
        <section id="agent-console" aria-label={active.title} className="flex min-h-0 min-w-0 flex-1 flex-col">
          {open && !sheet ? (
            <button
              type="button"
              aria-label="Drag to resize agents"
              onPointerDown={startResize}
              className="absolute top-0 bottom-0 left-0 z-10 w-1.5 cursor-col-resize hover:bg-foreground/15"
            />
          ) : null}
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <ThinkingOrb state={orbFor(active, liveHere, live.muted, busy)} size={20} theme="light" color="#10b981" aria-hidden />
              <div className="min-w-0">
                <h2 className="truncate text-xs font-bold uppercase tracking-tight">{active.title}</h2>
                <MonoLabel className="text-muted-foreground">Agents prepare · you decide</MonoLabel>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={togglePresenter}
                aria-pressed={state.presenter.on}
                title={state.presenter.on ? "Leave presenter mode" : "Present the pitch deck (the agent can move slides and run the demo)"}
                className={cn(
                  "flex h-7 cursor-pointer items-center gap-1 rounded-sm border px-2 font-mono text-[10px] font-bold uppercase transition-colors",
                  state.presenter.on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                <Presentation className="size-3" />
                <span>{state.presenter.on ? `Slide ${state.presenter.view === "demo" ? "demo" : state.presenter.slide}` : "Present"}</span>
              </button>
              <button
                type="button"
                onClick={toggleLive}
                disabled={live.status === "connecting" && state.liveAgentId === active.id}
                title={liveHere ? "End live voice" : "Go live with this agent"}
                className={cn(
                  "flex h-7 cursor-pointer items-center gap-1 rounded-sm border px-2 font-mono text-[10px] font-bold uppercase transition-colors disabled:cursor-wait disabled:opacity-60",
                  liveHere
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700"
                    : "border-border text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                {liveHere && live.status === "live" ? <PhoneOff className="size-3" /> : <Mic className="size-3" />}
                <span>{liveHere ? (live.status === "connecting" ? "Linking…" : "End") : "Go Live"}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="grid size-7 cursor-pointer place-items-center rounded-sm text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                aria-label={sheet ? "Close agents" : "Collapse agents"}
              >
                <X className="size-4 xl:hidden" />
                <PanelRightClose className="hidden size-4 xl:block" />
              </button>
            </div>
          </header>
          <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2 py-1.5">
            {state.agents.map((agent) => {
              const selected = agent.id === active.id;
              const holdsLive = agent.id === state.liveAgentId && (live.status === "live" || live.status === "connecting");
              return (
                <div key={agent.id} className={cn("flex shrink-0 items-center rounded-full border", selected ? "border-foreground bg-foreground text-background" : "border-border")}>
                  <button type="button" onClick={() => setActiveAgent(agent.id)} className="cursor-pointer px-2.5 py-1 text-[11px] font-medium" aria-current={selected ? "true" : undefined}>
                    {agent.title}
                    {holdsLive ? " · live" : ""}
                  </button>
                  {state.agents.length > 1 ? (
                    <button
                      type="button"
                      aria-label={`Close ${agent.title}`}
                      onClick={() => closeAgent(agent.id)}
                      className="mr-1 grid size-4 cursor-pointer place-items-center rounded-full opacity-70 hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  ) : null}
                </div>
              );
            })}
            <button type="button" onClick={spawnAgent} className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
              <Plus className="size-3" /> Add agent
            </button>
          </div>

          {liveHere ? (
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px]">
              <div className="flex min-w-0 items-center gap-1.5">
                <ThinkingOrb
                  state={live.status === "connecting" ? "connecting" : live.muted ? "breathing" : "listening"}
                  size={20}
                  theme="light"
                  color="#059669"
                  aria-hidden
                />
                <span className="truncate font-medium">
                  {live.status === "connecting"
                    ? "Connecting GPT-Live 1…"
                    : live.audioMode === "text-only"
                      ? `Live (Text → Voice) · ${live.models?.live ?? "gpt-live-1"}`
                      : `Live voice · ${live.models?.live ?? "gpt-live-1"} + ${live.models?.backend ?? "gpt-6-luna"}`}
                </span>
              </div>
              {live.status === "live" && live.audioMode === "mic" ? (
                <button
                  type="button"
                  onClick={live.toggleMute}
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-sm border border-border bg-background/80 px-2 py-0.5 font-mono text-[10px] uppercase hover:bg-background"
                >
                  {live.muted ? <MicOff className="size-3 text-[var(--warning)]" /> : <Mic className="size-3" />}
                  <span>{live.muted ? "Muted" : "Mute"}</span>
                </button>
              ) : live.status === "live" ? (
                <MonoLabel className="shrink-0 text-emerald-700 dark:text-emerald-300">Type below</MonoLabel>
              ) : null}
            </div>
          ) : liveAgent && (live.status === "live" || live.status === "connecting") ? (
            <button type="button" onClick={() => setActiveAgent(liveAgent.id)} className="shrink-0 border-b border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-left text-[11px] text-emerald-800">
              Live voice is on {liveAgent.title}. Switch to that agent to talk.
            </button>
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
                <div className="flex items-center gap-2.5 rounded border border-border bg-secondary/50 px-2.5 py-2">
                  <ThinkingOrb state={orbFor(active, liveHere, live.muted, busy)} size={32} theme="light" color="#10b981" aria-hidden />
                  <div className="min-w-0">
                    <MonoLabel className="block text-foreground">{liveHere ? "Listening live" : "Ready"}</MonoLabel>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      Ask below or hit <span className="font-semibold text-foreground">Go Live</span> to talk in real time.
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  I&apos;ll move around the dashboard and prepare the work. Anything sent to a customer or binding waits for your confirm.
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
              <div className="flex items-center gap-2 px-1 py-1 text-muted-foreground" aria-label="METAXY is working">
                <ThinkingOrb state={liveHere ? "solving" : "working"} size={20} theme="light" color="#10b981" aria-hidden />
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
    </aside>
  );
}

function orbFor(agent: AgentSession, liveHere: boolean, muted: boolean, busy: boolean): OrbState {
  if (liveHere && busy) return "solving";
  if (liveHere) return muted ? "breathing" : "listening";
  if (busy) return roleOrb(agent.role);
  return "breathing";
}

function roleOrb(role: WorkspaceAgentRole): OrbState {
  if (role === "Planner") return "searching";
  if (role === "Books") return "shaping";
  if (role === "Client Desk") return "composing";
  return "working";
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
