# METAXY: Mirrored Workspace & Multi-Agent Side Panel Design Prompt

> **Purpose:** Design prompt and technical notes for evolving the METAXY command centre into a clean, mirrored three-column workspace: a **draggable, expandable multi-agent side panel on the right** (where the owner can spawn and manage multiple live agents), a **mirrored navigation side panel on the left** (putting module navigation to proper use), and a **streamlined header matching the landing page**.
>
> **Language & style note:** Written in South African English with no em dashes.

---

## 1. Design Prompt (Copy & Paste into Lovable / v0 / Bolt / UI Agent)

Copy everything inside the code block below directly into your design or coding tool.

```text
Evolve the METAXY AI Business Command Centre workspace into a cleaner, calmer, mirrored three-zone interface that treats autonomous multi-agent work and workspace navigation as equal architectural pillars, while aligning the top header with the landing page.

### Core Layout & Visual Symmetry
1. **Landing-Matched Clean Header:**
   - Replace the crowded utility strip in the dashboard header with a refined, minimal header modelled on the public landing navigation bar: crisp METAXY wordmark and square mark on the left, subtle contextual studio/account pill or active status indicator in the centre-right, and clean account/session controls on the right.
   - Keep the header airy, low-noise, and grounded in editorial typography so it feels like a natural continuation of the landing page rather than a separate admin template.

2. **Mirrored Left Navigation Panel:**
   - Build the left-hand panel as a true structural mirror of the right-hand agent panel in proportion, surface contrast, border rhythm, and collapsible behaviour.
   - Use this left panel cleanly for primary page and module navigation (Operations, WhatsApp, Compliance, Opportunities, CRM & Retention, plus room for future workspace pages such as Settings, Automations, or Vault) along with concise studio memory context at the top or bottom.
   - Moving navigation and module context into this dedicated mirrored rail frees the centre canvas from redundant headers and dead space.

3. **Right-Hand Multi-Agent Side Panel (Draggable & Growable):**
   - Anchor a dedicated, interactive multi-agent side panel on the right edge of the workspace.
   - **Draggable & Resizable over/alongside lower elements:** Give the panel a clear, tactile drag/resize handle (along its inner edge and bottom-corner/header grip) so the owner can drag it wider or expand its footprint across lower workspace elements whenever they want deeper focus on agent activity, and collapse or dock it neatly back down when done.
   - **Multi-Agent Spawning (`+ Add agent`):** Include a prominent `+ Add agent` (or `+ Spawn`) trigger directly inside the panel header or quick dock. Clicking it spawns an additional live agent slot/tab/stack inside the panel, and the panel grows smoothly in capacity (via stacked cards, expandable agent lanes, or switchable active agent tabs with live status badges) so multiple agents can operate side by side without clutter.
   - Each spawned agent displays:
     - Its role or task label (e.g., Client Desk, Planner, Books, Compliance Prep, or a custom owner prompt)
     - A semantic animated orb reflecting real-time state (working, searching, solving, listening, composing, shaping, connecting)
     - Voice / Live mode toggle (`Go Live` for real-time voice or Text-to-Voice fallback) alongside typed commands
     - Compact, verifiable step traces ("-> Opened Thabo Nkosi's chat", "-> Checked IS302 calendar clash")
     - Clear human-in-the-loop Confirm / Cancel decision cards whenever an action is external, financial, or binding.

4. **Calm Central Workspace:**
   - Between the mirrored left navigation panel and the right multi-agent panel sits the operational board (approvals, shared university/studio schedule, deliverables, invoices, WhatsApp inbox, CIPC/SARS formalisation, opportunities, and client memory).
   - Maintain METAXY's South African grounding (ZAR currency, WhatsApp-first customer flows, CIPC/SARS/VAT readiness, plain South African English) and reject generic AI clichés (no neon-purple gradients, no sci-fi HUD clutter, no hidden black-box chat walls).
```

---

## 2. Implementation Notes: How METAXY Agents Currently Work

Use these notes when connecting the new mirrored UI to METAXY's real backend and state engine.

