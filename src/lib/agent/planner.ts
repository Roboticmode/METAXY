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

/* ------------------------------------------------------------------------------------------------
 * The studio ledger: the ONE capacity calculation behind quotes, the "by Friday?" enquiry and the
 * weekly plan. Seeded bookings live in dailyCapacity; every project created in the app has its hours
 * placed on free days strictly before its delivery day, earliest deadline first. Whatever can't be
 * placed is "unmet" (an overpromise the Planner reports instead of hiding).
 * ---------------------------------------------------------------------------------------------- */

export const HORIZON_DAYS = 56;

export type LedgerDay = Day & { allocated: number; remaining: number; jobs: { id: string; hours: number }[] };
export type Ledger = { days: Map<string, LedgerDay>; unmet: Map<string, number> };

export function buildLedger(school: SchoolLike[], projects: ProjectLike[], exceptId?: string, horizon = HORIZON_DAYS): Ledger {
  const days = new Map<string, LedgerDay>();
  for (let i = 0; i < horizon; i++) {
    const d = dayOf(addDays(TOMORROW, i), school);
    days.set(d.date, { ...d, allocated: 0, remaining: d.free, jobs: [] });
  }
  const jobs = projects
    .filter((p) => isActive(p) && !SEEDED_PROJECTS.has(p.id) && p.id !== exceptId && p.dueDate && (p.hoursNeeded ?? 0) > 0)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!) || a.id.localeCompare(b.id));
  const unmet = new Map<string, number>();
  for (const p of jobs) {
    let need = p.hoursNeeded ?? 0;
    for (const day of days.values()) {
      if (need <= 0 || day.date >= p.dueDate!) break;
      const take = Math.min(day.remaining, need);
      if (take > 0) {
        day.remaining -= take;
        day.allocated += take;
        day.jobs.push({ id: p.id, hours: take });
        need -= take;
      }
    }
    if (need > 0) unmet.set(p.id, need);
  }
  return { days, unmet };
}

/** Free studio hours left on the ledger from tomorrow up to (not including) the delivery day. */
export function freeBefore(ledger: Ledger, day: string) {
  let n = 0;
  for (const d of ledger.days.values()) {
    if (d.date >= day) break;
    n += d.remaining;
  }
  return n;
}

export type Fit = {
  requested: string | null;
  /** the requested date works */
  fits: boolean;
  /** a feasible date exists inside the planning horizon */
  feasible: boolean;
  /** date to promise (requested if it fits, else the earliest feasible one) */
  date: string;
  reason: string;
  /** free hours before `date` */
  freeBefore: number;
  /** free hours before the requested date */
  freeRequested: number;
};

/**
 * Earliest honest delivery date for `hours` of client work, on the shared ledger:
 * a weekday with no fixed university commitment, with enough uncommitted studio hours before it.
 */
export function fitDate(hours: number, requested: string | null, school: SchoolLike[], projects: ProjectLike[], examMode = false, exceptId?: string): Fit {
  const ledger = buildLedger(school, projects, exceptId);
  const floor = examMode ? "2026-12-07" : TOMORROW;
  const fixedOn = (day: string) => school.find((s) => s.date === day && s.fixed);
  const okDay = (day: string) => {
    const wd = weekday(day);
    return day >= floor && wd >= 1 && wd <= 5 && !fixedOn(day) && freeBefore(ledger, day) >= hours;
  };
  const why = (day: string) => {
    if (day < floor) return examMode ? "Exam Mode is on: new work starts after 4 Dec" : "that date has passed";
    const fixed = fixedOn(day);
    if (fixed) return `${fixed.title} is on ${formatDate(day)}`;
    const wd = weekday(day);
    if (wd === 0 || wd === 6) return `${formatDate(day)} is a weekend`;
    return `only ${freeBefore(ledger, day)}h of studio time is free before ${formatDate(day)} (needs ${hours}h)`;
  };
  const freeRequested = requested ? freeBefore(ledger, requested) : 0;
  if (requested && okDay(requested)) {
    return { requested, fits: true, feasible: true, date: requested, reason: `${hours}h fits before ${formatDate(requested)}`, freeBefore: freeRequested, freeRequested };
  }
  const last = addDays(TOMORROW, HORIZON_DAYS - 1);
  let d = requested && requested > floor ? requested : floor;
  while (d <= last && !okDay(d)) d = addDays(d, 1);
  const feasible = d <= last;
  if (!feasible) d = last;
  return {
    requested,
    fits: false,
    feasible,
    date: d,
    reason: !feasible
      ? `no day in the next ${HORIZON_DAYS / 7} weeks has ${hours}h of studio time free`
      : requested
        ? why(requested)
        : `earliest day with ${hours}h free before it and no university commitment`,
    freeBefore: freeBefore(ledger, d),
    freeRequested,
  };
}

