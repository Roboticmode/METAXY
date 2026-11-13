"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  Building2,
  Gauge,
  GraduationCap,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Radar,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { business, TURNOVER } from "@/lib/agent/data";
import type { Tab } from "@/lib/agent/types";
import { createClient } from "@/lib/supabase/client";
import { useMetaxy } from "@/lib/store";
import { ComplianceBoard } from "@/components/compliance-board";
import { CrmBoard, OpportunitiesBoard } from "@/components/other-boards";
import { OperationsBoard } from "@/components/operations-board";
import { WhatsAppBoard } from "@/components/whatsapp-board";
import { WhatsAppPanel } from "@/components/whatsapp-panel";
import { AgentDock } from "@/components/agent-console";
import { Badge, MonoLabel, cn } from "@/components/ui";
import { MetaxyMark } from "@/components/ui/metaxy-mark";
import { useColumns, useSheet } from "@/components/use-columns";

const tabs: { id: Tab; code: string; label: string; short: string; icon: typeof Gauge }[] = [
  { id: "operations", code: "M-01", label: "Operations", short: "Ops", icon: Gauge },
  { id: "whatsapp", code: "M-02", label: "WhatsApp", short: "WhatsApp", icon: MessageCircle },
  { id: "compliance", code: "M-03", label: "Compliance", short: "Comply", icon: ShieldCheck },
  { id: "opportunities", code: "M-04", label: "Opportunities", short: "Radar", icon: Radar },
  { id: "crm", code: "M-05", label: "CRM & Retention", short: "CRM", icon: Users },
];

/** Shared ids for aria-controls. The phone keeps its id inside the WhatsApp module. */
const ids = { leftNav: "left-nav", leftSheet: "left-sheet", phone: "phone-panel" };

const studioMemory = `${business.owner} balances a BSc IS degree with freelance clients in ${business.area}. CIPC, SARS, and the study calendar stay with the studio.`;

const motion = "duration-200 ease-out motion-reduce:transition-none";

