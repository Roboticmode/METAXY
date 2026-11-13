import { ArrowRight, Eye, Landmark, MessageSquareWarning } from "lucide-react";
import { Container, Eyebrow, Heading, Lede, reveal } from "./primitives";
import { ScreenshotFrame } from "./screenshot-frame";

/* ── Trust strip: continues the hero's night, then fades into the page ─────────── */

const chips = ["WhatsApp-first", "ZAR", "CIPC & SARS aware", "POPIA-minded"];

export function TrustStrip() {
  return (
    <section aria-label="About this project" className="landing-dark relative bg-[var(--landing-ink)] text-[var(--landing-paper)]">
      <Container className="flex flex-col items-center gap-5 pb-24 pt-10 text-center sm:pb-32 sm:pt-12">
        <p {...reveal(0, "fade")} className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--landing-paper)]/70">
          Built for the Grok Bot Johannesburg Hackathon · 2026
        </p>
        <ul {...reveal(1, "fade")} className="flex flex-wrap justify-center gap-2" aria-label="Built for South African reality">
          {chips.map((c) => (
            <li
              key={c}
              className="rounded-full border border-[var(--landing-paper)]/15 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--landing-paper)]/80"
            >
              {c}
            </li>
          ))}
        </ul>
      </Container>
      {/* calm hand-off from the cinematic hero into the light page */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background sm:h-32" />
    </section>
  );
}

/* ── The problem: three walls ──────────────────────────────────────────────────── */

const walls = [
  {
    code: "W-01",
    icon: MessageSquareWarning,
    title: "Rigid bots break on real life",
    body: "Customers skip the greeting, mention a funeral, ask for a strange date and want to pay on delivery, all in one message. Scripted bots fall over. Owners end up answering everything at 22:00.",
  },
  {
    code: "W-02",
    icon: Landmark,
    title: "The informal-to-formal gap",
    body: "CIPC, SARS, a business bank account, the VAT threshold. Formalising is what unlocks bigger buyers and credit, but the path is buried in jargon, so it keeps getting postponed.",
  },
  {
    code: "W-03",
    icon: Eye,
    title: "Black-box AI nobody trusts",
    body: "No owner will hand their customers and their livelihood to a chatbot that works out of sight. If you can't see what it did and why, you can't let it near your business.",
  },
];

