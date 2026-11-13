# Live voice pitch: discussion brief

**Status:** discussion only. No product code in this note. Written 13 November 2026 for rehearsal the same day.
**Read with:** [`script.md`](script.md), [`demo-run-sheet.md`](demo-run-sheet.md), [`deck/index.html`](deck/index.html).

Real-time voice can carry the **Naledi Studio minute** inside the working app. It cannot yet present the **12-slide deck** (advance, speaker notes, exact hand-off words). The smallest next build is a pitch cue plus a slide channel. Until that exists, a person keeps the deck and the spoken script, and one live agent drives the dashboard on short cues.

Two different engines are easy to mix up:

| Path | Key | What it does on stage |
| --- | --- | --- |
| WhatsApp / domain agents (Client Desk, Planner, Books) | `XAI_API_KEY`, or none | Scripted engine if the key is empty (a few seconds, offline). Grok if the key is set. Phone-panel badge: **scripted** or **Grok live**. |
| Owner's real-time voice | `OPENAI_API_KEY` | `POST /api/live/session` opens a server-authenticated WebRTC session. The browser key never leaves the server. Model `gpt-live-1` speaks. Tool calls are delegated to `gpt-6-luna` on high, with the same UI tools as the typed assistant, plus `get_dashboard_state`. |

Best timing mix for today: **scripted WhatsApp engine** (no xAI key) **plus live voice** (OpenAI key and venue Wi-Fi). The voice is the slow part. The Friday and coursework pipelines stay fast.

---

## 1. What already works for the run-sheet

Confirmed in `src/app/api/live/session/route.ts`, `src/components/agent-console/use-live-voice.ts`, and `src/lib/assistant/validate.ts`.

**Go Live** negotiates WebRTC, plays the model on a hidden `<audio autoplay>` element, and shows the transcript in the agent console. If the mic is blocked, the hook attaches a silent audio track and stays up in **Live (Text to Voice)**. Typed turns still speak. Mute disables the mic track and leaves text turns working. That is the reliable stage setup: connect, mute, drive by typed cues, so the room does not feed the agent's own voice back into the mic.

The live model already shares the dashboard tools. For the Naledi run-sheet these matter:

| Run-sheet beat | Tool | Runs immediately? |
| --- | --- | --- |
| Open Buhle (customer `c-200`, Buhle Sithole) | `open_chat` | Yes |
| "Can you do it by Friday?" with her exact preset text | `simulate_customer` | Yes. Same pipeline as the preset button. |
| Point at Agent activity or the approval queue | `focus` (`ops-activity`, `ops-approvals`, `phone-panel`) | Yes |
| Check collisions (Planner) | `check_collisions` | Yes. Drafts only. Sends nothing. |
| Coursework boundary, exact preset text on `c-200` | `simulate_customer` | Yes. The Never rule still blocks it. |
| Approve & send | `decide_approval` | **No.** Ask-first. A Confirm card appears. A person still clicks. |
| Anything after a click | `get_dashboard_state` | Read only. |

Spoken style today is short on purpose: one to three sentences, plain South African English, and "ask the owner to click Confirm" for anything that sends. That matches the product ("nothing goes out without Naledi") and fights a verbatim 3-minute monologue.

`simulate_customer` needs the **exact** Friday and coursework strings from `src/lib/agent/data.ts` (`presetMessages`). A paraphrase can miss the scripted story. Put those strings in the cue.

The other session is restyling `src/components/shell.tsx`, `src/components/agent-console/`, and `src/lib/store.tsx`. The tool names above are the stable contract. Before you go on, check that **Go Live**, mute, and the text box are still on screen in that build.

---

## 2. What is missing for the 12-slide deck

`docs/pitch/deck/index.html` is a standalone file. It is not inside the app, and the live model has no tool that can see it.

How slides move today:

