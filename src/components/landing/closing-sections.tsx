import { ArrowRight, ArrowUpRight, Ban, Check, Hand, Plus } from "lucide-react";
import { MetaxyMark } from "@/components/ui/metaxy-mark";
import { Container, CtaLink, Eyebrow, Heading, Lede, reveal } from "./primitives";
import { AmbientVideo } from "./ambient-video";
import { SessionCta } from "./sign-in-section";

/* ── Trust & boundaries ────────────────────────────────────────────────────────── */

const columns = [
  {
    key: "alone",
    title: "Do alone",
    icon: Check,
    tone: "text-accent",
    note: "Internal, reversible, inside your rules",
    items: [
      "Read and triage every message",
      "Answer FAQs from your brief: rates, banking details, project status",
      "Calculate capacity across your university and studio calendars",
      "Draft replies, quotes and payment reminders",
      "Flag requests that go beyond the agreed scope",
      "Update client memory",
    ],
  },
  {
    key: "ask",
    title: "Ask first",
    icon: Hand,
    tone: "text-[oklch(0.5_0.15_45)]",
    note: "Anything external or binding",
    items: [
      "Promise a delivery date or send a quote",
      "Send an invoice, a reminder or a change quote",
      "Move a block in your calendar",
      "Reply to a complaint (it hands the chat to you)",
      "Start a formal step like CIPC registration",
    ],
  },
  {
    key: "never",
    title: "Never",
    icon: Ban,
    tone: "text-destructive",
    note: "Hard out-of-bounds",
    items: [
      "Write, edit or submit university coursework",
      "Move money or make a payment",
      "Sign or submit a filing on your behalf",
      "Send promotions to clients who didn't opt in",
      "Share one client's details with another",
    ],
  },
];

