# METAXY: live demo run-sheet (60 s)

The live demo runs from **1:05 to 2:05** of the 3-minute pitch ([`script.md`](script.md)). One person drives the mouse and one person speaks. Rehearse it at least twice with the exact build you will demo.

Everything on screen is synthetic: Thandi's Bakes, Sipho Mabaso and all other customers, numbers and orders.

Screenshots of each expected state are in [`assets/`](assets/), captured from the live app with the scripted engine on 13 Nov 2026.

---

## 0 · Before the pitch (T-30 min)

| ✓ | Check |
| --- | --- |
| ☐ | Laptop is on mains power. Notifications are off (Windows: Focus / Do not disturb). Close Slack, WhatsApp Desktop and email. |
| ☐ | The repo is on the branch you rehearsed. `npm install` has run. `npm run dev` is running, and the URL loads. |
| ☐ | **Which URL?** Today the dashboard is at `http://localhost:3000/`. Once the landing page (Task 1) merges, it moves to **`/dashboard`**. Open the right one and bookmark it. |
| ☐ | **Engine decision.** No `.env.local` (or an empty `XAI_API_KEY`) means the **scripted** engine: offline and about 6 s per scenario. With a key, the **Grok live** engine is slower and needs Wi-Fi. If you go with Grok, run the scenario once to warm it up, then reset. If the venue Wi-Fi is shaky, use scripted. |
| ☐ | If you demo with Grok live, edit the slide 6 footer (`Running offline · scripted engine`) and skip "…which is what ran just now" on slide 9. |
| ☐ | Browser window is **≥ 1440 px wide** at **100 % zoom**, so all three columns (left nav · board · phone panel) are visible. Hide bookmarks bar. Full screen with `F11`. |
| ☐ | Deck is open in a second window (`docs/pitch/deck/index.html`) on slide 6, and `Alt+Tab` switches cleanly between the two. |
| ☐ | Fallback video is open, paused at 0:00, in a third window (see [Fallback plan](#fallback-plan)). |
| ☐ | **Reset** the app (§4). The phone panel header reads **Sipho Mabaso · +27 82 555 0142**, the board shows **Operations**, and Agent activity says **idle**. |

> ⚠️ **Gotcha:** the preset buttons send the message **as whoever is open in the phone panel**. If you clicked another chat in the WhatsApp inbox (e.g. Naledi Khumalo, a returning customer), Scenario A is sent as that customer. Policy then *allows* pay-on-delivery and **no approval card appears**. Always check that the header says **Sipho Mabaso** before step 1.

---

## 1 · Click path (what to click → what appears → what to say)

### Step 1 · 1:05 · Off-script message
**Click:** phone panel (right) → **Simulate customer** (already selected) → preset **`Scenario A — off-script order`**.

**On screen (≈ 6 s, scripted):** [`assets/02-scenario-a-approval.png`](assets/02-scenario-a-approval.png)
- Customer bubble: *"need 40 cupcakes and a small cake for next thursday. my mother passed away last week…can i pay when you deliver?"*
- **Agent activity** streams: `Read message` (no greeting · emotional context: bereavement · 40× cupcake, 1× small cake · Thursday 19 November · payment: on delivery) → `Look up customer` (new customer, no history) → `Check calendar` (1/4 bake slots → AVAILABLE) → `Check payment policy` (**BLOCKED**, P-02) → `Draft order` (R780 total · R390 deposit).
- Agent reply: condolences, Thursday available, explains the 50 % deposit, *"I've asked Thandi whether she can make an exception."*
- **Approval queue:** *Payment exception requested · Sipho Mabaso wants to pay R780 on delivery. Context: recently bereaved.* The header shows **1 decision waiting**.

**Say:** **[PERSONA]**
> "A brand-new customer messages Thandi on WhatsApp. No greeting, their mother just passed, and they want to pay on delivery. Her policy: a 50% deposit, first orders."
>
> *(as steps appear, point at Agent activity)* "Watch Agent activity. It noticed the loss, checked Thursday is free, and hit the policy. So it replied with condolences, explained the deposit kindly, and stopped. Exceptions are Thandi's call."

*Don't read the order number aloud. It's random (ORD-10xx).*

### Step 2 · 1:27 · Owner decides
**Click:** Approval queue → **Allow once**.

**On screen (≈ 4 s):** [`assets/03-allow-once-compliance-nudge.png`](assets/03-allow-once-compliance-nudge.png)
- Approval card → **ALLOWED**. Order → **CONFIRMED**, payment *Pay on delivery (owner exception)*.
- Agent reply: *"Good news Sipho — Thandi has made a once-off exception… Again, our condolences."*
- Agent activity: `Owner allowed exception` → `Check business growth` (trailing 12-mo turnover ≈ R118 400).
- **Green card at the top:** **YOU'RE READY TO FORMALISE**, with *Open checklist*. Compliance in the left nav gets a badge.

**Say:**
> "Thandi allows it, once. The agent confirms Sipho's order and remembers the context. Then it says: *you're ready to formalise.*"

### Step 3 · 1:37 · Compliance bridge
**Click:** **Open checklist** (on the green card). The Compliance tab opens with **CIPC company registration** already selected on the right. Then click **Prepare with agent**.

**On screen (≈ 4 s):** [`assets/04-compliance-cipc.png`](assets/04-compliance-cipc.png) → [`assets/05-compliance-cipc-prepared.png`](assets/05-compliance-cipc-prepared.png)
- Button shows *Preparing…*, then the task turns **READY FOR YOU**.
- **Prepared by agent:** name options checked, private company with standard MOI, registered address from profile, *BizPortal application pre-filled — ready for your CIPC login*.
- **Only you can do this:** *Log in with your own CIPC customer code, sign and pay the fee.* Button: **I've submitted it**.

**Say:**
> "CIPC registration. It checks her documents, pre-fills the application, and gives cost and time. Then it hands it back. The agent never signs or pays."

*Don't click "I've submitted it" on stage. It isn't needed and costs time.*

### Step 4 · 1:50 · Daily automations
**Click:** left nav **WhatsApp** → **Run today's** (green button, Automations panel).

**On screen (≈ 9 s, one message at a time):** [`assets/07-whatsapp-automations-run.png`](assets/07-whatsapp-automations-run.png)
- Inbox jumps: **Lerato Mokoena** (deposit reminder, R180), **Naledi Khumalo** (day-before delivery reminder), **Bongani Nkosi** (thank-you + review request), **Ayesha Patel** (re-order nudge, opted in). Each has an unread badge.
- **Pieter van Wyk** (tagged *NO MARKETING*) gets **no** message. The agent skipped the re-order promotion (POPIA). The skip is logged in Agent activity on the Operations tab: [`assets/08-operations-after-automations.png`](assets/08-operations-after-automations.png).
- Stats at the top: *Replies by agent 9 · Typing saved ≈27 min*. That figure is the app's own estimate of 3 min per message; don't present it as measured.

**Say:**
> "And the daily grind. Deposit reminder, delivery reminder, a thank-you, a re-order nudge. One customer never opted in to marketing, so under POPIA the agent skips them." *(point at Pieter van Wyk's row: NO MARKETING, no new message)*

### Step 5 · 2:02 · Hand back to the deck
`Alt+Tab` to the deck, press `→` to slide 7, and say exactly:
> **"So what did you just see? One rule."**

---

## 2 · Timing budget

| Step | Target | Scripted engine (measured) | Grok live |
| --- | --- | --- | --- |
| 1 · Scenario A | 1:05–1:27 | ≈ 5.4 s from click to approval card (5.8 s until idle) | several seconds per model step; talk over it |
| 2 · Allow once | 1:27–1:37 | ≈ 4 s | a few seconds (reply is composed by the model) |
| 3 · Prepare with agent | 1:37–1:50 | ≈ 4 s | same (no model call) |
| 4 · Run today's | 1:50–2:02 | ≈ 9 s (messages arrive one by one) | same (no model call) |

Measured on 13 Nov 2026, local `next dev`, scripted engine, headless Chrome at 1600×900.

If step 1 is still streaming when your line ends, **stop talking and let the audience watch**. The streaming steps are the point.

---

## 3 · Optional extras (only if you have time, or in Q&A)
- **FAQ:** preset `FAQ — banking details` → the agent answers from the brief. No owner time needed.
- **Hand-off:** preset `Complaint` → the agent hands the chat to the owner (amber banner *"Agent handed this to you"*) and doesn't guess.
- **Take over:** **Reply as Thandi** → type a message → the agent pauses for that chat (badge flips to *YOU*). Click *Hand back to agent* to resume.
- **Wednesday is full:** preset `Wednesday is full` → the calendar check shows FULL and the agent offers the next free day.

Run each extra from a **reset** state (and with Sipho's chat open), or the inbox gets noisy.

---

## 4 · Reset procedure (between rehearsals and right before going on)
1. Click the **reset icon** (↻, *Reset demo*) at the top-right of the **phone panel**, next to the *AGENT* badge.
   This clears all messages, orders, approvals, nudges, compliance progress and automation toggles back to the seed data. It **keeps the current tab** and engine badge.
2. Click **Operations** in the left nav.
3. Check: the phone header says **Sipho Mabaso**, the Approval queue is empty, Agent activity says **idle**, and there's no green *ready to formalise* card. Screenshot: [`assets/01-dashboard-idle.png`](assets/01-dashboard-idle.png).

If anything looks off, **reload the page (F5)**. State lives only in memory, so a reload is a full reset too.

---

## Fallback plan

| Situation | What to do | What to say |
| --- | --- | --- |
| **A Grok call fails mid-demo** | Nothing. That step falls back to the scripted engine automatically, and Agent activity shows an amber `Engine fallback` line. | "The network blinked, so the offline engine took over that step. That's by design." |
| **Grok is slow or Wi-Fi is down before you start** | Rename `.env.local` (or empty `XAI_API_KEY`) and restart `npm run dev`. The phone panel badge must read **SCRIPTED**. This is fully offline. | Nothing. Demo as normal. |
| **The app won't load, or the laptop misbehaves** | Switch to the **pre-recorded video** and play it from the step you were on. Keep saying the same lines. | "Let me show you the recording." |
| **The projector won't take the browser** | Present the deck only. Slides 5 and 8 contain real screenshots; walk through [`assets/`](assets/) images 02 → 03 → 05 → 07 if you can. | Same lines, in past tense. |

### Recording the fallback video (do this after feature freeze, ~15:30)
1. Reset the app (§4), scripted engine, 1440–1600 px wide window, 100 % zoom.
2. Record the screen: **Win + Alt + R** (Xbox Game Bar), or OBS. Capture the browser window only.
3. Do steps 1 → 4 exactly as above, at presenting pace (~50 s), **without voice**. The speaker talks live over it.
4. Trim it to start on the idle dashboard. Save it as `metaxy-demo-fallback.mp4` on the presenting laptop's desktop **and** a USB stick.
   Don't commit it to the repo (size). Note where it is here: `[path / link]`.
5. Play it once on the projector during setup.

---

## Things that must stay true on stage
- Say **"simulated WhatsApp"**, never "connected to WhatsApp". The Cloud API isn't wired up; the setup checklist is.
- Only say **"Grok"** if the badge reads **GROK LIVE**.
- Compliance is **guidance, not legal or tax advice**. The agent never signs, submits or pays.
- Opportunities and most of CRM are **sample (fixture) data**. Only CRM memory updates live.
- All people, phone numbers (`+27 … 555 01xx`) and businesses are fictional.