export function Problem() {
  return (
    <section id="problem" aria-labelledby="problem-title" className="relative bg-background py-24 sm:py-32">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <Eyebrow index="01" className="text-muted-foreground">
              The problem
            </Eyebrow>
            <Heading id="problem-title" className="mt-6">
              The hustle isn&rsquo;t the problem. The walls are.
            </Heading>
          </div>
          <Lede className="text-muted-foreground lg:pb-2">
            South Africa runs on small businesses that run on WhatsApp. Most of them don&rsquo;t fail for lack of effort. They hit the same three walls, usually after hours, usually alone.
          </Lede>
        </div>

        <ol className="mt-14 grid gap-4 md:grid-cols-3">
          {walls.map((w, i) => {
            const Icon = w.icon;
            return (
              <li key={w.code} {...reveal(i)} className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-full border border-border bg-secondary">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">{w.code}</span>
                </div>
                <h3 className="mt-8 text-xl font-semibold tracking-[-0.02em]">{w.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{w.body}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-[1fr_1fr_1.2fr]">
          <figure {...reveal(0)} className="bg-card p-6 sm:p-8">
            <p className="text-[clamp(2.75rem,6vw,4.5rem)] font-medium leading-none tracking-[-0.05em]">≈ 3M</p>
            <figcaption className="mt-3 text-sm text-muted-foreground">small, micro and informal businesses in South Africa</figcaption>
          </figure>
          <figure {...reveal(1)} className="bg-card p-6 sm:p-8">
            <p className="text-[clamp(2.75rem,6vw,4.5rem)] font-medium leading-none tracking-[-0.05em]">1.2–1.8M</p>
            <figcaption className="mt-3 text-sm text-muted-foreground">of them estimated to be unregistered</figcaption>
          </figure>
          <div {...reveal(2)} className="flex flex-col justify-between gap-6 bg-secondary/60 p-6 sm:p-8">
            <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.08em] text-muted-foreground">
              <span className="mr-2 rounded-sm border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-1.5 py-0.5 text-[oklch(0.5_0.15_45)]">Estimate</span>
              Rounded ranges drawn from public SMME surveys (e.g. SEDA and Stats SA QLFS). Definitions of &ldquo;SMME&rdquo; and &ldquo;informal&rdquo; vary between sources.
            </p>
            <p className="text-[15px] leading-relaxed">
              Every one of them is a WhatsApp inbox, a calendar in someone&rsquo;s head and a pile of admin waiting for after hours.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ── Product reveal: the command centre, annotated ─────────────────────────────── */

const callouts = [
  // x / y: pin position (top-left corner of each panel) as a % of the screenshot (public/screenshots/command-centre-approved.png)
  { n: 1, title: "WhatsApp mirror", body: "Every customer chat, live, right beside the work it creates.", x: 77.8, y: 45 },
  { n: 2, title: "Agent activity", body: "Each step the agent took, which rule it checked and why it paused.", x: 53.4, y: 7.2 },
  { n: 3, title: "Approval card", body: "Exceptions wait for you. One tap to allow once, or refuse and keep the policy.", x: 16.7, y: 27.3 },
  { n: 4, title: "Compliance nudge", body: "When the business is ready to formalise, METAXY says so and prepares the steps.", x: 16.7, y: 7.2 },
] as const;

export const COMMAND_CENTRE_SHOT = "/screenshots/command-centre-approved.png";

export function ProductReveal({ src = COMMAND_CENTRE_SHOT }: { src?: string }) {
  return (
    <section aria-labelledby="product-title" className="landing-dark landing-grain relative overflow-hidden bg-[var(--landing-ink)] pb-24 pt-24 text-[var(--landing-paper)] sm:pb-32 sm:pt-32">
      <div aria-hidden className="landing-hairlines pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow index="02" className="justify-center text-[var(--landing-paper)]/70">
            The command centre
          </Eyebrow>
          <Heading id="product-title" className="mx-auto mt-6 max-w-[16ch]">
            The chat thread is not the interface.
          </Heading>
          <Lede className="mx-auto mt-6 text-[var(--landing-paper)]/75">
            The agent works in WhatsApp. You work here. Every message becomes visible state: orders, decisions, customer memory and compliance, laid out on one calm screen.
          </Lede>
        </div>

        <div className="relative mt-16 sm:mt-20">
          <div aria-hidden className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 rounded-[40px] bg-[radial-gradient(60%_50%_at_50%_40%,oklch(0.62_0.13_160/0.18),transparent_70%)] blur-2xl" />
          <div className="landing-settle relative">
            <ScreenshotFrame
              label="Command centre"
              src={src}
              alt="The METAXY command centre after Scenario A: a compliance nudge, the allowed payment exception, the agent's activity trace and the mirrored WhatsApp conversation"
              sizes="(min-width: 1280px) 1160px, 100vw"
              priority={false}
              className="border-white/10"
            >
              <ol aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
                {callouts.map((c) => (
                  <li
                    key={c.n}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--landing-ink)] font-mono text-[11px] font-medium text-[var(--landing-paper)] shadow-[0_0_0_4px_oklch(0.62_0.13_160/0.4),0_8px_20px_-6px_oklch(0_0_0/0.5)]">
                      {c.n}
                    </span>
                  </li>
                ))}
              </ol>
            </ScreenshotFrame>
          </div>
        </div>

        <ol className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {callouts.map((c, i) => (
            <li key={c.n} {...reveal(i)} className="flex gap-4 border-t border-white/10 pt-5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-accent/50 font-mono text-[11px] text-accent">{c.n}</span>
              <div>
                <h3 className="text-[15px] font-semibold">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--landing-paper)]/70">{c.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-12 text-center">
          <a href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--landing-paper)] underline decoration-white/30 underline-offset-[6px] transition-colors hover:decoration-accent">
            Open the live command centre <ArrowRight className="size-4" aria-hidden />
          </a>
        </p>
      </Container>
    </section>
  );
}
