"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface LandingSession {
  /** Signed-in owner's email, or null when signed out / not yet known. */
  email: string | null;
  /** false when the Supabase env vars aren't set (demo-only deployment). */
  configured: boolean;
}

/**
 * Reads the Supabase session in the browser so the landing page itself can stay static
 * (no `force-dynamic`, no cookies read on the server). Everyone gets the same HTML first
 * ("Try the live demo"); signed-in owners see "Open workspace" a moment after hydration.
 * `getSession()` reads local storage/cookies only, so it costs no network round trip.
 */
export function useLandingSession(): LandingSession {
  const [session, setSession] = useState<LandingSession>({ email: null, configured: true });

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setSession({ email: null, configured: false });
      return;
    }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setSession({ email: data.session?.user.email ?? null, configured: true });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession({ email: s?.user.email ?? null, configured: true });
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return session;
}

/** Label for the primary call to action, depending on the session. */
export function ctaLabel(email: string | null) {
  return email ? "Open workspace" : "Try the live demo";
}
