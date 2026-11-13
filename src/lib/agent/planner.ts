import { DEMO_TODAY, dailyCapacity, initialProjects, initialSchoolItems } from "./data";
import { detectCollisions, formatDate } from "./tools";
import type { Project, ProjectStatus, SchoolItem } from "./types";

/**
 * Planner maths, shared by the offline router, the store and the LLM path.
 * Pure functions over plain data, so they run on the server and in the browser alike.
 * All numbers are synthetic and anchored to DEMO_TODAY.
 */

export type SchoolLike = Pick<SchoolItem, "id" | "module" | "title" | "kind" | "date" | "hours" | "fixed">;
export type ProjectLike = { id: string; customerId: string; title: string; dueDate: string | null; status: ProjectStatus; hoursNeeded?: number };

const SEEDED_PROJECTS = new Set(initialProjects.map((p) => p.id));
const SEEDED_SCHOOL = new Set(initialSchoolItems.map((s) => s.id));
const ACTIVE: ProjectStatus[] = ["scoping", "awaiting_deposit", "awaiting_approval", "in_progress"];
const BLOCKING: SchoolItem["kind"][] = ["test", "exam", "capstone"];

const fromIso = (s: string) => new Date(`${s}T12:00:00Z`);
export const isoOf = (d: Date) => d.toISOString().slice(0, 10);
export function addDays(isoDate: string, n: number) {
  const d = fromIso(isoDate);
  d.setUTCDate(d.getUTCDate() + n);
  return isoOf(d);
}
export const weekday = (isoDate: string) => fromIso(isoDate).getUTCDay(); // 0 = Sunday
export const TOMORROW = addDays(DEMO_TODAY, 1);
/** Monday of the week after DEMO_TODAY */
export const NEXT_MONDAY = (() => {
  const wd = weekday(DEMO_TODAY);
  return addDays(DEMO_TODAY, ((8 - wd) % 7) || 7);
})();

export const isActive = (p: ProjectLike) => ACTIVE.includes(p.status);

export type Day = {
  date: string;
  /** studio hours available that day (0 on test / exam / capstone days) */
  max: number;
  /** studio hours already booked by client work */
  booked: number;
  /** extra study blocks Planner added on that day */
  study: number;
  free: number;
  school: SchoolLike[];
  note?: string;
};

/** One day of Naledi's freelance capacity: seeded term capacity, minus fixed school days and added study blocks. */
export function dayOf(date: string, school: SchoolLike[]): Day {
  const wd = weekday(date);
  const base = dailyCapacity[date] ?? { maxHours: wd === 0 ? 0 : wd === 6 ? 4 : 2, bookedHours: 0 };
  const today = school.filter((s) => s.date === date);
  const blocked = today.some((s) => s.fixed && BLOCKING.includes(s.kind));
  const max = blocked ? 0 : base.maxHours;
  const study = today.filter((s) => !SEEDED_SCHOOL.has(s.id) && !s.fixed).reduce((n, s) => n + s.hours, 0);
  return { date, max, booked: base.bookedHours, study, free: Math.max(0, max - base.bookedHours - study), school: today, note: (base as { reason?: string }).reason };
}

/** Client hours promised by projects the seed capacity doesn't know about yet (anything created in the app). */
function newCommitments(projects: ProjectLike[], upTo: string, exceptId?: string) {
  return projects
    .filter((p) => isActive(p) && !SEEDED_PROJECTS.has(p.id) && p.id !== exceptId && p.dueDate && p.dueDate <= upTo)
    .reduce((n, p) => n + (p.hoursNeeded ?? 0), 0);
}

export type Fit = { requested: string | null; fits: boolean; date: string; reason: string; freeBefore: number };

/**
 * Earliest honest delivery date for `hours` of client work.
 * A delivery day must be a weekday with no fixed university commitment, and the free studio
 * hours from tomorrow up to that day must cover this job plus other new work due before it.
 */
export function fitDate(hours: number, requested: string | null, school: SchoolLike[], projects: ProjectLike[], examMode = false, exceptId?: string): Fit {
  const floor = examMode ? "2026-12-07" : TOMORROW;
  const freeUpTo = (day: string) => {
    let n = 0;
    for (let d = TOMORROW; d <= day; d = addDays(d, 1)) n += dayOf(d, school).free;
    return n - newCommitments(projects, day, exceptId);
  };
  const okDay = (day: string) => {
    const wd = weekday(day);
    return wd >= 1 && wd <= 5 && !school.some((s) => s.date === day && s.fixed) && freeUpTo(day) >= hours && day >= floor;
  };
  const why = (day: string) => {
    if (day < floor) return examMode ? "Exam Mode is on: new work starts after 4 Dec" : "that date has passed";
    const fixed = school.find((s) => s.date === day && s.fixed);
    if (fixed) return `${fixed.title} is on ${formatDate(day)}`;
    const wd = weekday(day);
    if (wd === 0 || wd === 6) return `${formatDate(day)} is a weekend`;
    return `only ${Math.max(0, freeUpTo(day))}h of studio time is free before ${formatDate(day)} (needs ${hours}h)`;
  };
  if (requested && okDay(requested)) return { requested, fits: true, date: requested, reason: `${hours}h fits before ${formatDate(requested)}`, freeBefore: freeUpTo(requested) };
  let d = requested && requested > floor ? requested : floor;
  for (let i = 0; i < 60 && !okDay(d); i++) d = addDays(d, 1);
  return {
    requested,
    fits: false,
    date: d,
    reason: requested ? why(requested) : `earliest day with ${hours}h free and no university commitment`,
    freeBefore: freeUpTo(d),
  };
}

