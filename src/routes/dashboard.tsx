import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import {
  Activity, HeartPulse, Flame, Dumbbell, Brain, Moon, Sparkles, ArrowRight,
} from "lucide-react";
import { useTwin } from "@/lib/twin-context";
import {
  INITIAL_DOMAINS, SAMPLE_BIOMARKERS, projectScores, type DomainKey, type Biomarker, type Status,
} from "@/lib/mockData";
import { HealthGauge } from "@/components/HealthGauge";
import { TwinRecipe } from "@/components/TwinRecipe";
import { HealthSignalCards } from "@/components/HealthSignalCards";
import { computeHealthspan } from "@/lib/scoringEngine";
import { FriendlyStatusBadge } from "@/components/FriendlyStatusBadge";
import { TrustNote } from "@/components/TrustNote";
import { ProgressMiniCard } from "@/components/TwinProgress";
import { FRIENDLY_COPY } from "@/lib/copy";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const ICONS = { Activity, HeartPulse, Flame, Dumbbell, Brain, Moon } as const;

// Friendly domain re-labelings + plain-language insight copy
const FRIENDLY_DOMAIN: Record<
  DomainKey,
  { name: string; why: string; nextStep: string }
> = {
  sleep: {
    name: "Recovery rhythm",
    why: "Your sleep signal suggests your body may benefit from a steadier recovery rhythm.",
    nextStep: "Pick a fixed wake-time for the next 7 days — even on weekends.",
  },
  inflammation: {
    name: "Inflammation balance",
    why: "A few markers hint your body is running with more background 'noise' than ideal.",
    nextStep: "Try 15 minutes of morning daylight and one omega-3 rich meal this week.",
  },
  cardio: {
    name: "Heart & circulation support",
    why: "Your heart system could be supported with a stronger aerobic base over time.",
    nextStep: "Add one easy 'conversation-pace' cardio session — 20 minutes is plenty.",
  },
  metabolic: {
    name: "Metabolic steadiness",
    why: "Your body may appreciate gentler blood-sugar swings through the day.",
    nextStep: "Walk for 10 minutes after your largest meal this week.",
  },
  muscle: {
    name: "Strength reserve",
    why: "Building a bit more strength supports almost every other system over time.",
    nextStep: "Two short strength sessions this week — even 20 minutes counts.",
  },
  cognition: {
    name: "Mental clarity",
    why: "Focus and memory respond well to better sleep and aerobic fitness.",
    nextStep: "Protect a screen-free 30 minutes before bed.",
  },
};

function readinessLabel(score: number) {
  if (score >= 80) return "Excellent foundation";
  if (score >= 70) return "Strong starting point";
  if (score >= 55) return "Good starting point";
  if (score >= 40) return "Lots of room to improve";
  return "A gentle place to begin";
}

