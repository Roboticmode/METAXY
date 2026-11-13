# UI Component Integrations — Agent State & Hero Backgrounds

> **Purpose:** Reference specification for coding and design agents implementing live **agent state indicators** (`ThinkingOrb`) and **hero / auth background variants** (`WovenLightHero`, `GrainGradient` Auth Section 1) in METAXY.  
> **Live testbench:** Run `npm run dev` and open `/heroes` to test all three hero/background options and all six `ThinkingOrb` states side-by-side.

---

## 1. Codebase Structure Check (shadcn / Tailwind / TypeScript)

| Requirement | Current METAXY Status | Details |
| --- | --- | --- |
| **Tailwind CSS** | Installed (`v4`) | Configured via `@import "tailwindcss";` and `@theme inline` + `oklch` design tokens in [src/app/globals.css](../../src/app/globals.css). |
| **TypeScript** | Installed (`strict: true`) | Path alias `@/*` resolves to `./src/*` in [tsconfig.json](../../tsconfig.json). |
| **shadcn-compatible component directory** | Present (`src/components/ui/`) | Primitives live in `src/components/ui/` (`index.tsx`, `elsewhere-hero.tsx`, `thinking-orbs.tsx`, `woven-light-hero.tsx`, `auth-grain-hero.tsx`). |

> **Why `src/components/ui/` matters:** In Next.js App Router projects using the `src/` directory with `@/* -> ./src/*`, placing reusable UI primitives in `src/components/ui/` (equivalent to `/components/ui`) ensures shadcn-style imports like `@/components/ui/thinking-orbs` and `@/components/ui/woven-light-hero` resolve uniformly across pages, dashboards, and future `npx shadcn@latest add ...` registries without breaking domain components.

If bootstrapping a fresh project from scratch without these configured:
1. Run `npx shadcn@latest init` (select TypeScript + Tailwind CSS + `src/` directory).
2. Install Tailwind v4 (`tailwindcss`, `@tailwindcss/postcss`) and `typescript` if absent.

---

## 2. Agent State Component — `thinking-orbs.tsx`

- **Installed file:** [src/components/ui/thinking-orbs.tsx](../../src/components/ui/thinking-orbs.tsx)
- **NPM dependency:** `thinking-orbs` (`^0.3.2`, React `>=18` / `19` compatible)
- **Source & playground:** https://orbs.jakubantalik.com

### Component Code

```tsx
"use client";

import { ThinkingOrb } from "thinking-orbs";

export { ThinkingOrb } from "thinking-orbs";
export type {
  ThinkingOrbProps,
  OrbState,
  OrbSize,
  OrbTheme,
} from "thinking-orbs";

export default ThinkingOrb;
```

### Reference Demo

```tsx
import { ThinkingOrb } from "@/components/ui/thinking-orbs";

export default function ThinkingOrbThinkingDemo() {
  return (
    <div className="flex min-h-[360px] w-full items-center justify-center bg-[#070707] p-8">
      <div
        className="inline-flex h-[74px] items-center gap-3 rounded-full pl-[9px] pr-8"
        style={{
          background: "rgba(29,29,29,0.42)",
          boxShadow:
            "inset 0 0 0 1px rgba(44,47,54,0.31), inset 0 0 50px 0 rgba(255,255,255,0.012)",
        }}
      >
        <span className="[&_canvas]:!size-14">
          <ThinkingOrb state="composing" size={64} theme="dark" />
        </span>
        <span
          className="whitespace-nowrap text-lg leading-6"
          style={{ color: "rgba(251,251,251,0.5)" }}
        >
          Thinking….
        </span>
      </div>
    </div>
  );
}
```

### Implementation Guidelines & Integration Map

1. **Data / Props:**
   - `state`: `"working" | "searching" | "solving" | "listening" | "composing" | "shaping" | "connecting" | "weaving" | "breathing"`
   - `size`: `64` (chat-avatar scale), `32` (compact badge/header scale), `20` (inline-text scale — hand-tuned dot counts & speeds)
   - `theme`: `"auto"` (default — watches `data-theme`, `.dark`/`.light`, and `prefers-color-scheme`) or pinned `"dark"` / `"light"`
   - `color` *(optional)*: tint hex/rgb preserving 3D depth shading (e.g., METAXY emerald `#10b981`)
   - `paused` / `speed`: freeze or modulate animation speed
