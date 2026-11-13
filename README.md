# Metexi

*Bridging informal hustle and formal business for South African small businesses.*

An AI agent (Grok Bot) that handles a small business's customer conversations and admin — paired with a live visual command centre so owners can **see, verify and approve** everything it does.

Built for the [Grok Bot Johannesburg Hackathon](https://luma.com/spacexai-0jmr?tk=zB235j) · 13 Nov 2026 · WeThinkCode Joburg.

## Pillars
Compliance & Formalisation · Operations · Opportunity Discovery · CRM & Retention

## Docs
- [Hackathon brief](docs/00-hackathon-brief.md) — rules, credits, prizes, questions for the mentor
- [Brainstorm](docs/01-brainstorm.md) — problem, scenarios, recommended vertical slice, architecture, risks
- [Sprint plan](docs/02-sprint-plan.md) — roles, timeline, demo checklist

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

## Status
Hero vertical slice working. Opportunities and CRM tabs use fixture data (CRM memory updates live).

> All data in this repo is synthetic. No real customer or business data.