export function Shell({ userEmail = null }: { userEmail?: string | null }) {
  const router = useRouter();
  const { state, setTab } = useMetaxy();

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }
  const cols = useColumns();
  const { bp, raw, leftOpen, rightOpen, agentOpen, agentWidth } = cols;
  const pendingApprovals = state.approvals.filter((a) => a.status === "pending").length;
  const sheetMode = bp === "tablet" || bp === "phone";

  // --- column actions: on small screens only one sheet is open at a time ---
  const setLeftOpen = (v: boolean) => {
    if (v && sheetMode) {
      cols.setRightOpen(false);
      cols.setAgentOpen(false);
    }
    cols.setLeftOpen(v);
  };
  const setRightOpen = (v: boolean) => {
    if (v && sheetMode) {
      cols.setLeftOpen(false);
      cols.setAgentOpen(false);
    }
    cols.setRightOpen(v);
  };
  const toggleLeft = () => setLeftOpen(!leftOpen);
  const toggleRight = () => setRightOpen(!rightOpen);
  const setAgentOpen = (v: boolean) => {
    if (v && sheetMode) {
      cols.setLeftOpen(false);
      cols.setRightOpen(false);
    }
    cols.setAgentOpen(v);
  };

  const goTab = (t: Tab) => {
    setTab(t);
    if (sheetMode) {
      cols.setLeftOpen(false);
      cols.setRightOpen(false);
    }
  };

  // --- keyboard: [ toggles the left column, ] the right ---
  const toggles = useRef({ toggleLeft, toggleRight });
  useEffect(() => {
    toggles.current = { toggleLeft, toggleRight };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "[") {
        e.preventDefault();
        toggles.current.toggleLeft();
      } else if (e.key === "]") {
        e.preventDefault();
        toggles.current.toggleRight();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // --- opening a chat from the inbox brings the phone panel into view ---
  const lastChat = useRef(state.activeChat);
  useEffect(() => {
    if (lastChat.current === state.activeChat) return;
    lastChat.current = state.activeChat;
    if (!rightOpen) setRightOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeChat]);

  // --- unread count for the Chat button / slim tab while the phone panel is hidden ---
  const lastMsgId = state.messages.length ? state.messages[state.messages.length - 1].id : 0;
  const [seenId, setSeenId] = useState(lastMsgId);
  useEffect(() => {
    if (rightOpen) setSeenId(lastMsgId);
  }, [rightOpen, lastMsgId]);
  const chatUnread = rightOpen ? 0 : state.messages.filter((m) => m.id > seenId && (m.from === "customer" || m.from === "agent")).length;
  const chatHasNews = chatUnread > 0;

  // --- modal sheets: tablet overlay sidebar, phone menu, chat sheet ---
  const leftOverlayRef = useRef<HTMLElement>(null);
  const leftSheetRef = useRef<HTMLElement>(null);
  const rightRef = useRef<HTMLElement>(null);
  useSheet(leftOverlayRef, bp === "tablet" && leftOpen, () => cols.setLeftOpen(false));
  useSheet(leftSheetRef, bp === "phone" && leftOpen, () => cols.setLeftOpen(false));
  useSheet(rightRef, sheetMode && rightOpen, () => cols.setRightOpen(false));

  // Label visibility inside the md+ sidebar: shown when expanded (desktop default), hidden on the rail.
  const labelCls = raw.left === true ? "" : raw.left === false ? "hidden" : "max-xl:hidden";
  const railOnlyCls = raw.left === true ? "hidden" : raw.left === false ? "" : "xl:hidden";
  const headerJustify = raw.left === true ? "justify-between" : raw.left === false ? "justify-center" : "justify-center xl:justify-between";
  const footerJustify = raw.left === true ? "justify-start" : raw.left === false ? "justify-center" : "justify-center xl:justify-start";
  const anySheetOpen = sheetMode && (leftOpen || rightOpen || agentOpen);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* ───────────── Header ───────────── */}
      <header className="relative z-20 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-2 md:px-4">
        <div className="flex min-w-0 items-center gap-2 md:gap-4">
          <IconButton
            className="md:hidden"
            label={leftOpen ? "Close menu" : "Open menu"}
            aria-expanded={bp === "phone" ? leftOpen : false}
            aria-controls={ids.leftSheet}
            onClick={toggleLeft}
          >
            <Menu className="size-4" />
          </IconButton>
          <Link href="/" className="flex shrink-0 items-center gap-2.5 hover:opacity-80">
            <MetaxyMark size={22} tone="light" />
            <span className="text-xs font-bold uppercase tracking-[0.22em]">METAXY</span>
          </Link>
        </div>
        <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 md:flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-[11px]">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            <span className="font-medium">{business.name}</span>
            <span className="text-muted-foreground">live demo</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          {state.examMode ? (
            <span className="hidden lg:inline-flex">
              <Badge tone="warn">Exam Mode ON</Badge>
            </span>
          ) : null}
          {pendingApprovals ? (
            <button
              onClick={() => goTab("operations")}
              className="flex h-8 cursor-pointer items-center rounded-sm border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-2 text-[var(--warning)] transition-colors hover:bg-[var(--warning)]/20 pointer-coarse:h-10 md:px-3"
            >
              <MonoLabel>
                {pendingApprovals} decision{pendingApprovals === 1 ? "" : "s"}
                <span className="hidden sm:inline"> waiting</span>
              </MonoLabel>
            </button>
          ) : null}
          <button
            onClick={toggleRight}
            aria-expanded={rightOpen}
            aria-controls={ids.phone}
            aria-label={chatHasNews ? `Chat, ${chatUnread} new` : "Chat"}
            className="relative flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border border-border px-2 text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-secondary pointer-coarse:h-10 pointer-coarse:min-w-10 pointer-coarse:justify-center xl:hidden"
          >
            <MessageCircle className="size-4 text-[#128C4B]" />
            <span className="hidden sm:inline">Chat</span>
            {chatHasNews ? <CountBadge n={chatUnread} className="absolute -top-1.5 -right-1.5 bg-[#25D366] text-white" /> : null}
          </button>
          <button
            type="button"
            onClick={() => setAgentOpen(!agentOpen)}
            aria-expanded={agentOpen}
            aria-controls="agent-dock"
            className="relative flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border border-border px-2 text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-secondary pointer-coarse:h-10 xl:hidden"
          >
            <Bot className="size-4" />
            <span className="hidden sm:inline">Agents</span>
          </button>
          {/* ≥1280: email + Sign out inline (as upstream). Below that they live in the avatar menu (and the phone menu sheet). */}
          <div className="hidden items-center gap-2 xl:flex">
            <AccountActions userEmail={userEmail} onSignOut={handleSignOut} inline />
          </div>
          <AccountMenu userEmail={userEmail} examMode={state.examMode} onSignOut={handleSignOut} />
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* ───────────── Left: sidebar / icon rail (md+) ───────────── */}
        <div className={cn("relative hidden shrink-0 transition-[width] md:block", motion, raw.left === false ? "md:w-14" : "md:w-14 xl:w-56")}>
          <aside
            id={ids.leftNav}
            ref={leftOverlayRef}
            role={bp === "tablet" && leftOpen ? "dialog" : undefined}
            aria-modal={bp === "tablet" && leftOpen ? true : undefined}
            aria-label="Navigation"
            className={cn(
              "absolute inset-y-0 left-0 flex flex-col overflow-hidden border-r border-border bg-secondary transition-[width,box-shadow] max-xl:z-40",
              motion,
              raw.left === true ? "w-56" : raw.left === false ? "w-14" : "w-14 xl:w-56",
              raw.left === true && "max-xl:shadow-2xl",
            )}
          >
            <div className={cn("flex h-11 shrink-0 items-center border-b border-border px-2.5", headerJustify)}>
              <MonoLabel className={cn("truncate pl-1 text-muted-foreground", labelCls)}>Operational Modules</MonoLabel>
              <IconButton label={leftOpen ? "Collapse sidebar ( [ )" : "Expand sidebar ( [ )"} aria-expanded={leftOpen} aria-controls={ids.leftNav} onClick={toggleLeft}>
                {leftOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
              </IconButton>
            </div>
            <div className={cn("space-y-2 border-b border-border p-4", labelCls)}>
              <MonoLabel className="text-muted-foreground">Contextual Memory</MonoLabel>
              <ContextBlurb />
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-2" aria-label="Modules">
              {tabs.map((t) => (
                <NavButton key={t.id} tab={t} active={state.tab === t.id} unseen={state.unseen[t.id] ?? 0} onClick={() => goTab(t.id)} labelCls={labelCls} railOnlyCls={railOnlyCls} />
              ))}
            </nav>
            <div className={cn("flex items-center gap-2 border-t border-border p-3", footerJustify)} title="CIPC · SARS · Study calendar">
              <Building2 className="size-3 shrink-0 text-muted-foreground" />
              <MonoLabel className={cn("truncate text-muted-foreground", labelCls)}>CIPC · SARS · Study calendar</MonoLabel>
            </div>
          </aside>
        </div>

        {/* ───────────── Main board ───────────── */}
        <main id="main-board" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card">
          {state.tab === "operations" ? <OperationsBoard /> : null}
          {state.tab === "whatsapp" ? <WhatsAppBoard /> : null}
          {state.tab === "compliance" ? <ComplianceBoard /> : null}
          {state.tab === "opportunities" ? <OpportunitiesBoard /> : null}
          {state.tab === "crm" ? <CrmBoard /> : null}
        </main>

        {/* ───────────── Right: WhatsApp phone panel ───────────── */}
        <aside
          id={ids.phone}
          ref={rightRef}
          role={sheetMode && rightOpen ? "dialog" : undefined}
          aria-modal={sheetMode && rightOpen ? true : undefined}
          aria-label="WhatsApp chat"
          inert={sheetMode && !rightOpen ? true : undefined}
          className={cn(
            "flex flex-col bg-card",
            // sheet (< 1280): full screen on phones, a 24rem sheet on tablets
            "fixed inset-y-0 right-0 z-40 w-full shadow-2xl transition-[translate] md:w-[24rem] md:border-l md:border-border",
            raw.right === true ? "translate-x-0" : "translate-x-full",
            // in the flow (≥ 1280)
            "xl:relative xl:inset-auto xl:z-auto xl:shrink-0 xl:translate-x-0 xl:border-l xl:border-border xl:shadow-none xl:transition-[width]",
            raw.right === false ? "xl:w-10" : "xl:w-80",
            motion,
          )}
        >
          {/* slim tab (desktop, collapsed) */}
          <button
            onClick={toggleRight}
            aria-expanded={false}
            aria-controls={ids.phone}
            aria-label={chatHasNews ? `Expand chat ( ] ), ${chatUnread} new` : "Expand chat ( ] )"}
            title="Expand chat ( ] )"
            className={cn("h-full w-10 cursor-pointer flex-col items-center gap-3 py-3 transition-colors hover:bg-secondary", raw.right === false ? "hidden xl:flex" : "hidden")}
          >
            <PanelRightOpen className="size-4 text-muted-foreground" />
            <span className="relative">
              <MessageCircle className="size-4 text-[#128C4B]" />
              {chatHasNews ? <CountBadge n={chatUnread} className="absolute -top-2 -right-2.5 bg-[#25D366] text-white" /> : null}
            </span>
            <MonoLabel className="text-muted-foreground [writing-mode:vertical-rl]">WhatsApp · live</MonoLabel>
          </button>
          <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col pt-[env(safe-area-inset-top)] xl:pt-0", raw.right === false && "xl:hidden")}>
            <WhatsAppPanel
              headerAction={
                <IconButton label={sheetMode ? "Close chat" : "Collapse chat ( ] )"} aria-expanded={rightOpen} aria-controls={ids.phone} onClick={() => setRightOpen(false)}>
                  <X className="size-4 xl:hidden" />
                  <PanelRightClose className="hidden size-4 xl:block" />
                </IconButton>
              }
            />
          </div>
        </aside>

        <AgentDock open={agentOpen} sheet={sheetMode} width={agentWidth} onOpenChange={setAgentOpen} onWidth={cols.setAgentWidth} />
      </div>

      {/* ───────────── Phone: bottom tab bar ───────────── */}
      <nav className="relative z-20 grid shrink-0 grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Modules">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = state.tab === t.id;
          const unseen = state.unseen[t.id] ?? 0;
          return (
            <button
              key={t.id}
              onClick={() => goTab(t.id)}
              aria-current={active ? "page" : undefined}
              aria-label={unseen ? `${t.label}, ${unseen} new` : t.label}
              className={cn("relative flex h-14 cursor-pointer flex-col items-center justify-center gap-1 transition-colors", active ? "text-foreground" : "text-muted-foreground")}
            >
              <span className="relative">
                <Icon className="size-5" />
                {unseen ? <CountBadge n={unseen} className="absolute -top-1.5 -right-2.5 bg-accent text-accent-foreground" /> : null}
              </span>
              <MonoLabel className={cn(active && "font-bold")}>{t.short}</MonoLabel>
              <span className={cn("absolute top-0 h-0.5 w-8", active ? "bg-foreground" : "bg-transparent")} aria-hidden />
            </button>
          );
        })}
      </nav>

      {/* ───────────── Phone: menu sheet ───────────── */}
      <aside
        id={ids.leftSheet}
        ref={leftSheetRef}
        role={bp === "phone" && leftOpen ? "dialog" : undefined}
        aria-modal={bp === "phone" && leftOpen ? true : undefined}
        aria-label="Menu"
        inert={bp === "phone" && leftOpen ? undefined : true}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col bg-secondary pt-[env(safe-area-inset-top)] shadow-2xl transition-[translate] md:hidden",
          motion,
          raw.left === true ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <MetaxyMark size={22} tone="light" />
            <span className="text-sm font-bold uppercase tracking-tight">METAXY</span>
          </Link>
          <IconButton label="Close menu" aria-expanded={leftOpen} aria-controls={ids.leftSheet} onClick={() => cols.setLeftOpen(false)}>
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2 border-b border-border p-4">
            <MonoLabel className="text-muted-foreground">Account</MonoLabel>
            {state.examMode ? (
              <div>
                <Badge tone="warn">Exam Mode ON</Badge>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <AccountActions userEmail={userEmail} onSignOut={handleSignOut} />
            </div>
          </div>
          <BusinessStrip stacked className="border-b border-border p-4" />
          <div className="space-y-2 border-b border-border p-4">
            <MonoLabel className="text-muted-foreground">Contextual Memory</MonoLabel>
            <ContextBlurb />
          </div>
          <nav className="space-y-1 p-3" aria-label="Modules">
            <MonoLabel className="mb-2 block px-1 text-muted-foreground">Operational Modules</MonoLabel>
            {tabs.map((t) => (
              <NavButton key={t.id} tab={t} active={state.tab === t.id} unseen={state.unseen[t.id] ?? 0} onClick={() => goTab(t.id)} labelCls="" railOnlyCls="hidden" />
            ))}
          </nav>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <Building2 className="size-3 text-muted-foreground" />
            <MonoLabel className="text-muted-foreground">CIPC · SARS · Study calendar</MonoLabel>
          </div>
        </div>
      </aside>

      {/* Backdrop for any open sheet (below the sheets' z-40, above the header) */}
      <div
        aria-hidden
        onClick={() => {
          cols.setLeftOpen(false);
          cols.setRightOpen(false);
          cols.setAgentOpen(false);
        }}
        className={cn("fixed inset-0 z-30 bg-foreground/25 transition-opacity xl:hidden", motion, anySheetOpen ? "opacity-100" : "pointer-events-none opacity-0")}
      />
    </div>
  );
}

