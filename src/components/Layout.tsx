import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Activity, LogIn, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { AmbientBackground } from "@/components/AmbientBackground";
import { useTwin } from "@/lib/twin-context";
import { supabase } from "@/lib/supabase";

const NAV = [
  { to: "/intake", label: "Intake" },
  { to: "/upload", label: "Labs" },
  { to: "/dashboard", label: "Insights" },
  { to: "/twin", label: "Digital Twin" },
  { to: "/simulator", label: "Try Changes" },
  { to: "/plan", label: "90-Day Guide" },
  { to: "/report", label: "Clinician Brief" },
  { to: "/investor", label: "Investor" },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  const { location } = useRouterState();
  const { user } = useTwin();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <AmbientBackground />
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative h-8 w-8 rounded-lg glass flex items-center justify-center">
              <Activity className="h-4 w-4 text-[var(--neon-blue)]" />
              <span className="absolute inset-0 rounded-lg neon-border-blue opacity-60 group-hover:opacity-100 transition" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-semibold tracking-tight">MediTwin</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Your healthspan twin
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider transition ${
                    active
                      ? "bg-[var(--neon-blue)]/15 text-[var(--neon-blue)] neon-text-blue"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          {user ? (
            <button
              onClick={handleSignOut}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold glass hover:neon-border-blue transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold btn-hero"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="relative flex-1">{children}</main>

      <footer className="relative border-t border-border/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-xs text-muted-foreground space-y-2">
          <p className="leading-relaxed">
            <span className="text-foreground font-semibold">Disclaimer.</span>{" "}
            MediTwin is an educational decision-support prototype. It does not diagnose, treat,
            or prescribe. Discuss medical decisions with a licensed clinician. All scores and
            simulations are projected directional estimates for demonstration purposes.
          </p>
          <p className="opacity-60">© {new Date().getFullYear()} MediTwin · Caltech Longevity Hackathon</p>
        </div>
      </footer>
    </div>
  );
}
