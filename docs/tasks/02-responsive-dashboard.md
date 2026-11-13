# Task 2: Responsive dashboard + collapsible columns

**Branch:** `feat/responsive-dashboard` · **Merge:** second (after the landing page) · **Size:** ~3–4 h

## Goal
The command centre works and looks deliberate on a phone, a tablet, a laptop and a projector. The side columns collapse to give the main board room, and owners and judges can open them whenever they want.

## Today's layout (what you're changing)
`src/components/shell.tsx` is a fixed three-column `h-screen` layout:
- **Left** `aside` `w-56`: business context + module nav (Operations, WhatsApp, Compliance, Opportunities, CRM).
- **Main**: the active board. Boards use `grid-cols-1 xl:grid-cols-5` (3 + 2 split).
- **Right** `aside` `w-80`: the WhatsApp phone panel (`whatsapp-panel.tsx`).
- **Header** `h-12`: logo, business, stage, turnover, pending decisions, avatar. It overflows on small screens.

Below ~1100 px the main board gets squeezed; on a phone it's unusable.

## Target behaviour

| Width | Left nav | Main | Right phone panel |
| --- | --- | --- | --- |
| **≥ 1280 px** (desktop/projector) | Full sidebar, collapsible to a **56 px icon rail** | 3 + 2 grid | Open by default, collapsible to a slim tab |
| **768–1279 px** (tablet / small laptop) | Icon rail by default; expands as an overlay | Single column, panels stacked | Closed by default; opens as a **right sheet** over the board |
| **< 768 px** (phone) | Hidden; a **bottom tab bar** (5 modules) or a menu button opens a left sheet | Single column, full width | Full-screen sheet opened by a "Chat" button with an unread badge |

Details:
- **Toggles:** a collapse button on each column header, plus keyboard shortcuts `[` (left) and `]` (right). Remember the choice in `localStorage`; wrap it in try/catch and fall back to the defaults above.
- **Header:** hide the business/stage/turnover strip below 768 px (move it into the left sheet); keep logo, "N decisions waiting" and avatar.
- **Unread & decision badges** stay visible when a column is collapsed (icon rail badges, a dot on the "Chat" button).
- **Animations:** width/transform transitions of ≤ 200 ms; respect `prefers-reduced-motion`.
- **Boards:** check every board (`operations-board`, `whatsapp-board`, `compliance-board`, `other-boards`) at each width. Fix overflowing badges and long text, and give the chat inbox rows and toggles ≥ 40 px tap targets on touch.
- **Scrolling:** only the main area and the chat area scroll. No double scrollbars, no horizontal page scroll.

## Contracts with other tasks (see the [task board](README.md))
- Add stable `id`s to every panel: `ops-approvals`, `ops-orders`, `ops-activity`, `ops-policies`, `wa-inbox`, `wa-automations`, `wa-setup`, `comp-checklist`, `comp-task`, `comp-deadlines`, `comp-vat`, `comp-vault`, `opp-radar`, `crm-memory`, `phone-panel`. The easiest way: give the `Panel` component in `ui.tsx` an optional `id` prop.
- Name the column state `leftOpen` / `rightOpen`. Use local state for now; Task 3 will move it into the store so the agent can open and close columns.
- Keep the **bottom-right corner** clear for the agent launcher (`z-50`). Drawers and sheets use `z-40`.

## Housekeeping (optional, quick)
`src/components/ui/` is now a folder (it holds the landing hero), sitting next to the old `src/components/ui.tsx`. Imports still work, but it's confusing. Move `ui.tsx` to `src/components/ui/index.tsx`. Every `@/components/ui` import keeps working, and all UI primitives end up in one folder, which is the shadcn convention if we add shadcn components later.

## Out of scope
- Routes and the landing page (Task 1). The agent console (Task 3).
- Changing data, the agent pipeline or `store.tsx` logic.

## Acceptance criteria
- [ ] At 375 × 812, 768 × 1024, 1280 × 800 and 1920 × 1080: no horizontal scroll, nothing clipped, every module reachable, the chat openable.
- [ ] Both columns collapse and expand with the mouse, the keyboard and touch; the choice survives a reload.
- [ ] The full hero demo works on a phone-sized screen: Scenario A → approval card → Allow once → compliance nudge.
- [ ] Toggles have `aria-expanded` / `aria-controls`; sheets trap focus and close on `Esc`.
- [ ] `npm run typecheck` passes; PR has screenshots at the four sizes.
