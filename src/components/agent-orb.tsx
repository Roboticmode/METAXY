"use client";

import { ThinkingOrb, type OrbState } from "@/components/ui/thinking-orbs";
import { cn } from "@/components/ui";

/**
 * Agent state → ThinkingOrb state, as mapped in docs/design/component-integrations.md §2.
 * Driven by the tool name of the latest trace step while the agent is busy.
 */
export function orbStateForTool(tool?: string | null): OrbState {
  if (!tool) return "working";
  if (/understand|triage|intake/.test(tool)) return "listening";
  if (/compliance_prepare|prefill|load_requirements|check_vault/.test(tool)) return "shaping";
  if (/propose_fix|compare|addon|scope_quote|collision_fix|clear_collision|price/.test(tool)) return "solving";
  if (/capacity|scan|check_collisions|collision_detected|customer_memory|flag_overdue/.test(tool)) return "searching";
  if (/compose|reply|reminder|draft|notice|stage_approval/.test(tool)) return "composing";
  return "working";
}

/**
 * A 20 px orb that sits inline with text, so it never shifts layout. Pinned to the light theme
 * because every dashboard surface it sits on is paper or white; the orb pauses itself under
 * `prefers-reduced-motion`.
 */
export function AgentOrb({ state = "working", className, theme = "light" }: { state?: OrbState; className?: string; theme?: "light" | "dark" }) {
  return (
    <span aria-hidden className={cn("inline-grid size-5 shrink-0 place-items-center", className)}>
      <ThinkingOrb state={state} size={20} theme={theme} color={theme === "light" ? "#1f8a5f" : "#5fd3a0"} />
    </span>
  );
}
