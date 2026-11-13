# Student-Freelancer Archetype — Primary Demo Use Case

> **Status:** Chosen demo archetype for METAXY implementation.  
> **Scope note:** METAXY is designed to work for any South African small business (formal or informal). This document defines the **specific archetype and vertical slice** we are seeding with data and demonstrating end-to-end.

---

## 1. Purpose

The hackathon brief asks for Grok Bot agents that save South African small businesses time, money, and effort on real repeating tasks, tested with made-up data.

We chose the **student-freelancer** archetype as our primary demo lens because:
- The repeating tasks happen every week (enquiries, quoting, scheduling, invoicing, scope changes).
- The failure modes are immediately relatable to judges (two competing calendars, awkward payment chasing, scope creep).
- The boundary between what the AI may do and what requires human approval is crystal clear.
- All data can be cleanly synthesised with zero real personal, banking, or university information.

---

## 2. The Archetype

**Naledi Khumalo** is a fictional third-year Information Systems student in Johannesburg who runs a small freelance design and web studio (**Naledi Studio**) for local small businesses alongside her university studies. All names, numbers, timetables, and messages are invented.

| Attribute | Value |
| --- | --- |
| Business name | Naledi Studio (sole-trader side business, informal → formalising) |
| Studies | 5 university modules, 2 tests, assignments, and a capstone milestone in a typical term |
| Freelance services | Logos, social media graphics, and small websites for local businesses |
| Active clients | 4 active, 1 new lead, 1 dormant (6 seeded clients) |
| Freelance capacity | Target 8–10 hours/week during term, more during holidays |
| Income | Roughly R6,000–R9,000/month, paid by EFT, 50% deposit on new projects |
| Client channels | WhatsApp first, email second |
| School channels | Lecturer announcements, university LMS, class timetable |
| Current tracking | Phone calendar, notes app, and a manual invoice spreadsheet |

Her week has **fixed blocks** (lectures, labs, tests, study sessions) and **floating blocks** (client design and build work). Client requests arrive at any hour with no visibility into her academic load. Nothing in her current tools shows both sides together, so she carries the entire schedule in her head.

---

## 3. The Core Problem

Naledi has **one pool of time** and **two sets of deadlines**, with no shared view of both. Each side looks manageable on its own; the damage happens where they collide. METAXY's core value here is **keeping both sides in line**, not automating either one in isolation.

### Failure modes we design for
1. **Deadline collisions:** A client delivery and a capstone milestone land on the same day, discovered too late.
2. **Overpromising:** A client asks *"can you do it by Friday?"* and she says yes without checking test week capacity.
3. **Slow money:** Invoices go unchased because payment reminders feel awkward and get postponed.
4. **Scope creep:** Extra requests (*"just a few more logo variations"*) arrive over WhatsApp and are absorbed unpriced.
5. **Going dark:** During tests and exams, clients receive no updates and quietly drop off.
6. **Dropped commitments:** Promises made in WhatsApp chats never reach her calendar.

**Central thesis:** One shared commitment ledger and command centre where METAXY's agents spot cross-side conflicts early and propose exact fixes Naledi can approve in seconds.

---

## 4. Jobs to Be Done

Ten repeating tasks across Client work, School commitments, and the Cross-side overlap (which carries the demo):

| Job | Side | Trigger | What METAXY produces |
| --- | --- | --- | --- |
| Triage a new enquiry | Client | New WhatsApp or email message | Summary, fit check, draft reply |
| Quote & set up a project | Client | Client confirms interest | Quote, 50% deposit request, milestones & dates |
| Send progress updates | Client | Milestone reached or quiet period | Short status update draft |
| Chase overdue invoices | Client | Invoice passes due date | Escalating reminder draft with EFT details |
| Handle a scope change | Client | Request outside agreed deliverables | Out-of-scope flag + draft change quote |
| Capture school deadlines | School | Lecturer notice or syllabus entry | Deadlines added to the shared calendar |
| Plan study blocks | School | New assignment or test date | Proposed study sessions scheduled around client work |
| Weekly capacity plan | Both | Sunday evening / Monday morning | One-page summary: free hours, committed hours, collision risks |
| Detect & resolve conflicts | Both | Two commitments compete for the same window | Reschedule options + drafted message to affected person |
| Answer availability questions | Both | *"Can you do it by Friday?"* | Honest reply grounded in real two-sided capacity |

