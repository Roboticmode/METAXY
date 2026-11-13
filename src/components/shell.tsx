"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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
import { WhatsAppPanel } from "@/components/whatsapp-panel";
import { WhatsAppBoard } from "@/components/whatsapp-board";
import { Badge, MonoLabel, cn } from "@/components/ui";
import { useColumns, useSheet } from "@/components/use-columns";

const tabs: { id: Tab; code: string; label: string; short: string; icon: typeof Gauge }[] = [
  { id: "operations", code: "M-01", label: "Operations", short: "Ops", icon: Gauge },
  { id: "whatsapp", code: "M-02", label: "WhatsApp", short: "WhatsApp", icon: MessageCircle },
  { id: "compliance", code: "M-03", label: "Compliance", short: "Comply", icon: ShieldCheck },
  { id: "opportunities", code: "M-04", label: "Opportunities", short: "Radar", icon: Radar },
  { id: "crm", code: "M-05", label: "CRM & Retention", short: "CRM", icon: Users },
];

/** Shared ids for aria-controls. */
const ids = { leftNav: "left-nav", leftSheet: "left-sheet", phone: "phone-panel" };

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
  const { bp, raw, leftOpen, rightOpen } = cols;
  const pendingApprovals = state.approvals.filter((a) => a.status === "pending").length;
  const sheetMode = bp === "tablet" || bp === "phone";

  // --- column actions: on small screens only one sheet is open at a time ---
  const setLeftOpen = (v: boolean) => {
    if (v && sheetMode) cols.setRightOpen(false);
    cols.setLeftOpen(v);
  };
  const setRightOpen = (v: boolean) => {
    if (v && sheetMode) cols.setLeftOpen(false);
    cols.setRightOpen(v);
  };
  const toggleLeft = () => setLeftOpen(!leftOpen);
  const toggleRight = () => setRightOpen(!rightOpen);

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
  const anySheetOpen = sheetMode && (leftOpen || rightOpen);

  return (
    <div className="metaxy-app flex h-dvh flex-col overflow-hidden bg-paper text-foreground" data-phone={rightOpen ? "open" : "closed"}>
      {/* ───────────── Header ───────────── */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-hairline bg-paper px-2 md:px-5">
        <div className="flex min-w-0 items-center gap-2 md:gap-5">
          <IconButton
            className="md:hidden"
            label={leftOpen ? "Close menu" : "Open menu"}
            aria-expanded={bp === "phone" ? leftOpen : false}
            aria-controls={ids.leftSheet}
            onClick={toggleLeft}
          >
            <Menu className="size-5" />
          </IconButton>
          <Logo />
          <BusinessStrip className="hidden min-w-0 border-l border-hairline pl-5 md:flex" />
        </div>
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          {state.examMode ? (
            <span className="hidden lg:inline-flex">
              <Badge tone="warn">Exam mode on</Badge>
            </span>
          ) : null}
          {pendingApprovals ? (
            <button
              onClick={() => goTab("operations")}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-full bg-ink pr-3.5 pl-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-ink-3 pointer-coarse:h-10"
            >
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold text-ink">{pendingApprovals}</span>
              <span>
                <span className="max-sm:sr-only">decision{pendingApprovals === 1 ? "" : "s"} </span>waiting
              </span>
            </button>
          ) : null}
          <button
            onClick={toggleRight}
            aria-expanded={rightOpen}
            aria-controls={ids.phone}
            aria-label={chatHasNews ? `Chat, ${chatUnread} new` : "Chat"}
            className="relative flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-hairline bg-card px-3 text-[13px] font-medium transition-colors hover:border-ink/25 pointer-coarse:h-10 pointer-coarse:min-w-10 pointer-coarse:justify-center xl:hidden"
          >
            <MessageCircle className="size-4 text-[#128C4B]" />
            <span className="hidden sm:inline">Chat</span>
            {chatHasNews ? <CountBadge n={chatUnread} className="absolute -top-1.5 -right-1.5 bg-[#25D366] text-ink" /> : null}
          </button>
          {/* ≥1280: email + Sign out inline (as upstream). Below that they live in the avatar menu (and the phone menu sheet). */}
          <div className="hidden items-center gap-2 xl:flex">
            <AccountActions userEmail={userEmail} onSignOut={handleSignOut} inline />
          </div>
          <AccountMenu userEmail={userEmail} examMode={state.examMode} onSignOut={handleSignOut} />
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* ───────────── Left: sidebar / icon rail (md+) — the ink band ───────────── */}
        <div className={cn("relative hidden shrink-0 transition-[width] md:block", motion, raw.left === false ? "md:w-16" : "md:w-16 xl:w-60")}>
          <aside
            id={ids.leftNav}
            ref={leftOverlayRef}
            role={bp === "tablet" && leftOpen ? "dialog" : undefined}
            aria-modal={bp === "tablet" && leftOpen ? true : undefined}
            aria-label="Navigation"
            className={cn(
              "metaxy-ink metaxy-grain absolute inset-y-0 left-0 flex flex-col overflow-hidden bg-ink text-paper transition-[width,box-shadow] max-xl:z-40",
              motion,
              raw.left === true ? "w-60" : raw.left === false ? "w-16" : "w-16 xl:w-60",
              raw.left === true && "max-xl:shadow-2xl",
            )}
          >
            <div className={cn("flex h-14 shrink-0 items-center px-3", headerJustify)}>
              <MonoLabel className={cn("truncate pl-1.5 text-paper/60", labelCls)}>Modules</MonoLabel>
              <IconButton ink label={leftOpen ? "Collapse sidebar ( [ )" : "Expand sidebar ( [ )"} aria-expanded={leftOpen} aria-controls={ids.leftNav} onClick={toggleLeft}>
                {leftOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
              </IconButton>
            </div>
            <nav className="space-y-1 overflow-x-hidden px-3" aria-label="Modules">
              {tabs.map((t) => (
                <NavButton key={t.id} tab={t} active={state.tab === t.id} unseen={state.unseen[t.id] ?? 0} onClick={() => goTab(t.id)} labelCls={labelCls} railOnlyCls={railOnlyCls} />
              ))}
            </nav>
            <div className="flex-1" />
            <div className={cn("mx-3 mb-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4", labelCls)}>
              <MonoLabel className="text-paper/60">Contextual memory</MonoLabel>
              <ContextBlurb ink />
            </div>
            <div className={cn("flex items-center gap-2 border-t border-white/10 px-4 py-3", footerJustify)} title="CIPC · SARS · Study calendar">
              <Building2 className="size-3.5 shrink-0 text-paper/60" />
              <span className={cn("truncate text-[12px] text-paper/70", labelCls)}>CIPC · SARS · Study calendar</span>
            </div>
          </aside>
        </div>

        {/* ───────────── Main board ───────────── */}
        <main id="main-board" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-paper">
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
            "fixed inset-y-0 right-0 z-40 w-full shadow-2xl transition-[translate] md:w-[24rem] md:border-l md:border-hairline",
            raw.right === true ? "translate-x-0" : "translate-x-full",
            // in the flow (≥ 1280): a device card resting on the paper
            "xl:relative xl:inset-auto xl:z-auto xl:shrink-0 xl:translate-x-0 xl:border-l-0 xl:bg-paper xl:py-4 xl:pr-4 xl:shadow-none xl:transition-[width]",
            raw.right === false ? "xl:w-14" : "xl:w-[23rem]",
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
            className={cn(
              "h-full w-10 cursor-pointer flex-col items-center gap-3 rounded-2xl border border-hairline bg-card py-3 shadow-soft transition-colors hover:border-ink/25",
              raw.right === false ? "hidden xl:flex" : "hidden",
            )}
          >
            <PanelRightOpen className="size-4 text-muted-foreground" />
            <span className="relative">
              <MessageCircle className="size-4 text-[#128C4B]" />
              {chatHasNews ? <CountBadge n={chatUnread} className="absolute -top-2 -right-2.5 bg-[#25D366] text-ink" /> : null}
            </span>
            <span className="text-[12px] text-muted-foreground [writing-mode:vertical-rl]">WhatsApp · live</span>
          </button>
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col bg-card pt-[env(safe-area-inset-top)] xl:overflow-hidden xl:rounded-[1.75rem] xl:border xl:border-hairline xl:pt-0 xl:shadow-lift",
              raw.right === false && "xl:hidden",
            )}
          >
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
      </div>

      {/* ───────────── Phone: bottom tab bar ───────────── */}
      <nav className="metaxy-ink relative z-20 grid shrink-0 grid-cols-5 bg-ink pb-[env(safe-area-inset-bottom)] text-paper md:hidden" aria-label="Modules">
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
              className={cn("relative flex h-14 cursor-pointer flex-col items-center justify-center gap-1 transition-colors", active ? "text-paper" : "text-paper/60")}
            >
              <span className="relative">
                <Icon className="size-5" />
                {unseen ? <CountBadge n={unseen} className="absolute -top-1.5 -right-2.5 bg-accent text-ink" /> : null}
              </span>
              <span className={cn("text-[11px]", active && "font-semibold")}>{t.short}</span>
              <span className={cn("absolute top-0 h-0.5 w-8 rounded-full", active ? "bg-accent" : "bg-transparent")} aria-hidden />
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
          "metaxy-ink metaxy-grain fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col bg-ink pt-[env(safe-area-inset-top)] text-paper shadow-2xl transition-[translate] md:hidden",
          motion,
          raw.left === true ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <Logo ink />
          <IconButton ink label="Close menu" aria-expanded={leftOpen} aria-controls={ids.leftSheet} onClick={() => cols.setLeftOpen(false)}>
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="metaxy-scroll flex-1 overflow-y-auto">
          <nav className="space-y-1 p-3" aria-label="Modules">
            <MonoLabel className="mb-2 block px-2 text-paper/60">Modules</MonoLabel>
            {tabs.map((t) => (
              <NavButton key={t.id} tab={t} active={state.tab === t.id} unseen={state.unseen[t.id] ?? 0} onClick={() => goTab(t.id)} labelCls="" railOnlyCls="hidden" />
            ))}
          </nav>
          <BusinessStrip stacked ink className="border-t border-white/10 p-5" />
          <div className="space-y-2 border-t border-white/10 p-5">
            <MonoLabel className="text-paper/60">Contextual memory</MonoLabel>
            <ContextBlurb ink />
          </div>
          <div className="space-y-3 border-t border-white/10 p-5">
            <MonoLabel className="text-paper/60">Account</MonoLabel>
            {state.examMode ? (
              <div>
                <Badge tone="warn">Exam mode on</Badge>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <AccountActions userEmail={userEmail} onSignOut={handleSignOut} ink />
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 px-5 py-4">
            <Building2 className="size-3.5 text-paper/60" />
            <span className="text-[12px] text-paper/70">CIPC · SARS · Study calendar</span>
          </div>
        </div>
      </aside>

      {/* Backdrop for any open sheet (below the sheets' z-40, above the header) */}
      <div
        aria-hidden
        onClick={() => {
          cols.setLeftOpen(false);
          cols.setRightOpen(false);
        }}
        className={cn("fixed inset-0 z-30 bg-ink/35 transition-opacity xl:hidden", motion, anySheetOpen ? "opacity-100" : "pointer-events-none opacity-0")}
      />
    </div>
  );
}