function Dashboard() {
  const { interventions, intake, parsedBiomarkers } = useTwin();
  const projected = projectScores(interventions);
  const breakdown = computeHealthspan(intake, interventions);
  const domains = INITIAL_DOMAINS.map((d) => ({ ...d, score: projected.domains[d.key] }));
  const biomarkers: Biomarker[] = parsedBiomarkers
    ? [
        { name: "HbA1c", value: parsedBiomarkers.hba1c, unit: "%", optimal: "< 5.4", status: band(parsedBiomarkers.hba1c, 5.4, 6) },
        { name: "Fasting Glucose", value: parsedBiomarkers.fasting_glucose, unit: "mg/dL", optimal: "70-95", status: band(parsedBiomarkers.fasting_glucose, 95, 110) },
        { name: "ApoB", value: parsedBiomarkers.apob, unit: "mg/dL", optimal: "< 80", status: band(parsedBiomarkers.apob, 80, 100) },
        { name: "LDL-C", value: parsedBiomarkers.ldl_c, unit: "mg/dL", optimal: "< 100", status: band(parsedBiomarkers.ldl_c, 100, 130) },
        { name: "HDL-C", value: parsedBiomarkers.hdl_c, unit: "mg/dL", optimal: "> 50", status: reverseBand(parsedBiomarkers.hdl_c, 50, 40) },
        { name: "Triglycerides", value: parsedBiomarkers.triglycerides, unit: "mg/dL", optimal: "< 100", status: band(parsedBiomarkers.triglycerides, 100, 175) },
        { name: "hs-CRP", value: parsedBiomarkers.hs_crp, unit: "mg/L", optimal: "< 1.0", status: band(parsedBiomarkers.hs_crp, 1, 3) },
        { name: "Vitamin D", value: parsedBiomarkers.vitamin_d, unit: "ng/mL", optimal: "40-60", status: reverseBand(parsedBiomarkers.vitamin_d, 40, 25) },
        { name: "Resting HR", value: parsedBiomarkers.resting_hr, unit: "bpm", optimal: "55-65", status: band(parsedBiomarkers.resting_hr, 65, 75) },
        { name: "HRV", value: parsedBiomarkers.hrv, unit: "ms", optimal: "> 50", status: reverseBand(parsedBiomarkers.hrv, 50, 35) },
        { name: "Sleep Duration", value: parsedBiomarkers.sleep_duration, unit: "hr/night", optimal: "7-8.5", status: reverseBand(parsedBiomarkers.sleep_duration, 7, 6) },
        { name: "VO2 max", value: parsedBiomarkers.vo2_max, unit: "ml/kg/min", optimal: "> 42", status: reverseBand(parsedBiomarkers.vo2_max, 42, 35) },
      ]
    : SAMPLE_BIOMARKERS;

  const radarData = domains.map((d) => ({ domain: d.short, score: d.score, fullMark: 100 }));
  const sorted = [...domains].sort((a, b) => b.score - a.score);
  const strongest = sorted.slice(0, 2);
  const opportunities = [...domains].sort((a, b) => a.score - b.score).slice(0, 3);

  const firstName = (intake.name || "Friend").split(" ")[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Header */}
      <div>
        <div
          className="text-xs font-mono uppercase tracking-[0.3em]"
          style={{ color: "var(--friendly-teal)" }}
        >
          Mission control · {firstName}
        </div>
        <h1 className="text-4xl font-display font-semibold mt-1">Your first healthspan insights</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Here's what your digital twin noticed — explained simply, with next steps you can explore.
        </p>
      </div>

      <ProgressMiniCard />

      {/* Twin Summary hero */}
      <div
        className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--friendly-teal) 10%, transparent), color-mix(in oklab, var(--friendly-mint) 6%, transparent))",
          border: "1px solid color-mix(in oklab, var(--friendly-teal) 30%, transparent)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-[260px] space-y-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide"
                style={{
                  color: "var(--friendly-teal)",
                  border: "1px solid color-mix(in oklab, var(--friendly-teal) 45%, transparent)",
                  background: "color-mix(in oklab, var(--friendly-teal) 12%, transparent)",
                }}
              >
                <Sparkles className="h-3 w-3" /> Twin summary
              </span>
            </div>
            <div className="space-y-2.5 text-[15px] leading-relaxed">
              <p>
                <span className="text-muted-foreground">{firstName},</span> your strongest systems
                are{" "}
                <span className="font-semibold" style={{ color: "var(--friendly-mint)" }}>
                  {FRIENDLY_DOMAIN[strongest[0].key].name}
                </span>{" "}
                and{" "}
                <span className="font-semibold" style={{ color: "var(--friendly-mint)" }}>
                  {FRIENDLY_DOMAIN[strongest[1].key].name}
                </span>
                .
              </p>
              <p>
                Your biggest opportunities are{" "}
                {opportunities.map((o, i) => (
                  <span key={o.key}>
                    <span className="font-semibold" style={{ color: "var(--friendly-amber)" }}>
                      {FRIENDLY_DOMAIN[o.key].name}
                    </span>
                    {i < opportunities.length - 2 ? ", " : i === opportunities.length - 2 ? ", and " : ""}
                  </span>
                ))}
                .
              </p>
              <p className="text-[13px] text-muted-foreground italic">
                Nothing here is a diagnosis — these are signals to learn from and discuss when helpful.
              </p>
            </div>
            <Link
              to="/simulator"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-hero text-sm font-semibold"
            >
              Try improving my score <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Readiness gauge + age gap, compact */}
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="glass-soft rounded-2xl p-5 min-w-[200px] flex-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Twin readiness score
              </div>
              <div className="-my-2">
                <HealthGauge score={projected.healthspan} />
              </div>
              <div
                className="text-center text-[12px] font-medium"
                style={{ color: "var(--friendly-teal)" }}
              >
                {readinessLabel(projected.healthspan)}
              </div>
              <div className="text-center text-[10px] text-muted-foreground mt-1">
                Prototype estimate — not a clinical score.
              </div>
            </div>

            <div className="glass-soft rounded-2xl p-5 min-w-[180px] flex-1 flex flex-col justify-between">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Estimated age gap
              </div>
              <div className="py-3">
                <div
                  className="font-display text-5xl"
                  style={{ color: "var(--friendly-amber)" }}
                >
                  +{projected.bioAgeGap}
                  <span className="text-xl text-muted-foreground font-sans ml-1">yrs</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  vs chronological age ({intake.age})
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground leading-snug">
                A directional estimate based on this demo profile. Small habit shifts can move it.
              </div>
            </div>
          </div>
        </div>
      </div>

      <TrustNote>{FRIENDLY_COPY.signalDisclaimer}</TrustNote>

      {/* Top 3 areas to support */}
      <div>
        <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-2xl font-semibold">Top 3 areas to support first</h2>
            <p className="text-[12px] text-muted-foreground mt-1">
              Small, gentle next steps — pick whichever one feels easiest to start.
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {opportunities.map((o) => {
            const status = o.score >= 75 ? "optimal" : o.score >= 60 ? "watch" : "priority";
            const tone =
              status === "optimal"
                ? "var(--friendly-mint)"
                : status === "watch"
                  ? "var(--friendly-amber)"
                  : "var(--friendly-coral)";
            const Icon = ICONS[o.icon as keyof typeof ICONS] ?? Activity;
            const friendly = FRIENDLY_DOMAIN[o.key];
            return (
              <div
                key={o.key}
                className="glass rounded-2xl p-5 flex flex-col gap-4 transition hover:translate-y-[-2px]"
                style={{
                  border: `1px solid color-mix(in oklab, ${tone} 40%, transparent)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center"
                      style={{ background: `color-mix(in oklab, ${tone} 15%, transparent)` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: tone }} />
                    </div>
                    <div>
                      <div className="font-display text-base font-semibold leading-tight">
                        {friendly.name}
                      </div>
                      <FriendlyStatusBadge status={status} className="mt-1" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-3xl leading-none" style={{ color: tone }}>
                      {o.score}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">of 100</div>
                  </div>
                </div>

                {/* gentle gauge bar */}
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${o.score}%`, background: tone }}
                  />
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Why it matters
                  </div>
                  <p className="text-[13px] leading-relaxed">{friendly.why}</p>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    What may be contributing
                  </div>
                  <ul className="space-y-1 text-[12px] text-muted-foreground">
                    {o.drivers.slice(0, 3).map((d) => (
                      <li key={d} className="flex gap-2">
                        <span style={{ color: tone }}>›</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className="rounded-xl p-3 text-[13px] leading-relaxed mt-auto"
                  style={{
                    background: "color-mix(in oklab, var(--friendly-mint) 8%, transparent)",
                    border: "1px solid color-mix(in oklab, var(--friendly-mint) 25%, transparent)",
                  }}
                >
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    One next step
                  </div>
                  {friendly.nextStep}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Radar — secondary */}
      <details className="glass rounded-2xl p-6 group">
        <summary className="cursor-pointer flex items-center justify-between list-none">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Six-system overview
            </div>
            <div className="font-display text-lg mt-0.5">See all systems at a glance</div>
          </div>
          <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90 text-muted-foreground" />
        </summary>
        <div className="mt-5 grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
            <div className="h-72">
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="oklch(0.5 0.05 230 / 0.4)" />
                  <PolarAngleAxis
                    dataKey="domain"
                    tick={{ fill: "oklch(0.85 0.02 230)", fontSize: 11 }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="var(--friendly-teal)"
                    fill="var(--friendly-teal)"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
            {domains.map((d) => {
              const Icon = ICONS[d.icon as keyof typeof ICONS] ?? Activity;
              const tone =
                d.score >= 75
                  ? "var(--friendly-mint)"
                  : d.score >= 60
                    ? "var(--friendly-teal)"
                    : "var(--friendly-amber)";
              return (
                <div key={d.key} className="glass-soft rounded-xl p-4 flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in oklab, ${tone} 15%, transparent)` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: tone }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {FRIENDLY_DOMAIN[d.key].name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{d.label}</div>
                  </div>
                  <div className="font-display text-xl" style={{ color: tone }}>
                    {d.score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </details>

      {/* Health Signal Cards */}
      <HealthSignalCards biomarkers={biomarkers} />

      {/* How MediTwin builds your score */}
      <TwinRecipe breakdown={breakdown} />

      {/* Bottom CTA */}
      <div
        className="glass rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--friendly-teal) 8%, transparent), transparent)",
        }}
      >
        <div>
          <div className="font-display text-lg font-semibold">
            Curious how these could shift?
          </div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            Explore gentle what-if changes to see how your twin readiness could grow.
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/twin" className="px-5 py-2.5 rounded-xl glass text-sm font-semibold">
            Revisit Twin Map
          </Link>
          <Link
            to="/simulator"
            className="px-5 py-2.5 rounded-xl btn-hero text-sm font-semibold inline-flex items-center gap-2"
          >
            Try improving my score <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function band(value: number, optimalCutoff: number, watchCutoff: number): Status {
  if (value < optimalCutoff) return "optimal";
  if (value < watchCutoff) return "watch";
  return "priority";
}

function reverseBand(value: number, optimalFloor: number, watchFloor: number): Status {
  if (value >= optimalFloor) return "optimal";
  if (value >= watchFloor) return "watch";
  return "priority";
}