---

## 5. Agent Roster

Three specialist roles coordinated behind METAXY's pipeline, matching Grok Bot's model of persistent, named teammates. **Planner** is the cross-side coordinator that keeps Client and School aligned.

| Agent | Owns | Reads | Acts alone on | Asks first on |
| --- | --- | --- | --- | --- |
| **Client Desk** | Enquiries, quotes, updates, scope checks | Client messages, project briefs, agreed deliverables | Summaries, scope flags, draft replies, CRM notes | Sending any message or quote to a client |
| **Books** | Deposits, invoices, payment chasing | Invoice ledger, payment confirmations | Tracking due dates, flagging overdue accounts, drafting reminders | Sending an invoice/reminder or changing an amount |
| **Planner** | Shared calendar, deadlines, capacity, conflicts | University timetable, school deadlines, project milestones | Capacity calculations, collision detection, proposing options | Adding/moving real calendar events, messaging clients or lecturers |

`Client Desk` and `Books` query `Planner` before promising any delivery date, and `Planner` rejects or shifts dates that collide with fixed academic commitments.

---

## 6. Approvals and Boundaries

**Rule:** Agents prepare; Naledi decides. Nothing leaves her workspace or alters a real commitment without explicit approval via an Approval card showing the exact wording or change.

| Level | Rule | Examples |
| --- | --- | --- |
| **Do alone** | Internal, reversible prep | Reading messages, summarising, calculating weekly capacity, flagging scope creep, drafting replies, updating internal CRM notes |
| **Ask first** | Anything external or binding | Sending WhatsApp/email replies to clients or lecturers, issuing invoices or payment reminders, moving calendar blocks, accepting a project |
| **Never** | Hard out-of-bounds | Writing, editing, or submitting academic coursework; moving money; contacting anyone outside her client/lecturer list; sharing one client's details with another |

> **Academic integrity boundary:** METAXY manages Naledi's time *around* school — it never performs or submits her coursework.

---

## 7. Demo Scenarios (4 Core + 1 Bonus)

Each scenario runs independently or sequentially from a fixed synthetic seed (`DEMO_TODAY`) so every demo run is deterministic:

| # | Scenario | Trigger | Agent workflow | Owner approval | Visible UI result |
| --- | --- | --- | --- | --- | --- |
| **1** | **"Can you do it by Friday?"** | Urgent WhatsApp enquiry lands during test week | `Client Desk` parses request & checks `Planner`; `Planner` spots Thursday test + low free hours, proposes Monday delivery | Approves drafted reply with Monday date | Honest availability offered; provisional slot added to shared calendar |
| **2** | **Collision week** | Weekly capacity check finds a client delivery and capstone milestone on the same day | `Planner` detects collision, proposes moving two study blocks, and drafts a polite 1-day extension note to the client | Approves calendar shift + extension message | Conflict cleared before deadline day; both sides updated |
| **3** | **Overdue invoice** | An invoice passes 21 days overdue | `Books` flags overdue balance and drafts a friendly EFT reminder; when payment is logged, drafts a thank-you | Approves reminder send | Invoice status moves to Paid; CRM reliability note updated |
| **4** | **Scope creep** | Client asks on WhatsApp for *"a few extra logo variations"* | `Client Desk` compares request against agreed deliverables, flags out-of-scope, drafts an add-on quote | Approves change quote | Extra work priced transparently instead of absorbed for free |
| **5** | **Exam mode** *(bonus)* | Owner toggles Exam Mode | Agents pause new project intake, draft *"away until [date]"* auto-updates, and keep active clients informed | Approves batch pause notices | Intake paused cleanly with zero ghosted clients |

---

## 8. Synthetic Data Plan

All data is synthetic (ZAR amounts, fictional people/businesses, fake `+27 ... 555 01xx` phone numbers) stored in the repo with a fixed reference date:

