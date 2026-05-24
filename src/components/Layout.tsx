import { Link, useRouterState } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import type { ReactNode } from "react";
import { AmbientBackground } from "@/components/AmbientBackground";

const NAV = [
  { to: "/intake", label: "Get Started" },
  { to: "/upload", label: "Labs" },
  { to: "/clock", label: "Bio Age" },
  { to: "/dashboard", label: "Snapshot" },
  { to: "/twin", label: "My Twin" },
  { to: "/simulator", label: "Try Changes" },
  { to: "/plan", label: "90-Day Plan" },
  { to: "/report", label: "Doctor Brief" },
  { to: "/investor", label: "Investor" },
] as const;

function isNavActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavLink({
  to,
  label,
  active,
  compact,
}: {
  to: string;
  label: string;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`rounded-md font-medium uppercase tracking-wider transition whitespace-nowrap ${
        compact ? "px-2.5 py-1.5 text-[10px] shrink-0" : "px-3 py-1.5 text-xs"
      } ${
        active
          ? "bg-[var(--neon-blue)]/15 text-[var(--neon-blue)] neon-text-blue"
          : "text-muted-foreground hover:text-foreground hover:bg-[oklch(0.28_0.04_250/0.45)]"
      }`}
    >
      {label}
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { location } = useRouterState();
  return (
    <div className="relative min-h-screen flex flex-col">
      <AmbientBackground />
      <header className="site-chrome sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative h-8 w-8 rounded-lg glass flex items-center justify-center">
              <Activity className="h-4 w-4 text-[var(--neon-blue)]" />
              <span className="absolute inset-0 rounded-lg neon-border-blue opacity-60 group-hover:opacity-100 transition" />
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="font-display font-semibold tracking-tight">MediTwin</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">
                Your future-health twin
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1 flex-wrap justify-end">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                label={n.label}
                active={isNavActive(location.pathname, n.to)}
              />
            ))}
          </nav>
          <Link
            to="/upload"
            className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold btn-hero shrink-0"
          >
            Meet My Twin
          </Link>
        </div>
        <nav
          aria-label="Primary"
          className="md:hidden border-t border-border/40 overflow-x-auto no-scrollbar"
        >
          <div className="flex items-center gap-1 px-3 py-2 min-w-max">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                label={n.label}
                active={isNavActive(location.pathname, n.to)}
                compact
              />
            ))}
          </div>
        </nav>
      </header>

      <main key={location.pathname} className="relative flex-1 page-enter">
        {children}
      </main>

      <footer className="site-chrome relative border-t border-border/50 mt-8 sm:mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-xs text-muted-foreground space-y-2">
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
