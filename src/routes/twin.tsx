import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, HeartPulse, Flame, Dumbbell, Brain, Moon, X } from "lucide-react";
import { INITIAL_DOMAINS, projectScores, statusColor, type DomainKey } from "@/lib/mockData";
import { useTwin } from "@/lib/twin-context";
import { FriendlyStatusBadge } from "@/components/FriendlyStatusBadge";
import { TrustNote } from "@/components/TrustNote";
import { FRIENDLY_COPY } from "@/lib/copy";

export const Route = createFileRoute("/twin")({
  component: TwinMap,
});

const ICONS = { Activity, HeartPulse, Flame, Dumbbell, Brain, Moon } as const;

// positions on a circle
const POSITIONS: Record<DomainKey, { x: number; y: number }> = {
  cognition:   { x: 50, y: 10 },
  cardio:      { x: 88, y: 32 },
  metabolic:   { x: 88, y: 72 },
  sleep:       { x: 50, y: 92 },
  muscle:      { x: 12, y: 72 },
  inflammation:{ x: 12, y: 32 },
};

function TwinMap() {
  const { interventions } = useTwin();
  const proj = projectScores(interventions);
  const domains = INITIAL_DOMAINS.map((d) => {
    const s = proj.domains[d.key];
    const status: "optimal" | "watch" | "priority" = s >= 75 ? "optimal" : s >= 60 ? "watch" : "priority";
    return { ...d, score: s, status };
  });
  const [active, setActive] = useState<DomainKey | null>(null);
  const activeNode = domains.find((d) => d.key === active) ?? null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: "var(--friendly-teal)" }}>Your body map</div>
      <h1 className="text-4xl font-display font-semibold mt-1 mb-3">Six gentle systems to explore</h1>
      <TrustNote className="mb-6 max-w-2xl">{FRIENDLY_COPY.signalDisclaimer}</TrustNote>


      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative aspect-square max-w-2xl mx-auto">
            {/* concentric rings */}
            <div className="absolute inset-[8%] rounded-full border border-[var(--neon-blue)]/30" />
            <div className="absolute inset-[20%] rounded-full border border-[var(--neon-blue)]/20" />
            <div className="absolute inset-[34%] rounded-full border border-[var(--neon-blue)]/15" />

            {/* center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Digital Twin</div>
                <div className="font-display text-3xl neon-text-green">Alex M.</div>
                <div className="font-mono text-xs text-muted-foreground mt-1">Healthspan {proj.healthspan} · Bio-age gap +{proj.bioAgeGap}y</div>
              </div>
            </div>

            {/* nodes */}
            {domains.map((d) => {
              const pos = POSITIONS[d.key];
              const Icon = ICONS[d.icon as keyof typeof ICONS] ?? Activity;
              const c = statusColor(d.status);
              const isActive = active === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => setActive(d.key)}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                >
                  <div className={`relative h-20 w-20 rounded-2xl glass flex flex-col items-center justify-center neon-border-${c === "neon-green" ? "green" : c === "neon-orange" ? "orange" : "red"} ${isActive ? "scale-110" : ""} transition`}>
                    <Icon className={`h-5 w-5 text-[var(--${c})]`} />
                    <div className={`font-display text-lg leading-none mt-1 text-[var(--${c})]`}>{d.score}</div>
                    <span className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[var(--${c})] pulse-dot relative`} />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-center mt-2 text-muted-foreground group-hover:text-foreground">{d.short}</div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="lg:col-span-4 glass rounded-3xl p-6 min-h-[400px]">
          {activeNode ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">System</div>
                  <h3 className="font-display text-2xl font-semibold mt-1">{activeNode.label}</h3>
                </div>
                <button onClick={() => setActive(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-baseline gap-3">
                <div className={`font-display text-5xl text-[var(--${statusColor(activeNode.status)})]`}>
                  {activeNode.score}
                </div>
                <div className={`text-xs uppercase tracking-wider text-[var(--${statusColor(activeNode.status)})]`}>
                  {activeNode.status}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Drivers</div>
                <ul className="space-y-1.5 text-sm">
                  {activeNode.drivers.map((d) => (
                    <li key={d} className="flex gap-2"><span className="text-[var(--neon-orange)]">›</span>{d}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Recommendations</div>
                <ul className="space-y-1.5 text-sm">
                  {activeNode.recommendations.map((d) => (
                    <li key={d} className="flex gap-2"><span className="text-[var(--neon-green)]">✓</span>{d}</li>
                  ))}
                </ul>
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                Educational insight — discuss with a licensed clinician before changing care.
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <div className="h-12 w-12 rounded-full glass-soft flex items-center justify-center mb-4">
                <Brain className="h-5 w-5 text-[var(--neon-blue)]" />
              </div>
              Click a glowing node to inspect that system's drivers and recommendations.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
