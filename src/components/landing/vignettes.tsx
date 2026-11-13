import { CalendarCheck, CheckCheck, CircleAlert, Pause, Send, ShieldCheck, UserRound } from "lucide-react";
import { Badge, MonoLabel, cn } from "@/components/ui";

/**
 * Small HTML replicas of real dashboard moments from preset "1 · Can you do it by Friday?"
 * (Naledi Studio, synthetic data). They mirror what the live demo does, so nothing here is invented.
 */

const card = "rounded-lg border border-border bg-card shadow-[0_20px_50px_-24px_oklch(0.13_0_0/0.35)]";

export function MessageVignette({ className }: { className?: string }) {
  return (
    <div className={cn(card, "overflow-hidden", className)}>
      <div className="flex items-center gap-3 border-b border-border bg-secondary/70 px-4 py-3">
        <span className="grid size-8 place-items-center rounded-full bg-foreground/10">
          <UserRound className="size-4 text-muted-foreground" aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Buhle S. · Sithole Events</p>
          <MonoLabel className="text-muted-foreground">New lead · WhatsApp</MonoLabel>
        </div>
        <MonoLabel className="ml-auto text-muted-foreground">21:47</MonoLabel>
      </div>
      <div className="space-y-3 bg-[oklch(0.975_0.006_95)] p-4">
        <p className="max-w-[92%] rounded-xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-[13.5px] leading-relaxed">
          hey naledi got your number from a friend. need a 3-page website for Sithole Events urgently, can you do it by next friday?
          <span className="mt-1 block text-right font-mono text-[10px] text-muted-foreground">21:47</span>
        </p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="landing-typing flex gap-1" aria-hidden>
            <span className="size-1.5 rounded-full bg-current" />
            <span className="size-1.5 rounded-full bg-current" />
            <span className="size-1.5 rounded-full bg-current" />
          </span>
          <MonoLabel>Client Desk is reading…</MonoLabel>
        </div>
      </div>
    </div>
  );
}

const traces: { agent: string; tool: string; label: string; detail: string; status: "ok" | "warn" | "block" }[] = [
  { agent: "Client Desk", tool: "understand_message", label: "Triage incoming WhatsApp", detail: "intent: order · tone: urgent · asked for: Friday 20 November", status: "ok" },
  { agent: "Client Desk", tool: "customer_memory", label: "Match client ledger", detail: "Buhle Sithole (Sithole Events): new lead", status: "ok" },
  { agent: "Planner", tool: "check_capacity", label: "Check university + studio calendar", detail: "Fri 20 Nov BLOCKED: IS302 Term Test 2 on Thu 19 Nov, 0 h free → proposing Sat 21 Nov", status: "block" },
  { agent: "Books", tool: "price_and_deposit", label: "Draft quote & deposit rule", detail: "R3 200 total · 50% deposit R1 600 (P-01)", status: "ok" },
  { agent: "Client Desk", tool: "stage_approval", label: "Hold outbound message for approval", detail: "Honest reply drafted, waiting for Naledi", status: "warn" },
];

const dot = { ok: "bg-accent", warn: "bg-[var(--warning)]", block: "bg-destructive" } as const;

export function TraceVignette({ className }: { className?: string }) {
  return (
    <div className={cn(card, className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <MonoLabel className="text-muted-foreground">AGENT</MonoLabel>
          <span className="text-xs font-bold uppercase tracking-tight">Agent activity</span>
        </div>
        <span className="flex items-center gap-1.5">
          <span className="landing-live size-1.5 rounded-full bg-accent" aria-hidden />
          <MonoLabel className="text-muted-foreground">Live</MonoLabel>
        </span>
      </div>
      <ol className="divide-y divide-border">
        {traces.map((t) => (
          <li key={t.tool} className="flex gap-3 px-4 py-2.5">
            <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", dot[t.status])} aria-hidden />
            <div className="min-w-0">
              <MonoLabel className="text-muted-foreground">{t.agent}</MonoLabel>
              <p className="text-[13px] font-semibold leading-snug">
                {t.label} <span className="font-mono text-[10px] font-normal text-muted-foreground">· {t.tool}</span>
              </p>
              <p className={cn("text-xs leading-snug", t.status === "block" ? "text-destructive" : "text-muted-foreground")}>{t.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ApprovalVignette({ className }: { className?: string }) {
  return (
    <div className={cn(card, "overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-[var(--warning)]/30 bg-[var(--warning)]/[0.07] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <CircleAlert className="size-3.5 text-[var(--warning)]" aria-hidden />
          <span className="text-xs font-bold uppercase tracking-tight">Decision needed</span>
        </div>
        <Badge tone="warn">Planner</Badge>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-[15px] font-semibold">Test-week capacity alert · propose Saturday 21 November</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            IS302 Term Test 2 on Thursday leaves 0 h free before Friday. Proposing Saturday (8 h studio block) and a R1 600 deposit.
          </p>
        </div>
        <div className="rounded border border-border bg-secondary/70 px-3 py-2">
          <MonoLabel className="text-muted-foreground">Draft WhatsApp message</MonoLabel>
          <p className="mt-1 text-[12.5px] leading-relaxed">
            &ldquo;Hi Buhle! Next week has a database test on Thursday, so Friday 20 November isn&rsquo;t realistic without rushing. We can deliver cleanly on Saturday 21 November for R3 200&hellip;&rdquo;
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm border border-foreground bg-foreground text-[11px] font-bold uppercase tracking-widest text-background">
            <Send className="size-3.5" aria-hidden /> Approve &amp; send
          </span>
          <span className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm border border-border text-[11px] font-bold uppercase tracking-widest">
            <Pause className="size-3.5" aria-hidden /> Hold
          </span>
        </div>
      </div>
    </div>
  );
}

export function UpdateVignette({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className={cn(card, "p-4")}>
        <div className="flex items-center justify-between">
          <MonoLabel className="text-muted-foreground">OPS-02 · Project</MonoLabel>
          <Badge tone="info">Slot reserved</Badge>
        </div>
        <p className="mt-2 text-sm font-semibold">3-page website · Sithole Events · Sat 21 Nov</p>
        <p className="text-xs text-muted-foreground">R3 200 · provisional studio block held until the 50% deposit lands</p>
      </div>
      <div className={cn(card, "p-4")}>
        <div className="flex items-center justify-between">
          <MonoLabel className="text-muted-foreground">OPS-00 · Shared calendar</MonoLabel>
          <Badge tone="ok">Test week safe</Badge>
        </div>
        <p className="mt-2 flex items-center gap-2 text-xs leading-relaxed text-muted-foreground">
          <CalendarCheck className="size-3.5 shrink-0 text-accent" aria-hidden /> IS302 Term Test 2 keeps its Thursday. No promise the week can&rsquo;t keep.
        </p>
      </div>
      <div className={cn(card, "border-accent/30 p-4")}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-accent" aria-hidden />
          <p className="text-sm font-semibold">Ready to formalise Naledi Studio</p>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          ≈ R92 400 across 12 months. Registering with CIPC unlocks a business bank account and corporate retainers. Checklist prepared.
        </p>
      </div>
      <p className="flex items-center gap-1.5 pl-1 text-xs text-muted-foreground">
        <CheckCheck className="size-3.5 text-[var(--info)]" aria-hidden /> Reply sent to Buhle the moment Naledi approved
      </p>
    </div>
  );
}
