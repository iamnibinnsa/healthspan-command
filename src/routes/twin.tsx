import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity, HeartPulse, Flame, Dumbbell, Brain, Moon, X,
  ArrowRight, Sparkles, Lightbulb, Target, Dna,
} from "lucide-react";
import {
  INITIAL_BIO_AGE_GAP, INITIAL_DOMAINS, SAMPLE_BIOMARKERS, projectScores, statusColor,
  type Biomarker, type DomainKey,
} from "@/lib/mockData";
import { useTwin, type ParsedBiomarkers } from "@/lib/twin-context";
import { bandFromGap } from "@/lib/bioAgeProjection";
import { computeHealthspan } from "@/lib/scoringEngine";
import { FriendlyStatusBadge } from "@/components/FriendlyStatusBadge";
import { TrustNote } from "@/components/TrustNote";
import { DOMAIN_BLURBS, CTA } from "@/lib/copy";

function parsedToBiomarkers(p: ParsedBiomarkers): Biomarker[] {
  return [
    { name: "HbA1c",           value: p.hba1c,           unit: "%",         optimal: "< 5.4",     status: "watch" as const },
    { name: "Fasting Glucose", value: p.fasting_glucose, unit: "mg/dL",     optimal: "70–95",     status: "watch" as const },
    { name: "ApoB",            value: p.apob,            unit: "mg/dL",     optimal: "< 80",      status: "watch" as const },
    { name: "LDL-C",           value: p.ldl_c,           unit: "mg/dL",     optimal: "< 100",     status: "watch" as const },
    { name: "HDL-C",           value: p.hdl_c,           unit: "mg/dL",     optimal: "> 50",      status: "watch" as const },
    { name: "Triglycerides",   value: p.triglycerides,   unit: "mg/dL",     optimal: "< 100",     status: "watch" as const },
    { name: "hs-CRP",          value: p.hs_crp,          unit: "mg/L",      optimal: "< 1.0",     status: "watch" as const },
    { name: "Vitamin D",       value: p.vitamin_d,       unit: "ng/mL",     optimal: "40–60",     status: "watch" as const },
    { name: "Resting HR",      value: p.resting_hr,      unit: "bpm",       optimal: "55–65",     status: "watch" as const },
    { name: "HRV",             value: p.hrv,             unit: "ms",        optimal: "> 50",      status: "watch" as const },
    { name: "VO2 max",         value: p.vo2_max,         unit: "ml/kg/min", optimal: "> 42",      status: "watch" as const },
  ];
}

/**
 * Page-local label/phrase mapping. We deliberately do NOT mutate the global
 * STATUS_TONE dictionary in copy.ts — other pages still use the friendlier
 * "On track / Worth a look / Discuss soon" labels. The Twin Map page uses
 * the calmer "Strong / Support / Focus" framing instead.
 */
const TWIN_LABEL: Record<"optimal" | "watch" | "priority", string> = {
  optimal:  "Strong",
  watch:    "Support",
  priority: "Focus",
};
const TWIN_PHRASE: Record<"optimal" | "watch" | "priority", string> = {
  optimal:  "Doing strong",
  watch:    "Support area",
  priority: "Focus area",
};

/**
 * One short, calm "what this means" line per body system. Used in the panel.
 */
