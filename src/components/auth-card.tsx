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
      <Panel title="Active workspace session" code="AUTH" right={<Badge tone="ok">signed in</Badge>}>
        <div className="space-y-4">
          <div className="rounded border border-border bg-secondary/40 p-3">
            <MonoLabel className="text-muted-foreground">Authenticated owner</MonoLabel>
            <div className="mt-1 truncate font-mono text-xs font-semibold">{userEmail}</div>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-accent bg-accent px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Open Command Centre <ArrowRight className="size-3.5" />
            </Link>
            <Btn type="button" onClick={() => void handleSignOut()} disabled={busy} className="w-full">
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
        <div className="grid grid-cols-2 gap-1 rounded-sm border border-border bg-secondary/50 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setNotice(null);
            }}
            className={cn(
              "cursor-pointer rounded-sm px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors",
              mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
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
              "cursor-pointer rounded-sm px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors",
              mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Create account
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="auth-email" className="block">
              <MonoLabel className="text-muted-foreground">Email</MonoLabel>
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@business.co.za"
              className="h-9 w-full rounded-sm border border-input bg-background px-2.5 text-xs outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="auth-password" className="block">
              <MonoLabel className="text-muted-foreground">Password</MonoLabel>
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
              className="h-9 w-full rounded-sm border border-input bg-background px-2.5 text-xs outline-none focus:border-accent"
            />
          </div>

          {error ? <div className="rounded border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-[11px] text-destructive">{error}</div> : null}
          {notice ? <div className="rounded border border-accent/30 bg-accent/10 px-2.5 py-2 text-[11px] text-accent">{notice}</div> : null}

          <Btn type="submit" variant="accent" disabled={busy || !supabase} className="w-full py-2">
            {busy ? "Working…" : mode === "signin" ? "Sign in to workspace" : "Create workspace account"}
          </Btn>
        </form>

        <div className="relative flex items-center py-1">
          <div className="flex-1 border-t border-border" />
          <MonoLabel className="px-2 text-muted-foreground">or</MonoLabel>
          <div className="flex-1 border-t border-border" />
        </div>

        <Link
          href="/dashboard"
          className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-border bg-secondary/60 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-secondary"
        >
          <ShieldCheck className="size-3.5 text-accent" />
          Launch Live Demo (No Sign-Up)
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Panel>
  );
}
