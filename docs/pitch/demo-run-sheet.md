# METAXY: live demo run-sheet (60 s)

The live demo runs from **1:05 to 2:05** of the 3-minute pitch ([`script.md`](script.md)). One person drives the mouse and one person speaks. Rehearse it at least twice with the exact build you will demo.

Everything on screen is synthetic: Naledi Studio, Buhle Sithole, Thabo Nkosi and all other clients, modules, numbers and invoices.

Screenshots of each expected state are in [`assets/`](assets/). They were captured from `main` (b770745, Naledi Studio data) with the scripted engine at 1600×900 on 13 Nov 2026.

---

## 0 · Before the pitch (T-30 min)

| ✓ | Check |
| --- | --- |
| ☐ | Laptop is on mains power. Notifications are off (Windows: Focus / Do not disturb). Close Slack, WhatsApp Desktop and email. |
| ☐ | The repo is on the commit you rehearsed. `npm install` has run, so `@supabase/ssr` is present. `npm run dev` is running. If Turbopack can't resolve `next` (e.g. `node_modules` is a junction), use `npx next dev --webpack`. |
| ☐ | **URL:** the dashboard is at **`http://localhost:3000/dashboard`**. The landing page at `/` has **Launch live demo (no sign-up)**, which goes to the same place. Bookmark `/dashboard`. Don't sign in: the demo runs logged out, and the header shows **DEMO · SIGN IN**. |
| ☐ | **Engine decision.** No `.env.local` (or an empty `XAI_API_KEY`) means the **scripted** engine: offline, about 7 s per enquiry. With a key, the **Grok live** engine is slower and needs Wi-Fi. If you go with Grok, run the demo once to warm it up, then reset. If the venue Wi-Fi is shaky, use scripted. |
| ☐ | If you demo with Grok live, edit the slide 6 footer (`Running offline · scripted engine`) and skip "…which is what ran just now" on slide 9. |
| ☐ | Browser window is **≥ 1440 px wide** at **100 % zoom**, so all three columns (left nav · board · phone panel) are visible. Hide the bookmarks bar. Full screen with `F11`. |
| ☐ | Deck is open in a second window (`docs/pitch/deck/index.html`) on slide 6, and `Alt+Tab` switches cleanly between the two. |
| ☐ | Fallback video is open, paused at 0:00, in a third window (see [Fallback plan](#fallback-plan)). |
| ☐ | **Reset** the app (§4). Operations shows **1 CALENDAR COLLISION · 2 OVERDUE**, the Approval queue says *Nothing needs your decision yet*, and Agent activity is **idle**. |

> The preset buttons now send as their own client (each preset carries a `customerId`), so it no longer matters which chat is open in the phone panel.

---

## 1 · Click path (what to click → what appears → what to say)

### Step 1 · 1:05 · "Can you do it by Friday?"
**Click:** phone panel (right) → **Simulate client** (already selected) → preset **`1 · Can you do it by Friday?`**

**On screen (≈ 7 s to the approval card, scripted):** [`assets/02-friday-approval.png`](assets/02-friday-approval.png)
- Client bubble from **Buhle Sithole (Sithole Events)**: *"…need a 3-page website for Sithole Events urgently, can you do it by next friday?"*
- **Agent activity** streams, one agent per step:
  - `CLIENT DESK` Triage incoming WhatsApp (urgent, asked for Friday 20 November)
  - `CLIENT DESK` Match client ledger (new lead)
  - `PLANNER` Check university + studio calendar: **BLOCKED** (IS302 Term Test 2 on Thursday 19 November), proposing **Saturday 21 November**
  - `BOOKS` Draft quote & deposit rule (R3 200 total, 50 % deposit R1 600)
  - `CLIENT DESK` Hold outbound message for approval
- **Approval queue:** *Test-week capacity alert · propose Saturday 21 November* (PLANNER), with the **Draft WhatsApp message** and **Approve & send** / **Hold**. The header shows **1 DECISION WAITING**.

**Say:**
> "A new client, Buhle, messages Naledi: a three-page website, urgently, by next Friday. It's test week."
>
> *(point at Agent activity as steps appear)* "Client Desk reads it. Planner checks both calendars: her database test is Thursday, so Friday isn't honest. It proposes Saturday, prices it, and holds the reply for her."

⚠️ **Known app bug:** the scripted draft proposes Saturday 21 November but ends with *"Does Monday work?"*. **Don't read the draft aloud.** It needs a one-line fix in the scripted compose text (`src/lib/agent/brain.ts`), not in these docs.

### Step 2 · 1:23 · Naledi approves
**Click:** Approval card → **Approve & send**.

**On screen (≈ 4 s):** [`assets/03-approved-formalise-nudge.png`](assets/03-approved-formalise-nudge.png)
- The card turns **ALLOWED**, and the exact draft appears as a **METAXY AGENT** bubble in Buhle's chat.
- Agent activity: `Approved by Naledi` → `Provisional studio block added` → `Check formalisation readiness` (trailing 12-month turnover ≈ R92 400).
- **Green card at the top:** **READY TO FORMALISE NALEDI STUDIO**, with **Open checklist**. Compliance in the left nav gets a badge.

**Say:**
> "Naledi approves. The reply goes out, the slot is pencilled in, and the agent notices she's ready to formalise."

### Step 3 · 1:31 · Collision week
**Click:** **Check collisions (Planner)** (Agent triggers bar, top of Operations). A new card appears (≈ 2 s). Then click **Approve & send** on it.

**On screen:** [`assets/04-collision-approval.png`](assets/04-collision-approval.png) → [`assets/05-collision-cleared.png`](assets/05-collision-cleared.png)
- Agent activity: `Scan Client + School calendars` → **`Deadline collision found!`**: PRJ-109 (Thabo Nkosi · Nkosi Solar) and Capstone Milestone 3 Demo both fall on **Wednesday 25 November** → `Propose 2-sided resolution` (shift the revision study block to Sat 21 Nov, and ask Thabo for one extra day, to Thu 26 Nov).
- Card: *Resolve Wednesday 25 November collision · Capstone Milestone 3 Demo*, with a draft to Thabo.
- After **Approve & send** (≈ 4 s): `Collision cleared`. The trigger badge flips to **CALENDAR CLEAR**, and the shared calendar shows **IN SYNC**. The message goes into Thabo's chat; the phone panel stays on Buhle, which is fine.

**Say:**
> "Planner also scans the next two weeks. A client website lands on her capstone demo day. It proposes one extra day, with a draft to the client. Approve."

### Step 4 · 1:43 · Compliance bridge
**Click:** **Open checklist** on the green card. The Compliance tab opens with **CIPC company registration** selected. Then click **Prepare with agent**.

**On screen (≈ 3 s):** [`assets/06-compliance-cipc.png`](assets/06-compliance-cipc.png) → [`assets/07-compliance-cipc-prepared.png`](assets/07-compliance-cipc-prepared.png)
- The button shows *Preparing…*, then the task turns **READY FOR YOU**, with a **Prepared by agent** list and an **Only you can do this** box (log in with your own CIPC customer code, sign and pay).

**Say:**
> "CIPC registration: the agent checks her documents and pre-fills the application. Naledi signs and pays herself."

*Don't click "I've submitted it" on stage.*

### Step 5 · 1:52 · The "Never" boundary
**Click:** phone panel preset **`Coursework boundary (Never)`**. This works from any tab.

**On screen (≈ 2 s):** [`assets/11-coursework-boundary.png`](assets/11-coursework-boundary.png)
- Client bubble: *"hey can you also write my cousin's IS302 database assignment for R500?"*
- Agent reply: *"…I never write, edit, or complete university assignments or coursework. Let me know if you need studio design work instead!"*
- Agent activity (if on Operations): `Academic integrity boundary (P-05)` → **Blocked**.

**Say:**
> "And if someone asks it to write a cousin's assignment for five hundred rand? Never."

### Step 6 · 2:02 · Hand back to the deck
`Alt+Tab` to the deck, press `→` to slide 7, and say exactly:
> **"So what did you just see? One rule."**

---

## 2 · Timing budget

| Step | Target | Scripted engine (measured) | Grok live |
| --- | --- | --- | --- |
| 1 · Friday enquiry | 1:05–1:23 | ≈ 6.7 s to the approval card (≈ 7.1 s until idle) | several seconds per model step; talk over it |
| 2 · Approve & send | 1:23–1:31 | ≈ 4.2 s | similar (no model call on approve) |
| 3 · Check collisions + approve | 1:31–1:43 | ≈ 2.6 s + ≈ 4.0 s | slower (the draft is composed by the model) |
| 4 · Prepare with agent | 1:43–1:52 | ≈ 3.2 s | same (no model call) |
| 5 · Coursework boundary | 1:52–2:02 | ≈ 2.3 s | a few seconds |

Measured on 13 Nov 2026 with local `next dev --webpack`, the scripted engine and headless Chrome at 1600×900.

If a step is still streaming when your line ends, **stop talking and let the audience watch**. The streaming steps are the point.

---

## 3 · Optional extras (only if you have time, or in Q&A)
- **Run today's** (WhatsApp tab → Automations): sends 4 template messages (deposit nudges to Kagiso Mokoena and Buhle, a test-week status update to Zanele Dube, and a dormant check-in to Amina Patel, who opted in). Screenshots: [`assets/09-whatsapp-automations-run.png`](assets/09-whatsapp-automations-run.png), [`assets/10-operations-activity.png`](assets/10-operations-activity.png). Note: these send without an approval card, even though the "Deposit & invoice chaser" label says *for your approval*.
- **`4 · Scope creep request`** (Zanele Dube): Client Desk flags the extra logo variations as out of scope, and Books drafts a R950 add-on quote for approval.
- **Chase overdue (Books)**: drafts an EFT reminder for INV-2041 (Kagiso Molefe, R2 400, 21 days overdue) for approval.
- **Exam Mode: OFF → ON**: pauses new intake and drafts a client notice for approval.
- **`Complaint (hand off)`**: the agent hands the chat to Naledi and doesn't guess.
- **Take over:** **Reply as Naledi** → type → the agent pauses for that chat. *Hand back to agent* resumes it.

Run extras from a **reset** state, or the queue gets noisy.

---

## 4 · Reset procedure (between rehearsals and right before going on)
1. Click the **reset icon** (↻, *Reset demo*) at the top-right of the **phone panel**, next to the *AGENT* badge.
   This restores all seed data: messages, projects, invoices, approvals, nudges, the calendar collision, compliance progress, automations and Exam Mode. It **keeps the current tab** and the engine badge.
2. Click **Operations** in the left nav.
3. Check: **1 CALENDAR COLLISION · 2 OVERDUE**, an empty Approval queue, Agent activity **idle**, and no green *Ready to formalise* card. Screenshot: [`assets/01-dashboard-idle.png`](assets/01-dashboard-idle.png).

If anything looks off, **reload the page (F5)**. State lives only in memory, so a reload is a full reset too.

---

## Fallback plan

| Situation | What to do | What to say |
| --- | --- | --- |
| **A Grok call fails mid-demo** | Nothing. That step falls back to the scripted engine automatically, and Agent activity shows an amber `Engine fallback` line. | "The network blinked, so the offline engine took over that step. That's by design." |
| **Grok is slow or Wi-Fi is down before you start** | Rename `.env.local` (or empty `XAI_API_KEY`) and restart the dev server. The phone panel badge must read **SCRIPTED**. This is fully offline. Supabase isn't needed for the logged-out demo. | Nothing. Demo as normal. |
| **The app won't load, or the laptop misbehaves** | Switch to the **pre-recorded video** and play it from the step you were on. Keep saying the same lines. | "Let me show you the recording." |
| **The projector won't take the browser** | Present the deck only. Slides 5 and 8 contain real screenshots; walk through [`assets/`](assets/) images 02 → 03 → 04 → 07 → 11 if you can. | Same lines, in past tense. |

### Recording the fallback video (do this after feature freeze)
1. Reset the app (§4), scripted engine, 1440–1600 px wide window, 100 % zoom.
2. Record the screen: **Win + Alt + R** (Xbox Game Bar), or OBS. Capture the browser window only.
3. Do steps 1 → 5 exactly as above, at presenting pace (~55 s), **without voice**. The speaker talks live over it.
4. Trim it to start on the idle dashboard. Save it as `metaxy-demo-fallback.mp4` on the presenting laptop's desktop **and** a USB stick.
   Don't commit it to the repo (size). Note where it is here: `[path / link]`.
5. Play it once on the projector during setup.

---

## Things that must stay true on stage
- Say **"simulated WhatsApp"**, never "connected to WhatsApp". The Cloud API isn't wired up; the setup checklist is.
- Only say **"Grok"** if the badge reads **GROK LIVE**.
- **Don't claim "zero unapproved messages" overall.** Dates, quotes, collision fixes, overdue reminders and Exam Mode notices wait for approval. FAQ answers, the coursework refusal and **Run today's** automations send on their own. (The landing page currently says "Zero unapproved outbound messages"; flag that to the landing owner.)
- Compliance is **guidance, not legal or tax advice**. The agent never signs, submits or pays.
- Opportunities and most of CRM are **sample (fixture) data**. Only client memory updates live.
- All people, phone numbers (`+27 … 555 01xx`) and businesses are fictional.