/** Same mark as the landing nav: a square and the spaced wordmark. */
function Logo({ ink = false }: { ink?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 rounded-full transition-opacity hover:opacity-75">
      <span aria-hidden className={cn("size-2.5", ink ? "bg-paper" : "bg-ink")} />
      <span className="text-xs font-bold tracking-[0.25em] uppercase">METAXY</span>
    </Link>
  );
}

function ContextBlurb({ ink = false }: { ink?: boolean }) {
  const strong = ink ? "font-medium text-paper" : "font-medium text-foreground";
  return (
    <p className={cn("mt-2 text-[13px] leading-relaxed", ink ? "text-paper/70" : "text-muted-foreground")}>
      <span className={strong}>{business.owner}</span> balances 5 <span className={strong}>BSc IS</span> modules with freelance design &amp; web clients in{" "}
      <span className={strong}>{business.area}</span>.
      <span className={cn("mt-3 flex items-center gap-1.5 text-[12px]", ink ? "text-accent" : "text-accent-ink")}>
        <GraduationCap className="size-3.5 shrink-0" /> Client Desk · Books · Planner
      </span>
    </p>
  );
}

/** Signed-in email + Sign out, or "Demo · Sign in" when there is no session. */
function AccountActions({ userEmail, onSignOut, inline = false, ink = false }: { userEmail: string | null; onSignOut: () => Promise<void>; inline?: boolean; ink?: boolean }) {
  const btn = cn(
    "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors pointer-coarse:h-10",
    ink ? "border-white/15 text-paper hover:border-white/35 hover:bg-white/5" : "border-hairline bg-card text-foreground hover:border-ink/25",
  );
  if (!userEmail) {
    return (
      <Link href="/" className={btn}>
        <LogIn className="size-3.5" /> Demo · Sign in
      </Link>
    );
  }
  return (
    <>
      <span className={cn("min-w-0 truncate text-[13px]", ink ? "text-paper/70" : "text-muted-foreground", inline ? "max-w-48" : "w-full")}>
        <span title={userEmail}>{userEmail}</span>
      </span>
      <button type="button" onClick={() => void onSignOut()} title="Sign out" className={btn}>
        <LogOut className="size-3.5" /> Sign out
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

  const avatar = "grid size-9 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-semibold text-paper";
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
        className={cn(avatar, "relative cursor-pointer hover:bg-ink-3 pointer-coarse:size-10 xl:hidden")}
      >
        {initials}
        {examMode ? <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-[var(--warning)] ring-2 ring-paper" aria-hidden /> : null}
      </button>
      {open ? (
        <div id="account-menu" className="absolute top-full right-0 z-40 mt-2 w-64 max-w-[calc(100vw-1rem)] space-y-3 rounded-2xl border border-hairline bg-card p-4 shadow-lift xl:hidden">
          <MonoLabel className="block text-muted-foreground">{userEmail ? "Signed in" : "Demo mode"}</MonoLabel>
          {examMode ? <Badge tone="warn">Exam mode on</Badge> : null}
          <div className="flex flex-wrap items-center gap-2">
            <AccountActions userEmail={userEmail} onSignOut={onSignOut} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Studio / mode / turnover. A row in the md+ header; a 2-column grid inside the phone menu sheet. */
function BusinessStrip({ className, stacked = false, ink = false }: { className?: string; stacked?: boolean; ink?: boolean }) {
  const divider = stacked ? "" : "border-l border-hairline pl-5";
  const label = ink ? "text-paper/60" : "text-muted-foreground";
  const value = "text-[13.5px] font-medium tracking-[-0.01em]";
  return (
    <div className={cn(stacked ? "grid grid-cols-2 gap-4" : "items-center gap-5", className)}>
      <div className={cn("flex min-w-0 flex-col gap-0.5 leading-tight", stacked && "col-span-2")}>
        <MonoLabel className={cn("text-[10.5px]", label)}>Studio</MonoLabel>
        <span className={cn("truncate", value)}>{business.name}</span>
      </div>
      <div className={cn("flex flex-col gap-0.5 leading-tight", divider, !stacked && "max-lg:hidden")}>
        <MonoLabel className={cn("text-[10.5px]", label)}>Mode</MonoLabel>
        <span className={cn("whitespace-nowrap", value)}>BSc IS · 8–10 hrs/wk</span>
      </div>
      <div className={cn("flex flex-col gap-0.5 leading-tight", divider)}>
        <MonoLabel className={cn("whitespace-nowrap text-[10.5px]", label)}>Turnover 12m</MonoLabel>
        <span className={value}>R{TURNOVER.last12.toLocaleString("en-ZA")}</span>
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
        "relative flex h-10 w-full cursor-pointer items-center gap-3 rounded-full px-3 text-left text-[14px] transition-colors pointer-coarse:h-11",
        active ? "bg-paper text-ink" : "text-paper/75 hover:bg-white/[0.06] hover:text-paper",
      )}
    >
      <span className="relative shrink-0">
        <Icon className="size-4" />
        {unseen ? <span className={cn("absolute -top-1 -right-1 size-2 rounded-full bg-accent ring-2 ring-ink", railOnlyCls)} aria-hidden /> : null}
      </span>
      <span className={cn("flex-1 truncate font-medium", labelCls)}>{tab.label}</span>
      <span className={cn("shrink-0", labelCls)}>
        {unseen ? (
          <CountBadge n={unseen} className="bg-accent text-ink" />
        ) : (
          <span className={cn("font-mono text-[10.5px] tracking-[0.08em]", active ? "text-ink/55" : "text-paper/45")}>{tab.code}</span>
        )}
      </span>
    </button>
  );
}

function CountBadge({ n, className }: { n: number; className?: string }) {
  return <span className={cn("grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[11px] leading-none font-semibold", className)}>{n > 9 ? "9+" : n}</span>;
}

function IconButton({ label, children, className, ink = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode; ink?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full transition-colors pointer-coarse:size-10",
        ink ? "text-paper/70 hover:bg-white/[0.08] hover:text-paper" : "text-muted-foreground hover:bg-ink/5 hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
