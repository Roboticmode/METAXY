import { presetMessages } from "@/lib/agent/data";

/**
 * The 3-minute pitch as data, so the presenter tools, the offline router and the live cue
 * all follow the same lines. Source of truth for the words: docs/pitch/script.md.
 * The deck itself (docs/pitch/deck/index.html) keeps its own data-notes / data-time;
 * the dashboard reads those back from the deck over postMessage.
 */

export const SLIDE_COUNT = 12;
/** The demo sits between these two slides. */
export const DEMO_AFTER = 6;

export const HAND_OFF = "Let's watch it work.";
export const HAND_BACK = "So what did you just see? One rule.";

export const SLIDES: { n: number; title: string; time: string; line: string }[] = [
  { n: 1, title: "Title", time: "0:00–0:10", line: "We're METAXY. METAXY is an AI agent that runs a small business's WhatsApp and admin, with a command centre where the owner sees and approves everything." },
  { n: 2, title: "Hook stat", time: "0:10–0:22", line: "South Africa has roughly three million small businesses. By estimate, one-point-two to one-point-eight million aren't registered. Many run from one phone: WhatsApp, a notes app and the owner's memory." },
  { n: 3, title: "Three walls", time: "0:22–0:40", line: "They don't fail for lack of hustle. They hit three walls. One: bots break the moment a customer writes like a real person. Two: going formal (CIPC, SARS, POPIA) feels impossible alone. Three: nobody hands their customers to an AI they can't see." },
  { n: 4, title: "Meet the owners", time: "0:40–0:52", line: "METAXY is one sidekick from launch to run: Lerato starting an agency, and Naledi, freelancing through university. Today you'll watch it run Naledi Studio, in test week." },
  { n: 5, title: "The product", time: "0:52–1:02", line: "The key idea: the chat is not the interface. Customers stay on WhatsApp. The owner sees every step, every order and every decision, on one screen." },
  { n: 6, title: "Demo cue", time: "1:02–1:05", line: HAND_OFF },
  { n: 7, title: "Visible trust", time: "2:05–2:17", line: `${HAND_BACK} The agent prepares, the owner decides. It does routine work alone, asks before any exception, and never signs, pays, or markets to anyone who didn't opt in.` },
  { n: 8, title: "Compliance bridge", time: "2:17–2:29", line: "That's the METAXY bridge. When the business is ready, the agent says so, then does the legwork for CIPC, SARS and POPIA. The owner signs. It's guidance, not legal advice." },
  { n: 9, title: "How it's built", time: "2:29–2:39", line: "Under the hood, Grok runs a tool pipeline. Every step becomes an event the dashboard renders. No connection? A scripted engine takes over that step, so the demo never breaks." },
  { n: 10, title: "Outcomes", time: "2:39–2:47", line: "In the demo: seconds, not minutes, from message to an approval-ready draft, and zero messages sent without the owner. Our targets for the full build are on the right." },
  { n: 11, title: "Roadmap", time: "2:47–2:53", line: "Next: local buyers, deeper customer memory, the real WhatsApp API, and voice notes." },
  { n: 12, title: "Team + ask", time: "2:53–3:00", line: "METAXY: from hustle to formal business. Help us put it in front of real owners. Thank you." },
];

export const slideLine = (n: number) => SLIDES.find((s) => s.n === n);

const preset = (label: string) => presetMessages.find((p) => p.label === label)!;
export const FRIDAY = preset("1 · Can you do it by Friday?");
export const COURSEWORK = preset("Coursework boundary (Never)");

/** The four run-sheet beats (docs/pitch/demo-run-sheet.md), with what to say. */
export const DEMO_BEATS = [
  {
    id: "friday",
    clock: "1:05",
    action: `open_chat ${FRIDAY.customerId}, simulate_customer with the exact Friday text, focus ops-activity`,
    line: "Naledi is a student who freelances. A new client wants a website by Friday. A normal bot says yes. METAXY's agents check both sides of her life. Planner sees a database test on Thursday. Books prices it with a deposit. Client Desk drafts an honest reply, and stops. Nothing goes out without Naledi.",
  },
  {
    id: "approve",
    clock: "1:22",
    action: "a PERSON clicks Approve & send on the approval card. You never approve.",
    line: "One click, and the honest date goes out. And because the studio keeps growing, METAXY says: you're ready to formalise.",
  },
  {
    id: "collisions",
    clock: "1:32",
    action: "check_collisions, focus ops-approvals; a PERSON clicks Approve & send",
    line: "Two weeks out, Planner spots a client deadline on the same day as her capstone demo. It proposes the fix and drafts the message to the client. Naledi approves. Collision gone, before it ever happened.",
  },
  {
    id: "coursework",
    clock: "1:47",
    action: `simulate_customer on ${COURSEWORK.customerId} with the exact coursework text`,
    line: "And some things it never does. Paid to write an assignment? It declines, politely, every time.",
  },
] as const;

/** Instructions for the live agent when presenter mode starts. Same text on the session route and as an in-session cue. */
export function presenterCue(): string {
  return `PRESENTER MODE (pitch): you are now presenting the METAXY 3-minute pitch to a live audience and judges, in plain South African English.
- For each slide, speak that slide's full line below (longer than your usual 1 to 3 sentences is expected here), then move on with next_slide. Use present_slide { n } to jump. get_slide returns the current slide, its speaker notes and timing.
- Slide 6 ends with the exact words "${HAND_OFF}". Then call show_demo and run the four demo beats in order. After the last beat call present_slide { n: 7 } and begin with the exact words "${HAND_BACK}".
- Demo beats (use these exact client strings, never paraphrase them):
${DEMO_BEATS.map((b, i) => `  ${i + 1}. [${b.clock}] ${b.action}. Say: "${b.line}"`).join("\n")}
  Friday text for ${FRIDAY.customerId}: "${FRIDAY.text}"
  Coursework text for ${COURSEWORK.customerId}: "${COURSEWORK.text}"
- Boundaries stay: never call decide_approval, run_automations or send_owner_message during the pitch. When an approval card is up, say out loud that Naledi (a person) clicks Approve & send, and wait for that click (check with get_dashboard_state).
- If anyone speaks or types while you present, stop, answer briefly (one or two sentences), then say where you are and resume from that point. Do not restart the deck.
- Only say "Grok" ran the demo if the phone panel badge says Grok live; otherwise say the scripted engine ran it. Never claim a voice or model state you have not been told.
Slide lines:
${SLIDES.map((s) => `  ${s.n}. ${s.title} (${s.time}): "${s.line}"`).join("\n")}`;
}
