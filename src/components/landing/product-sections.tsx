import { ArrowRight } from "lucide-react";
import { cn } from "@/components/ui";
import { Container, Eyebrow, Heading, Lede, reveal } from "./primitives";
import { ScreenshotFrame, type PlaceholderArt } from "./screenshot-frame";

/* ── Modules bento ─────────────────────────────────────────────────────────────── */

export type ModuleShots = Partial<Record<"operations" | "whatsapp" | "compliance" | "opportunities" | "crm", string>>;

const modules: {
  id: keyof ModuleShots;
  code: string;
  name: string;
  line: string;
  art: PlaceholderArt;
  span: string;
  aspect: string;
}[] = [
  {
    id: "operations",
    code: "M-01",
    name: "Operations",
    line: "Approvals, projects, invoices and the shared university and studio calendar on one board, with every step the agents took. The first thing you open in the morning.",
    art: "board",
    span: "lg:col-span-4",
    aspect: "16 / 9",
  },
  {
    id: "whatsapp",
    code: "M-02",
    name: "WhatsApp",
    line: "Answers rates and banking questions around the clock. Enquiries, scope changes and reminders are drafted for your approval.",
    art: "chat",
    span: "lg:col-span-2",
    aspect: "4 / 3",
  },
  {
    id: "compliance",
    code: "M-03",
    name: "Compliance",
    line: "CIPC, SARS, the VAT threshold and POPIA as a plain-language checklist, with the official source for every step.",
    art: "checklist",
    span: "lg:col-span-2",
    aspect: "4 / 3",
  },
  {
    id: "opportunities",
    code: "M-04",
    name: "Opportunities",
    line: "Nearby businesses that need design work, ranked by fit and distance, with the outreach drafted.",
    art: "radar",
    span: "lg:col-span-2",
    aspect: "4 / 3",
  },
  {
    id: "crm",
    code: "M-05",
    name: "CRM & Retention",
    line: "Remembers agreed scope, preferences and who pays on time, and never mixes up two clients with similar names.",
    art: "memory",
    span: "lg:col-span-2",
    aspect: "4 / 3",
  },
];

/** Real captures of the live dashboard (1440×900 @2x, cropped to the board area). */
export const MODULE_SHOTS: ModuleShots = {
  operations: "/screenshots/operations.png",
  whatsapp: "/screenshots/whatsapp.png",
  compliance: "/screenshots/compliance.png",
  opportunities: "/screenshots/opportunities.png",
  crm: "/screenshots/crm.png",
};

