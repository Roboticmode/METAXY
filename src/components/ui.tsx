import type { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[10px] uppercase tracking-[0.05em]", className)}>{children}</span>;
}

export function Panel({ title, code, right, children, className }: { title: string; code?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded border border-border bg-card", className)}>
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          {code ? <MonoLabel className="text-muted-foreground">{code}</MonoLabel> : null}
          <h3 className="text-xs font-bold uppercase tracking-tight">{title}</h3>
        </div>
        {right}
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
  return <span className={cn("inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide", tones[tone])}>{children}</span>;
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
      className={cn("inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50", v, className)}
      {...props}
    >
      {children}
    </button>
  );
}
