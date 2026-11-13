"use client";

import ElsewhereHero from "@/components/ui/elsewhere-hero";
import { ctaLabel, useLandingSession } from "./auth-session";
import { DAY_POSTER, DAY_SRC, NIGHT_POSTER, NIGHT_SRC } from "./hero-media";

/**
 * METAXY landing hero: ElsewhereHero configured for our story.
 * Day/night = the owner's day job (or lectures) vs. the business after hours (metaxý: "in between").
 * Footage lives in ./hero-media.ts (see the TODO there about South African clips).
 */
export function MetaxyHero() {
  const { email } = useLandingSession();
  return (
    <ElsewhereHero
      daySrc={DAY_SRC}
      nightSrc={NIGHT_SRC}
      dayPoster={DAY_POSTER}
      nightPoster={NIGHT_POSTER}
      fadeTo="var(--landing-ink)"
      objectPosition="42% 50%"
      brand="METAXY"
      links={[
        { label: "How it works", href: "#how" },
        { label: "Modules", href: "#modules" },
        { label: "Who it's for", href: "#who" },
        { label: "Trust", href: "#trust" },
        ...(email ? [] : [{ label: "Sign in", href: "#signin" }]),
      ]}
      navCta={email ? { label: "Open workspace", href: "/dashboard" } : { label: "Open dashboard", href: "/dashboard" }}
      headline="From hustle to formal business."
      subline="An AI agent that answers your clients, chases payments and walks you through CIPC and SARS, with a command centre where you see and approve everything it does."
      primaryCta={{ label: ctaLabel(email), href: "/dashboard" }}
      secondaryCta={{ label: "How it works", href: "#how" }}
      sound={false}
      cycleCaption={{ day: "By day: lectures, the 9-to-5, the day job", night: "After hours: the business, and METAXY keeps it running" }}
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    />
  );
}
