import Link from "next/link";
import { ArrowRight, Gauge, MessageCircle, Radar, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/auth-card";
import { Badge, MonoLabel } from "@/components/ui";

export const dynamic = "force-dynamic";

const pillars = [
  {
    code: "M-01",
    title: "Operations & Approvals",
    detail: "Off-script WhatsApp orders, two-sided capacity checks, and one-click owner exception cards.",
    icon: Gauge,
  },
  {
    code: "M-02",
    title: "WhatsApp Inbox & Automations",
    detail: "Intent routing, instant FAQ & banking replies, owner hand-off, and POPIA-aware reminders.",
    icon: MessageCircle,
  },
  {
    code: "M-03",
    title: "Compliance & Formalisation",
    detail: "Guided CIPC, SARS, VAT threshold, Scope & IP, and POPIA checklist with a live document vault.",
    icon: ShieldCheck,
  },
  {
    code: "M-04",
    title: "Opportunities & CRM",
    detail: "Local buyer discovery within 15 km plus persistent customer memory across interactions.",
    icon: Users,
  },
];

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ auth_error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const userEmail = data.user?.email ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="size-3 bg-foreground" aria-hidden />
          <span className="text-sm font-bold uppercase tracking-tight">METAXY</span>
          <MonoLabel className="ml-1 text-muted-foreground">/ ZA</MonoLabel>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="ok">Command Centre</Badge>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-secondary"
          >
            {userEmail ? "Open workspace" : "Live demo"} <ArrowRight className="size-3" />
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12">
        <section className="space-y-6 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">Informal → Formal</Badge>
            <MonoLabel className="text-muted-foreground">Greek metaxý · &ldquo;in between&rdquo;</MonoLabel>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              An AI operations agent your small business can actually <span className="text-accent">see and trust.</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              METAXY pairs a Grok-powered WhatsApp assistant with a live visual command centre for South African small, micro, and student-freelance businesses—handling customer chats, quotes, calendar conflicts, and compliance readiness while keeping every decision in your hands.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.code} className="rounded border border-border bg-card p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="size-3.5 text-accent" />
                      <span className="text-xs font-bold uppercase tracking-tight">{p.title}</span>
                    </div>
                    <MonoLabel className="text-muted-foreground">{p.code}</MonoLabel>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{p.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Radar className="size-3.5 text-accent" /> Zero unapproved outbound messages
            </span>
            <span>·</span>
            <span>Built for ZAR, WhatsApp, CIPC &amp; SARS workflows</span>
          </div>
        </section>

        <aside className="lg:col-span-5">
          <AuthCard userEmail={userEmail} authError={params.auth_error ?? null} />
        </aside>
      </main>
    </div>
  );
}
