"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const links = [
  { label: "How it works", href: "#how" },
  { label: "Modules", href: "#modules" },
  { label: "Who it's for", href: "#who" },
  { label: "Trust", href: "#trust" },
];

/**
 * Compact floating nav that slides in once the hero (and its own nav) has scrolled away.
 * Watches `#landing-hero-end`, a zero-height marker placed right after the hero.
 */
export function LandingNav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const marker = document.getElementById("landing-hero-end");
    if (!marker) return;
    const io = new IntersectionObserver(([e]) => setVisible(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(marker);
    return () => io.disconnect();
  }, []);

  return (
    <div
      data-visible={visible}
      className="landing-nav landing-dark fixed left-1/2 top-3 z-20 w-[calc(100%-24px)] max-w-[760px] sm:top-4"
    >
      <nav
        aria-label="Sections"
        className="flex h-14 items-center gap-2 rounded-full border border-white/10 bg-[oklch(0.155_0.008_130/0.82)] pl-5 pr-2 text-[var(--landing-paper)] shadow-[0_20px_40px_-20px_oklch(0_0_0/0.6)] backdrop-blur-xl backdrop-saturate-150"
      >
        <a href="#top" className="mr-auto flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] lg:mr-4">
          <span aria-hidden className="size-2.5 bg-[var(--landing-paper)]" />
          METAXY
        </a>
        <ul className="mr-auto hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="inline-flex h-10 items-center rounded-full px-3 text-[13px] text-[var(--landing-paper)]/80 transition-colors hover:bg-white/5 hover:text-[var(--landing-paper)]">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="/dashboard"
          className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--landing-paper)] px-4 text-[13px] font-medium text-[var(--landing-ink)] transition-colors hover:bg-white"
        >
          Try the demo <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </a>
      </nav>
    </div>
  );
}
