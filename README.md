# METAXY

*Bridging informal hustle and formal business for South African small businesses.*

An AI agent (Grok Bot) that handles a small business's customer conversations and admin — paired with a live visual command centre so owners can **see, verify and approve** everything it does.

Built for the [Grok Bot Johannesburg Hackathon](https://luma.com/spacexai-0jmr?tk=zB235j) · 13 Nov 2026 · WeThinkCode Joburg.

## Pillars
Compliance & Formalisation · Operations · Opportunity Discovery · CRM & Retention

## Docs

### Archetypes (`docs/archetypes/`)
- [Student-Freelancer archetype](docs/archetypes/student-freelancer.md) — **chosen demo use case** (**Naledi Studio**, managing freelance design & web clients alongside 3rd-year BSc IS university studies)
- [Graduate Founder archetype](docs/archetypes/graduate-founder.md) — companion launch-stage use case

### Planning (`docs/planning/`)
- [Hackathon brief](docs/planning/00-hackathon-brief.md) — rules, credits, prizes, questions for the mentor
- [Brainstorm](docs/planning/01-brainstorm.md) — problem, scenarios, recommended vertical slice, architecture, risks
- [Sprint plan](docs/planning/02-sprint-plan.md) — roles, timeline, demo checklist

### Tasks (`docs/tasks/`)
- [Task board](docs/tasks/README.md) — who's doing what, branches, merge order, file ownership
- [01 Landing page](docs/tasks/01-landing-page.md) · [02 Responsive dashboard](docs/tasks/02-responsive-dashboard.md) · [03 Agent console](docs/tasks/03-agent-console.md) · [04 Pitch deck](docs/tasks/04-pitch-deck.md)

### Design (`docs/design/`)
- [Design prompt](docs/design/03-design-prompt.md) — master product & experience brief
- [Design prompt template](docs/design/design-prompt-template.md) — reusable Concept-Led Product & Experience Brief template explaining *why* and *what* agents must keep note of
- [Component integrations](docs/design/component-integrations.md) — `ThinkingOrb` agent state spec (`thinking-orbs`), `WovenLightHero` (Three.js), and `AuthGrainHero` (`@paper-design/shaders-react`) + shadcn/Tailwind/TS structure guide

## Run it
```bash
npm install
cp .env.example .env.local   # optional: add XAI_API_KEY to use real Grok; empty = scripted engine
npm run dev                  # http://localhost:3000 (/ landing, /dashboard workspace, /heroes UI testbench)
```

## How it works
- UI shell and design tokens come from **Vanguard.OS** (Next 16, Tailwind 4, mono/brutalist style).
- The dashboard is purely presentational: it renders a stream of `AgentEvent`s (`trace`, `reply`, `project`, `project_update`, `invoice_update`, `school_update`, `approval`, `memory`, `compliance`, `handoff`).
- Three specialist roles coordinate behind the pipeline ([pipeline.ts](src/lib/agent/pipeline.ts)): **`Client Desk`** (WhatsApp intake, deliverables/scope checks, FAQs), **`Books`** (50% deposit policy, invoice aging, EFT reminders), and **`Planner`** (shared university timetable + studio capacity, collision detection, Exam Mode).
- The agent lives behind a swappable `Brain` ([src/lib/agent/brain.ts](src/lib/agent/brain.ts)): a scripted **mock** engine (works offline) and a **Grok** engine (xAI API). If a Grok call fails, that step falls back to the scripted engine so the demo never breaks.

## Hero demo scenarios (`Naledi Studio`)
1. **"Can you do it by Friday?" (Test-week capacity):** Click `1 · Can you do it by Friday?` in the WhatsApp panel → `Planner` spots the Thursday `IS302 Term Test 2` block, proposes Monday 23 Nov, `Books` quotes R3,200 (50% deposit R1,600), and `Client Desk` stages the draft reply in **Approval queue** → click **Approve & send**.
2. **Collision week:** Click **Check collisions (Planner)** → detects `PRJ-109` (`Nkosi Solar`) colliding with `IS399 Capstone Milestone 3` on Wed 25 Nov → proposes shifting the study block to Sat 21 Nov and extending the client milestone +1 day → click **Approve & send**.
3. **Overdue invoice (`Books`):** Click **Chase overdue (Books)** → flags `INV-2041` (`Kagiso Molefe · Molefe Logistics`, 21 days overdue) → approves polite EFT reminder → invoice marks **Paid** and CRM updates.
4. **Scope creep (`Client Desk`):** Click `4 · Scope creep request` (Zanele Dube · Dube Physiotherapy) → compares against `PRJ-108` deliverables → stages transparent R950 add-on quote for approval.
5. **Exam Mode & Academic Integrity Boundary:** Toggle **Exam Mode** to pause new bookings cleanly, or trigger `Coursework boundary (Never)` to watch `P-05` refuse university coursework requests.

## WhatsApp module (owner ↔ clients)
- **Inbox** of all 6 client chats (`Kagiso Mokoena · Kasi Brew Coffee`, `Kagiso Molefe · Molefe Logistics` disambiguation pair, `Zanele Dube`, `Thabo Nkosi`, `Amina Patel`, `Buhle Sithole`) — click one to open it in the phone panel. Unread counts, "needs you" and "you're handling" badges.
- **Reply as Naledi** in the phone panel to take over a chat — the agent pauses for that chat until you hand it back.
- **Automations** (toggle each): instant FAQs, enquiry & capacity triage, scope-creep guard, deposit & invoice chasers, test-week progress updates, dormant client check-ins (opted-in clients only — POPIA s69). **Run today's** fires them against current projects and invoices.
- **WhatsApp Business setup** checklist (profile, service packages, templates, POPIA opt-in, Cloud API connection).

## Compliance module (business legalities)
- Checklist tailored for a South African sole-trader freelance studio transitioning from informal to formal: SARS income tax & IRP6 provisional tax, CIPC registration, business bank account, Standard Freelance Scope & IP Agreement, POPIA (Information Officer, privacy notice & marketing opt-in), B-BBEE EME affidavit, and VAT/UIF/COIDA threshold monitoring.
- Each task shows why it matters, steps, documents (checked against the vault), cost, time and official links.
- **Prepare with agent** → the agent pre-fills what it can and marks it *ready for you*; Naledi submits/pays herself (*I've submitted it* → *Mark approved*). Finished tasks add certificates to the vault and unlock dependent tasks.

## Status
Naledi Studio student-freelancer vertical slice, multi-agent approval pipeline (`Client Desk`, `Books`, `Planner`), WhatsApp inbox/automations, and Compliance modules working end-to-end (scripted engine offline; Grok active when `XAI_API_KEY` is set). Opportunities and CRM tabs use fixture data (CRM memory updates live).

> All data in this repo is synthetic. No real customer, banking, or university data.
