"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, Sparkles } from "lucide-react";
import ElsewhereHero from "@/components/ui/elsewhere-hero";
import { WovenLightHero } from "@/components/ui/woven-light-hero";
import { AuthGrainHero } from "@/components/ui/auth-grain-hero";
import { ThinkingOrb, type OrbState } from "@/components/ui/thinking-orbs";
import { DAY_POSTER, DAY_SRC, NIGHT_POSTER, NIGHT_SRC } from "@/components/landing/hero-media";

type HeroVariant = "woven" | "elsewhere" | "grain";
type CopyMode = "metaxy" | "original";

const ORB_STATES: { state: OrbState; label: string; usage: string }[] = [
  { state: "working", label: "working", usage: "Agent busy / running tools" },
  { state: "searching", label: "searching", usage: "Scanning calendar & invoice ledger" },
  { state: "solving", label: "solving", usage: "Resolving collision / pricing scope" },
  { state: "listening", label: "listening", usage: "Voice / WhatsApp incoming" },
  { state: "composing", label: "composing", usage: "Drafting reply for approval" },
  { state: "shaping", label: "shaping", usage: "Preparing compliance pack" },
];

export function HeroPlayground() {
  const [variant, setVariant] = useState<HeroVariant>("woven");
  const [copyMode, setCopyMode] = useState<CopyMode>("metaxy");
  const [orbState, setOrbState] = useState<OrbState>("composing");

  return (
    <div className="relative min-h-screen w-full bg-black text-white">
      {/* Floating switcher bar */}
      <div className="fixed top-4 right-4 z-50 flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-black/80 px-3 py-1.5 backdrop-blur-xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/75 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-3" /> Landing
        </Link>
        <span className="h-4 w-px bg-white/15" aria-hidden />
        <div className="flex items-center gap-1">
          <Layers className="ml-1 size-3 text-emerald-400" />
          {(
            [
              ["woven", "1 · Woven Light"],
              ["grain", "2 · Grain Auth"],
              ["elsewhere", "0 · Elsewhere Video"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setVariant(id)}
              className={`cursor-pointer rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                variant === id ? "bg-white text-black" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {variant === "woven" ? (
          <>
            <span className="h-4 w-px bg-white/15" aria-hidden />
            <button
              type="button"
              onClick={() => setCopyMode((m) => (m === "metaxy" ? "original" : "metaxy"))}
              className="cursor-pointer rounded-full border border-white/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300 hover:bg-white/10"
            >
              Copy: {copyMode === "metaxy" ? "METAXY" : "Original Demo"}
            </button>
          </>
        ) : null}
      </div>

      {/* Active Hero / Background */}
      {variant === "woven" ? (
        copyMode === "original" ? (
          <WovenLightHero />
        ) : (
          <WovenLightHero
            brand="METAXY"
            headline="From hustle to formal business."
            subline="An AI command centre that runs WhatsApp enquiries, balances university and client calendars, and keeps every approval in your hands."
            ctaLabel="Open Command Centre"
            ctaHref="/dashboard"
          />
        )
      ) : variant === "grain" ? (
        <AuthGrainHero />
      ) : (
        <ElsewhereHero
          daySrc={DAY_SRC}
          nightSrc={NIGHT_SRC}
          dayPoster={DAY_POSTER}
          nightPoster={NIGHT_POSTER}
          objectPosition="42% 50%"
          brand="METAXY"
          links={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Hero Lab", href: "/heroes" },
          ]}
          navCta={{ label: "Open dashboard", href: "/dashboard" }}
          headline="From hustle to formal business."
          subline="Day/night video crossfade baseline hero for comparison against WovenLightHero and AuthGrainHero."
          primaryCta={{ label: "Try the live demo", href: "/dashboard" }}
          sound={false}
          cycleCaption={{ day: "By day: lectures & day job", night: "After hours: the studio" }}
        />
      )}

      {/* Thinking Orbs Agent-State Test Dock */}
      <div className="fixed bottom-4 left-4 z-50 flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-3 rounded-2xl border border-white/15 bg-[#070707]/85 px-4 py-2.5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <span className="[&_canvas]:!size-10">
            <ThinkingOrb state={orbState} size={64} theme="dark" />
          </span>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              <Sparkles className="size-3" /> ThinkingOrb · {orbState}
            </div>
            <div className="text-[11px] text-white/70">{ORB_STATES.find((s) => s.state === orbState)?.usage}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 border-l border-white/15 pl-3">
          {ORB_STATES.map((s) => (
            <button
              key={s.state}
              type="button"
              onClick={() => setOrbState(s.state)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                orbState === s.state ? "bg-white text-black" : "bg-white/5 text-white/75 hover:bg-white/15"
              }`}
            >
              <ThinkingOrb state={s.state} size={20} theme={orbState === s.state ? "light" : "dark"} />
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