export function Modules({ shots = MODULE_SHOTS }: { shots?: ModuleShots }) {
  return (
    <section id="modules" aria-labelledby="modules-title" className="relative border-t border-border bg-[var(--landing-paper)] py-24 sm:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Eyebrow index="04" className="text-muted-foreground">
              Modules
            </Eyebrow>
            <Heading id="modules-title" className="mt-6">
              One living business, not five apps.
            </Heading>
          </div>
          <Lede className="max-w-[40ch] text-muted-foreground lg:pb-2">
            Conversations, orders, compliance, leads and customer memory share one operational memory. Switch views without losing the thread.
          </Lede>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {modules.map((m, i) => (
            <li
              key={m.id}
              {...reveal(i % 3)}
              className={cn(
                "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-500 hover:shadow-[0_24px_60px_-30px_oklch(0.13_0_0/0.35)]",
                m.span,
                i === 0 && "sm:col-span-2",
              )}
            >
              <div className="p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[10px] font-medium text-background">{m.code}</span>
                  <h3 className="text-lg font-semibold tracking-[-0.02em]">{m.name}</h3>
                </div>
                <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">{m.line}</p>
              </div>
              <div className="mt-auto px-6 sm:px-7">
                <ScreenshotFrame
                  label={`${m.name} module`}
                  src={shots[m.id]}
                  art={m.art}
                  chrome={i === 0}
                  aspect={m.aspect}
                  width={1792}
                  height={i === 0 ? 1008 : 1344}
                  alt={`The ${m.name} module of the METAXY command centre`}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="translate-y-2 rounded-b-none border-b-0 shadow-[0_-1px_0_0_var(--border),0_20px_40px_-24px_oklch(0.13_0_0/0.3)] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-0 motion-reduce:transition-none"
                />
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ── Who it's for: Launch → Run ────────────────────────────────────────────────── */

const personas = [
  {
    stage: "Stage 1 · Launch",
    initials: "LM",
    name: "Lerato",
    role: "Graduate founder, starting a small tech agency",
    quote: "I know how to build it. I don't know how to run a business.",
    badge: "Companion archetype",
    does: [
      "Turns “where do I start?” into a one-page concept and launch plan",
      "Builds a CIPC & SARS checklist, each step with its official source",
      "Ranks local businesses that need a website and drafts the outreach",
      "Hands over to Run the moment the first client replies",
    ],
  },
  {
    stage: "Stage 2 · Run",
    initials: "NS",
    name: "Naledi Studio",
    role: "Student freelancer: design & web, alongside university",
    quote: "One pool of time. Two sets of deadlines.",
    badge: "In the live demo",
    does: [
      "Spots a client website milestone landing on capstone demo day, early",
      "Answers “can you do it by Friday?” with a date her test week can keep",
      "Drafts polite EFT reminders for overdue invoices, for her approval",
      "Flags “3 extra logo variations” as out of scope and drafts an add-on quote",
      "Never writes, edits or submits her coursework, even when asked",
    ],
  },
];

export function Personas() {
  return (
    <section id="who" aria-labelledby="who-title" className="relative bg-background py-24 sm:py-32">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow index="05" className="justify-center text-muted-foreground">
            Who it&rsquo;s for
          </Eyebrow>
          <Heading id="who-title" className="mx-auto mt-6 max-w-[17ch]">
            From the first idea to the hundredth order.
          </Heading>
          <Lede className="mx-auto mt-6 text-muted-foreground">
            METAXY lives in the in-between: the gap between a side hustle and a formal business. Two archetypes show the journey, launch first and then run.
          </Lede>
        </div>

        <div className="relative mt-14 grid gap-4 lg:grid-cols-2 lg:gap-6">
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 z-10 hidden size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow-sm lg:grid"
          >
            <ArrowRight className="size-4" />
          </span>
          {personas.map((p, i) => (
            <article key={p.name} {...reveal(i)} className="flex flex-col rounded-3xl border border-border bg-card p-7 sm:p-10">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{p.stage}</span>
                <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{p.badge}</span>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-foreground font-mono text-sm font-medium text-background">
                  {p.initials}
                </span>
                <div>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.role}</p>
                </div>
              </div>
              <blockquote className="mt-8 border-l-2 border-accent pl-5 text-[clamp(1.25rem,2.2vw,1.6rem)] font-medium leading-snug tracking-[-0.02em]">
                &ldquo;{p.quote}&rdquo;
              </blockquote>
              <ul className="mt-8 space-y-3 border-t border-border pt-6">
                {p.does.map((d) => (
                  <li key={d} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
                    <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-foreground/40" />
                    {d}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p {...reveal(0, "fade")} className="mx-auto mt-12 max-w-2xl text-center text-[clamp(1.1rem,1.8vw,1.35rem)] font-medium tracking-[-0.02em]">
          &hellip;and any small business that lives on WhatsApp: <span className="text-muted-foreground">bakers, plumbers, spaza shops, salons.</span>
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
          All names and figures are synthetic. The live demo runs as Naledi Studio; the same engine first ran Thandi&rsquo;s Bakes, a home bakery in Soweto, with nothing but different rules and data.
        </p>
      </Container>
    </section>
  );
}

/* ── Outcomes: demo targets ────────────────────────────────────────────────────── */

const outcomes = [
  { value: "100%", label: "of seeded deadline collisions caught before the day" },
  { value: "< 60 s", label: "from incoming message to an approval-ready draft" },
  { value: "0", label: "delivery dates or quotes sent without the owner's approval" },
  { value: "100%", label: "of overdue invoices with a reminder drafted in one run" },
];

export function Outcomes() {
  return (
    <section aria-labelledby="outcomes-title" className="landing-dark landing-grain relative overflow-hidden bg-[var(--landing-ink)] py-24 text-[var(--landing-paper)] sm:py-32">
      <Container className="relative">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Eyebrow index="06" className="text-[var(--landing-paper)]/70">
              Outcomes
            </Eyebrow>
            <Heading id="outcomes-title" className="mt-6 max-w-[15ch]">
              Measured on the demo, not promised.
            </Heading>
          </div>
          <p className="flex max-w-[38ch] items-start gap-2 text-sm leading-relaxed text-[var(--landing-paper)]/70 lg:pb-2">
            <span className="mt-0.5 shrink-0 rounded-sm border border-accent/50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">Demo targets</span>
            Success criteria we test against seeded, synthetic data. Not results from real businesses.
          </p>
        </div>
        <dl className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {outcomes.map((o, i) => (
            <div key={o.label} {...reveal(i)} className="flex flex-col gap-6 bg-[var(--landing-ink)] p-6 sm:p-8">
              <dt className="order-2 text-[15px] leading-relaxed text-[var(--landing-paper)]/75">{o.label}</dt>
              <dd className="order-1 text-[clamp(3rem,6vw,4.75rem)] font-medium leading-none tracking-[-0.05em]">{o.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
