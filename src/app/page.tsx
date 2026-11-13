import type { Metadata } from "next";
import { HeroCarousel } from "@/components/landing/hero-carousel";
import { NIGHT_POSTER, NIGHT_SRC } from "@/components/landing/hero-media";
import { SignInSection } from "@/components/landing/sign-in-section";
import { LandingNav } from "@/components/landing/landing-nav";
import { RevealObserver } from "@/components/landing/reveal-observer";
import { Problem, ProductReveal, TrustStrip } from "@/components/landing/intro-sections";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Modules, Outcomes, Personas } from "@/components/landing/product-sections";
import { Faq, FinalCta, Footer, Trust } from "@/components/landing/closing-sections";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The public landing page. Story: feel the pain → see the product → trust it → try it.
 * Rhythm: dark (hero) → light → dark (product) → light → dark (outcomes) → light → dark (CTA).
 */
export default function LandingPage() {
  return (
    <div id="top" className="landing-root bg-background text-foreground">
      <a
        href="#problem"
        className="sr-only z-50 rounded-full bg-[var(--landing-paper)] px-4 py-2 text-sm font-medium text-[var(--landing-ink)] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <LandingNav />
      <RevealObserver />

      <main>
        <HeroCarousel />
        <div id="landing-hero-end" aria-hidden />
        <TrustStrip />
        <Problem />
        <ProductReveal />
        <HowItWorks />
        <Modules />
        <Personas />
        <Outcomes />
        <Trust />
        <Faq />
        <SignInSection />
        <FinalCta videoSrc={NIGHT_SRC} poster={NIGHT_POSTER} />
      </main>
      <Footer />
    </div>
  );
}
