import { DEMO_TODAY, catalog, dailyCapacity, initialSchoolItems } from "./data";
import type { Invoice, Project, SchoolItem, Understanding } from "./types";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const fromIso = (s: string) => new Date(`${s}T12:00:00Z`);

export function formatDate(isoDate: string) {
  const d = fromIso(isoDate);
  const wd = DAYS[d.getUTCDay()];
  return `${wd[0].toUpperCase()}${wd.slice(1)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()][0].toUpperCase()}${MONTHS[d.getUTCMonth()].slice(1)}`;
}

/** Deterministic fallback understanding for Naledi Studio scenarios. */
export function mockUnderstand(text: string): Understanding {
  const t = text.toLowerCase();

  const greeting = /^\s*(hi|hello|hey|good (morning|afternoon|evening)|dumela|sawubona|molo)\b/.test(t);
  const emotion: Understanding["emotion"] = /(passed away|died|funeral|bereave|lost my|memorial)/.test(t)
    ? "bereavement"
    : /(urgent|urgently|asap|emergency|tomorrow|rush)/.test(t)
      ? "urgent"
      : /(angry|disappointed|terrible|unacceptable|blurry|unhappy)/.test(t)
        ? "frustrated"
        : "neutral";

  const items: Understanding["items"] = [];
  if (/website|web site|landing page|3-page/.test(t)) items.push({ name: "3-page website", qty: 1 });
  if (/extra logo|logo variation|instagram launch|add-on|also throw in/.test(t)) items.push({ name: "logo add-on", qty: 1 });
  else if (/logo/.test(t)) items.push({ name: "logo kit", qty: 1 });
  if (/social|instagram|templates/.test(t) && !items.some((i) => i.name === "logo add-on")) items.push({ name: "social pack", qty: 1 });
  if (!items.length) items.push({ name: "logo kit", qty: 1 });

  let requestedDate: string | null = null;
  const explicit = t.match(/(\d{1,2})\s*(?:st|nd|rd|th)?\s*(?:of\s*)?(january|february|march|april|may|june|july|august|september|october|november|december)/);
  if (explicit) {
    requestedDate = `2026-${String(MONTHS.indexOf(explicit[2]) + 1).padStart(2, "0")}-${String(Number(explicit[1])).padStart(2, "0")}`;
  } else {
    const wd = DAYS.findIndex((d) => t.includes(d));
    if (wd >= 0) {
      const today = fromIso(DEMO_TODAY);
      let diff = (wd - today.getUTCDay() + 7) % 7;
      if (diff === 0) diff = 7;
      today.setUTCDate(today.getUTCDate() + diff);
      requestedDate = iso(today);
    }
  }

  const paymentTerm: Understanding["paymentTerm"] = /(pay (when|on|after|upon)|on delivery|cash on|pay later)/.test(t)
    ? "on_delivery"
    : /(deposit|eft|upfront|pay now)/.test(t)
      ? "deposit"
      : "unspecified";

  return { intent: mockIntent(t, emotion), greeting, emotion, items, requestedDate, paymentTerm };
}

function mockIntent(t: string, emotion: Understanding["emotion"]): Understanding["intent"] {
  if (/(assignment|homework|coursework|exam paper|write my (essay|project|code|database)|is302|is301)/.test(t)) return "academic_integrity";
  if (emotion === "frustrated" || /(complain|refund|blurry|unhappy|broken)/.test(t)) return "complaint";
  if (/(extra logo|variations|throw in|also add|change request|launch pack)/.test(t)) return "scope_change";
  if (/(bank(ing)? details|account (number|details)|where (do|can) i pay|eft details)/.test(t)) return "banking_details";
  if (/(on track|status|still on|progress|when will (it|my website|my logo))/.test(t)) return "order_status";
  if (/(how much|rate|rates|price|packages|cost)/.test(t) && !/(need a|want a|can you do)/.test(t)) return "faq_rates";
  if (/(open|hours|what time|when do you work)/.test(t) && !/(website|logo|social)/.test(t)) return "faq_hours";
  if (/(where are you|location|address|remote)/.test(t)) return "faq_location";
  if (/(website|logo|social|design|order|need|want|by next|by friday)/.test(t)) return "order";
  return "other";
}

