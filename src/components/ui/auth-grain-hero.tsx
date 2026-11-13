"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GrainGradient } from "@paper-design/shaders-react";
import { AuthCard } from "@/components/auth-card";
import { MonoLabel } from "@/components/ui";

/**
 * Option 2 background test: split hero / auth section inspired by 21st.dev/@solaceui/components/auth-section-1
 * using `@paper-design/shaders-react` GrainGradient paired with METAXY's AuthCard.
 */
export interface AuthGrainHeroProps {
  /** Signed-in owner's email; shows the signed-in state in the card. */
  userEmail?: string | null;
  eyebrow?: string;
  headline?: string;
  subline?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Hide the "Option 2" lab label (used on the real landing page). */
  hideLabel?: boolean;
  /** Small note under the card heading. */
  cardNote?: string;
  /** Colour the bottom edge fades into, so the next section joins smoothly. */
  fadeTo?: string;
}

export function AuthGrainHero({
  userEmail = null,
  eyebrow = "Informal → Formal · South Africa",
  headline = "From hustle to formal business.",
  subline = "An AI command centre that runs WhatsApp enquiries, two-sided studio and university capacity, overdue EFTs, and CIPC/SARS readiness—with human approval at every edge.",
  primaryCta = { label: "Try live demo", href: "/dashboard" },
  secondaryCta,
  hideLabel = false,
  cardNote = "Tests the GrainGradient side-panel background paired with METAXY's Supabase Auth & Demo launcher.",
  fadeTo,
}: AuthGrainHeroProps = {}) {
  return (
    <section className="relative grid min-h-screen w-full grid-cols-1 bg-background text-foreground lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden bg-[#0c1210] p-8 pb-20 text-[#f5f3ec] sm:p-12 sm:pb-20 lg:min-w-0">
        <div className="pointer-events-none absolute inset-0">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/40" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-3 bg-[#f5f3ec]" aria-hidden />
            <span className="text-sm font-bold uppercase tracking-[0.22em]">METAXY</span>
          </div>
          {hideLabel ? null : <MonoLabel className="text-white/70">Option 2 · Grain Gradient (@solaceui auth-section-1)</MonoLabel>}
        </div>

        <div className="relative z-10 my-12 max-w-xl space-y-5">
          <MonoLabel className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/90">
            {eyebrow}
          </MonoLabel>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">{headline}</h1>
          <p className="text-base leading-relaxed text-white/80">{subline}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={primaryCta.href}
              className="inline-flex items-center gap-2 rounded-full bg-[#f5f3ec] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0c1210] transition-colors hover:bg-white"
            >
              {primaryCta.label} <ArrowRight className="size-3.5" />
            </Link>
            {secondaryCta ? (
              <a
                href={secondaryCta.href}
                className="inline-flex items-center rounded-full border border-white/25 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white/90 transition-colors hover:bg-white/10"
              >
                {secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap gap-4 border-t border-white/15 pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-white/65">
          <span>Client Desk</span>
          <span>·</span>
          <span>Books</span>
          <span>·</span>
          <span>Planner</span>
          <span>·</span>
          <span>Synthetic Data Only</span>
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-center bg-card p-6 sm:p-12 lg:px-10 xl:px-16">
        <div className="w-full max-w-md space-y-4">
          <div className="space-y-1">
            <MonoLabel className="text-muted-foreground">Owner Workspace</MonoLabel>
            <h2 className="text-xl font-bold tracking-tight">Sign in or launch the demo</h2>
            <p className="text-xs text-muted-foreground">
              {cardNote}
            </p>
          </div>
          <AuthCard userEmail={userEmail} />
        </div>
      </div>
      {fadeTo ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-32"
          style={{ background: `linear-gradient(180deg, transparent, ${fadeTo})` }}
        />
      ) : null}
    </section>
  );
}
