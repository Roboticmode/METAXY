"use client";

import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MetaxyHero } from "./metaxy-hero";

/**
 * Only the default slide is in this module's static graph. Woven Light (three.js + framer-motion) and
 * Grain Gradient (@paper-design/shaders-react) are separate chunks, fetched when first selected.
 */
const WovenSlide = dynamic(() => import("./woven-slide"), { ssr: false, loading: () => <SlideFallback /> });
const GrainSlide = dynamic(() => import("./grain-slide"), { ssr: false, loading: () => <SlideFallback /> });

const VARIANTS = [
  { id: "video", name: "Retro field video" },
  { id: "woven", name: "Woven Light" },
  { id: "grain", name: "Grain Gradient" },
] as const;

type VariantId = (typeof VARIANTS)[number]["id"];

const STORAGE_KEY = "metaxy-hero-variant";

function isVariant(v: unknown): v is VariantId {
  return VARIANTS.some((x) => x.id === v);
}

function SlideFallback() {
  return (
    <div
      className="flex h-dvh min-h-[560px] w-full items-center justify-center bg-[var(--landing-ink)] font-mono text-[11px] uppercase tracking-[0.2em] text-white/50"
      role="status"
    >
      Loading hero…
    </div>
  );
}

/**
 * The landing hero as a toggleable carousel of variants, for comparing them in place.
 * - SSR/first paint is always the video hero (page stays static); the saved choice or `?hero=` applies after mount.
 * - No autoplay. Only the active slide is mounted, so WebGL contexts and videos are released on switch.
 */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let id: string | null = null;
    try {
      id = new URLSearchParams(window.location.search).get("hero");
    } catch {}
    if (!isVariant(id)) {
      try {
        id = window.localStorage.getItem(STORAGE_KEY);
      } catch {}
    }
    const found = VARIANTS.findIndex((v) => v.id === id);
    if (found > 0) setIndex(found);
  }, []);

  const go = useCallback((next: number) => {
    const i = (next + VARIANTS.length) % VARIANTS.length;
    setIndex(i);
    const id = VARIANTS[i].id;
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {}
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("hero", id);
      window.history.replaceState(window.history.state, "", url);
    } catch {}
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const t = e.target as HTMLElement;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    }
  };

  const current = VARIANTS[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Hero variants"
      onKeyDown={onKeyDown}
      className="relative bg-[var(--landing-ink)]"
    >
      <div
        key={current.id}
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${VARIANTS.length}: ${current.name}`}
      >
        {current.id === "video" ? <MetaxyHero /> : current.id === "woven" ? <WovenSlide /> : <GrainSlide />}
      </div>

      <div
        role="group"
        aria-label="Choose hero variant"
        style={{ top: "calc(max(560px, 100dvh) - 3.25rem)" }}
        className="landing-dark absolute inset-x-0 z-30 mx-auto flex w-fit max-w-[calc(100%-24px)] items-center gap-1 rounded-full border border-white/15 bg-[oklch(0.155_0.008_130/0.78)] p-1 text-[var(--landing-paper)] shadow-[0_12px_32px_-12px_oklch(0_0_0/0.7)] backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous hero variant"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <div className="flex min-w-0 items-center gap-2.5 px-1">
          <div className="flex items-center gap-1">
            {VARIANTS.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${v.name} hero`}
                aria-current={i === index ? "true" : undefined}
                className="group inline-flex size-6 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-white"
              >
                <span
                  aria-hidden
                  className={`block rounded-full transition-all ${
                    i === index ? "h-1.5 w-5 bg-[var(--landing-paper)]" : "size-1.5 bg-white/40 group-hover:bg-white/70"
                  }`}
                />
              </button>
            ))}
          </div>
          <span
            aria-live="polite"
            className="w-[9.5rem] truncate text-center font-mono text-[10px] uppercase tracking-[0.14em] text-white/80 sm:w-[10.5rem]"
          >
            {current.name}
          </span>
        </div>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next hero variant"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}
