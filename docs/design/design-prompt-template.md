# Concept-Led Product & Experience Brief Template

> **Audience:** Design agents (Lovable, v0, Bolt) and coding agents building or extending METAXY.  
> **Reference implementation:** [03-design-prompt.md](./03-design-prompt.md) · **Primary demo archetype:** [student-freelancer.md](../archetypes/student-freelancer.md)

---

## 1. Purpose & Why This Template Exists

AI design and coding tools fail in predictable ways when handed a feature checklist: they produce technically plausible screens that feel emotionally generic, bolt a chat window onto an admin template, and miss the real human tension the product exists to resolve.

This methodology separates a brief into **three layers**:

1. **Product Concept** — Who the user is, what real-world friction breaks their day, what the product refuses to be, and the core thesis that holds it together.
2. **Experience Direction** — End-to-end human scenarios, behavioural cause-and-effect, and emotional/visual character (the "mission control" or operating-room feel).
3. **Design Freedom** — Giving the design model full ownership over layout, component hierarchy, spacing, and visual composition instead of micro-managing grids or widget trees.

We establish **human reality, domain friction, and philosophy before touching UI** because **functionality can be inferred, character cannot**. Once an agent deeply understands *who* is under pressure (for example, a student freelancer balancing university test weeks against WhatsApp client deadlines) and *why* black-box automation fails them, it can infer far better interfaces, states, and transitions than a rigid wireframe spec ever could.

For coding agents already inside the METAXY repo, this template also serves as an alignment anchor: every new archetype, board, or agent capability should trace back to a complete human cycle and uphold the same product character.

---

## 2. What Agents Must Keep Note Of & Deliberately Avoid

When authoring a prompt from this template—or translating it into UI/code—agents must observe these rules:

- **Do not dictate layout trees prematurely:** Never prescribe exact page layouts, sidebar/header pixel splits, component hierarchies, or navigation trees before the product concept and user workflows are clear. Describe *what the owner needs to see and decide*, not which CSS grid or tabs to draw.
- **Do not turn a brief into a technical spec:** Avoid API contracts, database schemas, state-store details, framework boilerplate, or rigid feature checklists. Keep the focus on **Problem -> Users -> Outcomes -> Principles -> Core Workflows** ("Action First, Conversation Second").
- **Reject generic "AI SaaS" tropes:** Explicitly prohibit neon-purple gradients, floating glassmorphism, sci-fi HUD gimmicks, motivational-coach copy (*"✨ Your AI Journey ✨"*), chat-box-only wrappers, and cluttered enterprise ERP tables. Aim for editorial calm, precision, warmth, and operational authority.
- **Keep generated prompts self-contained:** Never reference internal repository names, local file paths, branch names, or private backend/infra names that an external design tool (Lovable, v0, Bolt) has no context for.
- **Fence cleanly for copy-paste:** Wrap the final prompt in a single outer code fence with no conflicting inner fences so it can be copied directly into a design tool.
- **Anchor on synthetic reality:** Specify realistic, domain-authentic sample scenarios and interactive simulation triggers so the resulting UI demonstrates live cause-and-effect immediately on load.

---

## 3. METAXY Design Invariants (Non-Negotiable Rules for Any Agent Touching UI)

Whether adapting METAXY for a solo baker, a trades crew, or a student freelancer (`Naledi Studio`), these five invariants are non-negotiable:

