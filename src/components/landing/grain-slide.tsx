"use client";

import { AuthGrainHero } from "@/components/ui/auth-grain-hero";
import { ctaLabel, useLandingSession } from "./auth-session";
import { HERO_FADE_TO, HERO_HEADLINE, HERO_SECONDARY, HERO_SUBLINE } from "./hero-copy";

/** Hero variant 3: Grain Gradient + sign-in card (paper shaders), loaded on demand by HeroCarousel. */
export default function GrainSlide() {
  const { email } = useLandingSession();
  return (
    <AuthGrainHero
      userEmail={email}
      eyebrow="Informal → Formal · South Africa"
      headline={HERO_HEADLINE}
      subline={HERO_SUBLINE}
      primaryCta={{ label: ctaLabel(email), href: "/dashboard" }}
      secondaryCta={HERO_SECONDARY}
      hideLabel
      cardNote="Sign in to keep an owner session, or launch the live demo with no sign-up."
      fadeTo={HERO_FADE_TO}
    />
  );
}
