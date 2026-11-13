import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/components/ui";

export type PlaceholderArt = "app" | "board" | "chat" | "checklist" | "radar" | "memory";

export interface ScreenshotFrameProps {
  /** What the screenshot shows, e.g. "Operations board". Used for the placeholder label and default alt text. */
  label: string;
  /** Optional real screenshot in `public/`, e.g. "/screenshots/dashboard.png". Without it, tasteful placeholder art is shown. */
  src?: string;
  alt?: string;
  /** Intrinsic size of `src` (prevents layout shift). Defaults to a 16:10 capture. */
  width?: number;
  height?: number;
  /** Which placeholder sketch to draw when there's no `src`. */
  art?: PlaceholderArt;
  /** Address shown in the fake browser bar. */
  url?: string;
  /** Hide the browser chrome (for small tiles). */
  chrome?: boolean;
  /** CSS aspect ratio of the viewport area, e.g. "16 / 10". */
  aspect?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Extra overlay content (e.g. annotation pins) positioned over the viewport. */
  children?: ReactNode;
}

/**
 * A browser-framed screenshot. Drop a real PNG into `public/screenshots/` and pass `src`;
 * until then it renders a sketch of the METAXY layout with a clear "screenshot" label.
 */
export function ScreenshotFrame({
  label,
  src,
  alt,
  width = 2880,
  height = 1800,
  art = "app",
  url = "metaxy.app/dashboard",
  chrome = true,
  aspect = "16 / 10",
  priority,
  sizes = "(min-width: 1280px) 1200px, 100vw",
  className,
  children,
}: ScreenshotFrameProps) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-xl border border-black/10 bg-card shadow-[0_1px_0_0_oklch(1_0_0/0.6)_inset,0_30px_80px_-20px_oklch(0.13_0_0/0.35),0_12px_24px_-12px_oklch(0.13_0_0/0.18)]",
        className,
      )}
    >
      {chrome ? (
        <div className="flex h-9 items-center gap-3 border-b border-border bg-secondary/80 px-3.5" aria-hidden>
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </div>
          <div className="mx-auto flex h-5 w-full max-w-[280px] items-center justify-center gap-1.5 rounded-md bg-background px-3 font-mono text-[10px] text-muted-foreground">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="truncate">{url}</span>
          </div>
          <div className="w-[42px]" />
        </div>
      ) : null}

      <div className="relative w-full" style={{ aspectRatio: aspect }}>
        {src ? (
          <Image
            src={src}
            alt={alt ?? `Screenshot of the METAXY ${label}`}
            width={width}
            height={height}
            priority={priority}
            sizes={sizes}
            className="absolute inset-0 size-full object-cover object-top"
          />
        ) : (
          <div role="img" aria-label={alt ?? `Placeholder for a screenshot of the ${label}`} className="absolute inset-0 bg-background">
            <Sketch art={art} />
            <div className="absolute inset-0 grid place-items-center p-4" aria-hidden>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground shadow-sm backdrop-blur">
                <span className="size-1.5 rounded-full bg-accent" />
                Screenshot · {label}
              </span>
            </div>
          </div>
        )}
        {children}
      </div>
    </figure>
  );
}

/* ── Placeholder sketches: quiet wireframes of the real layout, never fake data ── */

const bar = "rounded-[3px] bg-foreground/[0.07]";

function Sketch({ art }: { art: PlaceholderArt }) {
  if (art === "app") return <AppSketch />;
  return (
    <div className="absolute inset-0 p-[6%]" aria-hidden>
      {art === "board" ? <BoardSketch /> : null}
      {art === "chat" ? <ChatSketch /> : null}
      {art === "checklist" ? <ChecklistSketch /> : null}
      {art === "radar" ? <RadarSketch /> : null}
      {art === "memory" ? <MemorySketch /> : null}
    </div>
  );
}

