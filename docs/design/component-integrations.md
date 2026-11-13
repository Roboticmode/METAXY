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
   - `theme`: `"auto"` (watches `data-theme`, `.dark`/`.light`, and `prefers-color-scheme`) or pinned `"dark"` / `"light"`. **METAXY note:** [`layout.tsx`](../../src/app/layout.tsx) pins `colorScheme: "light"` on `:root`, so pass `theme="light"` on light cards/bubbles (avoids white-on-white dots on macOS Dark Mode) and `theme="dark"` on dark floating pills or `--accent` buttons.
   - `color` *(optional)*: tint hex/rgb preserving 3D depth shading (e.g., METAXY emerald `#10b981` / `#059669`)
   - `paused` / `speed`: freeze or modulate animation speed
2. **State Management & METAXY Agent-State Mapping:**
   - Map `state.assistant.busy`, `useLiveVoice().status`, and `state.busy` / `state.preparing` (`src/lib/store.tsx`) to semantic orb states:
     - `working` → default active tool run (`AgentConsole` `busy` pill & launcher badge)
     - `connecting` → `GPT-Live 1` WebRTC voice handshake (`live.status === "connecting"`)
     - `listening` / `breathing` → `GPT-Live 1` live voice open / muted (`live.status === "live"`)
     - `searching` → `Planner` / `Books` scanning calendar or invoice ledger (`OperationsBoard` `AGENT` header)
     - `solving` → active tool execution during a live voice turn (`live.status === "live" && busy`)
     - `composing` → `Client Desk` / `Books` drafting WhatsApp reply (`WhatsAppPanel` `agent composing…` bubble & `AgentConsole` empty state)
     - `shaping` → `Books` preparing a compliance document pack (`ComplianceBoard` `Prepare with agent` button & `state.preparing`)
3. **Assets & Icons:**
   - Canvas is pure client-side (`"use client"` required for Next.js App Router). Zero external images or SVG assets needed; pair with `lucide-react` icons only for surrounding controls/badges.
4. **Responsive Behaviour:**
   - Use `size={20}` inside inline status pills (`AgentConsole` launcher & `working…` line, `OperationsBoard` `AGENT` header, `WhatsAppPanel` typing bubble, `ComplianceBoard` button) so layout never shifts on mobile (`375 px`) or desktop.
   - Use `size={32}` or `size={64}` inside empty-state welcome headers (`AgentConsole` ready card) or hero docks (`/heroes`).
5. **Integrated Places in METAXY:**
   - **Primary:** [src/components/agent-console/agent-console.tsx](../../src/components/agent-console/agent-console.tsx) — live in the floating launcher pill, `GPT-Live 1` voice status banner, empty-state ready card (`size={32}`), and `working…` indicator (`size={20}`).
   - **Operations:** [src/components/operations-board.tsx](../../src/components/operations-board.tsx) — `AGENT` panel header while `state.busy` (`searching` / `shaping`).
   - **WhatsApp:** [src/components/whatsapp-panel.tsx](../../src/components/whatsapp-panel.tsx) — `agent composing…` bubble (`state="composing"`, `theme="light"`).
   - **Compliance:** [src/components/compliance-board.tsx](../../src/components/compliance-board.tsx) — `Prepare with agent` button while `preparing` (`state="shaping"`, `theme="dark"`).

---

## 3. Hero & Background Test Variants

All three hero slides on `/` (`HeroCarousel`) and `/heroes` (`HeroPlayground`) share the **exact same `ElsewhereHero` layout, typography (`Inter`), nav, headline, and CTAs**—only the background layer swaps:

| Option | Component | Dependencies | Background Only |
| --- | --- | --- | --- |
| **Variant 1 (Default)** | [elsewhere-hero.tsx](../../src/components/ui/elsewhere-hero.tsx) via [metaxy-hero.tsx](../../src/components/landing/metaxy-hero.tsx) | None (HTML5 video + Web Audio API optional) | Day/night crossfade video on dark `#0a0d08` |
| **Variant 2 (Woven Light)** | [woven-light-hero.tsx](../../src/components/ui/woven-light-hero.tsx) via [woven-slide.tsx](../../src/components/landing/woven-slide.tsx) | `three`, `@types/three` | Light background (`#f5f3ec`) with 50,000-particle Three.js `TorusKnotGeometry` weave (`NormalBlending`) replacing the video |
| **Variant 3 (Grain Gradient)** | [auth-grain-hero.tsx](../../src/components/ui/auth-grain-hero.tsx) (`GrainGradientHero`) via [grain-slide.tsx](../../src/components/landing/grain-slide.tsx) | `@paper-design/shaders-react` | `GrainGradient` (`corners` shader) background only on dark `#0c1210` (no sign-in split card) |

### Variant Notes
- **`ElsewhereHero` (`background` + `tone`):** Accepts `background?: ReactNode` and `tone?: "dark" | "light"` (`#f5f3ec` paper surface + `#0a0d08` ink overrides for `WovenLightHero`).
- **WebGL hygiene (`woven-light-hero.tsx`):** Cleans up `requestAnimationFrame`, `ResizeObserver`, `mousemove` listeners, geometries, materials, and `WebGLRenderer` on unmount so switching slides never leaks WebGL contexts.
- **Background-only rule (`auth-grain-hero.tsx`):** Uses only the `GrainGradient` background layer from `21st.dev/@solaceui/components/auth-section-1`; owner sign-in lives exclusively in [sign-in-section.tsx](../../src/components/landing/sign-in-section.tsx).