- `→`, space, and Page Down advance. `←` and Page Up go back. Home and End jump to the ends.
- A click on the right-hand third of the window advances. The left-hand third goes back.
- `N` toggles speaker notes. `F` toggles fullscreen.
- Each slide stores its line in `data-notes` and its clock in `data-time`. The overlay is on the **same** window as the slide. There is no second-screen notes view. If you press `N` on the projector, the audience sees the script.
- `#5` in the URL opens on slide 5. Changing the hash from another window does nothing unless this page reloads.
- There is no `postMessage` listener, no present button, and no slide id the dashboard can call.

The script's hand-off words are exact and short: **"Let's watch it work."** (end of slide 6) and **"So what did you just see? One rule."** (back to slide 7). The live instructions tell the model to paraphrase into one to three sentences and to talk to the owner, not to read a deck. It will not hit those words reliably, and it cannot `Alt+Tab`.

There is also no "say this verbatim" control. Text turns are user messages. The model answers them. It does not read them aloud unchanged.

Speaker notes, slide index, and hand-off words therefore stay with a person, unless we add a small bridge:

1. **Pitch cue.** A session instruction (or one button that sends it) that allows a longer spoken line, names the four run-sheet beats, and forbids `decide_approval` until a person has clicked.
2. **Slide channel.** A `message` listener in `deck/index.html` (`{ type: "metaxy:slide", n: 7 }`) and one new tool, `present_slide`, from the dashboard. The deck file sits outside `src/`, so this need not wait on the shell restyle. Serving the deck from the app (same origin) is required so the message is allowed. A `file://` deck cannot be driven from `localhost`.
3. Optional later: notes on a laptop screen while the projector shows the slide only. The current overlay cannot do that.

Do not build this during the other session's shell work, and do not build it in the half hour before you present, unless rehearsal of the human-plus-voice plan below fails.

---

## 3. Rehearsal you can run today (13 November 2026)

Target is still 3:00 from [`script.md`](script.md): slides to 1:05, live demo to 2:05, slides to 3:00. One live voice agent narrates **only if a typed cue asks for the next short line**. A person reads slides 1 to 6 and 7 to 12, and clicks **Approve & send** both times. That click is the product.

### Setup (T-30, same checks as the run-sheet)

1. Mains power. Notifications off. `npm run dev`. Dashboard at `http://localhost:3000/dashboard`, full screen, window at least 1440 px wide, 100% zoom.
2. `OPENAI_API_KEY` set. `XAI_API_KEY` empty, then restart dev, so the phone badge reads **scripted**. Run Friday once, then reset, so you know the scripted path is the one on stage.
3. Reset. Header **Buhle Sithole · Sithole Events · +27 82 555 0142**. Operations. Triggers **1 calendar collision · 2 overdue**. Approval queue **clear**. No green formalise card.
4. Deck in a second window on slide 1, notes **off**. `Alt+Tab` both ways. Fallback video paused at 0:00 in a third window (path still `[path / link]` in the run-sheet).
5. Chrome output device is the venue line. Play a one-second live reply and listen from the audience seats. Then **mute** the live mic and leave it muted.
6. Connect **Go Live** before you walk up. Wait until the console says the session is ready. If connect fails, you are already on fallback B below. Do not debug WebRTC on stage.

### Who does what

