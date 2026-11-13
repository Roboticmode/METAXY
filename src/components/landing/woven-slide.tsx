"use client";

import { WovenLightHero } from "@/components/ui/woven-light-hero";
import { ctaLabel, useLandingSession } from "./auth-session";
import { HERO_FADE_TO, HERO_HEADLINE, HERO_LINKS, HERO_SECONDARY, HERO_SUBLINE } from "./hero-copy";

/** Hero variant 2: Woven Light (three.js particle weave on light surface), identical layout to Hero 1. */
export default function WovenSlide() {
  const { email } = useLandingSession();
  const label = ctaLabel(email);
  return (
    <WovenLightHero
      brand="METAXY"
      links={[...HERO_LINKS, ...(email ? [] : [{ label: "Sign in", href: "#signin" }])]}
      navCta={{ label, href: "/dashboard" }}
      headline={HERO_HEADLINE}
      subline={HERO_SUBLINE}
      ctaLabel={label}
      ctaHref="/dashboard"
      secondaryCta={HERO_SECONDARY}
      fadeTo={HERO_FADE_TO}
    />
  );
}
