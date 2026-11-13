"use client";

import { GrainGradient } from "@paper-design/shaders-react";
import ElsewhereHero, { type ElsewhereLink } from "@/components/ui/elsewhere-hero";

export interface GrainGradientHeroProps {
  brand?: string;
  links?: ElsewhereLink[];
  navCta?: ElsewhereLink | false;
  headline?: string;
  subline?: string;
  primaryCta?: ElsewhereLink;
  secondaryCta?: ElsewhereLink;
  fadeTo?: string;
}

export type AuthGrainHeroProps = GrainGradientHeroProps;

/**
 * Hero variant 3 (Grain Gradient): identical layout, typography, nav and CTAs to Hero 1 (ElsewhereHero),
 * using only the animated GrainGradient shader from `@paper-design/shaders-react` as the background.
 */
export function GrainGradientHero({
  brand = "METAXY",
  links,
  navCta = { label: "Try the live demo", href: "/dashboard" },
  headline = "From hustle to formal business.",
  subline = "An AI agent that answers your clients, chases payments and walks you through CIPC and SARS, with a command centre where you see and approve everything it does.",
  primaryCta = { label: "Try the live demo", href: "/dashboard" },
  secondaryCta,
  fadeTo,
}: GrainGradientHeroProps = {}) {
  return (
    <ElsewhereHero
      tone="dark"
      background={
        <div className="absolute inset-0 bg-[#0c1210]">
          <GrainGradient
            style={{ width: "100%", height: "100%" }}
            colorBack="#0c1210"
            colors={["#10b981", "#0f766e", "#1e293b", "#d97706"]}
            softness={0.7}
            intensity={0.45}
            noise={0.35}
            shape="corners"
            speed={0.6}
          />
        </div>
      }
      brand={brand}
      links={links}
      navCta={navCta}
      headline={headline}
      subline={subline}
      primaryCta={primaryCta}
      secondaryCta={secondaryCta}
      sound={false}
      fadeTo={fadeTo}
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    />
  );
}

/** Backwards-compatible alias for earlier imports. */
export const AuthGrainHero = GrainGradientHero;
