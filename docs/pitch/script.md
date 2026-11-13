# METAXY: 3-minute pitch script

**Deck:** [`deck/index.html`](deck/index.html), opened in a browser, works offline. Press `N` for notes and timing, `P` to switch the demo persona wording, `F` for fullscreen.
**Live demo steps:** [`demo-run-sheet.md`](demo-run-sheet.md)
**Total:** 3:00 = 1:05 slides → **1:00 live demo** → 0:55 slides.
**Pace:** about 150 words a minute. The word counts below fit that pace with a little air. If you run long, use the cut list at the bottom.

> All names, numbers and businesses are synthetic. Mentor names are masked as `[Mentor]`.

---

## Demo persona

The live app runs **Naledi Studio**: a student freelancer with one pool of time and two sets of deadlines (clients and university). She's introduced on **slide 4 (0:40)** and again in the **first line of the demo (1:05)**. Thandi's Bakes appears on slide 4 only as the "any small business" example.

---

## Timed script

| Clock | Slide | Seconds | Words (approx.) |
| --- | --- | --- | --- |
| 0:00–0:10 | 1 · Title | 10 | 26 |
| 0:10–0:22 | 2 · Hook stat | 12 | 30 |
| 0:22–0:40 | 3 · Three walls | 18 | 45 |
| 0:40–0:52 | 4 · Meet the owners | 12 | 29 |
| 0:52–1:02 | 5 · The product | 10 | 26 |
| 1:02–1:05 | 6 · Demo cue → **hand-off** | 3 | 5 |
| 1:05–2:05 | **LIVE DEMO** (run-sheet) | 60 | ≈ 130 |
| 2:05–2:17 | 7 · Visible trust | 12 | 30 |
| 2:17–2:29 | 8 · Compliance bridge | 12 | 30 |
| 2:29–2:39 | 9 · How it's built | 10 | 27 |
| 2:39–2:47 | 10 · Outcomes | 8 | 21 |
| 2:47–2:53 | 11 · Roadmap | 6 | 13 |
| 2:53–3:00 | 12 · Team + ask | 7 | 17 |
| | **Total** | **180 s = 3:00** | |

---

### 0:00–0:10 · Slide 1: Title
> We're [team]. METAXY is an AI agent that runs a small business's WhatsApp and admin, with a command centre where the owner sees and approves everything.

### 0:10–0:22 · Slide 2: Hook stat
> South Africa has roughly three million small businesses. By estimate, one-point-two to one-point-eight million aren't registered. Many run from one phone: WhatsApp, a notes app and the owner's memory.

*Say "roughly" and "by estimate". These figures come from the hackathon briefing, not an official count.*

### 0:22–0:40 · Slide 3: Three walls
> They don't fail for lack of hustle. They hit three walls. One: bots break the moment a customer writes like a real person. Two: going formal (CIPC, SARS, POPIA) feels impossible alone. Three: nobody hands their customers to an AI they can't see.

### 0:40–0:52 · Slide 4: Meet the owners
> METAXY is one sidekick from launch to run: Lerato starting an agency, and Naledi, freelancing through university. Today you'll watch it run **Naledi Studio, in test week**.

### 0:52–1:02 · Slide 5: The product
> The key idea: the chat is not the interface. Customers stay on WhatsApp. The owner sees every step, every order and every decision, on one screen.

### 1:02–1:05 · Slide 6: Demo cue → **HAND-OFF INTO THE DEMO**
Exact words, then switch to the app window (`Alt+Tab`):
> **"Let's watch it work."**

### 1:05–2:05 · LIVE DEMO (60 s)
Driver follows [`demo-run-sheet.md`](demo-run-sheet.md). The speaker says these lines while the driver clicks. Times are targets; each scripted step takes a few seconds.

| Clock | Action (driver) | Say (speaker) |
| --- | --- | --- |
| 1:05 | Click **1 · Can you do it by Friday?** | "Naledi is a student who freelances. A new client wants a website by Friday. A normal bot says yes." |
| 1:12 | *(steps stream in Agent activity)* | "METAXY's agents check both sides of her life. Planner sees a database test on Thursday. Books prices it with a deposit. Client Desk drafts an honest reply, and stops. Nothing goes out without Naledi." |
| 1:22 | Click **Approve & send** | "One click, and the honest date goes out. And because the studio keeps growing, METAXY says: *you're ready to formalise.*" |
| 1:32 | Click **Check collisions (Planner)** → **Approve & send** | "Two weeks out, Planner spots a client deadline on the same day as her capstone demo. It proposes the fix and drafts the message to the client. Naledi approves. Collision gone, before it ever happened." |
| 1:47 | Click **Coursework boundary (Never)** | "And some things it never does. Paid to write an assignment? It declines, politely, every time." |
| 2:02 | Switch back to the deck, slide 7 | **HAND-BACK, exact words:** **"So what did you just see? One rule."** |

### 2:05–2:17 · Slide 7: Visible trust
> The agent prepares, the owner decides. It does routine work alone, asks before any exception, and never signs, pays, or markets to anyone who didn't opt in.

### 2:17–2:29 · Slide 8: Compliance bridge
> That's the METAXY bridge. When the business is ready, the agent says so, then does the legwork for CIPC, SARS and POPIA. The owner signs. It's guidance, not legal advice.

### 2:29–2:39 · Slide 9: How it's built
> Under the hood, Grok runs a tool pipeline. Every step becomes an event the dashboard renders. No connection? A scripted engine takes over that step, so the demo never breaks.

*Only if the phone panel badge said **scripted** during the demo, you may add "…which is what ran just now." If it said **Grok live**, don't.*

### 2:39–2:47 · Slide 10: Outcomes
> In the demo: seconds, not minutes, from message to an approval-ready draft, and zero messages sent without the owner. Our targets for the full build are on the right.

*The ≈5 s figure is the scripted engine on a local run. With Grok live it is slower (several model calls), so say "seconds, not minutes" instead.*

### 2:47–2:53 · Slide 11: Roadmap
> Next: local buyers, deeper customer memory, the real WhatsApp API, and voice notes.

### 2:53–3:00 · Slide 12: Team + ask
> METAXY: from hustle to formal business. Help us put it in front of real owners. Thank you.

---

## If you're running long (cut in this order)
1. **Slide 9** (How it's built): skip the slide and keep one sentence for Q&A. Saves 10 s.
2. **Demo step "Coursework boundary"**: skip it and go straight to the hand-back. Saves about 15 s. Mention the coursework rule on slide 7 instead.
3. **Slide 11** (Roadmap): click through silently. Saves 6 s.
4. **Slide 3**: say only the three wall names. Saves about 8 s.

## If the demo breaks
Don't debug on stage. Say **"Let me show you the recording,"** play the fallback video from the same point, and keep the same lines. The fallback plan is in [`demo-run-sheet.md`](demo-run-sheet.md#fallback-plan).

## Likely questions (one-liners)
- **Is it really WhatsApp?** "A simulator today. The setup checklist for the WhatsApp Business Cloud API is in the app, and the agent is behind an adapter, so the channel can be swapped without touching the dashboard."
- **Is it really Grok?** "With `XAI_API_KEY` set, Grok runs each step. Without it, a scripted engine runs the same pipeline offline. The badge in the phone panel shows which one ran."
- **Does it give legal advice?** "No. Every compliance task cites the official site, and the owner signs and pays."
- **Why would an owner trust it?** "They see every step, and nothing outside policy happens without their click."
- **Business model?** Not decided yet. Say so honestly. Don't invent pricing on stage.
