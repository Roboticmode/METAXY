"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/components/ui";
import { Container, Eyebrow, Heading, Lede } from "./primitives";
import { ApprovalVignette, MessageVignette, TraceVignette, UpdateVignette } from "./vignettes";

const steps: { code: string; title: string; body: string; vignette: ReactNode }[] = [
  {
    code: "01",
    title: "A message arrives",
    body: "A new lead wants a 3-page website “by next Friday”. It lands at 21:47, in test week. Say yes on autopilot and the deadline collides with a database test; say nothing and the lead goes cold.",
    vignette: <MessageVignette />,
  },
  {
    code: "02",
    title: "The agents check both sides of your week",
    body: "Client Desk triages the message and matches the client. Planner checks the university calendar next to the studio's: Thursday is a term test, so Friday has no hours left. Books prices the job and applies your deposit rule. Every step shows up in the activity trace.",
    vignette: <TraceVignette />,
  },
  {
    code: "03",
    title: "You approve what goes out",
    body: "Routine answers just happen. A delivery date, a quote or anything else that commits you waits on one card: an honest counter-offer for Saturday, the exact WhatsApp wording, and the rules it was checked against.",
    vignette: <ApprovalVignette />,
  },
  {
    code: "04",
    title: "The business updates itself",
    body: "One tap and the reply goes to the client. Planner holds a provisional studio block until the deposit lands, the test keeps its day, and when turnover says it's time, METAXY prepares your formalisation checklist.",
    vignette: <UpdateVignette />,
  },
];

/**
 * Scrollytelling on desktop: the step list scrolls while a sticky stage swaps vignettes.
 * On small screens every step simply shows its own vignette inline.
 */
export function HowItWorks() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="how" aria-labelledby="how-title" className="relative bg-background py-24 sm:py-32">
      <Container>
        <div className="max-w-3xl">
          <Eyebrow index="03" className="text-muted-foreground">
            How it works
          </Eyebrow>
          <Heading id="how-title" className="mt-6">
            Agents prepare. You decide.
          </Heading>
          <Lede className="mt-6 text-muted-foreground">
            One real scenario from the live demo, start to finish: &ldquo;Can you do it by Friday?&rdquo; A student freelancer, an urgent lead, a term test in the way, and an owner who stays in charge.
          </Lede>
        </div>

        <div className="mt-14 grid gap-12 lg:mt-8 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <ol className="relative">
            {/* progress rail (desktop) */}
            <span aria-hidden className="absolute bottom-[35vh] left-[15px] top-[35vh] hidden w-px bg-border lg:block" />
            {steps.map((s, i) => (
              <li
                key={s.code}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                data-step={i}
                className="relative flex flex-col justify-center py-6 lg:min-h-[72vh] lg:py-0"
              >
                <div className="flex gap-5">
                  <span
                    className={cn(
                      "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border font-mono text-[11px] font-medium transition-colors duration-500",
                      active === i ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {s.code}
                  </span>
                  <div className={cn("transition-opacity duration-500 lg:opacity-40", active === i && "lg:opacity-100")}>
                    <h3 className="text-[clamp(1.4rem,2.4vw,2rem)] font-medium leading-tight tracking-[-0.03em]">{s.title}</h3>
                    <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </div>
                <div className="mt-8 sm:pl-[52px] lg:hidden">{s.vignette}</div>
              </li>
            ))}
          </ol>

          {/* sticky stage (desktop) */}
          <div className="relative hidden lg:block">
            <div className="sticky top-[14vh] h-[72vh]">
              <div className="landing-hairlines absolute inset-0 rounded-3xl border border-border bg-secondary/50" aria-hidden />
              <div className="absolute left-6 top-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground" aria-hidden>
                <span className="landing-live size-1.5 rounded-full bg-accent" />
                Preset 1 · step {steps[active].code} / 04
              </div>
              {steps.map((s, i) => (
                <div
                  key={s.code}
                  data-active={active === i}
                  aria-hidden={active !== i}
                  className="landing-stage-item absolute inset-0 flex items-center justify-center p-10 xl:p-14"
                >
                  <div className="w-full max-w-[440px]">{s.vignette}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
