import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, HeartPulse, Flame, Dumbbell, Brain, Moon, X, ArrowRight, Sparkles } from "lucide-react";

import { INITIAL_DOMAINS, projectScores, type DomainKey } from "@/lib/mockData";
import { useTwin } from "@/lib/twin-context";
import { useTwinProgress } from "@/lib/twin-progress";
import { FriendlyStatusBadge } from "@/components/FriendlyStatusBadge";
import { TrustNote } from "@/components/TrustNote";
import { FRIENDLY_COPY } from "@/lib/copy";

export const Route = createFileRoute("/twin")({
  component: TwinMap,
});

const ICONS = { Activity, HeartPulse, Flame, Dumbbell, Brain, Moon } as const;

const POSITIONS: Record<DomainKey, { x: number; y: number }> = {
  cognition:    { x: 50, y: 10 },
  cardio:       { x: 88, y: 32 },
  metabolic:    { x: 88, y: 72 },
  sleep:        { x: 50, y: 92 },
  muscle:       { x: 12, y: 72 },
  inflammation: { x: 12, y: 32 },
};

// Friendly per-system explanations layered on top of existing data
const SYSTEM_COPY: Record<DomainKey, { meaning: string; influence: string; nextStep: string }> = {
  metabolic: {
    meaning: "How smoothly your body turns food into steady energy.",
    influence: "Carb quality, fiber intake, movement after meals, and sleep all play a role.",
    nextStep: "Try a 10-minute walk after your largest meal this week.",
  },
  cardio: {
    meaning: "How well your heart and vessels carry oxygen over the long run.",
    influence: "Cholesterol particles, blood pressure, aerobic base, and stress patterns.",
    nextStep: "Add one easy 'conversation-pace' cardio session — 20 minutes is plenty.",
  },
  inflammation: {
    meaning: "The background 'noise' your immune system is running at.",
    influence: "Sleep depth, vitamin D, gut health, and recovery between hard days.",
    nextStep: "Aim for 15 minutes of morning daylight to nudge inflammation downward.",
  },
  muscle: {
    meaning: "Your strength and movement reserve as you age.",
    influence: "Resistance training, protein timing, and daily activity.",
    nextStep: "Two short strength sessions this week — even 20 minutes counts.",
  },
  cognition: {
    meaning: "Focus, memory, and mental clarity over time.",
    influence: "Sleep, cardio fitness, social connection, and novelty/learning.",
    nextStep: "Protect a screen-free 30 minutes before bed to support deeper sleep.",
  },
  sleep: {
    meaning: "How well your body restores itself overnight.",
    influence: "Consistent timing, light exposure, caffeine cutoff, and evening wind-down.",
    nextStep: "Pick a fixed wake-time for the next 7 days — even on weekends.",
  },
};

// Calmer color tokens — coral instead of red for "focus"
function toneFor(status: "optimal" | "watch" | "priority") {
  if (status === "optimal") return "var(--friendly-mint)";
  if (status === "watch") return "var(--friendly-amber)";
  return "var(--friendly-coral)";
}

function phraseFor(status: "optimal" | "watch" | "priority") {
  if (status === "optimal") return "Strong area";
  if (status === "watch") return "Support area";
  return "Focus area";
}