export type WeekPlan = {
  start: string;
  end: string;
  days: Day[];
  capacity: number;
  clientBooked: number;
  schoolHours: number;
  free: number;
  newWork: number;
  dues: ProjectLike[];
  fixed: SchoolLike[];
  risks: string[];
};

/** Planner's one-page week: free vs committed hours and anything that could collide. */
export function weekPlan(start: string, school: SchoolLike[], projects: ProjectLike[]): WeekPlan {
  const days = Array.from({ length: 7 }, (_, i) => dayOf(addDays(start, i), school));
  const end = days[6].date;
  const inWeek = (d: string | null) => !!d && d >= start && d <= end;
  const weekSchool = school.filter((s) => inWeek(s.date));
  const dues = projects.filter((p) => isActive(p) && inWeek(p.dueDate));
  const newWork = dues.filter((p) => !SEEDED_PROJECTS.has(p.id)).reduce((n, p) => n + (p.hoursNeeded ?? 0), 0);
  const risks: string[] = [];
  for (const c of detectCollisions(projects as Project[], school as SchoolItem[])) {
    if (inWeek(c.school.date)) risks.push(`Collision: ${c.project.id} (${c.project.title}) is due on ${formatDate(c.school.date)}, the same day as ${c.school.title}`);
  }
  for (const s of weekSchool.filter((x) => x.fixed && BLOCKING.includes(x.kind))) {
    const near = dues.filter((p) => p.dueDate && p.dueDate !== s.date && Math.abs(fromIso(p.dueDate).getTime() - fromIso(s.date).getTime()) <= 86400_000);
    for (const p of near) risks.push(`Tight: ${p.id} (${p.title}) is due ${formatDate(p.dueDate!)}, a day from ${s.title}`);
  }
  for (const d of days) if (d.booked > d.max && d.max === 0 && d.booked) risks.push(`${formatDate(d.date)}: ${d.booked}h of client work booked on a no-studio day${d.note ? ` (${d.note})` : ""}`);
  const free = days.reduce((n, d) => n + d.free, 0);
  if (newWork > free) risks.push(`New work due this week needs ${newWork}h but only ${free}h is free`);
  return {
    start,
    end,
    days,
    capacity: days.reduce((n, d) => n + d.max, 0),
    clientBooked: days.reduce((n, d) => n + d.booked, 0) + newWork,
    schoolHours: weekSchool.reduce((n, s) => n + s.hours, 0),
    free: Math.max(0, free - newWork),
    newWork,
    dues,
    fixed: weekSchool.filter((s) => s.fixed),
    risks,
  };
}

export function describeWeek(w: WeekPlan, nameOf: (customerId: string) => string = (id) => id): string {
  const busy = w.days.filter((d) => d.max === 0 || d.free === 0).map((d) => formatDate(d.date).split(" ")[0].slice(0, 3));
  const best = [...w.days].sort((a, b) => b.free - a.free)[0];
  const lines = [
    `Week of ${formatDate(w.start)} to ${formatDate(w.end)}`,
    `Studio capacity ${w.capacity}h · client work committed ${w.clientBooked}h · free ${w.free}h`,
    `University: ${w.schoolHours}h${w.fixed.length ? ` (${w.fixed.map((s) => `${s.title} ${formatDate(s.date)}`).join("; ")})` : ""}`,
    w.dues.length ? `Client deliveries: ${w.dues.map((p) => `${p.id} ${p.title} for ${nameOf(p.customerId)} (${formatDate(p.dueDate!)})`).join("; ")}` : "No client deliveries due",
  ];
  if (busy.length) lines.push(`No studio time on: ${busy.join(", ")}`);
  if (best && best.free) lines.push(`Best window: ${formatDate(best.date)} (${best.free}h free)`);
  lines.push(w.risks.length ? `Risks:\n  - ${w.risks.join("\n  - ")}` : "No collision risks");
  return lines.join("\n• ");
}

/** Up to two study blocks in the week before a test, placed only where client work leaves room. */
export function studySlots(target: SchoolLike, school: SchoolLike[], blockHours = 2) {
  const out: { date: string; hours: number }[] = [];
  const from = addDays(target.date, -7) > TOMORROW ? addDays(target.date, -7) : TOMORROW;
  const candidates: Day[] = [];
  for (let d = addDays(target.date, -1); d >= from; d = addDays(d, -1)) {
    const day = dayOf(d, school);
    if (day.school.some((s) => s.fixed) || day.free < Math.min(blockHours, 1)) continue;
    candidates.push(day);
  }
  for (const day of candidates) {
    if (out.length >= 2) break;
    out.push({ date: day.date, hours: Math.min(blockHours, day.free) });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** Next fixed test / exam / capstone that has no Planner study block yet. */
export function nextAssessment(school: SchoolLike[]) {
  return [...school]
    .filter((s) => s.fixed && BLOCKING.includes(s.kind) && s.date > DEMO_TODAY)
    .sort((a, b) => a.date.localeCompare(b.date))
    .find((s) => !school.some((x) => x.kind === "study" && x.title.includes(s.title)));
}