function AppSketch() {
  return (
    <div className="absolute inset-0 flex flex-col" aria-hidden>
      <div className="flex h-[7%] items-center gap-[2%] border-b border-border px-[2%]">
        <span className="size-[1.2vmin] min-h-2 min-w-2 bg-foreground/70" />
        <span className={cn(bar, "h-[28%] w-[8%]")} />
        <span className={cn(bar, "ml-auto h-[40%] w-[12%] bg-[var(--warning)]/20")} />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-[17%] flex-col gap-[5%] border-r border-border bg-secondary/60 p-[1.5%]">
          <span className={cn(bar, "h-[3%] w-[70%]")} />
          <span className={cn(bar, "h-[10%] w-full")} />
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={cn("h-[4.5%] w-full rounded-[3px]", i === 0 ? "bg-foreground/80" : "bg-foreground/[0.06]")} />
          ))}
        </div>
        <div className="grid flex-1 grid-cols-3 gap-[2%] bg-card p-[2%]">
          <div className="col-span-2 flex flex-col gap-[4%] rounded border border-border p-[3%]">
            <span className={cn(bar, "h-[5%] w-[35%]")} />
            <span className="h-[26%] w-full rounded border border-[var(--warning)]/30 bg-[var(--warning)]/[0.06]" />
            <span className={cn(bar, "h-[12%] w-full")} />
            <span className={cn(bar, "h-[12%] w-[85%]")} />
            <span className={cn(bar, "h-[12%] w-[92%]")} />
          </div>
          <div className="flex flex-col gap-[4%] rounded border border-border p-[4%]">
            <span className={cn(bar, "h-[5%] w-[50%]")} />
            {[80, 64, 90, 72, 58, 76].map((w, i) => (
              <span key={i} className="flex items-center gap-[6%]">
                <span className="size-[0.9vmin] min-h-1.5 min-w-1.5 rounded-full bg-accent/50" />
                <span className={cn(bar, "h-[0.9vmin] min-h-1.5")} style={{ width: `${w}%` }} />
              </span>
            ))}
          </div>
        </div>
        <div className="flex w-[25%] flex-col gap-[3%] border-l border-border bg-card p-[2%]">
          <span className={cn(bar, "h-[4%] w-[55%]")} />
          <span className="h-[9%] w-[78%] rounded-lg rounded-tl-sm bg-foreground/[0.06]" />
          <span className="ml-auto h-[13%] w-[82%] rounded-lg rounded-tr-sm bg-accent/15" />
          <span className="h-[6%] w-[60%] rounded-lg rounded-tl-sm bg-foreground/[0.06]" />
          <span className="ml-auto h-[10%] w-[74%] rounded-lg rounded-tr-sm bg-accent/15" />
          <span className="mt-auto h-[6%] w-full rounded border border-border" />
        </div>
      </div>
    </div>
  );
}

function BoardSketch() {
  return (
    <div className="grid h-full grid-cols-3 gap-3">
      {[0, 1, 2].map((c) => (
        <div key={c} className="flex flex-col gap-2 rounded border border-border bg-card p-2">
          <span className={cn(bar, "h-2 w-1/2")} />
          {[0, 1, 2].slice(0, 3 - (c % 2)).map((r) => (
            <span key={r} className={cn("h-8 rounded border", c === 0 && r === 0 ? "border-[var(--warning)]/30 bg-[var(--warning)]/[0.07]" : "border-border bg-secondary/60")} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ChatSketch() {
  return (
    <div className="mx-auto flex h-full max-w-[75%] flex-col justify-center gap-2.5">
      <span className="h-6 w-[62%] rounded-xl rounded-tl-sm bg-foreground/[0.07]" />
      <span className="ml-auto h-9 w-[78%] rounded-xl rounded-tr-sm bg-accent/15" />
      <span className="h-5 w-[44%] rounded-xl rounded-tl-sm bg-foreground/[0.07]" />
      <span className="ml-auto h-6 w-[58%] rounded-xl rounded-tr-sm bg-accent/15" />
    </div>
  );
}

function ChecklistSketch() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      {[1, 1, 0, 0, 0].map((done, i) => (
        <span key={i} className="flex items-center gap-2.5">
          <span className={cn("grid size-3.5 shrink-0 place-items-center rounded-sm border", done ? "border-accent/60 bg-accent/20" : "border-foreground/20")} />
          <span className={cn(bar, "h-2")} style={{ width: `${[70, 55, 82, 64, 48][i]}%` }} />
        </span>
      ))}
    </div>
  );
}

function RadarSketch() {
  return (
    <div className="relative mx-auto aspect-square h-full max-w-full">
      {[100, 70, 40].map((s) => (
        <span key={s} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/10" style={{ width: `${s}%`, height: `${s}%` }} />
      ))}
      <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/70" />
      {[
        [28, 30],
        [66, 22],
        [74, 62],
        [36, 72],
        [52, 40],
      ].map(([x, y], i) => (
        <span key={i} className="absolute size-1.5 rounded-full bg-accent/70" style={{ left: `${x}%`, top: `${y}%` }} />
      ))}
    </div>
  );
}

function MemorySketch() {
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex items-center gap-2.5 rounded border border-border bg-card p-2">
          <span className="size-5 shrink-0 rounded-full bg-foreground/10" />
          <span className="flex flex-1 flex-col gap-1">
            <span className={cn(bar, "h-1.5 w-1/3")} />
            <span className={cn(bar, "h-1.5 w-2/3")} />
          </span>
          <span className="h-3 w-8 rounded-sm bg-accent/15" />
        </span>
      ))}
    </div>
  );
}