export type WeekPlan = {
  start: string;
  end: string;
  days: LedgerDay[];
  capacity: number;
  clientBooked: number;
  schoolHours: number;
  free: number;
  /** hours of in-app client work placed on this week's days */
  newWork: number;
  dues: ProjectLike[];
  fixed: SchoolLike[];
  risks: string[];
};

/** Planner's one-page week: free vs committed hours and anything that could collide. */
export function weekPlan(start: string, school: SchoolLike[], projects: ProjectLike[]): WeekPlan {
  const ledger = buildLedger(school, projects);
  const days: LedgerDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const d = ledger.days.get(date);
    if (d) return d;
    const base = dayOf(date, school);
    return { ...base, allocated: 0, remaining: date < TOMORROW ? 0 : base.free, jobs: [] };
  });
  const end = days[6].date;
  const inWeek = (d: string | null) => !!d && d >= start && d <= end;
  const weekSchool = school.filter((s) => inWeek(s.date));
  const dues = projects.filter((p) => isActive(p) && inWeek(p.dueDate));
  const newWork = days.reduce((n, d) => n + d.allocated, 0);
  const risks: string[] = [];
  for (const c of detectCollisions(projects as Project[], school as SchoolItem[])) {
    if (inWeek(c.school.date)) risks.push(`Collision: ${c.project.id} (${c.project.title}) is due on ${formatDate(c.school.date)}, the same day as ${c.school.title}`);
  }
  for (const s of weekSchool.filter((x) => x.fixed && BLOCKING.includes(x.kind))) {
    const near = dues.filter((p) => p.dueDate && p.dueDate !== s.date && Math.abs(fromIso(p.dueDate).getTime() - fromIso(s.date).getTime()) <= 86400_000);
    for (const p of near) risks.push(`Tight: ${p.id} (${p.title}) is due ${formatDate(p.dueDate!)}, a day from ${s.title}`);
  }
  for (const d of days) if (d.booked > d.max && d.max === 0 && d.booked) risks.push(`${formatDate(d.date)}: ${d.booked}h of client work booked on a no-studio day${d.note ? ` (${d.note})` : ""}`);
  // overpromises: anything due this week (or already late) the ledger couldn't fit before its delivery day
  for (const p of projects.filter((x) => isActive(x) && x.dueDate && x.dueDate <= end && ledger.unmet.has(x.id))) {
    risks.push(`Overbooked: ${p.id} (${p.title}) due ${formatDate(p.dueDate!)} is ${ledger.unmet.get(p.id)}h short of studio time`);
  }
  return {
    start,
    end,
    days,
    capacity: days.reduce((n, d) => n + d.max, 0),
    clientBooked: days.reduce((n, d) => n + d.booked + d.allocated, 0),
    schoolHours: weekSchool.reduce((n, s) => n + s.hours, 0),
    free: days.reduce((n, d) => n + d.remaining, 0),
    newWork,
    dues,
    fixed: weekSchool.filter((s) => s.fixed),
    risks,
  };
}

export function describeWeek(w: WeekPlan, nameOf: (customerId: string) => string = (id) => id): string {
  const busy = w.days.filter((d) => d.max === 0 || d.remaining === 0).map((d) => formatDate(d.date).split(" ")[0].slice(0, 3));
  const best = [...w.days].sort((a, b) => b.remaining - a.remaining)[0];
  const lines = [
    `Week of ${formatDate(w.start)} to ${formatDate(w.end)}`,
    `Studio capacity ${w.capacity}h · client work committed ${w.clientBooked}h · free ${w.free}h`,
    `University: ${w.schoolHours}h${w.fixed.length ? ` (${w.fixed.map((s) => `${s.title} ${formatDate(s.date)}`).join("; ")})` : ""}`,
    w.dues.length ? `Client deliveries: ${w.dues.map((p) => `${p.id} ${p.title} for ${nameOf(p.customerId)} (${formatDate(p.dueDate!)})`).join("; ")}` : "No client deliveries due",
  ];
  if (busy.length) lines.push(`No studio time on: ${busy.join(", ")}`);
  const placed = w.days.filter((d) => d.jobs.length).map((d) => `${formatDate(d.date)}: ${d.jobs.map((j) => `${j.id} ${j.hours}h`).join(", ")}`);
  if (placed.length) lines.push(`New client work scheduled: ${placed.join("; ")}`);
  if (best && best.remaining) lines.push(`Best window: ${formatDate(best.date)} (${best.remaining}h free)`);
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
