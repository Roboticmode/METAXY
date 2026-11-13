# METAXY: Brainstorm

> *METAXY* (Greek *metaxý* "in between"): the bridge between informal daily hustle and structured, formal business.
> Working notes. **Status: DRAFT — decisions marked 🔲 need team sign-off.**

## 1. Problem
South Africa has ~3M small businesses on a wide spectrum:
- **Informal / solo** — barbers, spaza shops, side-hustlers running on WhatsApp.
- **Micro/small formal teams (5–50)** — trades like a 5-person plumbing crew, drowning in paper (quotes, job cards, invoices).

Pain points
1. **Rigid WhatsApp workflows break on real context** — no greeting, bereavement, odd dates, "I'll pay on delivery".
2. **Informal-to-formal wall** — CIPC registration, SARS tax, business banking feel impossible without guidance.
3. **Black-box AI = no trust** — owners want to *see* what the agent is doing and approve exceptions.

## 2. Product idea (one sentence)
A **Grok Bot agent that runs a small business's customer conversations and admin, with a live visual command centre** where the owner watches, verifies and approves what the agent does.

## 3. Pillars (from the team's earlier thinking)
| # | Pillar | Agent does | Dashboard shows |
| --- | --- | --- | --- |
| 1 | Compliance & Formalisation | Walks owner through CIPC, SARS, business bank account; tracks deadlines | Checklist, status tracker, document vault |
| 2 | Operations | Handles off-script chats, enforces policy, drafts quotes/invoices, digitises job cards | Live WhatsApp mirror, order/payment surface, invoice pipeline, approval cards |
| 3 | Opportunity | Finds buyers/suppliers in a radius | Lead cards, distance, outreach status |
| 4 | CRM & Retention | Remembers customers, schedules follow-ups, drafts campaigns | Customer timeline, follow-up queue |

## 4. Candidate demo scenarios
| ID | Scenario | Persona | Pillars | Wow factor | Build effort |
| --- | --- | --- | --- | --- | --- |
| **A** | Off-script WhatsApp order: no greeting + bereavement + "pay on delivery" → empathy, calendar check, deposit policy, owner override card | Moonlighting baker/pet-care owner | Ops (+CRM memory) | ⭐⭐⭐⭐⭐ (mirrors [Mentor]'s own example) | Medium |
| **B** | Plumber voice note → structured job card → invoice sent | 5-person plumbing crew | Ops | ⭐⭐⭐⭐ (shows time saved on paper) | Medium |
| **C** | Informal trader formalises + gets 15 km lead list | Spaza/supplier | Compliance + Opportunity | ⭐⭐⭐ (broad, harder to make "real") | High |

## 5. Recommendation 🔲
**Vertical slice = Scenario A as the hero demo, with a light Compliance nudge, B as stretch.**

Why: it's literally the example the mentor gave (judges "get" it instantly), it's easy to simulate with made-up data, it showcases the agent's strengths (context, memory, tools, policy) *and* the dashboard-trust insight, and it needs no external integrations to look real.

Flow for the 3-min demo:
1. Show owner's **Policies** (deposit 50%, lead time, no pay-on-delivery) — "the well-briefed agent".
2. Customer message lands (simulated WhatsApp) — condolences, calendar check for Thursday, polite deposit requirement.
3. Dashboard updates live: chat mirror, **Order card** (payment blocked), **Approval card** (Allow once / Refuse).
4. Owner clicks *Allow once* → agent confirms to customer, order moves to *Confirmed*, customer memory updated.
5. Agent notices revenue crossing a threshold → **Compliance card**: "You're ready to register with CIPC — here's your checklist." (the *METAXY bridge* moment).
6. Flash tabs 3 & 4 (Opportunity, CRM) populated with fixture data to show the roadmap.

Stretch: B (voice note → job card → invoice) as a second persona toggle.

## 6. Architecture (proposed) 🔲
```
WhatsApp Simulator (web chat)  ─┐
Voice-note input (stretch)     ─┼─►  Agent Adapter  ──►  Grok Bot agent (memory + tools)
Owner approvals (UI)           ─┘        │                     │ tools: calendar, quote/invoice,
                                         ▼                     │ policy check, customer memory,
                                  Event / State store  ◄───────┘ compliance checklist
                                         │
                                         ▼
                          Dashboard (presentational, state-driven)
```
- **Agent Adapter boundary:** UI never calls the agent directly; it renders a *state projection* (tasks, invoices, approvals). Lets us swap Grok Bot / mock agent freely.
- **Mock-agent mode:** a scripted agent returns the Scenario A events so the UI is demo-able even if credits/credentials aren't ready or the network fails. **Do this first.**
- **Surface pattern:** the chat is not the interface — agent emits structured events → Task / Invoice / Approval cards.
- Stack 🔲 (suggestion: Next.js + TypeScript + Tailwind + shadcn, SSE for live updates, JSON/SQLite store, deploy on Vercel). Reuse layout from **Vanguard OS** if repo is available.

## 7. Differentiators to emphasise to judges
- Handles **off-script human context**, not just button flows.
- **Visual trust layer** — owner stays in control (approval cards).
- **Informal → formal ladder**: the only entry that grows with the business.
- Built for SA reality: WhatsApp-first, ZAR, CIPC/SARS/VAT-threshold aware, low-data.

## 8. Risks
| Risk | Mitigation |
| --- | --- |
| Credits/credentials arrive late | Mock agent adapter first |
| Scope creep (4 pillars) | Hero = A; others are fixtures |
| Live demo/network failure | Pre-recorded fallback + scripted mode |
| Compliance facts wrong | Cite source (SARS/CIPC) on the card; mark as "guidance, not advice" |
| Real WhatsApp API unavailable | Use simulator; state it's a drop-in swap |

## 9. Synthetic data needed (made-up only)
- Business: "Thandi's Bakes" (side-hustle baker, Soweto), policy: 50% deposit, 3-day lead time.
- Customer: "Sipho M." — message in bereavement context, wants order by Thursday, pay on delivery.
- Calendar with Thursday free / Wednesday full.
- 8–10 past orders + 5 customers for CRM tab.
- Plumber: "Mokoena Plumbing" — 1 voice-note transcript, parts list, labour rate.
- 6–8 leads for Opportunity tab (fake names, real-looking suburbs).
- CIPC/SARS checklist content (public info, with source links).

## 10. Decisions log
| # | Decision | Status |
| --- | --- | --- |
| 1 | Hero scenario = A | 🔲 |
| 2 | Pillars wired E2E = Operations + Compliance | 🔲 |
| 3 | Stack | 🔲 |
| 4 | Roles (agent / frontend / data+demo) | 🔲 |
| 5 | Product name spelling: **METAXY** | ✅ |
