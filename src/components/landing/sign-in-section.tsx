"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AuthCard } from "@/components/auth-card";
import { Container, CtaLink, Eyebrow, Heading } from "./primitives";
import { ctaLabel, useLandingSession } from "./auth-session";

/**
 * Owner sign-in (Supabase Auth, via the team's AuthCard). The session is read in the browser,
 * so this section works on the static page and falls back to "demo only" without env vars.
 */
export function SignInSection() {
  const { email, configured } = useLandingSession();
  const [authError, setAuthError] = useState<string | null>(null);

  // /auth/callback redirects here with ?auth_error=… when a link is stale.
  useEffect(() => {
    setAuthError(new URLSearchParams(window.location.search).get("auth_error"));
  }, []);

  return (
    <section id="signin" aria-labelledby="signin-title" className="relative border-t border-border bg-background py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-[1fr_440px] lg:items-center lg:gap-20">
        <div>
          <Eyebrow index="09" className="text-muted-foreground">
            Owner access
          </Eyebrow>
          <Heading id="signin-title" className="mt-6 max-w-[14ch]">
            {email ? "Welcome back." : "Your workspace, your rules."}
          </Heading>
          <p className="mt-6 max-w-[48ch] text-pretty text-[clamp(1rem,1.35vw,1.175rem)] leading-relaxed text-muted-foreground">
            {email
              ? "You're signed in. Your command centre is one click away."
              : "Sign in to keep an owner session for your command centre. You don't need an account to try it: the live demo runs on synthetic data with no sign-up."}
          </p>
          <ul className="mt-8 space-y-3 text-[15px] leading-relaxed">
            {["Email and password, handled by Supabase Auth", "Nothing changes in the demo when you're signed out", "Sign out any time, from here or the dashboard"].map((t) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-foreground/40" />
                {t}
              </li>
            ))}
          </ul>
          {!configured ? (
            <p className="mt-8 max-w-[48ch] rounded-xl border border-border bg-secondary/60 px-4 py-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.06em] text-muted-foreground">
              Sign-in isn&rsquo;t switched on for this deployment yet. Use the live demo.
            </p>
          ) : null}
        </div>
        <div className="w-full rounded-2xl border border-border bg-secondary/40 p-2 shadow-[0_30px_60px_-30px_oklch(0.13_0_0/0.35)]">
          {/* keyed so the card re-reads ?auth_error= (it only reads the prop on mount) */}
          <AuthCard key={authError ?? "ok"} userEmail={email} authError={authError} />
        </div>
      </Container>
    </section>
  );
}

/** Primary CTA whose label follows the session ("Try the live demo" / "Open workspace"). */
export function SessionCta() {
  const { email } = useLandingSession();
  return (
    <CtaLink href="/dashboard" tone="light">
      {ctaLabel(email)} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </CtaLink>
  );
}
