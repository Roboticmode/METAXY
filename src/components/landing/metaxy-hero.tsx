"use client";

import ElsewhereHero from "@/components/ui/elsewhere-hero";
import { ctaLabel, useLandingSession } from "./auth-session";
import { HERO_FADE_TO, HERO_HEADLINE, HERO_LINKS, HERO_SECONDARY, HERO_SUBLINE } from "./hero-copy";
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
      fadeTo={HERO_FADE_TO}
      objectPosition="42% 50%"
      brand="METAXY"
      links={[...HERO_LINKS, ...(email ? [] : [{ label: "Sign in", href: "#signin" }])]}
      navCta={{ label: ctaLabel(email), href: "/dashboard" }}
      headline={HERO_HEADLINE}
      subline={HERO_SUBLINE}
      primaryCta={{ label: ctaLabel(email), href: "/dashboard" }}
      secondaryCta={HERO_SECONDARY}
      sound={false}
      cycleCaption={{ day: "By day: lectures, the 9-to-5, the day job", night: "After hours: the business, and METAXY keeps it running" }}
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    />
  );
}
