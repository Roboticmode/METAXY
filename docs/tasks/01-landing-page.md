# Task 1 — Landing page

**Branch:** `feat/landing-page` · **Merge:** first · **Size:** ~2–3 h

## Goal
A public landing page at `/` that explains METAXY in under 30 seconds and gets judges and visitors into the live demo at `/dashboard` with one click.

## Context
- Product story: *metaxý* = "in between" — the bridge from informal hustle to formal business. An AI agent runs customer conversations and admin; a visual command centre lets the owner **see, verify and approve** everything.
- Archetypes to feature (see `docs/archetypes/`):
  - **Run** — Naledi Studio, a student freelancer juggling clients and university (primary demo).
  - **Launch** — Lerato, a graduate founder starting a tech agency.
  - The bakery (Thandi's Bakes) is what the live dashboard shows today. Keep copy generic enough that either dataset works behind the "Try the demo" button.
- Visual direction: [docs/design/03-design-prompt.md](../design/03-design-prompt.md) — editorial, mission-control, calm. No neon gradients, no sci-fi HUD, no generic SaaS template look. Reuse the existing tokens in `globals.css` (Inter + JetBrains Mono, `MonoLabel`, `Badge`, `Btn` from `src/components/ui.tsx`).

## Scope
1. **Move the dashboard to `/dashboard`.**
   - Create `src/app/dashboard/page.tsx` that renders `<Shell />`.
   - Create `src/app/dashboard/layout.tsx` that wraps children in `<MetaxyProvider>`; remove the provider from the root `src/app/layout.tsx`.
   - Check the Next 16 docs for layouts and metadata first (`node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `14-metadata-and-og-images.md`).
2. **Build the landing page at `src/app/page.tsx`** (server component; components in `src/components/landing/`):
   - **Hero — already built, just render `<MetaxyHero />`** from `src/components/landing/metaxy-hero.tsx`. It's a full-screen day/night video hero (component: `src/components/ui/elsewhere-hero.tsx`, from 21st.dev). Day = "the 9-to-5, lectures, the day job", night = "after hours: the business". Nav links point to `#how`, `#modules`, `#who`, `#trust`, so give the sections below those ids. Sound is switched off (`sound={false}`).
     - **Swap the footage.** The current clips are the component's placeholder: a surreal meadow scene, not South African. Find or generate short SA day/night clips (≤ 10 s, ≤ 4 MB each), put them in `public/hero/day.mp4` and `public/hero/night.mp4`, and change `DAY_SRC` / `NIGHT_SRC`. Serving them from `public/` also keeps the hero working on bad venue Wi-Fi; until then the clips come from `cdn.21st.dev`.
     - Add a `poster` still for each video (an extra prop in `elsewhere-hero.tsx`), so a slow connection shows an image instead of a black screen.
     - The hero is dark and cinematic. Start the next section with a calm transition (the dark band fading into the page background) rather than a hard cut.
     - Keep the small "by guglielmogiannattasio.exe" credit, bottom-right. It's the component author's attribution, and the landing page has no agent launcher competing for that corner.
   - **The problem:** three walls — rigid bots break on real life · the informal-to-formal gap · black-box AI nobody trusts. Add one stat from the brainstorm (≈3M SMEs, ~1.2–1.8M unregistered), labelled as an estimate.
   - **How it works:** message arrives → agent reads context & checks your rules → you approve exceptions → business state updates. A small static mock of the command centre helps here (an image or a simplified HTML replica, not an iframe).
   - **Modules:** Operations · WhatsApp · Compliance · Opportunities · CRM. One line each.
   - **Who it's for:** the Launch → Run story (graduate founder → student freelancer), plus "works for any small business: bakers, plumbers, spaza shops".
   - **Trust & boundaries:** "Agents prepare, you decide." Nothing is sent, filed or paid without your approval. Guidance, not legal or tax advice. Synthetic data in the demo.
   - **Footer:** hackathon credit (Grok Bot Johannesburg Hackathon · WeThinkCode Joburg), GitHub link.
3. **Metadata:** title/description for `/` and `/dashboard`; Open Graph title/description.

## Out of scope
- Changing anything inside the dashboard (`shell.tsx`, boards, store) — that's Tasks 2 and 3.
- Auth, sign-up or forms. The CTA goes straight to the demo.

## Acceptance criteria
- [ ] `/` shows the landing page; `/dashboard` shows the existing command centre with everything working (Scenario A → Allow once → compliance nudge).
- [ ] Looks right at 375 px, 768 px, 1280 px and 1440 px+: no horizontal scroll, readable text, tap targets ≥ 40 px.
- [ ] Lighthouse (mobile) performance and accessibility ≥ 90; images have `alt`; one `h1`; headings in order.
- [ ] No new runtime dependencies unless agreed with the team (lucide-react icons are already available).
- [ ] `npm run typecheck` passes; PR description has before/after screenshots (desktop + mobile).

## Handoff to the other tasks
- Tell Task 3 when `src/app/dashboard/page.tsx` exists. They'll add `<AgentConsole />` there.
- Don't put a fixed element in the bottom-right corner of `/dashboard` (reserved for the agent launcher).
