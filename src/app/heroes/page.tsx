import type { Metadata } from "next";
import { HeroPlayground } from "@/components/landing/hero-playground";

export const metadata: Metadata = {
  title: "METAXY — Hero & Agent State Testbench",
  description: "Compare METAXY hero backgrounds (WovenLightHero, GrainGradient Auth, ElsewhereHero) and ThinkingOrb agent states.",
};

export default function HeroesPage() {
  return <HeroPlayground />;
}
