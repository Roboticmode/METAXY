"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { useMetaxy } from "@/lib/store";

/**
 * Layout breakpoints for the command centre (match Tailwind's `md` and `xl`).
 *  - desktop ≥ 1280: icon rail (optional expand) and the agent dock, both in the flow
 *  - tablet 768–1279: icon rail, with the module list as an overlay when expanded; agent dock as a sheet
 *  - phone  < 768:   menu sheet + bottom tab bar; agent dock as a sheet
 *
 * The WhatsApp phone lives inside the WhatsApp module, not as its own column.
 * `rightOpen` stays so the agent's `set_columns` action still has somewhere to land.
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

const STORAGE_KEY = "metaxy.layout.v2";

/** Right-hand multi-agent panel. Dragged width persists with the other column choices. */
export const AGENT_WIDTH_DEFAULT = 380;
export const AGENT_WIDTH_MIN = 320;
export const AGENT_WIDTH_MAX = 640;

type Stored = { leftOpen?: boolean; rightOpen?: boolean; agentOpen?: boolean; agentWidth?: number };

function clampAgentWidth(n: number) {
  return Math.min(AGENT_WIDTH_MAX, Math.max(AGENT_WIDTH_MIN, Math.round(n)));
}

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

/**
 * Default "open" state per breakpoint, before any choice by the user.
 * The left rail rests collapsed (icons only). Expanding it is optional.
 */
export const columnDefaults: Record<Breakpoint, { leftOpen: boolean; rightOpen: boolean; agentOpen: boolean }> = {
  desktop: { leftOpen: false, rightOpen: false, agentOpen: true },
  tablet: { leftOpen: false, rightOpen: false, agentOpen: false },
  phone: { leftOpen: false, rightOpen: false, agentOpen: false },
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
  const [agent, setAgent] = useState<boolean | null>(null);
  const [agentWidth, setAgentWidthState] = useState(AGENT_WIDTH_DEFAULT);

  // Whenever the breakpoint changes, go back to its defaults (plus the stored desktop choice).
  useEffect(() => {
    const s = readStored();
    if (typeof s.agentWidth === "number" && Number.isFinite(s.agentWidth)) setAgentWidthState(clampAgentWidth(s.agentWidth));
    if (bp === "desktop") {
      setLeft(typeof s.leftOpen === "boolean" ? s.leftOpen : null);
      setRight(typeof s.rightOpen === "boolean" ? s.rightOpen : null);
      setAgent(typeof s.agentOpen === "boolean" ? s.agentOpen : null);
    } else {
      setLeft(null);
      setRight(null);
      setAgent(null);
    }
  }, [bp]);

  const defaults = columnDefaults[bp ?? "desktop"];
  const leftOpen = left ?? defaults.leftOpen;
  const rightOpen = right ?? defaults.rightOpen;
  const agentOpen = agent ?? defaults.agentOpen;

  // Bridge to the store so the agent console's `set_columns` action can open/close columns,
  // and so the store always knows what the owner last chose.
  const { state, setColumns } = useMetaxy();

  const setLeftOpen = useCallback(
    (v: boolean) => {
      setLeft(v);
      if (bp === "desktop") writeStored({ leftOpen: v });
      setColumns({ left: v });
    },
    [bp, setColumns],
  );
  const setRightOpen = useCallback(
    (v: boolean) => {
      setRight(v);
      if (bp === "desktop") writeStored({ rightOpen: v });
      setColumns({ right: v });
    },
    [bp, setColumns],
  );
  const setAgentOpen = useCallback(
    (v: boolean) => {
      setAgent(v);
      if (bp === "desktop") writeStored({ agentOpen: v });
    },
    [bp],
  );
  const setAgentWidth = useCallback((v: number) => {
    const next = clampAgentWidth(v);
    setAgentWidthState(next);
    writeStored({ agentWidth: next });
  }, []);

  // Store → layout. Skip the first run: the store's initial value is a default, not a request.
  const storeLeft = state.ui.leftOpen;
  const storeRight = state.ui.rightOpen;
  const seenLeft = useRef(false);
  const seenRight = useRef(false);
  useEffect(() => {
    if (!seenLeft.current) {
      seenLeft.current = true;
      return;
    }
    setLeft(storeLeft);
    if (bp === "desktop") writeStored({ leftOpen: storeLeft });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to the store value only
  }, [storeLeft]);
  useEffect(() => {
    if (!seenRight.current) {
      seenRight.current = true;
      return;
    }
    setRight(storeRight);
    if (bp === "desktop") writeStored({ rightOpen: storeRight });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to the store value only
  }, [storeRight]);

  return {
    bp,
    /** raw tri-state values, for CSS class selection */
    raw: { left, right },
    leftOpen,
    rightOpen,
    agentOpen,
    agentWidth,
    setLeftOpen,
    setRightOpen,
    setAgentOpen,
    setAgentWidth,
    toggleLeft: () => setLeftOpen(!leftOpen),
    toggleRight: () => setRightOpen(!rightOpen),
    toggleAgent: () => setAgentOpen(!agentOpen),
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