const SYSTEM_MEANING: Record<DomainKey, string> = {
  metabolic:    "Your body's ability to turn food into steady, usable energy without big highs and lows.",
  cardio:       "How easily your heart and blood vessels carry oxygen wherever your body needs it.",
  inflammation: "How calm or activated your immune system feels in the background each day.",
  muscle:       "The strength, mobility, and reserves that protect your body as you age.",
  cognition:    "How clearly you think, focus, and remember — supported by sleep and circulation.",
  sleep:        "Your nightly window for repair, hormone reset, and brain clean-up.",
};

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
  const { interventions, intake, parsedBiomarkers } = useTwin();

  const activeBiomarkers: Biomarker[] = parsedBiomarkers
    ? parsedToBiomarkers(parsedBiomarkers)
    : SAMPLE_BIOMARKERS;

  // Real baseline from user's actual intake + biomarkers (no interventions)
  const baseBreakdown = useMemo(
    () => computeHealthspan(intake, [], activeBiomarkers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intake, parsedBiomarkers],
  );

  // Mock intervention effects for gap reduction and domain deltas
  const proj = projectScores(interventions);
  const interventionGapReduction = Math.max(0, INITIAL_BIO_AGE_GAP - proj.bioAgeGap);
  const dynamicBaseGap = Math.max(0, +((100 - baseBreakdown.overall) * 0.14).toFixed(1));
  const dynamicProjectedGap = Math.max(0, +(dynamicBaseGap - interventionGapReduction).toFixed(1));
  const bioBand = bandFromGap(dynamicProjectedGap);

  // Domain scores: real baseline + mock intervention deltas (same hybrid as simulator)
  const baseScoreMap = Object.fromEntries(
    baseBreakdown.domains.map((d) => [d.key, d.score])
  ) as Record<DomainKey, number>;

  const domains = INITIAL_DOMAINS.map((d) => {
    const before = baseScoreMap[d.key] ?? proj.baselineDomains[d.key];
    const mockDelta = proj.domains[d.key] - proj.baselineDomains[d.key];
    const s = Math.min(100, Math.round(before + mockDelta));
    const status: "optimal" | "watch" | "priority" = s >= 75 ? "optimal" : s >= 60 ? "watch" : "priority";
    return { ...d, score: s, status };
  });
  const [active, setActive] = useState<DomainKey | null>(null);
  const activeNode = domains.find((d) => d.key === active) ?? null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">My twin · gentle map</div>
      <h1 className="text-4xl font-display font-semibold mt-1 mb-2">Meet your six-system twin</h1>
      <p className="text-sm text-muted-foreground max-w-2xl mb-4 leading-relaxed">
        Each system shows one part of your healthspan picture. Tap a system to learn what it
        may need next.
      </p>

      {/* Compact bio-age strip → links into the full clock */}
      <Link
        to="/clock"
        className="group inline-flex items-center gap-3 mb-8 rounded-full pl-3 pr-2 py-1.5 transition hover:brightness-110"
        style={{
          background: `color-mix(in oklab, var(--${bioBand.color}) 8%, transparent)`,
          border: `1px solid color-mix(in oklab, var(--${bioBand.color}) 26%, transparent)`,
        }}
      >
        <Dna className="h-3.5 w-3.5 text-[var(--neon-blue)] shrink-0" />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Biological age
        </span>
          <span
          className="text-[12px] font-display tabular-nums"
          style={{ color: `var(--${bioBand.color})` }}
        >
          {+(intake.age + dynamicProjectedGap).toFixed(1)} yr
        </span>
        <span className="text-[11px] text-muted-foreground">
          · +{dynamicProjectedGap} vs chrono
        </span>
        <span
          className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full hidden sm:inline"
          style={{
            color: `var(--${bioBand.color})`,
            background: `color-mix(in oklab, var(--${bioBand.color}) 12%, transparent)`,
          }}
        >
          {bioBand.label}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--neon-blue)] inline-flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition">
          See clock <ArrowRight className="h-3 w-3" />
        </span>
      </Link>

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
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Your twin</div>
                <div className="font-display text-3xl neon-text-green">{intake.name ? intake.name.split(" ")[0] : "You"}</div>
                <div className="font-mono text-xs text-muted-foreground mt-1">Healthspan {baseBreakdown.overall} · body-age +{dynamicProjectedGap}y</div>
              </div>
            </div>

            {/* nodes */}
            {domains.map((d) => {
              const pos = POSITIONS[d.key];
              const Icon = ICONS[d.icon as keyof typeof ICONS] ?? Activity;
              const c = statusColor(d.status);
              const isActive = active === d.key;
              // Calmer glow: priority/red stays softer than green/amber so the
              // map never feels alarming. Active nodes lift a touch more.
              const glowAlpha = c === "neon-red" ? 32 : 55;
              const glowRadius = c === "neon-red" ? 16 : 22;
              return (
                <button
                  key={d.key}
                  onClick={() => setActive(d.key)}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                >
                  <div
                    className={`relative h-20 w-20 rounded-2xl glass flex flex-col items-center justify-center transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`}
                    style={{
                      borderColor: `var(--${c})`,
                      boxShadow: `0 0 ${glowRadius}px -4px color-mix(in oklab, var(--${c}) ${isActive ? glowAlpha + 15 : glowAlpha}%, transparent)`,
                    }}
                  >
                    <Icon className={`h-5 w-5 text-[var(--${c})]`} />
                    <div className={`font-display text-lg leading-none mt-1 text-[var(--${c})]`}>{d.score}</div>
                    <span className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[var(--${c})] pulse-dot relative`} />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-center mt-2 text-muted-foreground group-hover:text-foreground transition">
                    {d.short}
                    <span
                      className="ml-1"
                      style={{ color: `var(--${c})`, opacity: 0.85 }}
                    >
                      · {TWIN_LABEL[d.status]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="lg:col-span-4 glass rounded-3xl p-6 min-h-[400px]">
          {activeNode ? (
            // key={activeNode.key} → smooth fade-in re-runs each time the user
            // clicks a different system, giving a small "unlocked" feel.
            <div key={activeNode.key} className="space-y-5 animate-in fade-in slide-in-from-bottom-1 duration-300">
              {/* Insight unlocked badge */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.18em]"
                  style={{
                    color: `var(--${statusColor(activeNode.status)})`,
                    background: `color-mix(in oklab, var(--${statusColor(activeNode.status)}) 14%, transparent)`,
                    border: `1px solid color-mix(in oklab, var(--${statusColor(activeNode.status)}) 35%, transparent)`,
                  }}
                >
                  <Sparkles className="h-3 w-3" />
                  Insight unlocked
                </span>
                <button
                  onClick={() => setActive(null)}
                  className="text-muted-foreground hover:text-foreground transition"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title block */}
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Body system</div>
                <h3 className="font-display text-2xl font-semibold mt-1">{activeNode.label}</h3>
                {/* Paired score line: "Sleep & Recovery — 49 — Focus area" */}
                <div className="text-[11px] text-muted-foreground mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span>{activeNode.label}</span>
                  <span className="opacity-50">—</span>
                  <span
                    className="font-display tabular-nums"
                    style={{ color: `var(--${statusColor(activeNode.status)})` }}
                  >
                    {activeNode.score}
                  </span>
                  <span className="opacity-50">—</span>
                  <span style={{ color: `var(--${statusColor(activeNode.status)})` }}>
                    {TWIN_PHRASE[activeNode.status]}
                  </span>
                </div>
              </div>

              {/* Big visual: score + friendly badge */}
              <div className="flex items-baseline gap-3">
                <div
                  className="font-display text-5xl tabular-nums leading-none"
                  style={{ color: `var(--${statusColor(activeNode.status)})` }}
                >
                  {activeNode.score}
                </div>
                <FriendlyStatusBadge
                  status={activeNode.status}
                  size="md"
                  label={TWIN_LABEL[activeNode.status]}
                />
              </div>

              {/* Section 1 — What this means */}
              <Section
                Icon={Brain}
                title="What this means"
                colorVar={statusColor(activeNode.status)}
              >
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {SYSTEM_MEANING[activeNode.key] ?? DOMAIN_BLURBS[activeNode.key]}
                </p>
              </Section>

              {/* Section 2 — What may be influencing it */}
              <Section
                Icon={Lightbulb}
                title="What may be influencing it"
                colorVar={statusColor(activeNode.status)}
              >
                <ul className="space-y-1.5 text-sm">
                  {activeNode.drivers.map((d) => (
                    <li key={d} className="flex gap-2">
                      <span style={{ color: `var(--${statusColor(activeNode.status)})` }}>›</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              {/* Section 3 — One gentle next step (highlighted) + extras */}
              <Section
                Icon={Target}
                title="One gentle next step"
                colorVar="neon-green"
              >
                <div
                  className="rounded-xl p-3 text-sm flex items-start gap-2"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in oklab, var(--neon-green) 12%, transparent), color-mix(in oklab, var(--neon-blue) 6%, transparent))",
                    border: "1px solid color-mix(in oklab, var(--neon-green) 30%, transparent)",
                  }}
                >
                  <Sparkles className="h-4 w-4 text-[var(--neon-green)] mt-0.5 shrink-0" />
                  <span>{activeNode.recommendations[0]}</span>
                </div>
                {activeNode.recommendations.length > 1 && (
                  <div className="mt-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                      Other gentle ideas
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeNode.recommendations.slice(1).map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center text-[11px] px-2 py-1 rounded-full"
                          style={{
                            background: "color-mix(in oklab, var(--neon-blue) 10%, transparent)",
                            border: "1px solid color-mix(in oklab, var(--neon-blue) 25%, transparent)",
                            color: "var(--neon-blue)",
                          }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Section>

              <TrustNote />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <div className="h-12 w-12 rounded-full glass-soft flex items-center justify-center mb-4">
                <Brain className="h-5 w-5 text-[var(--neon-blue)]" />
              </div>
              Tap a glowing system to learn what it may need next.
              <div className="mt-3 text-[11px] text-muted-foreground/80 max-w-[220px]">
                Each tap unlocks a calm, friendly summary — no jargon, no judgment.
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Forward path — Twin Map is the first reveal; Mission Control is next. */}
      <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mr-auto font-mono uppercase tracking-[0.18em]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--neon-green)]" />
          Twin map unlocked
          <span className="opacity-50">•</span>
          Next: your first insights
        </span>
        <Link
          to="/upload"
          className="px-4 py-2 rounded-lg glass-soft text-xs font-semibold"
        >
          Back to labs
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg btn-hero text-sm font-semibold"
        >
          {CTA.seeFirstInsights} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tiny section helper used by the active panel                         */
/* ------------------------------------------------------------------ */

function Section({
  Icon,
  title,
  colorVar,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  colorVar: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="h-6 w-6 rounded-md flex items-center justify-center shrink-0"
          style={{
            background: `color-mix(in oklab, var(--${colorVar}) 14%, transparent)`,
            color: `var(--${colorVar})`,
          }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}