### 2.1 Domain Agent Roles & Event-Sourced Pipeline
METAXY currently runs three domain personas through a shared, deterministic-plus-LLM pipeline ([src/lib/agent/pipeline.ts](../../src/lib/agent/pipeline.ts) and [src/lib/agent/brain.ts](../../src/lib/agent/brain.ts)):
- **Client Desk:** Triages incoming WhatsApp enquiries, recognises customer emotion/urgency (including sensitive moments such as bereavement or frustration), compares requests against active project deliverables for scope creep, updates client memory, and handles studio FAQs.
- **Planner:** Checks two-sided capacity across studio hours and fixed BSc IS university lectures/tests, manages **Exam Mode**, and detects deadline collisions between client projects and academic dates.
- **Books:** Applies quote and 50% deposit rules, flags overdue EFT invoices, drafts polite ZAR reminders, tracks trailing 12-month turnover against the R1M VAT threshold, and prepares CIPC/SARS compliance document packs from the vault.

Every run emits typed `AgentEvent` records (`trace`, `reply`, `project`, `project_update`, `approval`, `handoff`, `memory`, `compliance_ready`) into the central store ([src/lib/store.tsx](../../src/lib/store.tsx)), ensuring agent reasoning and UI state stay synchronised.

### 2.2 Dual Owner Control Engines (`Ask METAXY`)
The owner's console ([src/components/agent-console/agent-console.tsx](../../src/components/agent-console/agent-console.tsx)) operates two real-time control paths over the shared dashboard state:
1. **High-Reasoning Tool Path (`POST /api/assistant` -> `gpt-6-luna` on `high`):**
   - Sends the owner's prompt, recent history, and a live JSON `Snapshot` of the dashboard to OpenAI's Responses API (`/v1/responses`) with `reasoning.effort = "high"` ([src/lib/assistant/grok.ts](../../src/lib/assistant/grok.ts)), falling back to Grok or the offline scripted intent router ([src/lib/assistant/router.ts](../../src/lib/assistant/router.ts)) if keys are absent or offline.
2. **Real-Time Live Voice & Text-to-Voice Path (`POST /api/live/session` -> `gpt-live-1`):**
   - Negotiates a server-authenticated WebRTC session against OpenAI `/v1/live/sessions` using `gpt-live-1` for sub-second bidirectional audio and `delegation.type = "responses"` backed by `gpt-6-luna` (`high`) + all UI tools + `get_dashboard_state`.
   - When microphone permission is denied or blocked (e.g., embedded desktop webviews), [use-live-voice.ts](../../src/components/agent-console/use-live-voice.ts) streams a silent `AudioContext` track so WebRTC timelines still advance cleanly in **Live (Text -> Voice)** mode.

### 2.3 Website Manipulation & Trust Boundaries
Both `gpt-6-luna` and `gpt-live-1` share the same validated UI action set ([src/lib/assistant/validate.ts](../../src/lib/assistant/validate.ts)):
- **Do alone (executes immediately with trace steps):** `navigate`, `open_chat`, `open_compliance_task`, `focus` (scroll + highlight ring), `set_columns`, `prepare_compliance`, `check_collisions`, `chase_overdue`, `simulate_customer`, `get_dashboard_state`.
- **Ask first (never runs automatically):** `run_automations`, `decide_approval`, `send_owner_message`. Calling any of these generates an interactive Confirm / Cancel card so nothing external or financial happens without owner sign-off.
- **Hard boundaries (Never):** Never write, edit, or submit university coursework (`P-05`), submit statutory filings, move money, or leak one client's details to another.

### 2.4 Architecture Shift Required for Spawning Multiple Agents
To support `+ Add agent` cleanly in code:
- **Refactor single console state into keyed agent instances:** Replace the single `state.assistant` object in [src/lib/store.tsx](../../src/lib/store.tsx) with an array/map of `AgentSession` records (`id`, `role`, `title`, `mode: "chat" | "live"`, `messages`, `busy`, `createdAt`) plus `activeAgentId`, while keeping one shared business ledger (`projects`, `invoices`, `approvals`, `customers`, `school`, `compliance`).
- **One WebRTC Live mic lock at a time:** Multiple chat/tool agents can think and stage confirmation cards concurrently, while at most one spawned agent holds an active `gpt-live-1` WebRTC audio session at a time (auto-handing off audio cleanly if the user switches Live to another spawned agent).
- **Scoped confirm cards & traces:** Tag every `confirm` card and tool step with its spawning `agentId` so multiple concurrent agents never overwrite each other's approvals.
- **Persistent layout preferences:** Persist the right panel's dragged width/height and left panel's mirrored state in `localStorage` via [src/components/use-columns.ts](../../src/components/use-columns.ts) alongside mobile sheet breakpoints.
