import type { Metadata } from "next";
import { HeroPlayground } from "@/components/landing/hero-playground";

export const metadata: Metadata = {
  title: "METAXY — Hero & Agent State Testbench",
  description: "Compare METAXY hero backgrounds (ElsewhereHero video, WovenLightHero light weave, GrainGradient) and ThinkingOrb agent states.",
};

export default function HeroesPage() {
  return <HeroPlayground />;
}
