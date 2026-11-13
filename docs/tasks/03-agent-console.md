# Task 3 — Agent console: talk to METAXY, and it drives the dashboard

**Branch:** `feat/agent-console` · **Merge:** last · **Size:** ~4–5 h (v1), voice is a stretch

## Goal
The owner can **talk to the agent directly**: ask questions, give instructions, and watch it **move around the dashboard**. It opens the right module, the right chat or the right compliance task, highlights what it's talking about, and prepares the work. Today the owner can only watch the agent answer customers; this turns METAXY into a sidekick the owner can actually command.

## Experience
- A **launcher button** fixed bottom-right ("Ask METAXY", shortcut `Ctrl/⌘ + K`) opens a console panel: a chat thread with the agent plus an input. Voice input (push-to-talk via the Web Speech API) is a stretch.
- Suggested prompts when empty, for example:
  - "What needs my attention today?" → summarises pending approvals, hand-offs, unpaid deposits and the next compliance deadline, and opens the busiest module.
  - "Show me Lerato's chat" → switches to the WhatsApp tab, opens that chat in the phone panel and highlights it.
  - "Take me to CIPC registration" → Compliance tab, opens that task, scrolls to it.
  - "Prepare my CIPC application" → runs the existing `prepareCompliance('cipc')` and explains what's left for the owner.
  - "Send today's reminders" → ask-first: shows exactly what will be sent and runs `runAutomations()` only after the owner says yes.
  - "Approve Sipho's pay-on-delivery" → ask-first: confirmation card first, then `decide(...)`.
- Every UI action the agent takes appears as a small step in the console ("→ Opened Compliance › CIPC"), the same way the Agent activity panel shows tool calls. **Visible trust** applies to the console too.

## Architecture
```
Console input ──► POST /api/assistant { message, history, snapshot }
                         │  (snapshot = compact JSON of state: tab, pending approvals,
                         │   handoffs, unread, compliance statuses, orders due)
                         ▼
               Grok tool-calling  ──fallback──►  scripted intent router (offline)
                         │
                         ▼
         { reply: string, actions: UiAction[], confirm?: ConfirmCard }
                         │
Console renders reply ◄──┘──► client executes actions against the store
```
- **`UiAction`** (put the types in `src/lib/assistant/types.ts`):
  - `navigate { tab }` · `open_chat { customerId }` · `open_compliance_task { taskId }` · `focus { anchorId }` (scroll + 2 s highlight ring) · `set_columns { left?, right? }`
  - `prepare_compliance { taskId }` · `simulate_customer { customerId, text }` (demo helper)
  - **ask-first:** `run_automations` · `decide_approval { approvalId, decision }` · `send_owner_message { customerId, text }`. These are never executed straight from the model's answer. They return a `confirm` card, and the client runs them only after the owner clicks **Confirm**.
- **Grok path** (`XAI_API_KEY` set): xAI chat completions with `tools` (one function per `UiAction`). Reuse the request style in `src/lib/agent/brain.ts`; keep a 20 s timeout.
- **Scripted path** (no key or Grok fails): keyword/regex router in `src/lib/assistant/router.ts` that covers every suggested prompt above. **The demo must work fully offline.**
- **Store additions** (`src/lib/store.tsx` — you own this):
  - `ui: { leftOpen, rightOpen, focus, complianceTask }` + actions `setColumns`, `focusAnchor`, `openComplianceTask`.
  - `assistant: { messages, busy }` + `askAssistant(text)`, `confirmAction(id)`, `cancelAction(id)`.
  - Executing an action reuses existing store functions (`setTab`, `openChat`, `prepareCompliance`, `runAutomations`, `decide`, `sendOwnerMessage`).

## Boundaries (from the archetype docs: "agents prepare, the owner decides")
| Do alone | Ask first | Never |
| --- | --- | --- |
| Navigate, open, highlight, summarise, explain, prepare drafts/compliance packs | Anything sent to a customer, approvals, running automations, marking compliance submitted/done | Submitting filings, moving money, inventing prices/dates/policies, sharing one customer's details with another |

## Files
- **New (yours):** `src/components/agent-console/**`, `src/lib/assistant/**`, `src/app/api/assistant/route.ts`.
- **Yours:** `src/lib/store.tsx`.
- **Small touches, after the others merge:** add `<AgentConsole />` to `src/app/dashboard/page.tsx` (created by Task 1). Read `complianceTask` from the store in `compliance-board.tsx`. Point Task 2's `leftOpen` / `rightOpen` at the store.
- **Don't change:** `src/lib/agent/**` (the customer-facing pipeline).

Until Task 1 merges, mount the console in `src/app/page.tsx` locally and don't commit that line. Rebase before your PR.

## Acceptance criteria
- [ ] Every suggested prompt works with **no API key** (scripted router) and with Grok.
- [ ] Navigation actions visibly move the dashboard: tab switches, chat opens, task opens, panel highlighted.
- [ ] Ask-first actions show a confirmation card with the exact effect; **nothing** runs before Confirm, and Cancel leaves the state untouched.
- [ ] Unknown requests get an honest "I can't do that yet". The agent never claims it did something it didn't.
- [ ] Keyboard: `Ctrl/⌘ + K` opens, `Esc` closes, focus returns to the launcher. Works at phone width (full-screen sheet).
- [ ] `npm run typecheck` passes; the PR includes a short screen recording of three prompts.

## Stretch
- Voice input (Web Speech API, `en-ZA`) with a visible "listening" state.
- Narrated tour: "Show me around" walks through each module with `focus` actions.
