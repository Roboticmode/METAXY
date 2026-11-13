import type { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Small technical label (eyebrow), like the landing's `01 — The problem`. Use sparingly, never for body copy. */
export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[11px] font-medium uppercase tracking-[0.12em]", className)}>{children}</span>;
}

const panelTones = {
  /** the default card: white on paper, hairline, soft shadow */
  default: "border-hairline bg-card shadow-soft",
  /** the one thing on the board that needs the owner: a touch more lift */
  hero: "border-hairline bg-card shadow-lift",
  /** reference material (policies, briefs): no shadow, sits back on the paper */
  quiet: "border-hairline bg-paper-2/60",
} as const;

/**
 * A board panel. `id` is a stable anchor (e.g. `ops-approvals`) the agent console uses to scroll to
 * and highlight a panel — keep the ids listed in docs/tasks/README.md stable.
 *
 * `code` renders as a small mono eyebrow above a sentence-case title.
 */
export function Panel({
  id,
  title,
  code,
  right,
  children,
  className,
  tone = "default",
  description,
}: {
  id?: string;
  title: string;
  code?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: keyof typeof panelTones;
  description?: ReactNode;
}) {
  const big = tone === "hero";
  return (
    <section id={id} className={cn("min-w-0 scroll-mt-4 rounded-2xl border", panelTones[tone], className)}>
      <header className={cn("flex flex-wrap items-end justify-between gap-x-3 gap-y-2 px-4 pt-4 sm:px-5", big && "sm:pt-5")}>
        <div className="min-w-0">
          {code ? <MonoLabel className="block text-muted-foreground">{code}</MonoLabel> : null}
          <h3 className={cn("mt-1 min-w-0 font-medium tracking-[-0.02em] text-balance break-words text-foreground", big ? "text-[clamp(1.25rem,2vw,1.5rem)] leading-tight" : tone === "quiet" ? "text-base leading-snug" : "text-[17px] leading-snug")}>
            {title}
          </h3>
          {description ? <p className="mt-1 max-w-[60ch] text-[13.5px] leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </header>
      <div className={cn("px-4 pt-3 pb-4 sm:px-5 sm:pb-5", big && "pt-4")}>{children}</div>
    </section>
  );
}

const tones = {
  ok: "bg-accent/12 text-accent-ink",
  warn: "bg-[var(--warning)]/14 text-warning-ink",
  block: "bg-destructive/10 text-destructive-ink",
  neutral: "bg-ink/[0.06] text-ink-3",
  info: "bg-[var(--info)]/10 text-info-ink",
} as const;

/** Status pill. Sentence case, 12 px, readable. */
export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium leading-none", tones[tone])}>
      {children}
    </span>
  );
}

/** Pill button. `accent` is the primary action (green, AA with white text); `default` is a hairline pill. */
export function Btn({ children, variant = "default", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "accent" | "destructive" | "ghost" }) {
  const v = {
    default: "border-hairline bg-card text-foreground hover:border-ink/25 hover:bg-paper",
    accent: "border-transparent bg-accent-strong text-white shadow-[0_8px_20px_-10px_oklch(0.5_0.115_160/0.7)] hover:bg-accent-ink",
    destructive: "border-hairline bg-card text-destructive-ink hover:border-destructive/40 hover:bg-destructive/5",
    ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-ink/5 hover:text-foreground",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-4 py-1.5 text-[13.5px] leading-tight font-medium transition-colors pointer-coarse:min-h-11 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0",
        v,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Scroll container + grid shared by every board: paper, generous gutters, room for the agent launcher. */
export const boardGrid =
  "metaxy-scroll grid min-h-0 flex-1 grid-cols-1 content-start gap-4 overflow-y-auto overscroll-contain p-3 pb-28 sm:p-5 sm:pb-28 xl:gap-5 xl:p-6 xl:pb-28 min-[1400px]:grid-cols-5";