/** Planner: check two-sided capacity (university tests/deadlines + studio hour cap). */
export function checkPlannerCapacity(isoDate: string | null, hoursNeeded: number, school: SchoolItem[] = initialSchoolItems) {
  if (!isoDate) {
    return {
      date: null,
      label: "no date given",
      available: false,
      freeHours: 0,
      blocker: "No target date specified",
      proposedDate: "2026-11-23",
    };
  }
  const slot = dailyCapacity[isoDate] ?? { maxHours: 2, bookedHours: 0 };
  const free = Math.max(0, slot.maxHours - slot.bookedHours);
  const weekSchool = school.filter((s) => Math.abs(fromIso(s.date).getTime() - fromIso(isoDate).getTime()) <= 2 * 86400_000 && s.fixed);
  const testOrCapstone = weekSchool.find((s) => s.kind === "test" || s.kind === "capstone" || s.kind === "exam");

  // During test week (e.g. Fri 20 Nov right after Thu 19 IS302 Test), 8 hrs won't fit before Friday
  const fits = free >= hoursNeeded && !testOrCapstone;

  let proposedDate = "2026-11-23";
  const d = fromIso(isoDate);
  for (let i = 1; i <= 10; i++) {
    d.setUTCDate(d.getUTCDate() + 1);
    const candidate = iso(d);
    const cSlot = dailyCapacity[candidate] ?? { maxHours: 3, bookedHours: 0 };
    const hasFixed = school.some((s) => s.date === candidate && s.fixed);
    if (!hasFixed && cSlot.maxHours - cSlot.bookedHours >= 2) {
      proposedDate = candidate;
      break;
    }
  }

  const blocker = testOrCapstone
    ? `${testOrCapstone.title} on ${formatDate(testOrCapstone.date)} · only ${free}h free before ${formatDate(isoDate)}`
    : free < hoursNeeded
      ? `Only ${free}h free (needs ${hoursNeeded}h)`
      : null;

  return {
    date: isoDate,
    label: formatDate(isoDate),
    available: fits,
    freeHours: free,
    blocker,
    proposedDate,
  };
}

/** Planner: detect same-day collisions between fixed school deadlines and active client deliveries. */
export function detectCollisions(projects: Project[], school: SchoolItem[]) {
  const collisions: { project: Project; school: SchoolItem; studyToShift?: SchoolItem; proposedDue: string }[] = [];
  for (const p of projects) {
    if (!p.dueDate || p.status === "delivered" || p.status === "declined") continue;
    const hit = school.find((s) => s.date === p.dueDate && s.fixed);
    if (hit) {
      const study = school.find((s) => s.date === p.dueDate && !s.fixed);
      const next = fromIso(p.dueDate);
      next.setUTCDate(next.getUTCDate() + 1);
      collisions.push({ project: p, school: hit, studyToShift: study, proposedDue: iso(next) });
    }
  }
  return collisions;
}

export function priceItems(items: Understanding["items"]) {
  const priced = items.map((i) => ({ ...i, unit: catalog[i.name]?.price ?? 1200 }));
  const total = priced.reduce((s, i) => s + i.qty * i.unit, 0);
  const hours = items.reduce((s, i) => s + i.qty * (catalog[i.name]?.hours ?? 4), 0);
  const deliverables = items.flatMap((i) => catalog[i.name]?.deliverables ?? []);
  return { priced, total, hours, deliverables };
}

export function checkPolicy(opts: { priorOrders: number; paymentTerm: Understanding["paymentTerm"]; total: number }) {
  const deposit = Math.round(opts.total * 0.5);
  const blocked = opts.paymentTerm === "on_delivery" && opts.priorOrders < 2;
  return {
    returning: opts.priorOrders >= 2,
    deposit,
    blocked,
    rule: blocked ? "P-01 · 50% deposit required before starting" : "P-01 · 50% deposit on project start",
  };
}

export function findOverdueInvoices(invoices: Invoice[]) {
  return invoices.filter((i) => i.status === "overdue").sort((a, b) => b.daysOverdue - a.daysOverdue);
}

export const rand = (n: number) => `R${n.toLocaleString("en-ZA")}`;
