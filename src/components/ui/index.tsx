import type { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[10px] uppercase tracking-[0.05em]", className)}>{children}</span>;
}

/**
 * A board panel. `id` is a stable anchor (e.g. `ops-approvals`) the agent console uses to scroll to
 * and highlight a panel — keep the ids listed in docs/tasks/README.md stable.
 */
export function Panel({ id, title, code, right, children, className }: { id?: string; title: string; code?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("min-w-0 scroll-mt-4 rounded border border-border bg-card", className)}>
      <header className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-baseline gap-2">
          {code ? <MonoLabel className="shrink-0 text-muted-foreground">{code}</MonoLabel> : null}
          <h3 className="min-w-0 text-xs font-bold uppercase tracking-tight break-words">{title}</h3>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

const tones = {
  ok: "border-accent/30 bg-accent/10 text-accent",
  warn: "border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]",
  block: "border-destructive/30 bg-destructive/10 text-destructive",
  neutral: "border-border bg-secondary text-muted-foreground",
  info: "border-[var(--info)]/30 bg-[var(--info)]/10 text-[var(--info)]",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={cn("inline-flex shrink-0 items-center whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide", tones[tone])}>{children}</span>;
}

export function Btn({ children, variant = "default", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "accent" | "destructive" | "ghost" }) {
  const v = {
    default: "bg-card text-foreground hover:bg-secondary border-border",
    accent: "bg-accent text-accent-foreground hover:bg-accent/90 border-accent",
    destructive: "bg-card text-destructive hover:bg-destructive/10 border-destructive/40",
    ghost: "bg-transparent text-muted-foreground hover:text-foreground border-transparent",
  }[variant];
  return (
    <button
      className={cn("inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm border px-3 py-1.5 text-[11px] pointer-coarse:min-h-10 font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50", v, className)}
      {...props}
    >
      {children}
    </button>
  );
}
