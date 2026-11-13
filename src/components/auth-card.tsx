"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge, Btn, MonoLabel, Panel, cn } from "@/components/ui";

export function AuthCard({ userEmail, authError }: { userEmail: string | null; authError?: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(authError ? "Authentication link expired or invalid. Please try signing in again." : null);
  const [notice, setNotice] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase environment variables are not configured. Use Demo Mode below.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
        router.push("/dashboard");
        router.refresh();
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (err) throw err;
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setNotice("Account created. Check your inbox to confirm your email, then sign in.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    router.refresh();
  }

  if (userEmail) {
    return (
      <Panel title="Active workspace session" code="AUTH" right={<Badge tone="ok">Signed in</Badge>}>
        <div className="space-y-4">
          <div className="rounded-xl border border-hairline bg-paper/60 p-4">
            <MonoLabel className="text-muted-foreground">Authenticated owner</MonoLabel>
            <div className="mt-1 truncate text-[14px] font-medium">{userEmail}</div>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent-strong px-5 text-[14.5px] font-medium text-white transition-colors hover:bg-accent-ink"
            >
              Open the command centre <ArrowRight className="size-3.5" />
            </Link>
            <Btn type="button" onClick={() => void handleSignOut()} disabled={busy} className="min-h-11 w-full">
              <LogOut className="size-3.5" /> Sign out
            </Btn>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Owner access" code="AUTH" right={<Badge tone={supabase ? "info" : "neutral"}>{supabase ? "Supabase Auth" : "Demo only"}</Badge>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-paper-2 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setNotice(null);
            }}
            className={cn(
              "min-h-9 cursor-pointer rounded-full px-3 text-[13.5px] font-medium transition-colors",
              mode === "signin" ? "bg-ink text-paper shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setNotice(null);
            }}
            className={cn(
              "min-h-9 cursor-pointer rounded-full px-3 text-[13.5px] font-medium transition-colors",
              mode === "signup" ? "bg-ink text-paper shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Create account
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="block">
              <span className="text-[13px] font-medium text-ink-3">Email</span>
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@business.co.za"
              className="h-11 w-full rounded-full border border-hairline bg-paper px-4 text-[14px] transition-colors outline-none placeholder:text-muted-foreground focus:border-accent-ink focus:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="block">
              <span className="text-[13px] font-medium text-ink-3">Password</span>
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="h-11 w-full rounded-full border border-hairline bg-paper px-4 text-[14px] transition-colors outline-none placeholder:text-muted-foreground focus:border-accent-ink focus:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
            />
          </div>

          {error ? <div className="rounded-xl border border-destructive/25 bg-destructive/[0.06] px-3.5 py-2.5 text-[13px] text-destructive-ink" role="alert">{error}</div> : null}
          {notice ? <div className="rounded-xl border border-accent/30 bg-accent/[0.08] px-3.5 py-2.5 text-[13px] text-accent-ink" role="status">{notice}</div> : null}

          <Btn type="submit" variant="accent" disabled={busy || !supabase} className="min-h-11 w-full text-[14.5px]">
            {busy ? "Working…" : mode === "signin" ? "Sign in to workspace" : "Create workspace account"}
          </Btn>
        </form>

        <div className="relative flex items-center py-1">
          <div className="flex-1 border-t border-hairline" />
          <MonoLabel className="px-3 text-muted-foreground">or</MonoLabel>
          <div className="flex-1 border-t border-hairline" />
        </div>

        <Link
          href="/dashboard"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 text-[14.5px] font-medium text-paper transition-colors hover:bg-ink-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
        >
          <ShieldCheck className="size-4 text-accent" />
          Launch the live demo · no sign-up
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Panel>
  );
}
