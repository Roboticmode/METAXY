# Task Board — Build Sprint 2

Three workstreams that can run **at the same time** (one person or agent each). Every task has its own brief, branch and set of files it owns, so nobody overwrites anybody else.

> Update the **Status** and **Owner** columns as you go. Statuses: `todo` · `in progress` · `in review` (PR open) · `merged`.

| # | Task | Brief | Branch | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Landing page | [01-landing-page.md](01-landing-page.md) | `feat/landing-page` | _unassigned_ | todo |
| 2 | Responsive dashboard + collapsible columns | [02-responsive-dashboard.md](02-responsive-dashboard.md) | `feat/responsive-dashboard` | _unassigned_ | todo |
| 3 | Agent console (talk to the agent; it drives the UI) | [03-agent-console.md](03-agent-console.md) | `feat/agent-console` | _unassigned_ | todo |

## Merge order

**1 → 2 → 3.** Merge the landing page first (it moves the dashboard to `/dashboard`), then the responsive work, then the agent console. Before opening a PR, rebase on the latest `main` (`git fetch upstream && git rebase upstream/main`).

## Who owns which files

Stay inside your own files. If you really need to change someone else's file, keep it to a few lines and say so in your PR.

| Area | Task 1 — Landing | Task 2 — Responsive | Task 3 — Agent console |
| --- | --- | --- | --- |
| `src/app/page.tsx` (becomes the landing page) | **owns** | — | — |
| `src/app/dashboard/**` (new: dashboard route + layout) | **owns** (creates it) | — | adds **one line** to mount `<AgentConsole />` |
| `src/app/layout.tsx` (root) | **owns** | — | — |
| `src/components/landing/**`, `src/components/ui/elsewhere-hero.tsx` (hero already added) | **owns** | — | — |
| `src/components/shell.tsx`, `*-board.tsx`, `whatsapp-panel.tsx`, `ui.tsx` | — | **owns** | small hook-up only (see contracts) |
| `src/app/globals.css` | landing-only classes, prefixed `landing-` | **owns** (tokens, breakpoints) | — |
| `src/lib/store.tsx` | — | — | **owns** (new actions) |
| `src/components/agent-console/**`, `src/lib/assistant/**`, `src/app/api/assistant/**` (new) | — | — | **owns** |
| `src/lib/agent/**` (existing pipeline) | — | — | read-only (don't change it) |

## Contracts between tasks

These are the few places where the tasks touch. Agree on them up front so nobody blocks anybody else.

1. **Routes.** `/` = landing page, `/dashboard` = the command centre. Every "Open dashboard" / "Try the demo" button links to `/dashboard`. `MetaxyProvider` moves from the root layout into `src/app/dashboard/layout.tsx`, so the landing page stays a fast static page.
2. **Bottom-right corner is reserved** for the agent console's launcher button (Task 3) on every screen size. Task 2 keeps mobile nav / drawers clear of it, or places the launcher above a bottom tab bar if there is one.
3. **Layers (z-index):** page content `z-0` · sticky header `z-20` · drawers/sheets (Task 2) `z-40` · agent console (Task 3) `z-50`.
4. **Stable anchors.** Task 2 adds a stable `id` to every panel so the agent can scroll to it and highlight it: `ops-approvals`, `ops-orders`, `ops-activity`, `ops-policies`, `wa-inbox`, `wa-automations`, `wa-setup`, `comp-checklist`, `comp-task`, `comp-deadlines`, `comp-vat`, `comp-vault`, `opp-radar`, `crm-memory`, `phone-panel`.
5. **Layout state lives in the store** so the agent can drive it. Task 3 adds these to `store.tsx`: `ui.leftOpen`, `ui.rightOpen`, and `ui.focus` (the anchor id to highlight). Task 2 reads/writes them through `useMetaxy()`. Until Task 3 lands, Task 2 can use local `useState` with the same names — swapping later is a one-line change.
6. **Selected compliance task** moves from local state in `compliance-board.tsx` into the store (`ui.complianceTask`) so the agent can open a specific task. Task 3 makes that small change after Task 2 has merged.

## Open decision — demo archetype data ⚠️

[docs/archetypes/student-freelancer.md](../archetypes/student-freelancer.md) makes **Naledi Studio** (student freelancer) the primary demo, with [graduate-founder.md](../archetypes/graduate-founder.md) as the "Launch" companion. The app still runs on the **Thandi's Bakes** bakery seed data.

- None of the three tasks above depends on this. Write copy and example prompts that work for either dataset.
- Swapping the seed data and adding the Planner / Books / Client Desk scenarios is a **fourth workstream** (it touches `src/lib/agent/**`). Decide as a team whether it happens today and who owns it, then add it as row 4 above.

## Everyone, before you start

- Read [`AGENTS.md`](../../AGENTS.md): this is **Next.js 16**. Check `node_modules/next/dist/docs/` before using routing, layout or metadata APIs from memory.
- `npm install`, then `npm run dev` → http://localhost:3000. Run `npm run typecheck` before every push.
- All data stays synthetic. No real names, numbers or banking details.
- The demo must keep working **offline** (scripted engine, no `XAI_API_KEY`). Grok is a bonus, never a requirement.
