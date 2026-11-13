"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Gauge, LogOut, MessageCircle, Radar, ShieldCheck, Users } from "lucide-react";
import { business, TURNOVER } from "@/lib/agent/data";
import type { Tab } from "@/lib/agent/types";
import { createClient } from "@/lib/supabase/client";
import { useMetaxy } from "@/lib/store";
import { ComplianceBoard } from "@/components/compliance-board";
import { CrmBoard, OpportunitiesBoard } from "@/components/other-boards";
import { OperationsBoard } from "@/components/operations-board";
import { WhatsAppPanel } from "@/components/whatsapp-panel";
import { WhatsAppBoard } from "@/components/whatsapp-board";
import { MonoLabel, cn } from "@/components/ui";

const tabs: { id: Tab; code: string; label: string; icon: typeof Gauge }[] = [
  { id: "operations", code: "M-01", label: "Operations", icon: Gauge },
  { id: "whatsapp", code: "M-02", label: "WhatsApp", icon: MessageCircle },
  { id: "compliance", code: "M-03", label: "Compliance", icon: ShieldCheck },
  { id: "opportunities", code: "M-04", label: "Opportunities", icon: Radar },
  { id: "crm", code: "M-05", label: "CRM & Retention", icon: Users },
];

export function Shell({ userEmail = null }: { userEmail?: string | null }) {
  const router = useRouter();
  const { state, setTab } = useMetaxy();
  const pendingApprovals = state.approvals.filter((a) => a.status === "pending").length;

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <div className="size-3 bg-foreground" aria-hidden />
            <span className="text-sm font-bold uppercase tracking-tight">METAXY</span>
            <MonoLabel className="ml-1 text-muted-foreground">/ ZA</MonoLabel>
          </Link>
          <div className="flex items-center gap-3 border-l border-border pl-3">
            <div className="flex flex-col leading-tight">
              <MonoLabel className="text-muted-foreground">Business</MonoLabel>
              <span className="text-[11px] font-semibold">{business.name}</span>
            </div>
            <div className="flex flex-col border-l border-border pl-3 leading-tight">
              <MonoLabel className="text-muted-foreground">Stage</MonoLabel>
              <span className="text-[11px] font-semibold">Informal → Formal</span>
            </div>
            <div className="flex flex-col border-l border-border pl-3 leading-tight">
              <MonoLabel className="text-muted-foreground">Turnover 12m</MonoLabel>
              <span className="text-[11px] font-semibold">R{TURNOVER.last12.toLocaleString("en-ZA")}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingApprovals ? (
            <div className="flex items-center gap-2 rounded-sm border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-3 py-1 text-[var(--warning)]">
              <MonoLabel>{pendingApprovals} decision waiting</MonoLabel>
            </div>
          ) : null}
          {userEmail ? (
            <div className="flex items-center gap-2">
              <MonoLabel className="hidden text-muted-foreground sm:inline">{userEmail}</MonoLabel>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                title="Sign out"
                className="inline-flex cursor-pointer items-center gap-1 rounded-sm border border-border bg-secondary px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-secondary/70"
              >
                <LogOut className="size-3" /> Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-sm border border-border bg-secondary px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Demo · Sign in
            </Link>
          )}
          <div className="grid size-8 place-items-center rounded-full border border-border bg-secondary text-[10px] font-bold">
            {userEmail ? userEmail.slice(0, 2).toUpperCase() : "TD"}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-secondary/60">
          <div className="space-y-2 border-b border-border p-4">
            <MonoLabel className="text-muted-foreground">Contextual Memory</MonoLabel>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{business.owner}</span> runs a home bakery in <span className="font-medium text-foreground">{business.area}</span> on WhatsApp, after her 9-to-5.
            </p>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            <MonoLabel className="mb-2 block px-1 text-muted-foreground">Operational Modules</MonoLabel>
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = state.tab === t.id;
              const unseen = state.unseen[t.id] ?? 0;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded px-2 py-2 text-left text-xs transition-colors",
                    active ? "bg-foreground text-background" : "hover:bg-foreground/5",
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="flex-1 font-medium">{t.label}</span>
                  {unseen ? <span className="grid size-4 place-items-center rounded-full bg-accent font-mono text-[9px] font-bold text-accent-foreground">{unseen}</span> : <MonoLabel className={active ? "text-background/60" : "text-muted-foreground"}>{t.code}</MonoLabel>}
                </button>
              );
            })}
          </nav>
          <div className="space-y-1 border-t border-border p-3">
            <div className="flex items-center gap-2">
              <Building2 className="size-3 text-muted-foreground" />
              <MonoLabel className="text-muted-foreground">CIPC · SARS · linked</MonoLabel>
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card">
          {state.tab === "operations" ? <OperationsBoard /> : null}
          {state.tab === "whatsapp" ? <WhatsAppBoard /> : null}
          {state.tab === "compliance" ? <ComplianceBoard /> : null}
          {state.tab === "opportunities" ? <OpportunitiesBoard /> : null}
          {state.tab === "crm" ? <CrmBoard /> : null}
        </main>

        <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
          <WhatsAppPanel />
        </aside>
      </div>
    </div>
  );
}
