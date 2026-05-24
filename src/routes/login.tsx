import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Account created! Check your email to confirm, or sign in if email confirmation is disabled.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/intake" });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl glass flex items-center justify-center">
            <Activity className="h-5 w-5 text-[var(--neon-blue)]" />
          </div>
          <div>
            <div className="font-display font-bold text-lg tracking-tight">LIFE</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Your future-health twin
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="font-display text-2xl font-semibold">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin"
                ? "Sign in to access your digital twin."
                : "Start your healthspan journey."}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-border/50">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                mode === "signin"
                  ? "bg-[var(--neon-blue)]/15 text-[var(--neon-blue)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                mode === "signup"
                  ? "bg-[var(--neon-blue)]/15 text-[var(--neon-blue)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-2.5 text-sm bg-[oklch(0.22_0.03_250/60%)] border border-border/60 focus:outline-none focus:border-[var(--neon-blue)] transition placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-2.5 text-sm bg-[oklch(0.22_0.03_250/60%)] border border-border/60 focus:outline-none focus:border-[var(--neon-blue)] transition placeholder:text-muted-foreground/50"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-[var(--neon-red)]/40 bg-[var(--neon-red)]/10 px-4 py-3 text-xs text-[var(--neon-red)]">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-[var(--neon-green)]/40 bg-[var(--neon-green)]/10 px-4 py-3 text-xs text-[var(--neon-green)]">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl btn-hero text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading
                ? "Loading…"
                : mode === "signin"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Educational prototype · not a medical service
          </p>
        </div>
      </div>
    </div>
  );
}
