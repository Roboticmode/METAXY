"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MonitorPlay, Presentation, X } from "lucide-react";
import { useMetaxy } from "@/lib/store";
import { DEMO_AFTER } from "@/lib/presenter/script";
import { cn } from "@/components/ui";

type SlideState = { type: "metaxy:slide-state"; n: number; total: number; title: string; time: string; notes: string };

/**
 * Presenter mode: the pitch deck (served same-origin at /pitch) over the dashboard, beside the agent dock.
 * "Live demo" hides the deck (kept mounted, so it stays on its slide); "Slides" brings it back.
 * The store's presenter.slide drives the deck; the deck reports its slide, notes and timing back.
 */
export function PresenterStage({ right }: { right: number }) {
  const { state, setPresenter } = useMetaxy();
  const p = state.presenter;
  const frame = useRef<HTMLIFrameElement>(null);
  const reported = useRef(0);

  // deck → store
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const d = e.data as Partial<SlideState>;
      if (d?.type !== "metaxy:slide-state" || typeof d.n !== "number") return;
      reported.current = d.n;
      setPresenter({ slide: d.n, total: d.total ?? 12, title: d.title ?? "", time: d.time ?? "", notes: d.notes ?? "" });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [setPresenter]);

  // store → deck
  useEffect(() => {
    if (!p.on || reported.current === p.slide) return;
    frame.current?.contentWindow?.postMessage({ type: "metaxy:slide", n: p.slide }, window.location.origin);
  }, [p.on, p.slide]);

  // keep keyboard control on the deck when the slides come back
  useEffect(() => {
    if (p.on && p.view === "slides") frame.current?.focus();
  }, [p.on, p.view]);

  if (!p.on) return null;
  const slides = p.view === "slides";

  return (
    <>
      <div
        className={cn("absolute inset-y-0 left-0 z-30 flex flex-col bg-[oklch(0.93_0.003_95)]", !slides && "hidden")}
        style={{ right }}
        aria-label="Pitch deck"
        role="region"
      >
        <iframe
          ref={frame}
          src="/pitch"
          title="METAXY pitch deck"
          className="min-h-0 w-full flex-1 border-0"
          onLoad={() => {
            reported.current = 0;
            frame.current?.contentWindow?.postMessage({ type: "metaxy:slide", n: p.slide }, window.location.origin);
          }}
        />
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-card px-3 py-1.5 font-mono text-[11px]">
          <div className="flex min-w-0 items-center gap-1">
            <BarButton label="Previous slide" onClick={() => setPresenter({ slide: p.slide - 1 })}>
              <ChevronLeft className="size-3.5" />
            </BarButton>
            <span className="tabular-nums">
              {String(p.slide).padStart(2, "0")} / {p.total}
            </span>
            <BarButton label="Next slide" onClick={() => setPresenter({ slide: p.slide + 1 })}>
              <ChevronRight className="size-3.5" />
            </BarButton>
            <span className="ml-2 truncate text-muted-foreground">{p.time}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <BarButton label="Show the live demo" onClick={() => setPresenter({ view: "demo" })} wide>
              <MonitorPlay className="size-3.5" /> Live demo
            </BarButton>
            <BarButton label="Exit presenter mode" onClick={() => setPresenter({ on: false })}>
              <X className="size-3.5" />
            </BarButton>
          </div>
        </div>
      </div>
      {!slides ? (
        <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1 rounded-full border border-border bg-card/95 px-2 py-1 font-mono text-[11px] shadow-lg">
          <span className="px-1 font-bold uppercase text-emerald-700">Live demo</span>
          <BarButton
            label="Back to the slides"
            wide
            onClick={() => setPresenter({ view: "slides", slide: p.slide <= DEMO_AFTER ? DEMO_AFTER + 1 : p.slide })}
          >
            <Presentation className="size-3.5" /> Slides
          </BarButton>
        </div>
      ) : null}
    </>
  );
}

function BarButton({ label, onClick, wide, children }: { label: string; onClick: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-6 cursor-pointer items-center gap-1 rounded-sm border border-border hover:bg-secondary",
        wide ? "px-2 font-bold uppercase" : "w-6 justify-center",
      )}
    >
      {children}
    </button>
  );
}
