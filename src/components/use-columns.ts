"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

/**
 * Layout breakpoints for the command centre (match Tailwind's `md` and `xl`).
 *  - desktop ≥ 1280: sidebar ⇄ 56 px icon rail, phone panel ⇄ slim tab (both in the flow)
 *  - tablet 768–1279: icon rail with an overlay sidebar, phone panel as a right sheet
 *  - phone  < 768:   left sheet + bottom tab bar, phone panel as a full-screen sheet
 */
export type Breakpoint = "phone" | "tablet" | "desktop";

const queries = { desktop: "(min-width: 1280px)", tablet: "(min-width: 768px)" };

function readBreakpoint(): Breakpoint {
  if (window.matchMedia(queries.desktop).matches) return "desktop";
  if (window.matchMedia(queries.tablet).matches) return "tablet";
  return "phone";
}

function subscribeBreakpoint(cb: () => void) {
  const lists = Object.values(queries).map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", cb));
  return () => lists.forEach((l) => l.removeEventListener("change", cb));
}

/** `null` until hydrated, so the server and first client render agree. */
export function useBreakpoint(): Breakpoint | null {
  return useSyncExternalStore(subscribeBreakpoint, readBreakpoint, () => null);
}

const STORAGE_KEY = "metaxy.layout.v1";

type Stored = { leftOpen?: boolean; rightOpen?: boolean };

function readStored(): Stored {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : {};
  } catch {
    return {};
  }
}

function writeStored(v: Stored) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readStored(), ...v }));
  } catch {
    /* private mode / storage disabled: fall back to defaults */
  }
}

/** Default "open" state per breakpoint, before any choice by the user. */
export const columnDefaults: Record<Breakpoint, { leftOpen: boolean; rightOpen: boolean }> = {
  desktop: { leftOpen: true, rightOpen: true },
  tablet: { leftOpen: false, rightOpen: false },
  phone: { leftOpen: false, rightOpen: false },
};

/**
 * Column state for the shell: `leftOpen` / `rightOpen` (the names Task 3 will move into the store).
 *
 * Internally each is `boolean | null`; `null` means "use the breakpoint default", which the shell
 * expresses with CSS breakpoints so there is no layout flash before hydration. Consumers only see
 * the effective booleans. Desktop choices persist in localStorage; tablet/phone sheets always start
 * closed (re-opening a modal sheet on reload would be surprising).
 */
export function useColumns() {
  const bp = useBreakpoint();
  const [left, setLeft] = useState<boolean | null>(null);
  const [right, setRight] = useState<boolean | null>(null);

  // Whenever the breakpoint changes, go back to its defaults (plus the stored desktop choice).
  useEffect(() => {
    if (bp === "desktop") {
      const s = readStored();
      setLeft(typeof s.leftOpen === "boolean" ? s.leftOpen : null);
      setRight(typeof s.rightOpen === "boolean" ? s.rightOpen : null);
    } else {
      setLeft(null);
      setRight(null);
    }
  }, [bp]);

  const defaults = columnDefaults[bp ?? "desktop"];
  const leftOpen = left ?? defaults.leftOpen;
  const rightOpen = right ?? defaults.rightOpen;

  const setLeftOpen = useCallback(
    (v: boolean) => {
      setLeft(v);
      if (bp === "desktop") writeStored({ leftOpen: v });
    },
    [bp],
  );
  const setRightOpen = useCallback(
    (v: boolean) => {
      setRight(v);
      if (bp === "desktop") writeStored({ rightOpen: v });
    },
    [bp],
  );

  return {
    bp,
    /** raw tri-state values, for CSS class selection */
    raw: { left, right },
    leftOpen,
    rightOpen,
    setLeftOpen,
    setRightOpen,
    toggleLeft: () => setLeftOpen(!leftOpen),
    toggleRight: () => setRightOpen(!rightOpen),
  };
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal-sheet behaviour: focus moves in, Tab is trapped, Esc closes, focus returns on close. */
export function useSheet(ref: RefObject<HTMLElement | null>, active: boolean, onClose: () => void) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () => [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    // Wait a frame so the sheet is visible (not `inert`) before moving focus.
    const raf = requestAnimationFrame(() => (focusables()[0] ?? el).focus({ preventScroll: true }));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !el.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [active, ref]);
}