function ContextBlurb() {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground">{business.owner}</span> balances 5 <span className="font-medium text-foreground">BSc IS</span> modules with freelance design &amp; web clients in{" "}
      <span className="font-medium text-foreground">{business.area}</span>.
      <span className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-accent">
        <GraduationCap className="size-3 shrink-0" /> Client Desk · Books · Planner
      </span>
    </p>
  );
}

/** Signed-in email + Sign out, or "Demo · Sign in" when there is no session. */
function AccountActions({ userEmail, onSignOut, inline = false }: { userEmail: string | null; onSignOut: () => Promise<void>; inline?: boolean }) {
  const btn =
    "inline-flex h-7 cursor-pointer items-center gap-1 rounded-sm border border-border bg-secondary px-2 font-mono text-[10px] font-bold uppercase tracking-wider pointer-coarse:h-10 pointer-coarse:px-3";
  if (!userEmail) {
    return (
      <Link href="/" className={cn(btn, "text-muted-foreground hover:text-foreground")}>
        <LogIn className="size-3" /> Demo · Sign in
      </Link>
    );
  }
  return (
    <>
      <MonoLabel className={cn("min-w-0 truncate text-muted-foreground", inline ? "max-w-48" : "w-full")} >
        <span title={userEmail}>{userEmail}</span>
      </MonoLabel>
      <button type="button" onClick={() => void onSignOut()} title="Sign out" className={cn(btn, "text-foreground hover:bg-secondary/70")}>
        <LogOut className="size-3" /> Sign out
      </button>
    </>
  );
}

