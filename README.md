# METAXY

*Bridging informal hustle and formal business for South African small businesses.*

An AI agent (Grok Bot) that handles a small business's customer conversations and admin — paired with a live visual command centre so owners can **see, verify and approve** everything it does.

Built for the [Grok Bot Johannesburg Hackathon](https://luma.com/spacexai-0jmr?tk=zB235j) · 13 Nov 2026 · WeThinkCode Joburg.

## Pillars
Compliance & Formalisation · Operations · Opportunity Discovery · CRM & Retention

## Docs

### Archetypes (`docs/archetypes/`)
- [Student-Freelancer archetype](docs/archetypes/student-freelancer.md) — **chosen demo use case** (managing freelance clients alongside university studies)
- [Graduate Founder archetype](docs/archetypes/graduate-founder.md) — companion launch-stage use case

### Planning (`docs/planning/`)
- [Hackathon brief](docs/planning/00-hackathon-brief.md) — rules, credits, prizes, questions for the mentor
- [Brainstorm](docs/planning/01-brainstorm.md) — problem, scenarios, recommended vertical slice, architecture, risks
- [Sprint plan](docs/planning/02-sprint-plan.md) — roles, timeline, demo checklist

### Tasks (`docs/tasks/`)
- [Task board](docs/tasks/README.md) — who's doing what, branches, merge order, file ownership
- [01 Landing page](docs/tasks/01-landing-page.md) · [02 Responsive dashboard](docs/tasks/02-responsive-dashboard.md) · [03 Agent console](docs/tasks/03-agent-console.md)

### Design (`docs/design/`)
- [Design prompt](docs/design/03-design-prompt.md) — master product & experience brief

## Run it
```bash
npm install
cp .env.example .env.local   # optional: add XAI_API_KEY to use real Grok; empty = scripted engine
npm run dev                  # http://localhost:3000
```

## How it works
- UI shell and design tokens come from **Vanguard.OS** (Next 16, Tailwind 4, mono/brutalist style).
- The dashboard is purely presentational: it renders a stream of `AgentEvent`s (trace, reply, order, approval, memory, compliance).
- The agent lives behind a swappable `Brain` ([src/lib/agent/brain.ts](src/lib/agent/brain.ts)): a scripted **mock** engine (works offline) and a **Grok** engine (xAI API). A pipeline ([pipeline.ts](src/lib/agent/pipeline.ts)) runs tools: understand → customer memory → calendar → policy → order → reply → approval.
- If a Grok call fails, that step falls back to the scripted engine so the demo never breaks.

## Hero demo
1. Click **Scenario A — off-script order** in the WhatsApp panel (right).
2. Watch Agent activity, the draft order (payment BLOCKED), and the approval card appear.
3. Click **Allow once** → agent confirms to the customer → compliance nudge to formalise (CIPC).

## WhatsApp module (owner ↔ customers)
- **Inbox** of all customer chats — click one to open it in the phone panel. Unread counts, "needs you" and "you're handling" badges.
- The agent routes every message by **intent**: orders go through the policy pipeline; FAQs (prices, hours, location, banking details) and "is my order ready?" are answered from the brief; complaints and unknown questions are **handed off** to the owner.
- **Reply as Thandi** in the phone panel to take over a chat — the agent pauses for that chat until you hand it back.
- **Automations** (toggle each): deposit reminders, day-before delivery reminders, thank-you + review, re-order nudges (opted-in customers only — POPIA), FAQ answers, order intake. **Run today's** fires them against the current orders.
- **WhatsApp Business setup** checklist (profile, catalogue, templates, opt-in, Cloud API connection).

## Compliance module (business legalities)
- Checklist grouped by area: identity & tax (SARS, provisional tax, VAT), CIPC registration, business bank account, food-premises certificate (R638) and business licence, POPIA (Information Officer, privacy notice & marketing opt-in), B-BBEE EME affidavit, UIF/COIDA.
- Each task shows why it matters, steps, documents (checked against the vault), cost, time and the official site.
- **Prepare with agent** → the agent pre-fills what it can and marks it *ready for you*; the owner submits/pays herself (*I've submitted it* → *Mark approved*). Finished tasks add their certificate to the vault and unlock dependent tasks (e.g. CIPC → bank account).
- Upcoming legal dates, turnover vs VAT threshold, document vault. Guidance only — not legal or tax advice.

## Status
Hero vertical slice, WhatsApp and Compliance modules working (scripted engine; Grok used when `XAI_API_KEY` is set). Opportunities and CRM tabs use fixture data (CRM memory updates live).

> All data in this repo is synthetic. No real customer or business data.
