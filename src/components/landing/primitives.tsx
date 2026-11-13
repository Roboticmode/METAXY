import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/components/ui";

/** Stagger helper: `{...reveal(2)}` → fades in 2 beats after the first item. */
export function reveal(step = 0, kind: "rise" | "fade" = "rise") {
  return {
    "data-reveal": kind === "fade" ? "fade" : "",
    style: { "--landing-delay": `${step * 90}ms` } as CSSProperties,
  };
}

/** Small technical label, e.g. `§02 — The problem`. JetBrains Mono, like the dashboard. */
export function Eyebrow({ index, children, className }: { index?: string; children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em]", className)}>
      {/* darker step of the accent on light backgrounds keeps small text above WCAG AA */}
      {index ? <span className="text-[oklch(0.47_0.11_160)] [.landing-dark_&]:text-accent">{index}</span> : null}
      {index ? <span aria-hidden className="h-px w-8 bg-current opacity-30" /> : null}
      <span>{children}</span>
    </p>
  );
}

/** Section heading: big, confident, tight tracking. */
export function Heading({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2
      id={id}
      className={cn(
        "max-w-[18ch] text-balance text-[clamp(2.1rem,5.2vw,4.4rem)] font-medium leading-[0.98] tracking-[-0.045em]",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function Lede({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("max-w-[58ch] text-pretty text-[clamp(1rem,1.35vw,1.175rem)] leading-relaxed", className)}>{children}</p>;
}

/** Page gutter + max width used by every section. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10", className)}>{children}</div>;
}

/** Dark-on-light button used outside the hero. 44 px tall for comfortable tap targets. */
export function CtaLink({
  href,
  children,
  tone = "dark",
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: "dark" | "light" | "ghost-light" | "ghost-dark";
  className?: string;
}) {
  const tones = {
    dark: "bg-foreground text-background hover:bg-foreground/85",
    light: "bg-[var(--landing-paper)] text-[var(--landing-ink)] hover:bg-white",
    "ghost-light": "border border-[var(--landing-paper)]/25 text-[var(--landing-paper)] hover:border-[var(--landing-paper)]/50 hover:bg-white/5",
    "ghost-dark": "border border-foreground/15 text-foreground hover:border-foreground/35 hover:bg-foreground/[0.03]",
  }[tone];
  return (
    <a
      href={href}
      className={cn(
        "group inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium transition-colors",
        tones,
        className,
      )}
    >
      {children}
    </a>
  );
}
