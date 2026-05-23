import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type Mode = "signin" | "signup";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccessMsg(
          "Account created! Check your email to confirm, then sign in."
        );
        setMode("signin");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        navigate({ to: "/intake" });
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex flex-col items-center gap-2 group">
            <div className="relative h-14 w-14 rounded-2xl glass flex items-center justify-center">
              <Activity className="h-7 w-7 text-[var(--neon-blue)]" />
              <span className="absolute inset-0 rounded-2xl neon-border-blue opacity-60 group-hover:opacity-100 transition" />
            </div>
            <div className="text-center">
              <div className="font-display font-semibold tracking-tight">
                MediTwin
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Healthspan Mission Control
              </div>
            </div>
          </Link>
        </div>

        <div className="glass rounded-3xl p-8 space-y-6">
          {/* Mode toggle */}
          <div className="flex rounded-xl glass-soft p-1 gap-1">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  mode === m
                    ? "bg-[var(--neon-blue)]/20 text-[var(--neon-blue)] neon-text-blue"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-input rounded-lg px-4 py-3 text-sm outline-none focus:neon-border-blue transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                placeholder={
                  mode === "signup" ? "Min 6 characters" : "Your password"
                }
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-input rounded-lg px-4 py-3 text-sm outline-none focus:neon-border-blue transition"
              />
            </div>

            {error && (
              <div className="text-xs text-[var(--neon-red)] bg-[var(--neon-red)]/10 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="text-xs text-[var(--neon-green)] bg-[var(--neon-green)]/10 rounded-lg px-4 py-3">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl btn-hero text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="text-[var(--neon-blue)] hover:underline"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="text-[var(--neon-blue)] hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          MediTwin is an educational prototype. Not medical advice.
        </p>
      </div>
    </div>
  );
}