2. **State Management & METAXY Agent-State Mapping:**
   - Map `state.assistant.busy` (`src/components/agent-console/agent-console.tsx`) and `state.busy` / active `AgentEvent` (`src/lib/store.tsx`) to semantic orb states:
     - `working` → default active tool run (`AgentConsole` `busy` pill, `OperationsBoard` `AGENT` panel header)
     - `searching` → `Planner` scanning university + studio calendar (`check_capacity`, `scan_commitments`) or `Books` scanning invoice ledger (`scan_ledger`)
     - `solving` → resolving deadline collision or pricing scope-creep add-on (`propose_fix`, `compare_deliverables`, `draft_addon_quote`)
     - `composing` → `Client Desk` / `Books` drafting WhatsApp reply or EFT reminder (`compose_reply`, `WhatsAppPanel` `agent working…`)
     - `shaping` → `Books` preparing a compliance document pack (`compliance_prepare` / `preparing === task.id`)
     - `listening` → voice input / incoming client message triage (`understand_message`)
3. **Assets & Icons:**
   - Canvas is pure client-side (`"use client"` required for Next.js App Router). Zero external images or SVG assets needed; pair with `lucide-react` icons only for surrounding controls/badges.
4. **Responsive Behaviour:**
   - Use `size={20}` inside inline status pills (`AgentConsole` `working…` line, `OperationsBoard` `AGENT` header, `WhatsAppPanel` typing bubble) so layout never shifts on mobile (`375 px`) or desktop.
   - Use `size={64}` (or `size={32}`) inside empty-state welcome headers or featured status banners.
5. **Best Places to Integrate:**
   - **Primary:** [src/components/agent-console/agent-console.tsx](../../src/components/agent-console/agent-console.tsx) — replace the pulsing `size-1.5` dot in the `busy` indicator (and optionally launcher badge when active) with `<ThinkingOrb state={orbState} size={20} theme="auto" />`.
   - **Secondary:** [src/components/operations-board.tsx](../../src/components/operations-board.tsx) (`AGENT` panel header while `state.busy`) and [src/components/whatsapp-panel.tsx](../../src/components/whatsapp-panel.tsx) (`agent working…` bubble using `state="composing"`).

---

## 3. Hero & Background Test Variants

To test visual directions without breaking the production landing page (`/`), METAXY maintains a live background switcher at **`/heroes`** ([src/app/heroes/page.tsx](../../src/app/heroes/page.tsx) + [src/components/landing/hero-playground.tsx](../../src/components/landing/hero-playground.tsx)):

| Option | Component | Dependencies | Visual Concept |
| --- | --- | --- | --- |
| **Option 0 (Current Default)** | [elsewhere-hero.tsx](../../src/components/ui/elsewhere-hero.tsx) via [metaxy-hero.tsx](../../src/components/landing/metaxy-hero.tsx) | None (HTML5 video + Web Audio API optional) | Day/night crossfade video ("day job / lectures vs. after-hours studio") |
| **Option 1 (3D Particle Weave)** | [woven-light-hero.tsx](../../src/components/ui/woven-light-hero.tsx) | `three`, `@types/three`, `framer-motion` | Interactive 50,000-particle Three.js `TorusKnotGeometry` with pointer repulsion + Framer Motion letter stagger |
| **Option 2 (`auth-section-1` Grain Gradient)** | [auth-grain-hero.tsx](../../src/components/ui/auth-grain-hero.tsx) | `@paper-design/shaders-react` | Split hero / owner auth layout using `GrainGradient` (`corners` shader) paired with [auth-card.tsx](../../src/components/auth-card.tsx) |

### Option 1 Notes (`woven-light-hero.tsx`)
- **Props:** Accepts optional `brand`, `headline`, `subline`, `ctaLabel`, `ctaHref`, and `onCtaClick` (defaulting to the original `"Woven"` / `"Woven by Light"` / `"Explore the Weave"` demo values).
- **WebGL & SSR hygiene:** Marked `"use client"`; cancels `requestAnimationFrame`, disposes `TorusKnotGeometry` / `BufferGeometry` / `PointsMaterial` / `WebGLRenderer`, and cleans up dynamically injected `<link>` fonts on unmount so switching hero variants on `/heroes` does not leak WebGL contexts.
- **Font note:** Uses `Playfair Display` + `Inter` (in METAXY production sections, align font variables or pair with `Inter` + `JetBrains Mono` from `globals.css` if adopting permanently).

### Option 2 Notes (`21st.dev/@solaceui/components/auth-section-1`)
- **Source:** https://21st.dev/@solaceui/components/auth-section-1
- **Dependency:** `@paper-design/shaders-react` (`GrainGradient`)
- **Best fit in METAXY:**
  - Either as an **animated grain-gradient side panel** inside [src/components/landing/sign-in-section.tsx](../../src/components/landing/sign-in-section.tsx) alongside `AuthCard`,
  - Or as a lightweight **full-bleed split hero + immediate demo/sign-in entry** when venue Wi-Fi makes video clips heavy (`GrainGradient` renders procedurally on GPU with zero video payload).
