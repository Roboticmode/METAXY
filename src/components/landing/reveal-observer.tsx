"use client";

import { useEffect } from "react";

/**
 * One observer for the whole landing page. Any element with `data-reveal` fades/rises in
 * the first time it enters the viewport. Sections stay server components: they only add
 * the attribute (and an optional `--landing-delay` style for staggering).
 *
 * Motion is opt-in: `landing-motion` is added to <html> only when JS runs and the visitor
 * hasn't asked for reduced motion, so nothing is ever hidden for no-JS / reduced-motion users.
 */
export function RevealObserver() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches || !("IntersectionObserver" in window)) return;

    const root = document.documentElement;
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    // Anything already on screen shows immediately, so above-the-fold content never blinks.
    const vh = window.innerHeight;
    for (const el of items) {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.dataset.revealed = "";
    }
    root.classList.add("landing-motion");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.revealed = "";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    items.filter((el) => !("revealed" in el.dataset)).forEach((el) => io.observe(el));

    const onChange = () => {
      if (reduce.matches) {
        root.classList.remove("landing-motion");
        io.disconnect();
      }
    };
    reduce.addEventListener("change", onChange);

    return () => {
      io.disconnect();
      reduce.removeEventListener("change", onChange);
      root.classList.remove("landing-motion");
    };
  }, []);

  return null;
}
