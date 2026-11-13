"use client";

import { WovenLightHero } from "@/components/ui/woven-light-hero";
import { ctaLabel, useLandingSession } from "./auth-session";
import { HERO_FADE_TO, HERO_HEADLINE, HERO_LINKS, HERO_SECONDARY, HERO_SUBLINE } from "./hero-copy";

/** Hero variant 2: Woven Light (three.js + framer-motion), loaded on demand by HeroCarousel. */
export default function WovenSlide() {
  const { email } = useLandingSession();
  return (
    <WovenLightHero
      brand="METAXY"
      headline={HERO_HEADLINE}
      subline={HERO_SUBLINE}
      ctaLabel={ctaLabel(email)}
      ctaHref="/dashboard"
      secondaryCta={HERO_SECONDARY}
      links={[...HERO_LINKS, ...(email ? [] : [{ label: "Sign in", href: "#signin" }])]}
      fadeTo={HERO_FADE_TO}
    />
  );
}
