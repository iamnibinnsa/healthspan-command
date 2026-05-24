import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import {
  Activity, HeartPulse, Flame, Dumbbell, Brain, Moon, Sparkles, ArrowRight,
  Lightbulb, Target, Wind, ChevronDown, ShieldCheck, Stethoscope, Dna,
} from "lucide-react";
import { useTwin } from "@/lib/twin-context";
import {
  INITIAL_DOMAINS, INITIAL_BIO_AGE_GAP, SAMPLE_BIOMARKERS, projectScores,
  type Biomarker, type DomainKey,
} from "@/lib/mockData";
import { projectBioAge, bandFromGap } from "@/lib/bioAgeProjection";
import { HealthGauge } from "@/components/HealthGauge";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { computeHealthspan, type DomainBreakdown } from "@/lib/scoringEngine";
import { TrustNote } from "@/components/TrustNote";
import { SECTION_COPY, DOMAIN_BLURBS, CTA, MICROCOPY } from "@/lib/copy";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const ICONS = { Activity, HeartPulse, Flame, Dumbbell, Brain, Moon } as const;

/**
 * Friendly, opportunity-framed names for each body system. Used in the
 * Mission Control "Top 3 areas to support first" cards instead of the more
 * clinical labels stored on INITIAL_DOMAINS.
 */
const FRIENDLY_DOMAIN_NAME: Record<string, string> = {
  metabolic:    "Metabolic balance",
  cardio:       "Heart & circulation support",
  inflammation: "Inflammation balance",
  muscle:       "Strength & mobility",
  cognition:    "Cognition & clarity",
  sleep:        "Recovery rhythm",
};

/**
 * One-sentence "Why it matters" copy for each system — calm, opportunity-led,
 * never alarming. Used in the Top 3 area cards.
 */
const WHY_IT_MATTERS: Record<string, string> = {
  metabolic:    "How your body turns food into steady energy. Small shifts here ripple into mood, focus, and long-term heart health.",
  cardio:       "Your heart and vessels carry oxygen everywhere. Caring for them today is one of the highest-leverage things you can do for the decades ahead.",
  inflammation: "Low background inflammation supports nearly every system. Calmer signals here often mean better recovery, sleep, and clarity.",
  muscle:       "Strength and mobility protect your independence and metabolism — and they respond quickly to gentle, consistent effort.",
  cognition:    "Focus and memory thrive on good sleep, circulation, and movement. Small kind habits compound beautifully here.",
  sleep:        "Sleep is your body's nightly repair window. A steadier recovery rhythm tends to lift almost every other system at once.",
};

/**
 * Friendly status labels for individual lab signals (chip-level).
 * Calmer than the global "Discuss soon" tone used elsewhere — designed for
 * the Mission Control "key health signals" section.
 */
const SIGNAL_STATUS: Record<
  "optimal" | "watch" | "priority",
  { label: string; color: "neon-green" | "neon-orange" | "neon-coral" }
> = {
  optimal:  { label: "Looks steady",   color: "neon-green"  },
  watch:    { label: "Worth watching", color: "neon-orange" },
  priority: { label: "Discuss soon",   color: "neon-coral"    },
};

/**
 * Plain-language one-liner for every lab marker shown on the dashboard.
 * Intentionally short, optimistic, and free of fear language.
 */
const SIGNAL_EXPLAIN: Record<string, string> = {
  "ApoB":            "Counts the cholesterol-carrying particles in your blood. Lower & steadier values are usually friendlier to arteries over time.",
  "LDL-C":           "A long-watched cholesterol number. Lower readings tend to support long-term heart health.",
  "HDL-C":           "Often called the helpful cholesterol. Higher readings are usually friendlier to circulation.",
  "Triglycerides":   "Fat circulating in your blood. Steadier movement and meals tend to gently lower this.",
  "HbA1c":           "Your three-month average blood sugar. Steady readings reflect calm, consistent energy.",
  "Fasting Glucose": "Blood sugar after sleep, before food. Lower-and-steady tends to mean smoother daily energy.",
  "hs-CRP":          "A general inflammation signal. Calmer values often mean better recovery and clarity.",
  "Vitamin D":       "Supports immune balance, mood, and bones. Levels respond gently to sunlight and supplementation.",
  "HRV":             "Heart-rate variability — a calm signal of recovery. Higher readings usually mean your body is bouncing back well.",
  "Resting HR":      "How relaxed your heart is at rest. Lower-and-steady tends to mean stronger cardiovascular fitness.",
  "Sleep Duration":  "Your nightly repair window. Steadier sleep is one of the highest-leverage signals on this page.",
  "VO2 max":         "How efficiently your body uses oxygen during effort. Often the single strongest signal of healthspan.",
};