| Dataset | Size | Key seeded contents |
| --- | --- | --- |
| **Clients** | 6 | 4 active, 1 new lead, 1 dormant (including one similar-name pair to test disambiguation) |
| **Projects** | 8 | Explicit deliverable lists so scope-creep checks have a concrete baseline |
| **Invoices** | 14 | Paid, due soon, and overdue at 7 / 21 / 45 days; two with 50% deposit pending |
| **Client messages** | ~60 | WhatsApp-style messages (English + SA vernacular, vague dates, urgent requests, off-script context) |
| **School modules** | 5 | Weekly lecture and lab timetable blocks |
| **School deadlines** | 12 | Assignments, 2 tests, 1 capstone milestone, and an exam block in week 4 |
| **Shared calendar** | 6 weeks | Fixed university blocks + floating client work blocks |

### Required seeded edge cases
- A client delivery and capstone milestone colliding on the same day.
- An urgent *"by Friday"* request landing during test week.
- One repeat late payer and one early payer.
- A casual WhatsApp request that exceeds agreed deliverables.
- A lecturer announcement shifting an assignment deadline.

---

## 9. Success Metrics (Measurable on Seeded Data)

| Metric | Measurement | Target |
| --- | --- | --- |
| Collisions caught | Seeded client/school collisions flagged ahead of date | 100% |
| Honest availability | Seeded *"by when?"* requests given a date that fits real capacity | 100% |
| Scope creep detected | Seeded out-of-scope requests flagged against deliverables | ≥ 4 of 5 |
| Overdue invoices handled | Overdue invoices with reminder drafted in one run | 100% |
| Time to first draft | Time from incoming message to approval-ready draft | < 60s |
| Safety | Outbound messages/invoices sent without owner approval | 0 |

---

## 10. Generalising to Any Small Business

METAXY's engine is domain-agnostic; the student-freelancer setup simply swaps configuration and seed data:

| In the Student-Freelancer Demo | In Any Small Business |
| --- | --- |
| University timetable & deadlines | Any fixed constraint: day job, supplier lead times, opening hours, team shifts |
| Freelance clients | Customers / accounts |
| `Client Desk` | Customer-facing agent (enquiries, quotes, scope, updates) |
| `Books` | Billing, deposits, and collections agent |
| `Planner` | Capacity and scheduling agent |
| Exam mode | Seasonal / holiday / at-capacity mode |

---

## 11. Mapping to the Current METAXY Codebase

Currently, the dashboard shell and agent event pipeline are implemented using an initial placeholder bakery dataset (`Thandi's Bakes` in `src/lib/agent/data.ts`). Adapting the live app to this chosen archetype maps cleanly onto the existing architecture:

- **Event-driven UI (`src/lib/agent/types.ts`, `src/lib/store.tsx`):** Keep the `AgentEvent` stream (`trace`, `reply`, `order`/project, `approval`, `memory`, `compliance`) and extend event/state types for **school commitments**, **capacity/collision alerts**, **invoices**, and **scope-creep flags**.
- **Seed data (`src/lib/agent/data.ts`):** Replace the bakery catalog/orders with Naledi Studio's profile, policies, service deliverables, 6 clients, 8 projects, 14 invoices, 5 school modules, 12 school deadlines, and preset WhatsApp triggers for Scenarios 1–4.
- **Agent pipeline & tools (`src/lib/agent/pipeline.ts`, `src/lib/agent/tools.ts`, `src/lib/agent/brain.ts`):** Upgrade `checkCalendar` into a two-sided `Planner` capacity/collision check, add scope-comparison and invoice-aging tools (`Client Desk` + `Books`), and update `grokBrain` / `mockBrain` prompts accordingly.
- **Dashboard boards (`src/components/operations-board.tsx`, `src/components/compliance-board.tsx`, `src/components/other-boards.tsx`, `src/components/whatsapp-panel.tsx`):** Surface the shared Client + School commitment timeline, collision resolution cards, scope-creep change-quote approvals, and invoice chasing alongside the Compliance, Opportunities, and CRM & Retention views.

*(See [graduate-founder.md](graduate-founder.md) for the companion "Launch" stage archetype that precedes running the business.)*