function TwinMap() {
  const { interventions } = useTwin();
  const proj = projectScores(interventions);
  const domains = INITIAL_DOMAINS.map((d) => {
    const s = proj.domains[d.key];
    const status: "optimal" | "watch" | "priority" =
      s >= 75 ? "optimal" : s >= 60 ? "watch" : "priority";
    return { ...d, score: s, status };
  });
  const [active, setActive] = useState<DomainKey | null>(null);
  const { awardXp, awardBadge } = useTwinProgress();
  const handleSelect = (key: DomainKey) => {
    setActive(key);
    awardXp(`twin.system.${key}`, 5, `Explored ${key}`);
    awardBadge("system-mapper");
  };
  const activeNode = domains.find((d) => d.key === active) ?? null;
  const activeCopy = active ? SYSTEM_COPY[active] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: "var(--friendly-teal)" }}>
        Your body map
      </div>
      <h1 className="text-4xl font-display font-semibold mt-1 mb-2">Meet your six-system twin</h1>
      <p className="text-sm text-muted-foreground max-w-2xl mb-3">
        Each system shows one part of your healthspan picture. Tap a system to learn what it may need next.
      </p>
      <div className="flex items-center gap-2 text-[11px] mb-5">
        <span className="inline-flex h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: "var(--friendly-teal)" }} />
        <span className="text-muted-foreground">
          Twin map unlocked <span className="opacity-50">•</span> Next: your first insights
        </span>
      </div>
      <TrustNote className="mb-6 max-w-2xl">{FRIENDLY_COPY.signalDisclaimer}</TrustNote>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative aspect-square max-w-2xl mx-auto">
            <div className="absolute inset-[8%] rounded-full border border-[var(--neon-blue)]/30" />
            <div className="absolute inset-[20%] rounded-full border border-[var(--neon-blue)]/20" />
            <div className="absolute inset-[34%] rounded-full border border-[var(--neon-blue)]/15" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Digital Twin</div>
                <div className="font-display text-3xl neon-text-green">Alex M.</div>
                <div className="font-mono text-xs text-muted-foreground mt-1">
                  Healthspan {proj.healthspan} · Bio-age gap +{proj.bioAgeGap}y
                </div>
              </div>
            </div>

            {domains.map((d) => {
              const pos = POSITIONS[d.key];
              const Icon = ICONS[d.icon as keyof typeof ICONS] ?? Activity;
              const tone = toneFor(d.status);
              const isActive = active === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => handleSelect(d.key)}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group transition-transform duration-300 ease-out hover:scale-105"
                >
                  <div
                    className={`relative h-20 w-20 rounded-2xl glass flex flex-col items-center justify-center transition-all duration-300 ${
                      isActive ? "scale-110" : ""
                    }`}
                    style={{
                      border: `1px solid color-mix(in oklab, ${tone} 55%, transparent)`,
                      boxShadow: isActive
                        ? `0 0 24px color-mix(in oklab, ${tone} 45%, transparent)`
                        : `0 0 12px color-mix(in oklab, ${tone} 18%, transparent)`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: tone }} />
                    <div className="font-display text-lg leading-none mt-1" style={{ color: tone }}>
                      {d.score}
                    </div>
                    <span
                      className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full pulse-dot"
                      style={{ background: tone }}
                    />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-center mt-2 text-muted-foreground group-hover:text-foreground">
                    {d.short}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="lg:col-span-4 glass rounded-3xl p-6 min-h-[400px]">
          {activeNode && activeCopy ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide mb-2"
                    style={{
                      color: "var(--friendly-teal)",
                      border: "1px solid color-mix(in oklab, var(--friendly-teal) 45%, transparent)",
                      background: "color-mix(in oklab, var(--friendly-teal) 12%, transparent)",
                    }}
                  >
                    <Sparkles className="h-3 w-3" />
                    Insight unlocked
                  </span>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">System</div>
                  <h3 className="font-display text-2xl font-semibold mt-1">{activeNode.label}</h3>
                </div>
                <button onClick={() => setActive(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-baseline gap-3 flex-wrap">
                <div className="font-display text-5xl" style={{ color: toneFor(activeNode.status) }}>
                  {activeNode.score}
                </div>
                <div>
                  <FriendlyStatusBadge status={activeNode.status} />
                  <div className="text-[11px] text-muted-foreground mt-1">{phraseFor(activeNode.status)}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">What this means</div>
                <p className="text-sm leading-relaxed">{activeCopy.meaning}</p>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  What may be influencing it
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{activeCopy.influence}</p>
                {activeNode.drivers.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
                    {activeNode.drivers.map((d) => (
                      <li key={d} className="flex gap-2">
                        <span style={{ color: "var(--friendly-amber)" }}>›</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  One gentle next step
                </div>
                <div
                  className="text-sm leading-relaxed rounded-xl p-3"
                  style={{
                    background: "color-mix(in oklab, var(--friendly-mint) 10%, transparent)",
                    border: "1px solid color-mix(in oklab, var(--friendly-mint) 30%, transparent)",
                  }}
                >
                  {activeCopy.nextStep}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground italic">
                Educational insight — discuss with a licensed clinician before changing care.
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <div className="h-12 w-12 rounded-full glass-soft flex items-center justify-center mb-4">
                <Brain className="h-5 w-5" style={{ color: "var(--friendly-teal)" }} />
              </div>
              Tap a glowing system to unlock a gentle insight about what it may need next.
            </div>
          )}
        </aside>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-muted-foreground">
          Twin map unlocked <span className="opacity-50">•</span> Next: your first insights
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-hero text-sm font-semibold"
        >
          See My First Insights <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