/**
 * Five system groups for the Mission Control "Your key health signals" section.
 * Each group declares which markers (by exact name) belong to it.
 */
const SIGNAL_GROUPS: {
  key: string;
  title: string;
  blurb: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: "neon-red" | "neon-orange" | "neon-blue" | "neon-green";
  markers: string[];
}[] = [
  {
    key:   "heart",
    title: "Heart & circulation",
    blurb: "How well your heart and vessels move with you.",
    Icon:  HeartPulse,
    color: "neon-red",
    markers: ["ApoB", "LDL-C", "HDL-C", "Triglycerides"],
  },
  {
    key:   "blood-sugar",
    title: "Blood sugar energy",
    blurb: "How smoothly your body turns food into steady energy.",
    Icon:  Activity,
    color: "neon-orange",
    markers: ["HbA1c", "Fasting Glucose"],
  },
  {
    key:   "inflammation",
    title: "Inflammation balance",
    blurb: "How calm or activated your immune system feels each day.",
    Icon:  Flame,
    color: "neon-orange",
    markers: ["hs-CRP", "Vitamin D"],
  },
  {
    key:   "recovery",
    title: "Recovery signals",
    blurb: "Signals from your nights and your wearable.",
    Icon:  Moon,
    color: "neon-blue",
    markers: ["HRV", "Resting HR", "Sleep Duration"],
  },
  {
    key:   "fitness",
    title: "Fitness capacity",
    blurb: "How efficiently your body uses oxygen during effort.",
    Icon:  Dumbbell,
    color: "neon-green",
    markers: ["VO2 max"],
  },
];

/**
 * Ingredients of the Twin Readiness Score, each mapped to a domain key in the
 * existing scoring engine. Order chosen for visual balance, not weight order.
 */
const INGREDIENTS: {
  key: DomainKey;
  title: string;
  blurb: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "metabolic",    title: "Blood sugar energy",   blurb: "How smoothly your body turns food into steady energy.",                    Icon: Activity   },
  { key: "cardio",       title: "Heart & circulation",  blurb: "How well your heart and vessels move with you.",                            Icon: HeartPulse },
  { key: "inflammation", title: "Inflammation balance", blurb: "How calm or activated your immune system feels each day.",                  Icon: Flame      },
  { key: "muscle",       title: "Strength & mobility",  blurb: "Reserves of strength, mobility, and movement quality.",                     Icon: Dumbbell   },
  { key: "cognition",    title: "Brain energy",         blurb: "Focus, memory, and clarity — fueled by sleep and circulation.",             Icon: Brain      },
  { key: "sleep",        title: "Recovery rhythm",      blurb: "Your nightly repair window and how well your body bounces back.",           Icon: Moon       },
];

