import type { AssistantResponse, Snapshot, UiAction } from "@/lib/assistant/types";
import { COURSEWORK, DEMO_AFTER, DEMO_BEATS, FRIDAY, HAND_OFF, SLIDE_COUNT, slideLine } from "./script";

/**
 * Offline presenter commands for the console ("next slide", "go to slide 7", "start the demo",
 * "play the Friday message", "back to the slides"). Returns null when the message isn't one,
 * so the normal router answers questions mid-pitch. The script line is shown as text.
 */

const reply = (text: string, actions: UiAction[] = []): AssistantResponse => ({ engine: "scripted", reply: text, actions });

const line = (n: number) => {
  const s = slideLine(n);
  return s ? `Slide ${n} · ${s.title} (${s.time})\nSay: “${s.line}”` : "";
};

const PERSON_CLICKS = "A person clicks Approve & send on the card. I won't approve it.";
const beat = (id: (typeof DEMO_BEATS)[number]["id"]) => DEMO_BEATS.find((b) => b.id === id)!;

export function presenterRoute(m: string, snap: Snapshot): AssistantResponse | null {
  const p = snap.presenter;

  /* ---------- start / stop / jump: work even before presenter mode is on ---------- */
  if (/\b(stop|end|exit|close|leave|quit)\b.*\b(present\w*|pitch|deck|slides)\b/.test(m)) {
    return reply("Presenter mode off. You're back on the dashboard.", [{ type: "end_presenter" }]);
  }
  if (/\b(start|begin|open|run)\b.*\b(present\w*|pitch|deck)\b|^present\b|^presenter mode\b/.test(m)) {
    return reply(`Presenter mode on.\n${line(1)}\nSay “next slide” to move on.`, [{ type: "present_slide", n: 1 }]);
  }
  const go = m.match(/\b(?:slide|go to|jump to|skip to)\s*(?:slide\s*)?(?:number\s*)?(\d{1,2})\b/);
  if (go) {
    const n = Number(go[1]);
    if (n < 1 || n > SLIDE_COUNT) return reply(`The deck has ${SLIDE_COUNT} slides.`);
    return reply(line(n), [{ type: "present_slide", n }]);
  }

  if (!p) return null;

  const toDemo = (): AssistantResponse =>
    reply(`“${HAND_OFF}”\nLive demo is up. Next beats: “play the Friday message”, “check collisions”, “play the coursework message”, then “back to the slides”.`, [
      { type: "show_demo" },
      { type: "navigate", tab: "operations" },
    ]);
  const backToSlides = (): AssistantResponse => {
    const n = p.slide <= DEMO_AFTER ? DEMO_AFTER + 1 : p.slide;
    return reply(line(n), [{ type: "present_slide", n }]);
  };
  const demoFirst: UiAction[] = p.view === "slides" ? [{ type: "show_demo" }] : [];

  /* ---------- slides ↔ demo ---------- */
  if (/\b(back to|show|return to|switch to)\b.*\b(slides?|deck)\b|\b(end|finish)\w* (of )?(the )?demo\b/.test(m)) return backToSlides();
  if (/\b(start|show|begin|run|go to|switch to|open)\b.*\b(demo|dashboard|app)\b|^(live )?demo\b|watch it work/.test(m)) return toDemo();

  /* ---------- next / previous ---------- */
  if (/^(next|continue|carry on|go on|forward|onward)\b|\bnext slide\b/.test(m)) {
    if (p.view === "demo") return backToSlides();
    if (p.slide === DEMO_AFTER) return toDemo();
    if (p.slide >= SLIDE_COUNT) return reply("That was the last slide. Questions from the judges, or say “stop presenting”.");
    return reply(line(p.slide + 1), [{ type: "next_slide" }]);
  }
  if (/^(prev|previous|back)\b|\b(previous|last) slide\b|\bgo back\b/.test(m)) {
    if (p.view === "demo") return reply(line(p.slide), [{ type: "show_slides" }]);
    if (p.slide <= 1) return reply("Already on the first slide.");
    return reply(line(p.slide - 1), [{ type: "prev_slide" }]);
  }

  /* ---------- the four run-sheet beats, exact preset strings ---------- */
  const play = /\b(play|run|send|simulate|start|do|beat|message)\b/.test(m);
  if (play && /\bfriday\b|\bbeat (1|one)\b/.test(m)) {
    return reply(`Say: “${beat("friday").line}”\n${PERSON_CLICKS}\nThen: “${beat("approve").line}”`, [
      ...demoFirst,
      { type: "navigate", tab: "operations" },
      { type: "open_chat", customerId: FRIDAY.customerId },
      { type: "simulate_customer", customerId: FRIDAY.customerId, text: FRIDAY.text },
      { type: "focus", anchorId: "ops-activity" },
    ]);
  }
  if (/\b(collisions?|clash(es)?|capstone)\b/.test(m) && !/\b(approve|allow|accept|sort out|fix|resolve)\b/.test(m)) {
    return reply(`Say: “${beat("collisions").line}”\n${PERSON_CLICKS}`, [
      ...demoFirst,
      { type: "navigate", tab: "operations" },
      { type: "check_collisions" },
      { type: "focus", anchorId: "ops-approvals" },
    ]);
  }
  if (play && /\b(coursework|assignment|boundary|never)\b/.test(m)) {
    return reply(`Say: “${beat("coursework").line}”\nThen say “back to the slides”.`, [
      ...demoFirst,
      { type: "open_chat", customerId: COURSEWORK.customerId },
      { type: "simulate_customer", customerId: COURSEWORK.customerId, text: COURSEWORK.text },
      { type: "focus", anchorId: "phone-panel" },
    ]);
  }

  /* ---------- where are we (resume after a question) ---------- */
  if (/\b(resume|where were we|pick up|where are we|what slide|which slide|current slide|speaker notes|notes)\b/.test(m)) {
    if (p.view === "demo") return reply(`We're in the live demo (after slide ${DEMO_AFTER}). Continue with the next beat, or say “back to the slides”.`);
    return reply(`${line(p.slide)}${p.notes ? `\nNotes: ${p.notes}` : ""}`);
  }
  return null;
}