/** Avatar. Below 1280 px it opens a small menu with the email and Sign out, so they fit the collapsed header. */
function AccountMenu({ userEmail, examMode, onSignOut }: { userEmail: string | null; examMode: boolean; onSignOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "NK";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const avatar = "grid size-8 shrink-0 place-items-center rounded-full border border-border bg-secondary text-[10px] font-bold";
  return (
    <div ref={ref} className="relative">
      <div className={cn(avatar, "hidden xl:grid")} title={userEmail ?? "Demo mode"}>
        {initials}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label={userEmail ? `Account: ${userEmail}` : "Account (demo mode)"}
        className={cn(avatar, "relative cursor-pointer hover:bg-foreground/5 pointer-coarse:size-10 xl:hidden")}
      >
        {initials}
        {examMode ? <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-[var(--warning)] ring-2 ring-card" aria-hidden /> : null}
      </button>
      {open ? (
        <div id="account-menu" className="absolute top-full right-0 z-40 mt-1.5 w-64 max-w-[calc(100vw-1rem)] space-y-2 rounded border border-border bg-card p-3 shadow-lg xl:hidden">
          <MonoLabel className="block text-muted-foreground">{userEmail ? "Signed in" : "Demo mode"}</MonoLabel>
          {examMode ? <Badge tone="warn">Exam Mode ON</Badge> : null}
          <div className="flex flex-wrap items-center gap-2">
            <AccountActions userEmail={userEmail} onSignOut={onSignOut} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Studio / mode / turnover. A row in the md+ header; a 2-column grid inside the phone menu sheet. */
function BusinessStrip({ className, stacked = false }: { className?: string; stacked?: boolean }) {
  const divider = stacked ? "" : "border-l border-border pl-3";
  return (
    <div className={cn(stacked ? "grid grid-cols-2 gap-3" : "items-center gap-3", className)}>
      <div className={cn("flex min-w-0 flex-col leading-tight", stacked && "col-span-2")}>
        <MonoLabel className="text-muted-foreground">Studio</MonoLabel>
        <span className="truncate text-[11px] font-semibold">{business.name}</span>
      </div>
      <div className={cn("flex flex-col leading-tight", divider, !stacked && "max-lg:hidden")}>
        <MonoLabel className="text-muted-foreground">Mode</MonoLabel>
        <span className="whitespace-nowrap text-[11px] font-semibold">BSc IS · 8–10 hrs/wk</span>
      </div>
      <div className={cn("flex flex-col leading-tight", divider)}>
        <MonoLabel className="whitespace-nowrap text-muted-foreground">Turnover 12m</MonoLabel>
        <span className="text-[11px] font-semibold">R{TURNOVER.last12.toLocaleString("en-ZA")}</span>
      </div>
    </div>
  );
}

function NavButton({ tab, active, unseen, onClick, labelCls, railOnlyCls }: { tab: (typeof tabs)[number]; active: boolean; unseen: number; onClick: () => void; labelCls: string; railOnlyCls: string }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      title={tab.label}
      aria-current={active ? "page" : undefined}
      aria-label={unseen ? `${tab.label}, ${unseen} new` : tab.label}
      className={cn(
        "relative flex h-9 w-full cursor-pointer items-center gap-2 rounded px-2.5 text-left text-xs transition-colors pointer-coarse:h-11",
        active ? "bg-foreground text-background" : "hover:bg-foreground/5",
      )}
    >
      <span className="relative shrink-0">
        <Icon className="size-4" />
        {unseen ? <span className={cn("absolute -top-1 -right-1 size-2 rounded-full bg-accent ring-2 ring-secondary", railOnlyCls)} aria-hidden /> : null}
      </span>
      <span className={cn("flex-1 truncate font-medium", labelCls)}>{tab.label}</span>
      <span className={cn("shrink-0", labelCls)}>
        {unseen ? <CountBadge n={unseen} className="bg-accent text-accent-foreground" /> : <MonoLabel className={active ? "text-background/60" : "text-muted-foreground"}>{tab.code}</MonoLabel>}
      </span>
    </button>
  );
}

function CountBadge({ n, className }: { n: number; className?: string }) {
  return <span className={cn("grid h-4 min-w-4 place-items-center rounded-full px-1 font-mono text-[9px] leading-none font-bold", className)}>{n > 9 ? "9+" : n}</span>;
}

function IconButton({ label, children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn("grid size-8 shrink-0 cursor-pointer place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground pointer-coarse:size-10", className)}
      {...props}
    >
      {children}
    </button>
  );
}
