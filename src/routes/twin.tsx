import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, HeartPulse, Flame, Dumbbell, Brain, Moon, X, ArrowRight, Sparkles } from "lucide-react";

import { INITIAL_DOMAINS, projectScores, type DomainKey } from "@/lib/mockData";
import { useTwin } from "@/lib/twin-context";
import { FriendlyStatusBadge } from "@/components/FriendlyStatusBadge";
import { TrustNote } from "@/components/TrustNote";
import { FRIENDLY_COPY, friendlyStatusLabel } from "@/lib/copy";

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

// Friendly per-system narrative copy
const SYSTEM_COPY: Record<DomainKey, { meaning: string; influence: string; step: string }> = {
  cognition: {
    meaning: "Your brain's clarity, focus, and long-term resilience.",
    influence: "Sleep quality, blood sugar swings, and movement habits all shape this.",
    step: "Try a 10-minute morning walk in daylight to support focus.",
  },
  cardio: {
    meaning: "How efficiently your heart and vessels move oxygen.",
    influence: "Lipid balance, blood pressure, and aerobic training all play a role.",
    step: "Add one zone-2 cardio session this week — even a brisk 20-minute walk counts.",
  },
  metabolic: {
    meaning: "How your body turns food into steady energy.",
    influence: "Glucose response, fiber intake, and meal timing shape this signal.",
    step: "Pair carbs with protein or fiber to soften glucose spikes.",
  },
  sleep: {
    meaning: "Your nightly recovery window — when most repair happens.",
    influence: "Bedtime consistency, evening light, and stress load matter most.",
    step: "Aim for the same wind-down hour three nights this week.",
  },
  muscle: {
    meaning: "Strength and lean tissue that protect long-term mobility.",
    influence: "Resistance training, protein intake, and recovery sleep build this.",
    step: "Add two 20-minute strength sessions — bodyweight is enough to start.",
  },
  inflammation: {
    meaning: "Your body's baseline 'background noise' of stress signals.",
    influence: "Sleep, gut health, omega-3 intake, and stress all influence this.",
    step: "Try one omega-3 rich meal (salmon, walnuts, chia) in the next few days.",
  },
};

// Calmer per-status color tokens (no harsh red)
function toneFor(status: "optimal" | "watch" | "priority") {
  return status === "optimal"
    ? "var(--friendly-mint)"
    : status === "watch"
    ? "var(--friendly-amber)"
    : "var(--friendly-coral)";
}

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
      <div className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: "var(--friendly-teal)" }}>
        Your body map · unlocked
      </div>
      <h1 className="text-4xl font-display font-semibold mt-1 mb-2">Meet your six-system twin</h1>
      <p className="text-sm text-muted-foreground max-w-2xl mb-4">
        Each system shows one part of your healthspan picture. Tap a system to learn what it may need next.
      </p>
      <TrustNote className="mb-6 max-w-2xl">{FRIENDLY_COPY.signalDisclaimer}</TrustNote>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative aspect-square max-w-2xl mx-auto">
            <div className="absolute inset-[8%] rounded-full border" style={{ borderColor: "color-mix(in oklab, var(--friendly-teal) 30%, transparent)" }} />
            <div className="absolute inset-[20%] rounded-full border" style={{ borderColor: "color-mix(in oklab, var(--friendly-teal) 18%, transparent)" }} />
            <div className="absolute inset-[34%] rounded-full border" style={{ borderColor: "color-mix(in oklab, var(--friendly-teal) 12%, transparent)" }} />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Digital Twin</div>
                <div className="font-display text-3xl" style={{ color: "var(--friendly-mint)" }}>Alex M.</div>
                <div className="font-mono text-xs text-muted-foreground mt-1">Healthspan {proj.healthspan} · Bio-age gap +{proj.bioAgeGap}y</div>
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
                  onClick={() => setActive(d.key)}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group transition-transform"
                >
                  <div
                    className={`relative h-20 w-20 rounded-2xl glass flex flex-col items-center justify-center transition-all duration-300 ${
                      isActive ? "scale-110" : "group-hover:scale-105"
                    }`}
                    style={{
                      border: `1px solid ${tone}`,
                      boxShadow: isActive
                        ? `0 0 28px -4px ${tone}`
                        : `0 0 14px -6px ${tone}`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: tone }} />
                    <div className="font-display text-lg leading-none mt-1" style={{ color: tone }}>{d.score}</div>
                    <span
                      className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full"
                      style={{ background: tone, boxShadow: `0 0 8px ${tone}` }}
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
          {activeNode ? (
            <div className="space-y-5 animate-fade-in" key={activeNode.key}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider mb-2"
                    style={{
                      background: "color-mix(in oklab, var(--friendly-mint) 14%, transparent)",
                      border: "1px solid color-mix(in oklab, var(--friendly-mint) 40%, transparent)",
                      color: "var(--friendly-mint)",
                    }}
                  >
                    <Sparkles className="h-3 w-3" /> Insight unlocked
                  </div>
                  <h3 className="font-display text-2xl font-semibold">{activeNode.label}</h3>
                  <div className="text-[12px] text-muted-foreground mt-1">
                    {activeNode.label} — {activeNode.score} — {friendlyStatusLabel(activeNode.status)} area
                  </div>
                </div>
                <button onClick={() => setActive(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-baseline gap-3">
                <div className="font-display text-5xl" style={{ color: toneFor(activeNode.status) }}>
                  {activeNode.score}
                </div>
                <FriendlyStatusBadge status={activeNode.status} />
              </div>

              <Section title="What this means">{SYSTEM_COPY[activeNode.key].meaning}</Section>
              <Section title="What may be influencing it">
                {SYSTEM_COPY[activeNode.key].influence}
                {activeNode.drivers.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {activeNode.drivers.slice(0, 3).map((d) => (
                      <li key={d} className="flex gap-2 text-[13px]">
                        <span style={{ color: "var(--friendly-amber)" }}>›</span>{d}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
              <Section title="One gentle next step" tone="var(--friendly-mint)">
                {SYSTEM_COPY[activeNode.key].step}
              </Section>

              <p className="text-[11px] text-muted-foreground italic">
                Educational insight — discuss with a licensed clinician before changing care.
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: "color-mix(in oklab, var(--friendly-teal) 14%, transparent)",
                  color: "var(--friendly-teal)",
                }}
              >
                <Brain className="h-5 w-5" />
              </div>
              Tap a glowing system to see what it may need next.
            </div>
          )}
        </aside>
      </div>

      <div
        className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl px-5 py-4"
        style={{
          background: "color-mix(in oklab, var(--friendly-teal) 6%, transparent)",
          border: "1px solid color-mix(in oklab, var(--friendly-teal) 22%, transparent)",
        }}
      >
        <div className="text-sm font-mono uppercase tracking-[0.18em]" style={{ color: "var(--friendly-teal)" }}>
          ✨ Twin map unlocked • Next: your first insights
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

function Section({
  title,
  tone = "var(--friendly-teal)",
  children,
}: {
  title: string;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider mb-1.5 font-mono" style={{ color: tone }}>
        {title}
      </div>
      <div className="text-[13px] text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}
