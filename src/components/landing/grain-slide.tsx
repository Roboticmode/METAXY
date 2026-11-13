"use client";

import { GrainGradientHero } from "@/components/ui/auth-grain-hero";
import { ctaLabel, useLandingSession } from "./auth-session";
import { HERO_FADE_TO, HERO_HEADLINE, HERO_LINKS, HERO_SECONDARY, HERO_SUBLINE } from "./hero-copy";

/** Hero variant 3: Grain Gradient background only (paper shaders), identical layout to Hero 1. */
export default function GrainSlide() {
  const { email } = useLandingSession();
  const label = ctaLabel(email);
  return (
    <GrainGradientHero
      brand="METAXY"
      links={[...HERO_LINKS, ...(email ? [] : [{ label: "Sign in", href: "#signin" }])]}
      navCta={{ label, href: "/dashboard" }}
      headline={HERO_HEADLINE}
      subline={HERO_SUBLINE}
      primaryCta={{ label, href: "/dashboard" }}
      secondaryCta={HERO_SECONDARY}
      fadeTo={HERO_FADE_TO}
    />
  );
}
