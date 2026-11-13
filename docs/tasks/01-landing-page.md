# Task 1: Landing page

**Branch:** `feat/landing-page` · **Merge:** first · **Size:** ~4–6 h

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
   - **Hero / Background test options (`/heroes`):** Compare `ElsewhereHero` (Option 0) against [`WovenLightHero`](../../src/components/ui/woven-light-hero.tsx) (Option 1 — Three.js particle weave + Framer Motion) and [`AuthGrainHero`](../../src/components/ui/auth-grain-hero.tsx) (Option 2 — `@paper-design/shaders-react` `GrainGradient` inspired by `21st.dev/@solaceui/components/auth-section-1`). See [component-integrations.md](../design/component-integrations.md).
   - The sections below make it a **full, high-end SaaS landing page**. The order is a suggestion; the story is what matters: *feel the pain → see the product → trust it → try it*.
     1. **Trust strip** under the hero: "Built for the Grok Bot Johannesburg Hackathon", plus small monochrome chips for *WhatsApp-first · ZAR · CIPC & SARS aware · POPIA-minded*.
     2. **The problem (`#problem`):** three walls, as three cards: rigid bots break on real life · the informal-to-formal gap · black-box AI nobody trusts. Big numbers: ≈3M SMEs, ~1.2–1.8M unregistered, labelled *estimate* with a source note.
     3. **Product reveal:** a large framed screenshot of the command centre (browser chrome, soft shadow, slight perspective that settles flat on scroll). Annotated callouts point at the WhatsApp mirror, the agent activity, the approval card and the compliance nudge.
     4. **How it works (`#how`):** four steps — message arrives → agent reads context & checks your rules → you approve the exceptions → the business updates itself. Each step has a small UI vignette (an HTML replica of a chat bubble, a trace line, an approval card), not just icons. A sticky "scrollytelling" layout is ideal on desktop and stacks on mobile.
     5. **Modules (`#modules`):** Operations · WhatsApp · Compliance · Opportunities · CRM as a bento grid. Each tile has one benefit line and a screenshot placeholder.
     6. **Who it's for (`#who`):** the Launch → Run story as two persona cards. Lerato, a graduate founder (*"I know how to build it. I don't know how to run a business."*), and Naledi Studio, a student freelancer (one pool of time, two sets of deadlines). Add a line: "and any small business: bakers, plumbers, spaza shops".
     7. **Outcomes:** 3–4 metric tiles from the archetype success metrics, clearly labelled as *demo targets*: 100% of collisions caught, < 60 s to first draft, 0 messages sent without approval.
     8. **Trust & boundaries (`#trust`):** a "Do alone / Ask first / Never" table. "Agents prepare, you decide." Guidance, not legal or tax advice. Synthetic data only.
     9. **FAQ:** 5–6 questions, as an accessible `<details>` accordion. For example: Is it a chatbot? Does it send messages on its own? Do I need to be registered? What about POPIA? Does it work offline/without Grok?
     10. **Final CTA:** cinematic dark band reprising the day/night idea. "Try the live demo" → `/dashboard`.
     11. **Footer:** hackathon credit (Grok Bot Johannesburg Hackathon · WeThinkCode Joburg), GitHub link, "All demo data is synthetic".
   - **Screenshots:** use a reusable `<ScreenshotFrame label="Operations board" />` placeholder (browser chrome + tasteful placeholder art + the label). Real images can drop into `public/screenshots/*.png` later through an optional `src` prop and `next/image`. Real screenshots captured from the running dashboard are welcome if time allows.
3. **Metadata & SEO:** title/description for `/` and `/dashboard`, Open Graph + Twitter card text, a generated OG image (`opengraph-image.tsx`, see the Next 16 docs), `robots`/`sitemap` optional.

## Quality bar: "cinematic, not template"
- Editorial typography: big confident headings with tight tracking, generous whitespace, JetBrains Mono for small technical labels (`M-01`, `OPS-02` …), consistent with the dashboard.
- Motion: subtle reveal-on-scroll (IntersectionObserver + CSS; no heavy animation library unless it clearly earns its place), parallax ≤ 8 px, everything off under `prefers-reduced-motion`.
- One accent colour (the existing `--accent`). Mostly dark → light → dark rhythm between sections. No purple gradients, no stock "AI brain" art, no fake customer logos or fake testimonials.
- Every claim is true of the demo or labelled as a target/estimate.

## Out of scope
- Changing anything inside the dashboard (`shell.tsx`, boards, store) — that's Tasks 2 and 3.
- Auth, sign-up or forms. The CTA goes straight to the demo.

## Acceptance criteria
- [ ] `/` shows the landing page; `/dashboard` shows the existing command centre with everything working (Scenario A → Allow once → compliance nudge).
- [ ] Looks right at 375 px, 768 px, 1280 px and 1440 px+: no horizontal scroll, readable text, tap targets ≥ 40 px.
- [ ] Lighthouse (mobile) performance and accessibility ≥ 90; images have `alt`; one `h1`; headings in order.
- [ ] No new runtime dependencies unless agreed with the team (lucide-react icons are already available).
- [ ] Keyboard-only navigation works with visible focus; colour contrast meets WCAG AA; no layout shift when videos/images load.
- [ ] `npm run typecheck` and `npm run build` pass; PR description has screenshots (desktop + mobile).

## Handoff to the other tasks
- Tell Task 3 when `src/app/dashboard/page.tsx` exists. They'll add `<AgentConsole />` there.
- Don't put a fixed element in the bottom-right corner of `/dashboard` (reserved for the agent launcher).