1. **The chat thread is not the interface:** Agent understanding, tool checks, capacity calculations, and state changes must surface as structured operational objects (quotes, projects, approval cards, shared schedules, invoices, compliance milestones)—never buried inside a wall of chat messages.
2. **Visible trust over black-box magic:** Always surface *what* context the agent noticed (e.g., an urgent tone, a test-week collision, a scope addition), *which* rule, policy, or constraint it checked, and *why* it acted or paused.
3. **Human authority at the edges:** Agents prepare, summarise, calculate, draft, and flag internally; the owner explicitly approves anything external, financial, or binding (sending client messages, issuing quotes/invoices, moving calendar blocks, granting policy exceptions) via clear decision cards.
4. **One continuous operational memory:** Client conversations, fixed personal/academic/shift constraints, capacity, billing/deposits, compliance readiness, and opportunities share one living business state—never disconnected siloed widgets.
5. **Grounded in South African reality:** Design around WhatsApp-first workflows, South African Rand (`ZAR` / `R`), practical cash-flow habits (deposits, EFT reminders), the informal-to-formal bridge (`CIPC`, `SARS`, `POPIA`, business banking, `VAT` thresholds), local phrasing, and **synthetic-only** demo data (`+27 ... 555 01xx` numbers, fictional people and businesses).

---

## 4. The Reusable Master Prompt Template

Copy the block below, replace every `{{PLACEHOLDER}}` (removing the inline guidance notes), and paste the completed brief directly into Lovable, v0, Bolt, or a UI-focused coding agent.