export function Trust() {
  return (
    <section id="trust" aria-labelledby="trust-title" className="relative bg-background py-24 sm:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Eyebrow index="07" className="text-muted-foreground">
              Trust &amp; boundaries
            </Eyebrow>
            <Heading id="trust-title" className="mt-6 max-w-[14ch]">
              Visible trust over black-box magic.
            </Heading>
          </div>
          <Lede className="text-muted-foreground lg:pb-2">
            Every agent works to the same rulebook. You can read it, change your policies, and see in the activity trace exactly which rule it checked.
          </Lede>
        </div>

        <div className="mt-14 grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-3">
          {columns.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={c.key} {...reveal(i)} className="border-border p-6 sm:p-8 [&:not(:first-child)]:border-t md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-t-0">
                <div className="flex items-center gap-3">
                  <span className={`grid size-9 place-items-center rounded-full border border-border bg-secondary ${c.tone}`}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.02em]">{c.title}</h3>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{c.note}</p>
                  </div>
                </div>
                <ul className="mt-6 space-y-3">
                  {c.items.map((it) => (
                    <li key={it} className="flex gap-3 text-[15px] leading-relaxed">
                      <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-foreground/40" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Agents prepare, you decide.", "Nothing that commits you, a date, a quote or an invoice, goes out without an approval card showing the exact wording."],
            ["Guidance, not legal or tax advice.", "Compliance steps link the official source (CIPC, SARS). Confirm with the authority or a professional."],
            ["Synthetic data only.", "The demo's clients, phone numbers, amounts, timetables and banking details are all invented."],
          ].map(([t, b], i) => (
            <li key={t} {...reveal(i, "fade")} className="rounded-2xl border border-border bg-secondary/50 p-6">
              <p className="font-semibold">{t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ── FAQ ───────────────────────────────────────────────────────────────────────── */

const faqs = [
  {
    q: "Is METAXY a chatbot?",
    a: "No. A chatbot lives inside the chat. METAXY is a small team of agents (Client Desk, Planner and Books) working in WhatsApp, plus a command centre where you see what they did, why, and what's waiting for you. The chat thread is where clients talk; the command centre is where you run the business.",
  },
  {
    q: "Does it send messages on its own?",
    a: "Only routine answers from your brief: your rates, your banking details, where a project stands. Anything that commits you, like a delivery date, a quote, a change quote or a payment reminder, is drafted and waits on an approval card. Complaints are handed to you instead of guessed, and requests to do coursework are politely declined.",
  },
  {
    q: "Do I need an account to try it?",
    a: "No. The live demo runs without sign-up. Owners can sign in (email and password, via Supabase Auth) to keep a workspace session; when sign-in isn't configured, the demo works exactly the same.",
  },
  {
    q: "Do I need to be a registered business?",
    a: "No. METAXY starts where you are, informal included. As your turnover grows it tracks how ready you are to formalise and walks you through CIPC registration, SARS and the VAT threshold in plain language, linking the official source for every step.",
  },
  {
    q: "What about POPIA?",
    a: "Marketing messages only go to clients who opted in. In the demo, the dormant-client check-in skips anyone without opt-in and says why (POPIA s69). Client details stay with the client they belong to. The demo itself uses only synthetic data.",
  },
  {
    q: "Does it work offline, or without Grok?",
    a: "Yes. The demo runs on a scripted engine with no API key and no internet needed for the dashboard. Add an xAI key and Grok handles the reading and writing. If a Grok call fails, METAXY falls back to the scripted engine and shows that in the activity trace.",
  },
  {
    q: "Is it connected to my real WhatsApp?",
    a: "Not in this demo. The WhatsApp panel mirrors synthetic conversations so you can try every scenario safely. The WhatsApp module shows what a live WhatsApp Business connection needs.",
  },
];

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="relative border-t border-border bg-[var(--landing-paper)] py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <Eyebrow index="08" className="text-muted-foreground">
            FAQ
          </Eyebrow>
          <Heading id="faq-title" className="mt-6 max-w-[10ch]">
            Fair questions.
          </Heading>
          <p className="mt-6 max-w-[34ch] text-[15px] leading-relaxed text-muted-foreground">
            The best answer is the demo itself. Every claim on this page is something you can watch it do, or is labelled as a target.
          </p>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {faqs.map((f) => (
            <details key={f.q} className="landing-faq group">
              <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-6 py-5 text-left text-[clamp(1.05rem,1.6vw,1.2rem)] font-medium tracking-[-0.01em]">
                <h3>{f.q}</h3>
                <span className="landing-faq-icon grid size-8 shrink-0 place-items-center rounded-full border border-border" aria-hidden>
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="max-w-[62ch] pb-6 pr-12 text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ── Final CTA: the day/night idea, one more time ──────────────────────────────── */

export function FinalCta({ videoSrc, poster }: { videoSrc: string; poster?: string }) {
  return (
    <section aria-labelledby="cta-title" className="landing-dark relative isolate overflow-hidden bg-[var(--landing-ink)] text-[var(--landing-paper)]">
      <AmbientVideo src={videoSrc} poster={poster} className="absolute inset-0 -z-10 size-full object-cover opacity-45" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,var(--landing-ink)_0%,oklch(0.155_0.008_130/0.55)_35%,oklch(0.155_0.008_130/0.7)_70%,var(--landing-ink)_100%)]" />
      <Container className="flex min-h-[88svh] flex-col justify-center py-28 sm:py-36">
        <div className="grid gap-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--landing-paper)]/70 sm:grid-cols-2 sm:gap-8" {...reveal(0, "fade")}>
          <p className="flex items-center gap-3 border-t border-white/15 pt-4">
            <span className="text-[var(--landing-paper)]">09:00</span> By day: lectures, the 9-to-5, the day job
          </p>
          <p className="flex items-center gap-3 border-t border-accent/50 pt-4">
            <span className="text-accent">21:47</span> After hours: the business, handled
          </p>
        </div>
        <h2 id="cta-title" {...reveal(1)} className="mt-14 max-w-[13ch] text-balance text-[clamp(2.6rem,7.5vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.05em]">
          Run the business in between.
        </h2>
        <Lede className="mt-8 max-w-[46ch] text-[var(--landing-paper)]/80">
          Send &ldquo;Can you do it by Friday?&rdquo;, watch the agents check both calendars, make the call, and see the whole studio respond. It takes about two minutes.
        </Lede>
        <div className="mt-10 flex flex-wrap items-center gap-3" {...reveal(2, "fade")}>
          <SessionCta />
          <CtaLink href="#how" tone="ghost-light">
            See how it works
          </CtaLink>
        </div>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--landing-paper)]/65">No sign-up · Synthetic data · Runs offline</p>
      </Container>
    </section>
  );
}

/* ── Footer ────────────────────────────────────────────────────────────────────── */

const REPO_URL = "https://github.com/ThisIsPhila/METAXY";

export function Footer() {
  return (
    <footer className="landing-dark border-t border-white/10 bg-[var(--landing-ink)] text-[var(--landing-paper)]">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2.5">
            <MetaxyMark size={22} tone="dark" />
            <span className="text-sm font-bold uppercase tracking-[0.2em]">METAXY</span>
          </p>
          <p className="mt-4 max-w-[36ch] text-sm leading-relaxed text-[var(--landing-paper)]/70">
            From the Greek <em>metaxý</em>, &ldquo;in between&rdquo;. The bridge from informal hustle to formal business.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--landing-paper)]/65">Explore</p>
          <ul className="mt-4 space-y-1 text-sm">
            {[
              ["How it works", "#how"],
              ["Modules", "#modules"],
              ["Who it's for", "#who"],
              ["Trust", "#trust"],
              ["Live demo", "/dashboard"],
            ].map(([l, h]) => (
              <li key={h}>
                <a href={h} className="inline-flex min-h-8 items-center text-[var(--landing-paper)]/80 transition-colors hover:text-[var(--landing-paper)]">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--landing-paper)]/65">Project</p>
          <ul className="mt-4 space-y-1 text-sm text-[var(--landing-paper)]/80">
            <li className="min-h-8 py-1.5">Grok Bot Johannesburg Hackathon · WeThinkCode Joburg</li>
            <li>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1 transition-colors hover:text-[var(--landing-paper)]">
                Source on GitHub <ArrowUpRight className="size-3.5" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </div>
      </Container>
      <Container className="flex flex-col gap-2 border-t border-white/10 py-6 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--landing-paper)]/65 sm:flex-row sm:justify-between">
        <p>All demo data is synthetic · Guidance, not legal or tax advice</p>
        <p>Made in Johannesburg · 2026</p>
      </Container>
    </footer>
  );
}
