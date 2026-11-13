import { CAPACITY, DEMO_TODAY, calendarUsed, catalog } from "./data";
import type { Understanding } from "./types";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const fromIso = (s: string) => new Date(`${s}T12:00:00Z`);

export function formatDate(isoDate: string) {
  const d = fromIso(isoDate);
  const wd = DAYS[d.getUTCDay()];
  return `${wd[0].toUpperCase()}${wd.slice(1)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()][0].toUpperCase()}${MONTHS[d.getUTCMonth()].slice(1)}`;
}

/** Deterministic fallback "understanding" so the demo never depends on network/credits. */
export function mockUnderstand(text: string): Understanding {
  const t = text.toLowerCase();

  const greeting = /^\s*(hi|hello|hey|good (morning|afternoon|evening)|dumela|sawubona|molo)\b/.test(t);
  const emotion: Understanding["emotion"] = /(passed away|died|funeral|bereave|lost my|late (mother|father|husband|wife)|memorial)/.test(t)
    ? "bereavement"
    : /(urgent|asap|emergency|tomorrow)/.test(t)
      ? "urgent"
      : /(angry|disappointed|terrible|unacceptable)/.test(t)
        ? "frustrated"
        : "neutral";

  const items: Understanding["items"] = [];
  const cupcakes = t.match(/(\d+)\s*(cup\s?cakes?)/);
  if (cupcakes) items.push({ name: "cupcake", qty: Number(cupcakes[1]) });
  const brownies = t.match(/(\d+)?\s*brownies?/);
  if (brownies) items.push({ name: "brownie box", qty: Number(brownies[1] ?? 1) });
  const withoutCupcakes = t.replace(/cup\s?cakes?/g, "");
  if (/large cake|big cake/.test(t)) items.push({ name: "large cake", qty: 1 });
  else if (/\bcakes?\b/.test(withoutCupcakes)) items.push({ name: "small cake", qty: 1 });
  if (!items.length) items.push({ name: "small cake", qty: 1 });

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

  const paymentTerm: Understanding["paymentTerm"] = /(pay (when|on|after|upon)|on delivery|cash on|pay later|pay you when)/.test(t)
    ? "on_delivery"
    : /(deposit|eft|upfront|pay now|pay first)/.test(t)
      ? "deposit"
      : "unspecified";

  return { greeting, emotion, items, requestedDate, paymentTerm };
}

export function checkCalendar(isoDate: string | null) {
  if (!isoDate) return { date: null, label: "no date given", used: 0, available: true, alternative: null as string | null };
  const used = calendarUsed[isoDate] ?? 0;
  const available = used < CAPACITY;
  let alternative: string | null = null;
  if (!available) {
    const d = fromIso(isoDate);
    for (let i = 1; i <= 7; i++) {
      d.setUTCDate(d.getUTCDate() + 1);
      if ((calendarUsed[iso(d)] ?? 0) < CAPACITY) {
        alternative = iso(d);
        break;
      }
    }
  }
  return { date: isoDate, label: formatDate(isoDate), used, available, alternative };
}

export function priceItems(items: Understanding["items"]) {
  const priced = items.map((i) => ({ ...i, unit: catalog[i.name] ?? 300 }));
  const total = priced.reduce((s, i) => s + i.qty * i.unit, 0);
  return { priced, total };
}

export function checkPolicy(opts: { priorOrders: number; paymentTerm: Understanding["paymentTerm"]; total: number }) {
  const returning = opts.priorOrders >= 2;
  const payOnDeliveryAllowed = returning;
  const deposit = returning ? 0 : Math.round(opts.total * 0.5);
  const blocked = opts.paymentTerm === "on_delivery" && !payOnDeliveryAllowed;
  return {
    returning,
    deposit,
    blocked,
    rule: blocked ? "P-02 · no pay-on-delivery for first orders" : returning ? "P-02 · returning customer, flexible terms" : "P-01 · 50% deposit required",
  };
}

export const rand = (n: number) => `R${n.toLocaleString("en-ZA")}`;