function Dashboard() {
  const { interventions, intake, parsedBiomarkers, score, scoreLoading, scoreError, computeScore } = useTwin();
  const projected = projectScores(interventions);
  const bioAge = projectBioAge(intake.age, interventions);
  const bioBand = bandFromGap(bioAge.projectedGap);
  const fallbackBreakdown = computeHealthspan(intake, interventions);
  const breakdown = score?.breakdown ?? fallbackBreakdown;
  const fallbackDomains = INITIAL_DOMAINS.map((d) => ({ ...d, score: projected.domains[d.key] }));
  const domains = score?.domains ?? fallbackDomains;

  const biomarkerKey = parsedBiomarkers ? JSON.stringify(parsedBiomarkers) : null;
  useEffect(() => {
    if (!biomarkerKey) return;
    void computeScore();
  }, [biomarkerKey, computeScore]);

  const radarData = domains.map((d) => ({ domain: d.short, score: d.score, fullMark: 100 }));
  const bottlenecks = [...domains].sort((a, b) => a.score - b.score).slice(0, 3);
  const topStrong = [...domains].sort((a, b) => b.score - a.score).slice(0, 2);

  const firstName = (intake.name || "Friend").split(" ")[0];

  // Use backend score if available, fall back to local projection
  const hs = score?.overallHealthspanScore ?? projected.healthspan;
  const readinessLabel =
    hs >= 75 ? "Strong starting point" : hs >= 60 ? "Good starting point" : "Lots of room to improve";
  const readinessColor =
    hs >= 75 ? "neon-green" : hs >= 60 ? "neon-blue" : "neon-orange";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">
          Hi {firstName} — your first insights
        </div>
        <h1 className="text-4xl font-display font-semibold mt-1">Your first healthspan insights</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          {score?.summary ?? "Here's what your digital twin noticed — explained simply, with next steps you can explore."}
          {" "}
          <span className="italic">{MICROCOPY.educationalSignals}</span>
        </p>
        {scoreLoading && (
          <p className="text-xs font-mono mt-2 text-[var(--neon-blue)]">Computing your healthspan score…</p>
        )}
        {scoreError && (
          <p className="text-xs mt-2 text-[var(--neon-red)]">Score unavailable ({scoreError}). Showing local estimate.</p>
        )}
      </div>

      {/* Twin Summary hero */}
      <TwinSummaryHero
        firstName={firstName}
        topStrong={topStrong}
        areas={bottlenecks}
      />

      {/* Top row: gauge · age gap · action card */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* Twin Readiness Score */}
        <div className="lg:col-span-4 glass rounded-2xl p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{SECTION_COPY.twinReadinessScore}</div>
          <HealthGauge score={hs} label="Readiness" />
          <div className="text-center mt-1 space-y-1.5">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"
              style={{
                color: `var(--${readinessColor})`,
                background: `color-mix(in oklab, var(--${readinessColor}) 12%, transparent)`,
                border: `1px solid color-mix(in oklab, var(--${readinessColor}) 32%, transparent)`,
              }}
            >
              {readinessLabel}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Prototype estimate &mdash; not a clinical score.
            </div>
          </div>
        </div>

        {/* Biological age — links to the full clock */}
        <Link
          to="/clock"
          className="lg:col-span-4 glass rounded-2xl p-6 flex flex-col justify-between group transition hover:brightness-110 relative overflow-hidden"
          style={{
            border: `1px solid color-mix(in oklab, var(--${bioBand.color}) 28%, transparent)`,
          }}
        >
          <div
            aria-hidden
            className="absolute -top-10 -right-8 h-32 w-32 rounded-full opacity-15 blur-3xl pointer-events-none"
            style={{ background: `var(--${bioBand.color})` }}
          />
          <div className="relative flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
              <Dna className="h-3.5 w-3.5 text-[var(--neon-blue)]" />
              Biological age
            </div>
            <span
              className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                color: `var(--${bioBand.color})`,
                background: `color-mix(in oklab, var(--${bioBand.color}) 12%, transparent)`,
                border: `1px solid color-mix(in oklab, var(--${bioBand.color}) 32%, transparent)`,
              }}
            >
              {bioBand.label}
            </span>
          </div>

          <div className="relative py-3 flex items-baseline gap-2">
            <div
              className="font-display text-5xl tabular-nums"
              style={{
                color: `var(--${bioBand.color})`,
                textShadow: `0 0 14px color-mix(in oklab, var(--${bioBand.color}) 28%, transparent)`,
              }}
            >
              {bioAge.projectedBioAge}
            </div>
            <div className="text-xs text-muted-foreground">
              yr · chronological {intake.age}
            </div>
          </div>

          <div className="relative flex items-end justify-between gap-2">
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <span
                className="font-mono"
                style={{ color: `var(--${bioBand.color})` }}
              >
                +{projected.bioAgeGap} yr {SECTION_COPY.estimatedAgeGap.toLowerCase()}
              </span>
              {" · "}
              started at +{INITIAL_BIO_AGE_GAP}.
              {bioAge.yearsImproved > 0 && (
                <>
                  {" "}
                  Your selected habits could trim{" "}
                  <span className="text-[var(--neon-green)] font-medium">
                    {bioAge.yearsImproved} yr
                  </span>{" "}
                  off this.
                </>
              )}
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--neon-blue)] inline-flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition">
              See full clock <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* Action card replacing the dense bottlenecks list */}
        <div
          className="lg:col-span-4 glass rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--neon-green) 12%, oklch(0.22 0.03 250 / 0.6)), color-mix(in oklab, var(--neon-blue) 8%, oklch(0.22 0.03 250 / 0.55)))",
            border: "1px solid color-mix(in oklab, var(--neon-green) 28%, transparent)",
          }}
        >
          <div
            aria-hidden
            className="absolute -bottom-16 -right-12 h-44 w-44 rounded-full opacity-25 blur-3xl"
            style={{ background: "var(--neon-green)" }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--neon-green)]">
              <Sparkles className="h-3 w-3" />
              Next best step
            </div>
            <div className="font-display text-2xl mt-2 leading-tight">
              See how small habits could shift these numbers.
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Toggle gentle, evidence-led changes and watch your six-system map respond in real time.
            </p>
          </div>
          <Link
            to="/simulator"
            className="relative mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-hero text-sm font-semibold w-fit"
          >
            {CTA.tryImprovingScore} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Top 3 areas to support first */}
      <div>
        <div className="flex items-end justify-between flex-wrap gap-2 mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {SECTION_COPY.areasToSupportFirst}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Each card explains the area in plain language and offers one gentle next step.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {bottlenecks.map((b, idx) => (
            <AreaCard key={b.key} area={b} idx={idx} />
          ))}
        </div>
      </div>

      {/* Radar + system cards (kept as a secondary, at-a-glance overview) */}
      <div className="grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {SECTION_COPY.bodySystems}
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
              Overview
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="oklch(0.5 0.05 230 / 0.4)" />
                <PolarAngleAxis dataKey="domain" tick={{ fill: "oklch(0.85 0.02 230)", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="var(--neon-blue)" fill="var(--neon-blue)" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
          {domains.map((d) => {
            const Icon = ICONS[d.icon as keyof typeof ICONS] ?? Activity;
            const color = d.score >= 75 ? "neon-green" : d.score >= 60 ? "neon-blue" : "neon-orange";
            return (
              <div key={d.key} className={`glass rounded-2xl p-5 hover:neon-border-${color} transition`}>
                <div className="flex items-start justify-between">
                  <div className={`h-10 w-10 rounded-xl bg-[var(--${color})]/15 flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 text-[var(--${color})]`} />
                  </div>
                  <div className={`font-display text-3xl text-[var(--${color})]`}>{d.score}</div>
                </div>
                <div className="mt-3 font-display font-semibold">{d.label}</div>
                <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  {DOMAIN_BLURBS[d.key] ?? d.drivers.join(" · ")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Your key health signals — grouped by system with friendly chips */}
      <HealthSignalsSection biomarkers={SAMPLE_BIOMARKERS} />

      {/* How MediTwin builds your score — gamified ingredients + drawer */}
      <ScoreRecipeSection breakdown={breakdown} />

      <div className="flex flex-wrap gap-3 justify-end items-center">
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mr-auto max-w-md leading-relaxed">
          <Sparkles className="h-3.5 w-3.5 text-[var(--neon-green)] shrink-0" />
          {MICROCOPY.smallChanges}{" "}
          <span className="italic">{MICROCOPY.bringToClinician}</span>
        </span>
        <Link to="/twin" className="px-5 py-2.5 rounded-lg glass-soft text-sm font-semibold">
          Revisit Twin Map
        </Link>
        <Link to="/simulator" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg btn-hero text-sm font-semibold">
          {CTA.tryImprovingScore} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/report" className="px-5 py-2.5 rounded-lg glass-soft text-sm font-semibold">
          {CTA.openClinicianBrief}
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Twin Summary hero — derives from existing domain data, no new state */
/* ------------------------------------------------------------------ */

function TwinSummaryHero({
  firstName,
  topStrong,
  areas,
}: {
  firstName: string;
  topStrong: { key: string; label: string; short: string }[];
  areas: { key: string; label: string; short: string }[];
}) {
  const strong0 = topStrong[0]?.short ?? "—";
  const strong1 = topStrong[1]?.short ?? "—";
  const a0 = areas[0]?.short ?? "—";
  const a1 = areas[1]?.short ?? "—";
  const a2 = areas[2]?.short ?? "—";

  return (
    <div className="relative glass rounded-3xl p-6 sm:p-8 overflow-hidden neon-border-blue">
      <div
        aria-hidden
        className="absolute -top-20 -right-16 h-52 w-52 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--neon-green)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--neon-blue)" }}
      />

      <div className="relative grid md:grid-cols-12 gap-5 items-center">
        <div className="md:col-span-8 space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--neon-green)] inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Twin summary
          </div>
          <ul className="space-y-2.5 text-sm sm:text-[15px] leading-relaxed">
            <li className="flex gap-2.5">
              <span
                aria-hidden
                className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                style={{ background: "var(--neon-green)", boxShadow: "0 0 10px var(--neon-green)" }}
              />
              <span>
                {firstName}, your strongest systems are{" "}
                <strong className="text-[var(--neon-green)] font-semibold">{strong0}</strong> and{" "}
                <strong className="text-[var(--neon-green)] font-semibold">{strong1}</strong>.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span
                aria-hidden
                className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                style={{ background: "var(--neon-orange)", boxShadow: "0 0 10px color-mix(in oklab, var(--neon-orange) 50%, transparent)" }}
              />
              <span>
                Your biggest opportunities are{" "}
                <strong className="text-[var(--neon-orange)] font-semibold">{a0}</strong>,{" "}
                <strong className="text-[var(--neon-orange)] font-semibold">{a1}</strong>, and{" "}
                <strong className="text-[var(--neon-orange)] font-semibold">{a2}</strong>.
              </span>
            </li>
            <li className="flex gap-2.5 text-muted-foreground">
              <span
                aria-hidden
                className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                style={{ background: "var(--neon-blue)" }}
              />
              <span>
                Nothing here is a diagnosis &mdash; these are signals to learn from and discuss when helpful.
              </span>
            </li>
          </ul>
        </div>

        <div className="md:col-span-4 flex md:justify-end">
          <Link
            to="/simulator"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl btn-hero text-sm font-semibold whitespace-nowrap"
          >
            {CTA.tryImprovingScore} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Top-3 area card — calm, opportunity-framed, no fear language        */
/* ------------------------------------------------------------------ */

interface AreaShape {
  key: string;
  label: string;
  short: string;
  score: number;
  drivers: string[];
  recommendations: string[];
  icon: string;
}

function AreaCard({ area, idx }: { area: AreaShape; idx: number }) {
  const friendly = FRIENDLY_DOMAIN_NAME[area.key] ?? area.label;
  const why = WHY_IT_MATTERS[area.key] ?? DOMAIN_BLURBS[area.key] ?? "";
  // Stay calm: never neon-red. amber for everything < 75; deeper coral only for very low scores.
  const tone: "support" | "focus" = area.score >= 60 ? "support" : "focus";
  const color = tone === "focus" ? "neon-coral" : "neon-orange";
  const phrase = tone === "focus" ? "Focus area" : "Support area";
  const Icon = ICONS[area.icon as keyof typeof ICONS] ?? Wind;

  return (
    <div
      className="glass rounded-2xl p-5 flex flex-col gap-4 transition hover:scale-[1.005]"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, var(--${color}) 7%, oklch(0.22 0.03 250 / 0.6)), oklch(0.22 0.03 250 / 0.55))`,
        border: `1px solid color-mix(in oklab, var(--${color}) 26%, transparent)`,
        // Subdued shadow so the card never feels alarming.
        boxShadow: `0 0 18px -8px color-mix(in oklab, var(--${color}) 40%, transparent)`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `color-mix(in oklab, var(--${color}) 14%, transparent)`,
              color: `var(--${color})`,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--neon-blue)]">
              Focus area {idx + 1}
            </div>
            <div className="font-display font-semibold leading-tight truncate">{friendly}</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-3xl tabular-nums leading-none" style={{ color: `var(--${color})` }}>
            {area.score}
          </div>
          <div
            className="text-[10px] uppercase tracking-wider mt-1"
            style={{ color: `var(--${color})`, opacity: 0.85 }}
          >
            {phrase}
          </div>
        </div>
      </div>

      {/* Why it matters */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
          <Lightbulb className="h-3 w-3 text-[var(--neon-blue)]" /> Why it matters
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{why}</p>
      </div>

      {/* What may be contributing */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-[var(--neon-orange)]" /> What may be contributing
        </div>
        <div className="flex flex-wrap gap-1.5">
          {area.drivers.slice(0, 3).map((d) => (
            <span
              key={d}
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: "color-mix(in oklab, var(--neon-blue) 8%, transparent)",
                border: "1px solid color-mix(in oklab, var(--neon-blue) 22%, transparent)",
              }}
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* One next step */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Target className="h-3 w-3 text-[var(--neon-green)]" /> One next step
        </div>
        <div
          className="rounded-lg p-3 text-sm flex items-start gap-2"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--neon-green) 11%, transparent), color-mix(in oklab, var(--neon-blue) 6%, transparent))",
            border: "1px solid color-mix(in oklab, var(--neon-green) 28%, transparent)",
          }}
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--neon-green)] mt-0.5 shrink-0" />
          <span>{area.recommendations[0]}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Health Signal Cards — replaces the dense biomarker table            */
/* ------------------------------------------------------------------ */

function HealthSignalsSection({ biomarkers }: { biomarkers: Biomarker[] }) {
  const byName = (n: string) => biomarkers.find((b) => b.name === n);

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Your key health signals
          </div>
          <div className="text-sm text-muted-foreground mt-1 max-w-2xl">
            We grouped your lab markers into simple health signals so you can understand what to ask
            about next. {MICROCOPY.educationalSignals}
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {biomarkers.length} signals reviewed
        </span>
      </div>

      {/* Signal Guide legend */}
      <div className="flex flex-wrap gap-2">
        <LegendChip color="neon-green"  label="Steady"          desc="currently aligned with demo target" />
        <LegendChip color="neon-orange" label="Worth watching"  desc="useful to track over time" />
        <LegendChip color="neon-red"    label="Discuss soon"    desc="helpful to bring up with a clinician" />
      </div>

      {/* Grouped cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SIGNAL_GROUPS.map((g) => {
          const markers = g.markers.map(byName).filter((m): m is Biomarker => Boolean(m));
          if (!markers.length) return null;
          return <SignalGroupCard key={g.key} group={g} markers={markers} />;
        })}
      </div>

      <TrustNote />
    </div>
  );
}

function LegendChip({
  color,
  label,
  desc,
}: {
  color: "neon-green" | "neon-orange" | "neon-red";
  label: string;
  desc: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px]"
      style={{
        background: `color-mix(in oklab, var(--${color}) 9%, transparent)`,
        border: `1px solid color-mix(in oklab, var(--${color}) 28%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: `var(--${color})`,
          boxShadow: `0 0 6px var(--${color})`,
        }}
      />
      <span className="font-medium" style={{ color: `var(--${color})` }}>
        {label}
      </span>
      <span className="text-muted-foreground">{desc}</span>
    </span>
  );
}

function SignalGroupCard({
  group,
  markers,
}: {
  group: (typeof SIGNAL_GROUPS)[number];
  markers: Biomarker[];
}) {
  const Icon = group.Icon;
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, var(--${group.color}) 7%, oklch(0.22 0.03 250 / 0.6)), oklch(0.22 0.03 250 / 0.55))`,
        border: `1px solid color-mix(in oklab, var(--${group.color}) 24%, transparent)`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `color-mix(in oklab, var(--${group.color}) 14%, transparent)`,
            color: `var(--${group.color})`,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-display font-semibold leading-tight">{group.title}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{group.blurb}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {markers.map((m) => (
          <SignalChip key={m.name} m={m} />
        ))}
      </div>
    </div>
  );
}

function SignalChip({ m }: { m: Biomarker }) {
  const status = (
    ["optimal", "watch", "priority"].includes(m.status as string) ? m.status : "watch"
  ) as "optimal" | "watch" | "priority";
  const tone = SIGNAL_STATUS[status];
  const explain = SIGNAL_EXPLAIN[m.name] ?? "";
  const showAsk = status !== "optimal";

  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, var(--${tone.color}) 8%, transparent), oklch(0.22 0.03 250 / 0.45))`,
        border: `1px solid color-mix(in oklab, var(--${tone.color}) 24%, transparent)`,
      }}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{m.name}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">target {m.optimal}</div>
        </div>
        <div className="text-right shrink-0">
          <div
            className="font-display text-lg leading-none tabular-nums"
            style={{ color: `var(--${tone.color})` }}
          >
            {m.value}{" "}
            <span className="text-[10px] text-muted-foreground font-sans">{m.unit}</span>
          </div>
          <span
            className="inline-flex items-center gap-1 mt-1 text-[10px] uppercase tracking-wider"
            style={{ color: `var(--${tone.color})` }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: `var(--${tone.color})`,
                boxShadow: `0 0 5px var(--${tone.color})`,
              }}
            />
            {tone.label}
          </span>
        </div>
      </div>
      {explain && (
        <p className="text-[12px] text-muted-foreground leading-relaxed mt-2">{explain}</p>
      )}
      {showAsk && (
        <div
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] rounded-full px-2 py-0.5"
          style={{
            color: "var(--neon-blue)",
            background: "color-mix(in oklab, var(--neon-blue) 10%, transparent)",
            border: "1px solid color-mix(in oklab, var(--neon-blue) 26%, transparent)",
          }}
        >
          <Stethoscope className="h-3 w-3" />
          Ask my clinician
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Score Recipe — gamified replacement for the transparent table       */
/* ------------------------------------------------------------------ */

function ScoreRecipeSection({
  breakdown,
}: {
  breakdown: ReturnType<typeof computeHealthspan>;
}) {
  const byKey = Object.fromEntries(
    breakdown.domains.map((d) => [d.key, d]),
  ) as Record<DomainKey, DomainBreakdown>;

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 text-[var(--neon-blue)]">
          <Sparkles className="h-3.5 w-3.5" />
          <div className="text-[10px] font-mono uppercase tracking-[0.25em]">
            How your twin thinks
          </div>
        </div>
        <h2 className="font-display text-2xl mt-1">How MediTwin builds your score</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Your Twin Readiness Score is a recipe, not a verdict. Six ingredients combine in
          fixed proportions — open any one to see the small inputs inside it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {INGREDIENTS.map((ing) => {
          const dom = byKey[ing.key];
          if (!dom) return null;
          const weight = breakdown.weights[ing.key];
          return <IngredientCard key={ing.key} ing={ing} domain={dom} weight={weight} />;
        })}
      </div>

      {/* Disclaimer */}
      <div
        className="rounded-xl px-4 py-3 flex items-start gap-2 text-[12px] text-muted-foreground"
        style={{
          background: "oklch(0.22 0.03 250 / 0.55)",
          border: "1px solid color-mix(in oklab, var(--neon-blue) 22%, transparent)",
        }}
      >
        <ShieldCheck className="h-4 w-4 text-[var(--neon-blue)] mt-0.5 shrink-0" />
        <span>
          This is an interpretable prototype model for education &mdash; not a clinical score.
        </span>
      </div>

      {/* Drawer: original transparent breakdown for the technically curious */}
      <details className="group rounded-2xl glass-soft overflow-hidden">
        <summary className="cursor-pointer list-none px-5 py-3 flex items-center justify-between hover:bg-[oklch(0.3_0.04_250/0.3)] transition">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[var(--neon-blue)]" />
            <span className="text-sm font-medium">For the technically curious</span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              · weights, sub-scores, and the underlying formula
            </span>
          </div>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="p-1">
          <ScoreBreakdown breakdown={breakdown} />
        </div>
      </details>
    </div>
  );
}