```text
Build {{PRODUCT_NAME}} — {{ONE_SENTENCE_ROLE: e.g., an AI Business Command Centre designed for [target user] who [core daily reality] and needs an autonomous agent they can see, understand, and trust}}.

The name {{PRODUCT_NAME}} comes from {{ETYMOLOGY_OR_MEANING: brief origin and why it fits the product's core tension, e.g., "in between" informal hustle and formal structure}}.

### Context & Who This Is For
{{USER_SPECTRUM_AND_ARCHETYPE: Describe the real humans using this—their environment, tools they currently juggle (e.g., WhatsApp, phone calendar, spreadsheets), income/time scale, and the specific persona or vertical slice being brought to life.}}

These users do not fail because they lack effort. They hit {{NUMBER}} walls:
1. {{FRICTION_1: e.g., Rigid tools break on real, messy human messages and overlapping life commitments.}}
2. {{FRICTION_2: e.g., The bridge from informal operations to formal structure/compliance feels overwhelming.}}
3. {{FRICTION_3: e.g., Invisible black-box AI destroys trust—owners will not hand customer relationships or commitments to something operating out of sight.}}

### Vision
{{PRODUCT_NAME}} is not {{ANTI_PATTERNS: e.g., a chatbot, a generic SaaS admin template, or a motivational coach}}. It is {{CORE_METAPHOR: e.g., a calm, legible operational command centre where an autonomous, memory-enabled agent handles routine prep and admin while projecting every action, judgement call, and pending decision visibly}}.

The core thesis is simple: {{CORE_THESIS: e.g., the chat thread is not the interface; when messages arrive or constraints collide, operational reality surfaces as structured state—never buried in conversation}}.

### Design Philosophy
- **Visible trust over black-box magic:** {{HOW_REASONING_SHOWS: e.g., Show what context the agent noticed, which policy or calendar constraint it checked, and why it acted or paused.}}
- **Human authority at the edges:** {{APPROVAL_BOUNDARY: e.g., The agent handles internal prep autonomously and pauses before anything external, financial, or binding so the owner makes the final call in one click.}}
- **One continuous operational memory:** {{SHARED_STATE: e.g., Conversations, commitments, billing, compliance, and customer history belong to one living system—not isolated tools.}}
- **Grounded in local reality:** {{DOMAIN_GROUNDING: e.g., Built around WhatsApp-first communication, local currency (ZAR), practical cash-flow rules, and real regulatory/operational pathways without jargon.}}

### Core Experience
When an owner opens {{PRODUCT_NAME}}, they should immediately feel {{TARGET_EMOTION: e.g., calm control over what matters right now, before typing anything}}. They should be able to experience {{1_TO_4}} complete, end-to-end human cycles:

1. **{{CYCLE_1_TITLE: e.g., Off-script enquiry checked against real capacity}}:**
   {{CYCLE_1_STORY: Describe a concrete trigger (e.g., an urgent WhatsApp message), the constraint or nuance the agent detects, what internal checks it runs, what it drafts, and the exact decision surfaced for the owner.}}

2. **{{CYCLE_2_TITLE: e.g., Cross-side conflict detected and resolved early}}:**
   {{CYCLE_2_STORY: Describe how competing deadlines or messy real-world updates are turned into structured options, updated schedules, and approval-ready communication.}}

3. **{{CYCLE_3_TITLE: e.g., Revenue protection / scope & payment discipline}}:**
   {{CYCLE_3_STORY: Describe how awkward admin—like chasing overdue EFTs, flagging out-of-scope requests, or tracking deposits—is prepared gracefully for owner sign-off.}}

4. **{{CYCLE_4_TITLE: e.g., Growth, formalisation, or lasting memory}}:**
   {{CYCLE_4_STORY: Describe how the system tracks longer-term readiness (e.g., CIPC/SARS/VAT milestones), customer memory, or opportunities without overwhelming daily focus.}}

### Primary Workspaces / Conceptual Areas
Organise the experience around clear conceptual areas (choosing the clearest layout and navigation model for the workflow):
- **{{AREA_1_NAME: e.g., Live Operations & Approvals}}:** {{AREA_1_PURPOSE: What questions this area answers at a glance—e.g., what just happened, why the agent paused, and what needs owner sign-off.}}
- **{{AREA_2_NAME: e.g., Shared Schedule / Commitment Ledger}}:** {{AREA_2_PURPOSE: e.g., Fixed personal/team constraints alongside active deliverables so capacity and collisions are unmistakable.}}
- **{{AREA_3_NAME: e.g., Billing, Scope & Client Memory}}:** {{AREA_3_PURPOSE: e.g., Quotes, deposits, overdue invoices, scope baselines, and persistent relationship notes.}}
- **{{AREA_4_NAME: e.g., Formalisation & Opportunities}}:** {{AREA_4_PURPOSE: e.g., Step-by-step regulatory readiness and relevant local opportunities tied to current capacity.}}

### Behaviour & Interaction Model
- **Cause-and-effect visibility:** {{CAUSE_EFFECT: Keep incoming messages, agent tool checks/reasoning, updated business state, and owner approvals visibly connected so cause and effect are unmistakable.}}
- **Smooth context switching:** {{CONTEXT_SWITCHING: Allow moving between active operations, schedules, financials, and compliance without losing state or feeling like disconnected apps.}}
- **Interactive synthetic simulation:** {{SIMULATION_TRIGGERS: Seed realistic, 100% synthetic sample data and interactive scenario triggers so anyone opening the app can test realistic edge cases, inspect agent judgement, approve or adjust a decision, and watch the workspace update live.}}

### Visual Language & Emotional Tone
- **Avoid clichés:** No neon-purple gradients, no floating glassmorphism, no sci-fi HUD gimmicks, no chat-box-only minimalism, and no cluttered enterprise table bloat.
- **Target aesthetic:** {{AESTHETIC_DIRECTION: e.g., Precision, warmth, and operational authority—an editorial, mission-control sensibility with crisp typography, intentional spacing, subtle technical labels, and unambiguous status signals.}}
- **Voice & feeling:** {{VOICE_AND_TONE: e.g., Sound like a sharp, calm business operations partner—never a hype-driven motivational coach. Dependable, respectful of the owner's time, and quietly empowering.}}

### Guiding Principles & Boundaries
- **Do alone (internal & reversible):** {{DO_ALONE_LIST: e.g., Read messages, summarise enquiries, calculate capacity, flag scope creep or overdue items, draft replies, update internal notes.}}
- **Ask first (external or binding):** {{ASK_FIRST_LIST: e.g., Sending any WhatsApp/email message, issuing quotes or invoices, shifting committed calendar blocks, granting policy exceptions.}}
- **Never (hard boundaries):** {{NEVER_LIST: e.g., Fabricate commitments, expose one client's data to another, move money autonomously, or perform work that crosses ethical/integrity boundaries (such as completing academic coursework).}}
```
