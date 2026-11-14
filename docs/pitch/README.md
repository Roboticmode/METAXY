# METAXY pitch kit (Task 4)

| File | What it is |
| --- | --- |
| [`deck/index.html`](deck/index.html) | 12-slide deck. Open it in a browser; it works offline (fonts bundled) and scales to any window (tested at 1280×720, 1366×768, 1600×900, 1920×1080 and 800 px wide). `→`/`←` to move, `N` notes + timing, `F` fullscreen, `Ctrl+P` prints one slide per page. |
| [`script.md`](script.md) | Spoken script timed to 3:00, with the exact hand-off words into and out of the live demo. |
| [`demo-run-sheet.md`](demo-run-sheet.md) | Click-by-click live demo on the Naledi Studio data at `/dashboard`, what to say at each agent step, reset procedure, fallback plan. |
| [`assets/`](assets/) | Screenshots from the live app (`main` @ b770745, scripted engine, synthetic data, 3200×1800). |

## Screenshots
| File | State |
| --- | --- |
| `00-landing.png` | Landing page at `/` (used on slide 1) |
| `01-dashboard-idle.png` | Fresh/reset dashboard, Operations tab |
| `02-friday-approval.png` | "Can you do it by Friday?": Planner blocks Friday, proposes Saturday, reply held for approval (slide 5) |
| `03-approved-formalise-nudge.png` | After **Approve & send**: reply sent + "Ready to formalise Naledi Studio" |
| `04-collision-approval.png` | **Check collisions**: capstone-day collision card |
| `05-collision-cleared.png` | Collision fix approved, calendar back in sync |
| `06-compliance-cipc.png` | Compliance tab, CIPC task selected |
| `07-compliance-cipc-prepared.png` | After **Prepare with agent**: CIPC "ready for you" (slide 8) |
| `08-whatsapp-module.png` | WhatsApp tab before automations |
| `09-whatsapp-automations-run.png` | After **Run today's**: 4 template messages sent |
| `10-operations-activity.png` | Agent activity after the full run |
| `11-coursework-boundary.png` | Coursework request refused (P-05, the "Never" boundary) |

To refresh them: run the app, reset it, and walk the run-sheet steps in a 1600×900 window.

## Open items for the team
- Fill in `[Team name]`, `[Name]` and `[repo / demo link]` on slides 1 and 12.
- Record the fallback video (run-sheet → *Fallback plan*).
- **App bug (src, not docs):** the scripted Friday reply proposes Saturday but ends "Does Monday work?" (`src/lib/agent/brain.ts`).
- **Claim to soften:** the landing page says "Zero unapproved outbound messages", but FAQ answers, the coursework refusal and *Run today's* automations send without approval.
- If the cinematic landing page (Task 1) replaces the current one, recapture `assets/00-landing.png`.
- Hook-stat figures (≈3M SMEs, 1.2–1.8M unregistered) are labelled estimates from the event briefing. Find a citable source if a judge asks.
