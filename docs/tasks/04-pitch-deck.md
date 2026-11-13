# Task 4 — Pitch deck & demo script

**Branch:** `docs/pitch-deck` · **Merge:** any time (docs only) · **Size:** ~3–4 h

## Goal
A tight **3-minute pitch** for the judges: a slide deck, a spoken script and a demo run-sheet, so whoever presents can deliver it confidently and the live demo never surprises us.

## Inputs
- Story and positioning: `docs/planning/01-brainstorm.md`, `docs/design/03-design-prompt.md`, the landing-page copy (Task 1).
- Archetypes: `docs/archetypes/student-freelancer.md` (primary), `docs/archetypes/graduate-founder.md` (Launch → Run).
- Hackathon rules and judging: `docs/planning/00-hackathon-brief.md`. Demo checklist: `docs/planning/02-sprint-plan.md`.
- The running app (`npm run dev`) for real screenshots.

## Deliverables
1. **Slide deck** (~10–12 slides) that matches the METAXY look: editorial, calm, mono labels, one accent colour.
   1. Title: METAXY — *from hustle to formal business*
   2. Hook stat: ≈3M SMEs, ~1.2–1.8M unregistered (labelled estimate)
   3. The problem: three walls (rigid bots · informal-to-formal gap · black-box AI)
   4. Meet the owners: Launch → Run (graduate founder → student freelancer; any small business)
   5. The product: command centre screenshot, *the chat is not the interface*
   6. Live demo cue slide (what the audience should watch for)
   7. Visible trust: Do alone / Ask first / Never
   8. Compliance bridge: CIPC, SARS, POPIA guided, never auto-filed
   9. How it's built: Grok agent + tool pipeline + event stream + offline fallback (simple diagram)
   10. Outcomes / demo targets (100% collisions caught, < 60 s to first draft, 0 unapproved sends)
   11. Roadmap: Opportunities, CRM, WhatsApp Cloud API, voice
   12. Team + ask / close
2. **Speaker script** `docs/pitch/script.md`: timed to 3:00, with a line or two per slide and the exact words for the demo hand-off.
3. **Demo run-sheet** `docs/pitch/demo-run-sheet.md`: click-by-click steps for the live demo, what to say during each agent step, a reset procedure, and the fallback plan (scripted engine, pre-recorded video).
4. **Screenshot slots**: use placeholders until the landing page and dashboard are final, then capture real ones into `docs/pitch/assets/`.

## Rules
- Only claims that are true of the demo; targets and estimates labelled as such. Synthetic data only, no real people.
- Mask mentor names as `[Mentor]` (team convention).
