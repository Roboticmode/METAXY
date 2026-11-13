# METAXY: live demo run-sheet (60 s)

The live demo runs from **1:05 to 2:05** of the 3-minute pitch ([`script.md`](script.md)). One person drives the mouse and one person speaks. Rehearse it at least twice with the exact build you will demo.

The demo persona is **Naledi Studio**: Naledi Khumalo, a third-year Information Systems student who runs a small design and web studio. Everything on screen is synthetic: Naledi, her clients (Buhle Sithole, Thabo Nkosi …), her timetable, numbers and invoices.

Screenshots of each expected state are in [`assets/`](assets/), captured from the live app with the scripted engine on 13 Nov 2026.

---

## 0 · Before the pitch (T-30 min)

| ✓ | Check |
| --- | --- |
| ☐ | Laptop is on mains power. Notifications are off (Windows: Focus / Do not disturb). Close Slack, WhatsApp Desktop and email. |
| ☐ | The repo is on the branch you rehearsed. `npm install` has run. `npm run dev` is running. |
| ☐ | Open **`http://localhost:3000/dashboard`** (the landing page is at `/`). Bookmark it. No sign-in is needed: logged out, the header shows *Demo · Sign in*. |
| ☐ | **Engine decision.** No `.env.local` (or an empty `XAI_API_KEY`) means the **scripted** engine: offline and a few seconds per scenario. With a key, the **Grok live** engine is slower and needs Wi-Fi. If you go with Grok, run the scenario once to warm it up, then reset. If the venue Wi-Fi is shaky, use scripted. |
| ☐ | If you demo with Grok live, edit the slide 6 footer (`Running offline · scripted engine`) and skip "…which is what ran just now" on slide 9. |
| ☐ | Browser window is **≥ 1440 px wide** at **100 % zoom**, so all three columns (left nav · board · phone panel) are visible. Hide the bookmarks bar. Full screen with `F11`. |
| ☐ | Deck is open in a second window (`docs/pitch/deck/index.html`) on slide 6, and `Alt+Tab` switches cleanly between the two. |
| ☐ | Fallback video is open, paused at 0:00, in a third window (see [Fallback plan](#fallback-plan)). |
| ☐ | **Reset** the app (§4). The phone panel header reads **Buhle Sithole · Sithole Events · +27 82 555 0142**, the board shows **Operations**, the triggers strip shows **1 calendar collision · 2 overdue**, and the Approval queue says **clear**. |

> ⚠️ **Gotcha:** the preset buttons send the message **as whoever is open in the phone panel**. If you clicked another chat in the WhatsApp inbox, the Friday request is sent as that client and the story changes. Always check that the header says **Buhle Sithole** before step 1.

---

## 1 · Click path (what to click → what appears → what to say)

### Step 1 · 1:05 · "Can you do it by Friday?"
**Click:** phone panel (right) → **Simulate client** (already selected) → preset **`1 · Can you do it by Friday?`**

**On screen (a few seconds, scripted):** [`assets/02-friday-approval.png`](assets/02-friday-approval.png)
- Client bubble: *"hey naledi got your number from a friend. need a 3-page website for Sithole Events urgently, can you do it by next friday?"*
- **Agent activity** streams, each line tagged with the agent that did it:
  `CLIENT DESK · Triage incoming WhatsApp` (new lead, urgent, asked for Friday 20 November) → `CLIENT DESK · Match client ledger` (new lead) → `PLANNER · Check university + studio calendar` (**BLOCKED**: IS302 Term Test 2 on Thursday 19 November, 0 h free) → `BOOKS · Draft quote & deposit rule` (R3 200 · 50 % deposit R1 600) → `CLIENT DESK · Hold outbound message for approval`.
- **Approval queue:** *Test-week capacity alert · propose Saturday 21 November*, with the drafted WhatsApp reply and **Approve & send / Hold**. Nothing has been sent to the client yet.

**Say:**
> "Naledi is a student who freelances. A new client wants a website by Friday. A normal bot says yes."
>
> *(point at Agent activity)* "METAXY's agents check both sides of her life. Planner sees a database test on Thursday. Books prices it with a deposit. Client Desk drafts an honest reply, and stops. Nothing goes out without Naledi."

### Step 2 · 1:22 · Owner approves
**Click:** Approval queue → **Approve & send**.

**On screen (a few seconds):** [`assets/03-approved-formalise-nudge.png`](assets/03-approved-formalise-nudge.png)
- Approval card → **ALLOWED**. The reply appears in the phone panel as a *METAXY AGENT* bubble.
- **Green card at the top:** **READY TO FORMALISE NALEDI STUDIO** (*turnover ≈ R92 400 across 12 months…*), with *Open checklist*.

**Say:**
> "One click, and the honest date goes out. And because the studio keeps growing, METAXY says: *you're ready to formalise.*"

### Step 3 · 1:32 · Collision caught before it happens
**Click:** triggers strip → **Check collisions (Planner)**. Then on the new card → **Approve & send**.

**On screen (a few seconds each):** [`assets/04-collision-approval.png`](assets/04-collision-approval.png) → [`assets/05-collision-cleared.png`](assets/05-collision-cleared.png)
- New card: *Resolve Wednesday 25 November collision · Capstone Milestone 3 Demo*. Thabo Nkosi's solar website is due the same day as her capstone demo. The draft asks Thabo for **+1 day (Thursday 26 November)**, and Planner moves a revision block to Saturday.
- After approving: the triggers strip reads **Calendar clear** and the calendar panel says **IN SYNC**.

**Say:**
> "Two weeks out, Planner spots a client deadline on the same day as her capstone demo. It proposes the fix and drafts the message to the client. Naledi approves. Collision gone, before it ever happened."

### Step 4 · 1:47 · The line it never crosses
**Click:** phone panel → preset **`Coursework boundary (Never)`**.

**On screen (a few seconds):** [`assets/11-coursework-boundary.png`](assets/11-coursework-boundary.png)
- Client bubble: *"hey can you also write my cousin's IS302 database assignment for R500?"*
- Agent reply: *"…I never write, edit, or complete university assignments or coursework…"*
- Agent activity: `CLIENT DESK · Academic integrity boundary (P-05)` → **Blocked**.

**Say:**
> "And some things it never does. Paid to write an assignment? It declines, politely, every time."

### Step 5 · 2:02 · Hand back to the deck
`Alt+Tab` to the deck, press `→` to slide 7, and say exactly:
> **"So what did you just see? One rule."**

---

## 2 · Timing budget

| Step | Target | Scripted engine (observed) | Grok live |
| --- | --- | --- | --- |
| 1 · Friday request | 1:05–1:22 | a few seconds from click to approval card | several seconds per model step; talk over it |
| 2 · Approve & send | 1:22–1:32 | a few seconds | a few seconds |
| 3 · Check collisions + approve | 1:32–1:47 | a few seconds per click | same (no model call) |
| 4 · Coursework boundary | 1:47–2:02 | a few seconds | several seconds |

Time each step yourself in rehearsal and write the real numbers here.

If step 1 is still streaming when your line ends, **stop talking and let the audience watch**. The streaming steps are the point.

---

## 3 · Optional extras (only if you have time, or in Q&A)
- **Compliance bridge:** green card → **Open checklist** → CIPC company registration is selected → **Prepare with agent**. The task turns *ready for you*. The agent pre-fills; Naledi signs and pays herself. Screenshots: [`06`](assets/06-compliance-cipc.png) → [`07`](assets/07-compliance-cipc-prepared.png).
- **Books:** triggers strip → **Chase overdue (Books)** → friendly EFT reminders drafted for overdue invoices, each waiting for approval.
- **Scope creep:** preset `4 · Scope creep request` → Client Desk compares the request with the agreed deliverables, flags it and drafts a change quote.
- **FAQ:** preset `FAQ — banking details` or `FAQ — rates & packages` → answered from the brief, no owner time needed.
- **Hand-off:** preset `Complaint (hand off)` → the agent hands the chat to Naledi instead of guessing.
- **Exam mode:** triggers strip → **Exam mode** → new intake pauses and active clients get a polite "away until…" draft.

Run each extra from a **reset** state (with Buhle's chat open), or the inbox gets noisy.

---

## 4 · Reset procedure (between rehearsals and right before going on)
1. Click the **reset icon** (↻, *Reset demo*) at the top-right of the **phone panel**, next to the *AGENT* badge. This clears messages, approvals, nudges and compliance progress back to the seed data.
2. Click **Operations** in the left nav.
3. Check: the phone header says **Buhle Sithole**, the triggers strip shows **1 calendar collision · 2 overdue**, the Approval queue is **clear**, and there's no green *ready to formalise* card. Screenshot: [`assets/01-dashboard-idle.png`](assets/01-dashboard-idle.png).

If anything looks off, **reload the page (F5)**. State lives only in memory, so a reload is a full reset too.

---

## Fallback plan

| Situation | What to do | What to say |
| --- | --- | --- |
| **A Grok call fails mid-demo** | Nothing. That step falls back to the scripted engine automatically, and Agent activity shows an amber `Engine fallback` line. | "The network blinked, so the offline engine took over that step. That's by design." |
| **Grok is slow or Wi-Fi is down before you start** | Rename `.env.local` (or empty `XAI_API_KEY`) and restart `npm run dev`. The phone panel badge must read **SCRIPTED**. This is fully offline. | Nothing. Demo as normal. |
| **The app won't load, or the laptop misbehaves** | Switch to the **pre-recorded video** and play it from the step you were on. Keep saying the same lines. | "Let me show you the recording." |
| **The projector won't take the browser** | Present the deck only. Slides 5 and 8 contain real screenshots; walk through [`assets/`](assets/) images 02 → 03 → 04 → 05 → 11 if you can. | Same lines, in past tense. |

### Recording the fallback video (do this after feature freeze, ~15:30)
1. Reset the app (§4), scripted engine, 1440–1600 px wide window, 100 % zoom.
2. Record the screen: **Win + Alt + R** (Xbox Game Bar), or OBS. Capture the browser window only.
3. Do steps 1 → 4 exactly as above, at presenting pace (~50 s), **without voice**. The speaker talks live over it.
4. Trim it to start on the idle dashboard. Save it as `metaxy-demo-fallback.mp4` on the presenting laptop's desktop **and** a USB stick.
   Don't commit it to the repo (size). Note where it is here: `[path / link]`.
5. Play it once on the projector during setup.

---

## Known issue to fix before the pitch
The drafted Friday reply proposes **Saturday 21 November** but ends with *"Does Monday work?"* (seed data in `src/lib/agent/`). Fix the wording before rehearsal, or a judge may notice.

---

## Things that must stay true on stage
- Say **"simulated WhatsApp"**, never "connected to WhatsApp". The Cloud API isn't wired up; the setup checklist is.
- Only say **"Grok"** if the badge reads **GROK LIVE**.
- Compliance is **guidance, not legal or tax advice**. The agent never signs, submits or pays.
- METAXY **never writes coursework**. It manages time *around* school.
- Opportunities and most of CRM are **sample (fixture) data**.
- All people, phone numbers (`+27 … 555 01xx`) and businesses are fictional.