| Clock | Person | Live agent (muted mic, typed cue) |
| --- | --- | --- |
| 0:00–1:02 | Read slides 1 to 5 from [`script.md`](script.md). Arrows only. Notes stay off. | Silent. Session already connected. |
| 1:02–1:05 | Slide 6. Say **"Let's watch it work."** `Alt+Tab` to the app. | Silent. |
| 1:05 | Say the Naledi / Friday setup line yourself (it is longer than the voice style). | Cue: open `c-200`, `simulate_customer` with the exact Friday text, `focus` `ops-activity`. Do not approve. |
| 1:12 | Say the Planner / Books / Client Desk line while steps stream. If it is still streaming when you finish, stop talking. | Silent unless you ask it to name the agent on the latest step, in one sentence. |
| 1:22 | Click **Approve & send** on the queue. Say the honest-date line, including the formalise nudge. | Do not call `decide_approval`. |
| 1:32 | Optional: you click **Check collisions**, or the cue does. You click **Approve & send** on the new card. Say the collision line. | Cue may call `check_collisions` and `focus` `ops-approvals` only. |
| 1:47 | Say the coursework line. | Cue: `simulate_customer` on `c-200` with the exact coursework text. |
| 2:02 | `Alt+Tab` to the deck, `→` to slide 7. Say **"So what did you just see? One rule."** | Silent from here. Disconnect if you want a quiet room for the close. |
| 2:05–3:00 | Slides 7 to 12, including the scripted-engine sentence on slide 9, because the badge says **scripted**. | Silent. |

Type the three cues into a note on the laptop before you start, so the driver pastes them. Wording to paste:

1. `Open Buhle Sithole's chat (c-200). Play this client message exactly, then highlight Agent activity. Do not approve or send anything. Message: hey naledi got your number from a friend. need a 3-page website for Sithole Events urgently, can you do it by next friday?`
2. `Run the Planner collision check. Highlight the approval queue. Do not approve.`
3. `In Buhle's chat, play this client message exactly. Do not approve. Message: hey can you also write my cousin's IS302 database assignment for R500?`

Time one full pass with a stopwatch. The live model thinks on `gpt-6-luna` (high) before the tool runs, so step 1 can blow past 1:22. If the approval card is not up when the spoken line ends, drop the voice for the rest of the minute and use the preset buttons. The scripted clicks are the supported demo. Voice is an extra, not a replacement, until you have timed it twice.

Slide 9: say the offline-engine line. Do not say "Grok" unless the badge reads **Grok live**. The voice model is a different system. If a judge asks, say the owner's voice is a live session and the WhatsApp steps on screen ran on the scripted engine.

### If the mic or the Wi-Fi fails

| Situation | Do this | Say |
| --- | --- | --- |
| **A. Mic denied, OpenAI still up** | You are already in the plan above. Text to Voice speaks. Keep the mic muted. | Nothing about the mic. |
| **B. Live session will not connect, or Wi-Fi drops** | Leave the dashboard on the scripted engine. Driver clicks the four run-sheet steps. Person reads every line in the script, including both hand-offs. | Nothing about voice. The 60-second demo was written for clicks. |
| **C. A domain step errors** | That step falls back to scripted on its own and shows an amber engine-fallback line. Continue. | "The network blinked, so the offline engine took over that step. That's by design." |
| **D. The app will not load** | Play `metaxy-demo-fallback.mp4` from the step you were on. | "Let me show you the recording." |
| **E. The projector will not take the browser** | Deck only, then screenshots 02, 03, 04, 05, 11. | Same lines, in the past tense. |

Do not rename env files or restart `npm run dev` after you have said the title.

---

## 4. Open questions

1. **Who speaks?** A person for all 3:00, with the agent only moving the dashboard (recommended for today). Or the agent speaks the 60-second lines too, knowing it will shorten them. Or, after a pitch-cue build, the agent speaks the whole script.
2. **Where does the deck live?** Keep `deck/index.html` in a second window and advance it by hand (works today, offline). Or serve it inside the app and add `present_slide` so the voice can move it. A second-screen notes view is a third choice and is not in the file now.
3. **May the agent press the run-sheet steps?** Recommendation: it may open the chat, play the two client messages, focus panels, and run **Check collisions**. A person still clicks **Approve & send**, because that click is the sentence "nothing goes out without Naledi." Say if you want the agent to call `decide_approval` and leave only the Confirm click, which is a different button from the queue in the screenshots.

Reply with those three calls and we can either lock today's human-plus-voice rehearsal or spec the pitch cue and slide channel without touching the shell work in progress.
