import { catalog, DEMO_TODAY, schoolModules } from "@/lib/agent/data";
import { addDays, NEXT_MONDAY, weekday } from "@/lib/agent/planner";
import type { SchoolKind } from "@/lib/agent/types";

/**
 * Small, forgiving parsers for owner instructions (offline router).
 * They extract facts only; deciding what to do with them stays in router.ts.
 */

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

const pad = (n: number) => String(n).padStart(2, "0");
function isoFor(day: number, monthIdx: number) {
  if (day < 1 || day > 31) return null;
  // the demo runs in Nov 2026: Nov/Dec are this year, Jan–Oct are next year
  const year = monthIdx >= 10 ? 2026 : 2027;
  return `${year}-${pad(monthIdx + 1)}-${pad(day)}`;
}

/** "2 December", "Dec 2", "2/12", "tomorrow", "Friday", "next Friday" → ISO date (synthetic calendar, DEMO_TODAY = Fri 13 Nov 2026). */
export function parseDate(m: string): string | null {
  const t = m.toLowerCase();
  let r = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s+)?${MONTH_RE}\\b`));
  if (r) return isoFor(Number(r[1]), MONTHS.indexOf(r[2].slice(0, 3)));
  r = t.match(new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));
  if (r) return isoFor(Number(r[2]), MONTHS.indexOf(r[1].slice(0, 3)));
  r = t.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (r && Number(r[2]) >= 1 && Number(r[2]) <= 12) return isoFor(Number(r[1]), Number(r[2]) - 1);
  if (/\btomorrow\b/.test(t)) return addDays(DEMO_TODAY, 1);
  r = t.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|mon|tues?|wed|thu(?:rs?)?|fri|sat|sun)\b/);
  if (r) {
    const wd = DAYS.indexOf(r[1].slice(0, 3));
    let diff = (wd - weekday(DEMO_TODAY) + 7) % 7;
    if (diff === 0) diff = 7;
    return addDays(DEMO_TODAY, diff);
  }
  return null;
}

/** Monday-based week the owner is asking about. */
export function parseWeek(m: string): string {
  const t = m.toLowerCase();
  if (/\b(week after next|in two weeks|in 2 weeks)\b/.test(t)) return addDays(NEXT_MONDAY, 7);
  if (/\bthis week\b/.test(t)) return DEMO_TODAY;
  const d = parseDate(t.replace(/\b(next|this)\s+week\b/g, ""));
  if (d && /\bweek of\b/.test(t)) return addDays(d, -((weekday(d) + 6) % 7));
  return NEXT_MONDAY;
}

/** Studio packages named in a message ("a logo", "website", "social media pack", "extra logo variations"). */
export function parsePackages(m: string): string[] {
  const t = m.toLowerCase();
  const out: string[] = [];
  if (/\b(extra logo|logo variations?|add-?on)\b/.test(t)) out.push("logo add-on");
  else if (/\blogos?\b|\bbrand(ing)? kit\b/.test(t)) out.push("logo kit");
  if (/\b(social|instagram|templates?)\b/.test(t)) out.push("social pack");
  if (/\b(web ?site|landing page|site|web page)\b/.test(t)) out.push("3-page website");
  return out.filter((p) => p in catalog);
}

export const PHONE_RE = /(\+27[\d ]{9,13}\d|\b0\d{2}[ -]?\d{3}[ -]?\d{4}\b)/;

/** "Add Lindiwe Dube from Dube Florists, she wants a logo" / "New lead: Lindiwe Dube (Dube Florists)". */
export function parseNewClient(original: string): { name: string; business: string; rest: string } | null {
  const msg = original.replace(PHONE_RE, " ").replace(/\s+/g, " ").trim();
  const lead = /^(?:please\s+)?(?:can you\s+)?(?:add|save|create|capture|new)\s+(?:a\s+)?(?:new\s+)?(?:client|lead|customer|contact)?\s*:?\s*/i;
  if (!lead.test(msg)) return null;
  const body = msg.replace(lead, "");
  const NAME = "([A-Z][\\p{L}'-]+(?:\\s+[A-Z][\\p{L}'-]+){0,2})";
  let r = body.match(new RegExp(`^${NAME}\\s*\\(([^)]+)\\)\\s*[,.;]?\\s*(.*)$`, "u"));
  if (r) return { name: r[1].trim(), business: r[2].trim(), rest: r[3] ?? "" };
  r = body.match(new RegExp(`^${NAME}\\s+(?:from|of|at|who runs|owner of|,)\\s+(.+?)(?=\\s*[,.;!]|\\s+(?:she|he|they|who|wants?|needs?|for|about|looking)\\b|$)(.*)$`, "u"));
  if (r) return { name: r[1].trim(), business: r[2].trim().replace(/^the\s+/i, ""), rest: r[3] ?? "" };
  return null;
}

const KIND_WORDS: [RegExp, SchoolKind][] = [
  [/\bstudy\b/, "study"],
  [/\bexams?\b/, "exam"],
  [/\b(tests?|quiz|semester test|term test)\b/, "test"],
  [/\b(capstone|milestone|demo day)\b/, "capstone"],
  [/\b(labs?|practicals?|sign-?off)\b/, "lecture"],
  [/\b(assignments?|deadline|due date|essay|report|submission|project)\b/, "assignment"],
];
export const KIND_HOURS: Record<SchoolKind, number> = { exam: 6, test: 5, capstone: 6, assignment: 3, lecture: 2, study: 2 };

export function parseSchoolKind(m: string): SchoolKind | null {
  for (const [re, kind] of KIND_WORDS) if (re.test(m)) return kind;
  return null;
}

/** "IS302" → "IS302 Databases" (null when no module code is mentioned). */
export function parseModule(m: string): { code: string; name: string } | null {
  const r = m.toUpperCase().match(/\b(IS|CS)\s?(\d{3})\b/);
  if (!r) return null;
  const code = `${r[1]}${r[2]}`;
  return { code, name: schoolModules.find((x) => x.startsWith(code)) ?? code };
}

export const INVOICE_RE = /\binv[-\s]?(\d{3,5})\b/i;
