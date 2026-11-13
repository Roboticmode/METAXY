import { Check, CheckCheck, CircleAlert, ShieldCheck, UserRound, X } from "lucide-react";
import { Badge, MonoLabel, cn } from "@/components/ui";

/**
 * Small HTML replicas of real dashboard moments (Scenario A, synthetic data).
 * They mirror what the live demo actually does, so nothing here is invented.
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
          <p className="text-sm font-semibold">Sipho M.</p>
          <MonoLabel className="text-muted-foreground">New customer · WhatsApp</MonoLabel>
        </div>
        <MonoLabel className="ml-auto text-muted-foreground">21:47</MonoLabel>
      </div>
      <div className="space-y-3 bg-[oklch(0.975_0.006_95)] p-4">
        <p className="max-w-[92%] rounded-xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-[13.5px] leading-relaxed">
          need 40 cupcakes and a small cake for next thursday. my mother passed away last week its for the family gathering. can i pay when you deliver? money is tight right now
          <span className="mt-1 block text-right font-mono text-[10px] text-muted-foreground">21:47</span>
        </p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="landing-typing flex gap-1" aria-hidden>
            <span className="size-1.5 rounded-full bg-current" />
            <span className="size-1.5 rounded-full bg-current" />
            <span className="size-1.5 rounded-full bg-current" />
          </span>
          <MonoLabel>Agent is reading…</MonoLabel>
        </div>
      </div>
    </div>
  );
}

const traces: { tool: string; label: string; detail: string; status: "ok" | "warn" | "block" }[] = [
  { tool: "understand_message", label: "Read message", detail: "intent: order · no greeting · emotional context: bereavement", status: "warn" },
  { tool: "customer_memory", label: "Look up customer", detail: "Sipho M. — new customer, no history", status: "ok" },
  { tool: "check_calendar", label: "Check calendar", detail: "Thu 19 Nov: 1/4 bake slots used → AVAILABLE", status: "ok" },
  { tool: "check_policy", label: "Check payment policy", detail: "BLOCKED — no pay-on-delivery for first orders (P-02)", status: "block" },
  { tool: "create_order", label: "Draft order", detail: "R780 total · R390 deposit", status: "ok" },
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
        <Badge tone="warn">OPS-01</Badge>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-[15px] font-semibold">Payment exception requested</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Sipho M. wants to pay R780 on delivery. Context: recently bereaved.
          </p>
        </div>
        <p className="rounded border border-border bg-secondary/70 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
          P-02 · No pay-on-delivery for first orders
        </p>
        <div className="flex gap-2">
          <span className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm border border-foreground bg-foreground text-[11px] font-bold uppercase tracking-widest text-background">
            <Check className="size-3.5" aria-hidden /> Allow once
          </span>
          <span className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm border border-border text-[11px] font-bold uppercase tracking-widest">
            <X className="size-3.5" aria-hidden /> Refuse
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
          <MonoLabel className="text-muted-foreground">OPS-02 · Order</MonoLabel>
          <Badge tone="ok">Confirmed</Badge>
        </div>
        <p className="mt-2 text-sm font-semibold">40 × cupcake · 1 × small cake · Thu 19 Nov</p>
        <p className="text-xs text-muted-foreground">Pay on delivery — one-off exception approved by owner</p>
      </div>
      <div className={cn(card, "p-4")}>
        <div className="flex items-center justify-between">
          <MonoLabel className="text-muted-foreground">CRM-01 · Memory</MonoLabel>
          <Badge tone="info">Updated</Badge>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Recently bereaved (mother) — keep tone gentle. Asked to pay on delivery — cash-tight.</p>
      </div>
      <div className={cn(card, "border-accent/30 p-4")}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-accent" aria-hidden />
          <p className="text-sm font-semibold">You&rsquo;re ready to formalise</p>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          ≈ R118 400 earned in 12 months. Registering with CIPC unlocks a business bank account and bigger buyers. Checklist prepared.
        </p>
      </div>
      <p className="flex items-center gap-1.5 pl-1 text-xs text-muted-foreground">
        <CheckCheck className="size-3.5 text-[var(--info)]" aria-hidden /> Warm reply sent to Sipho after your decision
      </p>
    </div>
  );
}