function IngredientCard({
  ing,
  domain,
  weight,
}: {
  ing: (typeof INGREDIENTS)[number];
  domain: DomainBreakdown;
  weight: number;
}) {
  const Icon = ing.Icon;
  const score = domain.score;
  const color = score >= 75 ? "neon-green" : score >= 60 ? "neon-blue" : "neon-orange";
  const weightPct = Math.round(weight * 100);

  // Weight ring math
  const r = 22;
  const c = 2 * Math.PI * r;
  const off = c - (weightPct / 100) * c;

  return (
    <details
      className="group rounded-2xl overflow-hidden transition"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, var(--${color}) 8%, oklch(0.22 0.03 250 / 0.6)), oklch(0.22 0.03 250 / 0.55))`,
        border: `1px solid color-mix(in oklab, var(--${color}) 26%, transparent)`,
      }}
    >
      <summary className="cursor-pointer list-none p-4 flex items-start gap-4 hover:bg-[oklch(0.3_0.04_250/0.15)] transition">
        {/* Weight ring */}
        <div className="relative h-14 w-14 shrink-0">
          <svg viewBox="0 0 60 60" className="absolute inset-0 -rotate-90">
            <circle cx="30" cy="30" r={r} stroke="oklch(0.4 0.04 250 / 0.4)" strokeWidth="4" fill="none" />
            <circle
              cx="30" cy="30" r={r}
              stroke="var(--neon-blue)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={off}
              style={{
                filter: "drop-shadow(0 0 6px color-mix(in oklab, var(--neon-blue) 60%, transparent))",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-display tabular-nums">
            {weightPct}%
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 shrink-0" style={{ color: `var(--${color})` }} />
            <div className="font-display font-semibold truncate">{ing.title}</div>
            <ChevronDown className="h-3.5 w-3.5 ml-auto transition-transform text-muted-foreground group-open:rotate-180" />
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed mt-1">{ing.blurb}</p>

          {/* Current level bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[oklch(0.3_0.04_250/0.5)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${score}%`,
                  background: `linear-gradient(90deg, var(--${color}), color-mix(in oklab, var(--${color}) 60%, transparent))`,
                  boxShadow: `0 0 10px -2px var(--${color})`,
                }}
              />
            </div>
            <span
              className="font-mono text-xs tabular-nums"
              style={{ color: `var(--${color})` }}
            >
              {score}
            </span>
          </div>
        </div>
      </summary>

      {/* Expanded inputs — visual, not table-like */}
      <div
        className="px-4 pb-4 pt-1 space-y-2"
        style={{ borderTop: "1px solid color-mix(in oklab, var(--neon-blue) 14%, transparent)" }}
      >
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground pt-3">
          What goes into this ingredient
        </div>
        {domain.components.map((c) => {
          const cColor =
            c.score >= 75 ? "neon-green" : c.score >= 50 ? "neon-blue" : "neon-orange";
          return (
            <div
              key={c.label}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5"
              style={{ background: "oklch(0.22 0.03 250 / 0.45)" }}
            >
              <div className="text-sm flex-1 min-w-0">
                <span className="font-medium">{c.label}</span>
                <span className="text-muted-foreground ml-2 text-[11px]">{c.raw}</span>
              </div>
              <div className="w-24 h-1.5 rounded-full overflow-hidden bg-[oklch(0.3_0.04_250/0.5)] shrink-0">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${c.score}%`,
                    background: `var(--${cColor})`,
                  }}
                />
              </div>
              <span
                className="text-[11px] font-mono tabular-nums w-10 text-right"
                style={{ color: `var(--${cColor})` }}
              >
                {Math.round(c.score)}
              </span>
              <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">
                {Math.round(c.weight * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </details>
  );
}
