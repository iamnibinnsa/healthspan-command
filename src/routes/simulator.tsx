import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTwin } from "@/lib/twin-context";
import {
  INITIAL_DOMAINS, INITIAL_BIO_AGE_GAP, INTERVENTIONS, projectScores,
  type DomainKey,
} from "@/lib/mockData";
import { projectBioAge, bandFromGap, bioAgeReductionFromIds } from "@/lib/bioAgeProjection";
import { CTA, MICROCOPY } from "@/lib/copy";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Legend, Tooltip,
  ReferenceLine, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Sparkles, Moon, Sun, Activity, HeartPulse, Brain,
  Dumbbell, Flame, Plus, Minus, Soup, Stethoscope, Trophy, Star, ChevronRight,
  Dna,
} from "lucide-react";

export const Route = createFileRoute("/simulator")({
  component: Simulator,
});

/* ------------------------------------------------------------------ */
/*  Mapping playground controls → existing intervention IDs             */
/* ------------------------------------------------------------------ */

interface PlaygroundState {
  sleepMin: number;       // 0 → 90 minutes added per night
  wakeOn: boolean;        // → alcohol (consistent recovery)
  zone2Min: number;       // 0 → 180 min/week
  strengthSess: number;   // 0 → 4 sessions/week
  fiberG: number;         // 10 → 40 g/day
  proteinOn: boolean;
  homeOn: boolean;        // soft lifestyle commitment
  apobOn: boolean;
  vitdOn: boolean;
  hrvOn: boolean;         // soft conversation prompt
}

function deriveStateFromIds(ids: string[]): PlaygroundState {
  return {
    sleepMin:     ids.includes("sleep45") ? 45 : 0,
    wakeOn:       ids.includes("alcohol"),
    zone2Min:     ids.includes("zone2") ? 150 : 0,
    strengthSess: ids.includes("strength") ? 3 : 0,
    fiberG:       ids.includes("fiber") ? 30 : 10,
    proteinOn:    ids.includes("protein"),
    homeOn:       false,
    apobOn:       ids.includes("apob"),
    vitdOn:       ids.includes("vitd"),
    hrvOn:        false,
  };
}

function deriveIdsFromState(s: PlaygroundState): string[] {
  const ids: string[] = [];
  if (s.sleepMin >= 30)     ids.push("sleep45");
  if (s.wakeOn)             ids.push("alcohol");
  if (s.zone2Min >= 90)     ids.push("zone2");
  if (s.strengthSess >= 2)  ids.push("strength");
  if (s.fiberG >= 25)       ids.push("fiber");
  if (s.proteinOn)          ids.push("protein");
  if (s.apobOn)             ids.push("apob");
  if (s.vitdOn)             ids.push("vitd");
  return ids;
}

/**
 * Active intervention IDs *owned* by a particular playground section. Used
 * to compute per-section bio-age delta chips ("Recovery Rhythm: −0.6 yr").
 */
type SectionKey = "recovery" | "movement" | "nutrition" | "clinic";
function sectionActiveIds(section: SectionKey, s: PlaygroundState): string[] {
  switch (section) {
    case "recovery":
      return [
        ...(s.sleepMin >= 30 ? ["sleep45"] : []),
        ...(s.wakeOn         ? ["alcohol"] : []),
      ];
    case "movement":
      return [
        ...(s.zone2Min >= 90      ? ["zone2"]    : []),
        ...(s.strengthSess >= 2   ? ["strength"] : []),
      ];
    case "nutrition":
      return [
        ...(s.fiberG >= 25 ? ["fiber"]   : []),
        ...(s.proteinOn   ? ["protein"] : []),
      ];
    case "clinic":
      return [
        ...(s.apobOn ? ["apob"] : []),
        ...(s.vitdOn ? ["vitd"] : []),
      ];
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

function Simulator() {
  const { interventions, setInterventions, intake } = useTwin();

  const [state, setState] = useState<PlaygroundState>(() => deriveStateFromIds(interventions));

  const activeIds = useMemo(() => deriveIdsFromState(state), [state]);
  const activeKey = activeIds.join("|");

  // Sync the playground state to global twin context so /plan and /report stay aligned.
  useEffect(() => {
    setInterventions(activeIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const proj = projectScores(activeIds);
  const bioAge = useMemo(() => projectBioAge(intake.age, activeIds), [intake.age, activeIds]);
  const bioBand = bandFromGap(bioAge.projectedGap);

  const chartData = INITIAL_DOMAINS.map((d) => ({
    name: d.short,
    Before: proj.baselineDomains[d.key],
    "With selected changes": proj.domains[d.key],
    delta: proj.domains[d.key] - proj.baselineDomains[d.key],
  }));

  const healthDelta = proj.healthspan - proj.baselineHealthspan;
  const gapDelta = +(proj.bioAgeGap - INITIAL_BIO_AGE_GAP).toFixed(1);

  // Per-section bio-age contributions (years removed from gap)
  const recoveryYr  = bioAgeReductionFromIds(sectionActiveIds("recovery",  state));
  const movementYr  = bioAgeReductionFromIds(sectionActiveIds("movement",  state));
  const nutritionYr = bioAgeReductionFromIds(sectionActiveIds("nutrition", state));
  const clinicYr    = bioAgeReductionFromIds(sectionActiveIds("clinic",    state));

  const tryAll = () =>
    setState({
      sleepMin: 60, wakeOn: true,
      zone2Min: 150, strengthSess: 3,
      fiberG: 30, proteinOn: true, homeOn: true,
      apobOn: true, vitdOn: true, hrvOn: true,
    });
  const reset = () =>
    setState({
      sleepMin: 0, wakeOn: false,
      zone2Min: 0, strengthSess: 0,
      fiberG: 10, proteinOn: false, homeOn: false,
      apobOn: false, vitdOn: false, hrvOn: false,
    });

  // XP economy: 10 per scoring intervention, 5 per soft commitment.
  const softCount = (state.homeOn ? 1 : 0) + (state.hrvOn ? 1 : 0);
  const xp = activeIds.length * 10 + softCount * 5;

  // Quest stack: human-readable list of what's selected.
  const quests = useMemo(() => buildQuestList(state), [state]);

  // Earned badges
  const badges = useMemo(() => computeBadges(state), [state]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">
            Try small changes
          </div>
          <h1 className="text-4xl font-display font-semibold mt-1">
            Explore what could help
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Explore how sleep, movement, food, and clinician follow-up could support your six body
            systems. {MICROCOPY.educationalSignals} {MICROCOPY.smallChanges}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={tryAll} className="px-3 py-1.5 rounded-lg glass-soft text-xs">
            Try them all
          </button>
          <button onClick={reset} className="px-3 py-1.5 rounded-lg glass-soft text-xs">
            Start over
          </button>
        </div>
      </div>

      {/* TOP SUMMARY */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Current score"
          base={proj.baselineHealthspan}
          value={proj.baselineHealthspan}
          color="neon-blue"
        />
        <Kpi
          label="Potential score"
          base={proj.baselineHealthspan}
          value={proj.healthspan}
          delta={healthDelta}
          color="neon-green"
          higherIsBetter
        />
        <OpportunityCard delta={healthDelta} gapDelta={gapDelta} />
        <ActiveChangesCard count={activeIds.length + softCount} totalScoring={INTERVENTIONS.length + 2} />
      </div>

      {/* BIO-AGE PROJECTION STRIP */}
      <BioAgeProjectionStrip
        chronologicalAge={intake.age}
        baselineBioAge={bioAge.baselineBioAge}
        projectedBioAge={bioAge.projectedBioAge}
        yearsImproved={bioAge.yearsImproved}
        bandLabel={bioBand.label}
        bandColor={bioBand.color}
      />

      {/* MAIN: playground (col-8) + aside (col-4) */}
      <div className="grid lg:grid-cols-12 gap-5 lg:gap-6">
        <div className="lg:col-span-8 space-y-5">
          <RecoveryRhythmSection state={state} setState={setState} bioYr={recoveryYr} />
          <MovementBuilderSection state={state} setState={setState} bioYr={movementYr} />
          <FuelNutritionSection state={state} setState={setState} bioYr={nutritionYr} />
          <ClinicianConvoSection state={state} setState={setState} bioYr={clinicYr} />
        </div>

        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 self-start">
          <TwinXPCard xp={xp} active={activeIds.length + softCount} />
          <BadgesCard badges={badges} />
          <SystemOrbitPreview proj={proj} />
          <QuestStackCard quests={quests} />
        </aside>
      </div>

      {/* BEFORE / AFTER CHART */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Before vs. With selected changes
            </div>
            <div className="font-display text-lg mt-1">How your six body systems could shift</div>
          </div>
          <div className="text-[11px] text-muted-foreground italic">
            Directional demo estimate &mdash; not a clinical prediction.
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={chartData} barGap={6}>
              <defs>
                <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.55 0.06 230)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="oklch(0.4 0.05 230)" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="projectedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--neon-green)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--neon-blue)" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.4 0.05 230 / 0.2)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "oklch(0.85 0.02 230)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "oklch(0.7 0.02 230)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "oklch(0.5 0.05 230 / 0.08)" }}
                contentStyle={{
                  background: "oklch(0.2 0.03 250 / 0.95)",
                  border: "1px solid oklch(0.4 0.05 230 / 0.4)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number, name) => [`${v}`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine
                y={75}
                stroke="var(--neon-green)"
                strokeDasharray="3 4"
                strokeOpacity={0.4}
                label={{ value: "on-track zone", fill: "var(--neon-green)", fontSize: 10, position: "right" }}
              />
              <Bar dataKey="Before" fill="url(#baselineGrad)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="With selected changes" fill="url(#projectedGrad)" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fillOpacity={entry.delta > 0 ? 1 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-domain delta strip */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-5">
          {chartData.map((d) => (
            <div key={d.name} className="glass-soft rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.name}</div>
              <div className="font-mono text-sm mt-0.5">
                {d.Before} →{" "}
                <span className="text-[var(--neon-green)]">{d["With selected changes"]}</span>
              </div>
              <div
                className={`text-[10px] font-mono ${d.delta > 0 ? "text-[var(--neon-green)]" : "text-muted-foreground"}`}
              >
                {d.delta > 0 ? `+${d.delta}` : d.delta} pts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA STRIP */}
      <div className="flex justify-end gap-3 items-center flex-wrap">
        <span className="text-xs text-muted-foreground mr-auto">
          Like what you see? Turn this into a calm, week-by-week guide.
        </span>
        <Link
          to="/plan"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-hero text-sm font-semibold"
        >
          {CTA.build90DayGuide} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Top-summary cards                                                    */
/* ------------------------------------------------------------------ */

function Kpi({
  label, base, value, delta, color, higherIsBetter,
}: {
  label: string;
  base: number;
  value: number;
  delta?: number;
  color: string;
  higherIsBetter?: boolean;
}) {
  const showDelta = typeof delta === "number" && delta !== 0;
  const good = higherIsBetter ? (delta ?? 0) > 0 : (delta ?? 0) < 0;
  const TrendIcon =
    !showDelta ? null : higherIsBetter
      ? (delta as number) > 0 ? TrendingUp : TrendingDown
      : (delta as number) < 0 ? TrendingDown : TrendingUp;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display text-5xl text-[var(--${color})] mt-2 tabular-nums`}>{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
        Baseline {base}
        {showDelta && (
          <span
            className={`inline-flex items-center gap-0.5 font-mono ${
              good ? "text-[var(--neon-green)]" : "text-[var(--neon-orange)]"
            }`}
          >
            {TrendIcon && <TrendIcon className="h-3 w-3" />}
            {(delta as number) > 0 ? "+" : ""}{Number((delta as number).toFixed(1))}
          </span>
        )}
      </div>
    </div>
  );
}

function OpportunityCard({ delta, gapDelta }: { delta: number; gapDelta: number }) {
  const tier = Math.floor(Math.max(0, delta) / 10);
  const message =
    delta <= 0
      ? "Move a slider to unlock"
      : delta < 5
        ? "Small lift available"
        : delta < 10
          ? "Meaningful lift available"
          : "Big opportunity unlocked";

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--neon-green) 14%, oklch(0.22 0.03 250 / 0.6)), color-mix(in oklab, var(--neon-blue) 8%, oklch(0.22 0.03 250 / 0.55)))",
        border: "1px solid color-mix(in oklab, var(--neon-green) 30%, transparent)",
      }}
    >
      <div
        aria-hidden
        className="absolute -bottom-12 -right-10 h-32 w-32 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--neon-green)" }}
      />
      <div className="relative">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Opportunity unlocked</div>
        <div className="font-display text-5xl mt-2 tabular-nums text-[var(--neon-green)]">
          {delta > 0 ? "+" : ""}{delta}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">
          potential lift in your readiness · {gapDelta < 0 ? `${gapDelta}` : `${gapDelta > 0 ? "+" : ""}${gapDelta}`} yr body-age shift
        </div>
        {/* Re-mounts on every 10-pt tier crossing → smooth re-animation */}
        {delta >= 10 && (
          <div
            key={tier}
            className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider animate-in fade-in slide-in-from-bottom-1 duration-500"
            style={{
              color: "var(--neon-green)",
              background: "color-mix(in oklab, var(--neon-green) 18%, transparent)",
              border: "1px solid color-mix(in oklab, var(--neon-green) 38%, transparent)",
              boxShadow: "0 0 16px -4px var(--neon-green)",
            }}
          >
            <Sparkles className="h-3 w-3" />
            +{Math.floor(delta / 10) * 10} point lift unlocked
          </div>
        )}
        {delta < 10 && (
          <div className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveChangesCard({ count, totalScoring }: { count: number; totalScoring: number }) {
  return (
    <div className="glass rounded-2xl p-5 relative overflow-hidden">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Active changes</div>
      <div className="font-display text-5xl neon-text-green mt-2 flex items-baseline gap-1 tabular-nums">
        {count}
        <span className="text-2xl text-muted-foreground">/{totalScoring}</span>
      </div>
      <div className="text-[11px] text-muted-foreground mt-2 italic">
        Friendly preview &mdash; not a medical prediction.
      </div>
      <Sparkles className="absolute -right-3 -bottom-3 h-20 w-20 text-[var(--neon-green)]/10" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Playground sections                                                  */
/* ------------------------------------------------------------------ */

interface SectionProps {
  state: PlaygroundState;
  setState: React.Dispatch<React.SetStateAction<PlaygroundState>>;
  /** Years removed from the bio-age gap by this section's active changes. */
  bioYr: number;
}

function PlaygroundShell({
  title, subtitle, color, Icon, feedback, bioYr, children,
}: {
  title: string;
  subtitle: string;
  color: "neon-green" | "neon-blue" | "neon-orange" | "neon-red";
  Icon: React.ComponentType<{ className?: string }>;
  feedback: string;
  bioYr?: number;
  children: React.ReactNode;
}) {
  const showBio = typeof bioYr === "number" && bioYr > 0;
  return (
    <div
      className="rounded-2xl p-5 sm:p-6 space-y-4"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, var(--${color}) 8%, oklch(0.22 0.03 250 / 0.6)), oklch(0.22 0.03 250 / 0.55))`,
        border: `1px solid color-mix(in oklab, var(--${color}) 26%, transparent)`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `color-mix(in oklab, var(--${color}) 14%, transparent)`,
            color: `var(--${color})`,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg font-semibold">{title}</div>
          <div className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</div>
        </div>
        {showBio && (
          <span
            className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full shrink-0 self-start"
            title="Estimated years trimmed off your bio-age gap by this section's selections"
            style={{
              color: "var(--neon-green)",
              background: "color-mix(in oklab, var(--neon-green) 10%, transparent)",
              border: "1px solid color-mix(in oklab, var(--neon-green) 28%, transparent)",
            }}
          >
            <Dna className="h-3 w-3" />
            −{bioYr} yr bio age
          </span>
        )}
      </div>

      {children}

      <div
        className="text-[11px] flex items-center gap-1.5 flex-wrap"
        style={{ color: `var(--${color})` }}
      >
        <Sparkles className="h-3 w-3" />
        <span className="opacity-90">Live feedback:</span>
        <span className="text-muted-foreground">{feedback}</span>
        {showBio && (
          <span
            className="sm:hidden inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded ml-auto"
            style={{
              color: "var(--neon-green)",
              background: "color-mix(in oklab, var(--neon-green) 10%, transparent)",
              border: "1px solid color-mix(in oklab, var(--neon-green) 28%, transparent)",
            }}
          >
            <Dna className="h-2.5 w-2.5" />
            −{bioYr} yr bio age
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bio-age projection strip — below the KPI row                        */
/* ------------------------------------------------------------------ */

function BioAgeProjectionStrip({
  chronologicalAge,
  baselineBioAge,
  projectedBioAge,
  yearsImproved,
  bandLabel,
  bandColor,
}: {
  chronologicalAge: number;
  baselineBioAge: number;
  projectedBioAge: number;
  yearsImproved: number;
  bandLabel: string;
  bandColor: "neon-green" | "neon-blue" | "neon-orange" | "neon-red";
}) {
  const improving = yearsImproved > 0;
  return (
    <div
      className="rounded-2xl p-5 sm:p-6 flex flex-wrap items-center gap-5 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(90deg, color-mix(in oklab, var(--neon-blue) 8%, oklch(0.22 0.03 250 / 0.6)), color-mix(in oklab, var(--neon-green) 8%, oklch(0.22 0.03 250 / 0.55)))",
        border: "1px solid color-mix(in oklab, var(--neon-blue) 28%, transparent)",
      }}
    >
      <div
        aria-hidden
        className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: improving ? "var(--neon-green)" : "var(--neon-blue)" }}
      />

      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "color-mix(in oklab, var(--neon-blue) 14%, transparent)",
            color: "var(--neon-blue)",
          }}
        >
          <Dna className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--neon-blue)]">
            Bio age projection
          </div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            Chronological {chronologicalAge} yr · prototype proxy
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 relative">
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Today
          </div>
          <div className="font-display text-2xl tabular-nums text-[var(--neon-blue)]">
            {baselineBioAge}
          </div>
          <div className="text-[10px] text-muted-foreground">yr</div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            With your changes
          </div>
          <div
            className="font-display text-3xl tabular-nums"
            style={{
              color: `var(--${bandColor})`,
              textShadow: `0 0 14px color-mix(in oklab, var(--${bandColor}) 30%, transparent)`,
            }}
          >
            {projectedBioAge}
          </div>
          <div
            className="text-[10px] font-mono uppercase tracking-wider"
            style={{ color: `var(--${bandColor})` }}
          >
            {bandLabel}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-[12rem] sm:text-right relative">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {improving ? "Years rolled back" : "Move a slider to roll back the clock"}
        </div>
        <div
          className="font-display text-3xl tabular-nums"
          style={{
            color: improving ? "var(--neon-green)" : "var(--muted-foreground)",
          }}
        >
          {improving ? `−${yearsImproved} yr` : "—"}
        </div>
        <Link
          to="/clock"
          className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--neon-blue)] hover:brightness-125 transition"
        >
          See full bio age clock <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function RecoveryRhythmSection({ state, setState, bioYr }: SectionProps) {
  return (
    <PlaygroundShell
      title="Recovery Rhythm"
      subtitle="Sleep is your body's nightly repair window. Small, consistent shifts here ripple into mood, focus, and inflammation."
      color="neon-blue"
      Icon={Moon}
      feedback="improves Recovery, Cognition, Inflammation"
      bioYr={bioYr}
    >
      <SliderRow
        label="Sleep added per night"
        Icon={Moon}
        color="neon-blue"
        value={state.sleepMin}
        min={0}
        max={90}
        step={5}
        unit=" min"
        liveLabel={
          state.sleepMin === 0 ? "Today's baseline" :
          state.sleepMin < 30  ? "Building the habit" :
          state.sleepMin < 60  ? "Recovery boost" :
          "Strong recovery window"
        }
        threshold={30}
        thresholdNote="Recovery boost kicks in at +30 min"
        onChange={(v) => setState((s) => ({ ...s, sleepMin: v }))}
      />
      <ToggleRow
        label="Consistent wake time"
        sub="Same wake time most days, even on weekends."
        Icon={Sun}
        color="neon-blue"
        active={state.wakeOn}
        onToggle={() => setState((s) => ({ ...s, wakeOn: !s.wakeOn }))}
      />
    </PlaygroundShell>
  );
}

function MovementBuilderSection({ state, setState, bioYr }: SectionProps) {
  return (
    <PlaygroundShell
      title="Movement Builder"
      subtitle="Steady, low-stress movement plus a few strength sessions per week is one of the highest-leverage longevity stacks."
      color="neon-green"
      Icon={Activity}
      feedback="improves Metabolic, Heart, Muscle, Cognition"
      bioYr={bioYr}
    >
      <SliderRow
        label="Zone 2 cardio per week"
        Icon={Activity}
        color="neon-green"
        value={state.zone2Min}
        min={0}
        max={180}
        step={15}
        unit=" min"
        liveLabel={
          state.zone2Min === 0 ? "Just getting started" :
          state.zone2Min < 90  ? "Building aerobic base" :
          state.zone2Min < 150 ? "Strong cardio rhythm" :
          "Mitochondrial momentum"
        }
        threshold={90}
        thresholdNote="Aerobic boost kicks in at 90 min/week"
        onChange={(v) => setState((s) => ({ ...s, zone2Min: v }))}
      />
      <StepperRow
        label="Strength sessions per week"
        sub="Compound lifts or resistance work — keeps muscle and metabolism strong."
        Icon={Dumbbell}
        color="neon-green"
        value={state.strengthSess}
        min={0}
        max={4}
        threshold={2}
        thresholdNote="Strength boost kicks in at 2/week"
        onChange={(v) => setState((s) => ({ ...s, strengthSess: v }))}
      />
    </PlaygroundShell>
  );
}

function FuelNutritionSection({ state, setState, bioYr }: SectionProps) {
  return (
    <PlaygroundShell
      title="Fuel & Nutrition"
      subtitle="Gentle, doable shifts in fiber, protein, and home-cooked meals tend to lift several systems at once."
      color="neon-orange"
      Icon={Soup}
      feedback="improves Metabolic, Inflammation, Muscle"
      bioYr={bioYr}
    >
      <SliderRow
        label="Daily fiber target"
        Icon={Flame}
        color="neon-orange"
        value={state.fiberG}
        min={10}
        max={40}
        step={1}
        unit=" g"
        liveLabel={
          state.fiberG < 18 ? "Today's average" :
          state.fiberG < 25 ? "Building variety" :
          state.fiberG < 32 ? "Microbiome friendly" :
          "Fiber champion"
        }
        threshold={25}
        thresholdNote="Metabolic boost kicks in at 25 g/day"
        onChange={(v) => setState((s) => ({ ...s, fiberG: v }))}
      />
      <ToggleRow
        label="Protein at every meal"
        sub="Anchor each meal with ~30 g protein for satiety and muscle support."
        Icon={Dumbbell}
        color="neon-orange"
        active={state.proteinOn}
        onToggle={() => setState((s) => ({ ...s, proteinOn: !s.proteinOn }))}
      />
      <ToggleRow
        label="More home-cooked meals"
        sub="A gentle commitment — supports your routine and your Quest Stack."
        Icon={Soup}
        color="neon-orange"
        soft
        active={state.homeOn}
        onToggle={() => setState((s) => ({ ...s, homeOn: !s.homeOn }))}
      />
    </PlaygroundShell>
  );
}

function ClinicianConvoSection({ state, setState, bioYr }: SectionProps) {
  return (
    <PlaygroundShell
      title="Clinician Conversation"
      subtitle="These add a doctor-discussion quest, not automatic treatment. Bring them to your next visit."
      color="neon-coral"
      Icon={Stethoscope}
      feedback="adds doctor-discussion quests, never auto-treats"
      bioYr={bioYr}
    >
      <ToggleRow
        label="Discuss ApoB / lipids"
        sub="Asks your clinician about advanced lipid markers and lipid-lowering strategy."
        Icon={HeartPulse}
        color="neon-coral"
        active={state.apobOn}
        onToggle={() => setState((s) => ({ ...s, apobOn: !s.apobOn }))}
      />
      <ToggleRow
        label="Discuss Vitamin D"
        sub="Confirms dosing, recheck timing, and any supplementation plan."
        Icon={Sun}
        color="neon-coral"
        active={state.vitdOn}
        onToggle={() => setState((s) => ({ ...s, vitdOn: !s.vitdOn }))}
      />
      <ToggleRow
        label="Discuss sleep / HRV concerns"
        sub="A gentle conversation prompt — adds to your Quest Stack."
        Icon={Moon}
        color="neon-coral"
        soft
        active={state.hrvOn}
        onToggle={() => setState((s) => ({ ...s, hrvOn: !s.hrvOn }))}
      />
    </PlaygroundShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Slider / stepper / toggle rows                                       */
/* ------------------------------------------------------------------ */

function SliderRow({
  label, Icon, color, value, min, max, step, unit, liveLabel, threshold, thresholdNote, onChange,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  liveLabel: string;
  threshold: number;
  thresholdNote: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const triggered = value >= threshold;
  const thresholdPct = ((threshold - min) / (max - min)) * 100;

  return (
    <div className="rounded-xl p-3 glass-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 shrink-0" style={{ color: `var(--${color})` }} />
          <span className="text-sm font-medium truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="font-display text-lg tabular-nums"
            style={{ color: `var(--${color})` }}
          >
            {value > 0 ? "+" : ""}{value}{unit}
          </span>
        </div>
      </div>

      <div className="relative mt-3">
        {/* track */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[oklch(0.3_0.04_250/0.5)]" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full transition-all"
          style={{
            left: 0,
            width: `${pct}%`,
            background: `linear-gradient(90deg, var(--${color}), color-mix(in oklab, var(--${color}) 60%, transparent))`,
            boxShadow: `0 0 10px -2px var(--${color})`,
          }}
        />
        {/* threshold tick */}
        <div
          aria-hidden
          className="absolute top-1/2 -translate-y-1/2 h-3 w-px"
          style={{
            left: `${thresholdPct}%`,
            background: `color-mix(in oklab, var(--${color}) 70%, transparent)`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          className="relative w-full bg-transparent appearance-none cursor-pointer h-5"
          style={{ accentColor: `var(--${color})` }}
        />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 mt-2">
        <span
          className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            color: `var(--${color})`,
            background: `color-mix(in oklab, var(--${color}) 12%, transparent)`,
            border: `1px solid color-mix(in oklab, var(--${color}) 30%, transparent)`,
          }}
        >
          {liveLabel}
        </span>
        <span
          className="text-[10px] font-mono"
          style={{
            color: triggered ? `var(--${color})` : "oklch(0.65 0.02 230)",
            opacity: triggered ? 1 : 0.7,
          }}
        >
          {triggered ? "● boost active" : `○ ${thresholdNote}`}
        </span>
      </div>
    </div>
  );
}

function StepperRow({
  label, sub, Icon, color, value, min, max, threshold, thresholdNote, onChange,
}: {
  label: string;
  sub: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  value: number;
  min: number;
  max: number;
  threshold: number;
  thresholdNote: string;
  onChange: (v: number) => void;
}) {
  const triggered = value >= threshold;
  return (
    <div className="rounded-xl p-3 glass-soft">
      <div className="flex items-start gap-3">
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `color-mix(in oklab, var(--${color}) 14%, transparent)`,
            color: `var(--${color})`,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-[11px] text-muted-foreground">{sub}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            aria-label="Decrease"
            onClick={() => onChange(Math.max(min, value - 1))}
            className="h-8 w-8 rounded-lg glass-soft flex items-center justify-center hover:scale-105 transition disabled:opacity-30"
            disabled={value <= min}
          >
            <Minus className="h-4 w-4" />
          </button>
          <div
            className="font-display text-2xl tabular-nums w-7 text-center"
            style={{ color: `var(--${color})` }}
          >
            {value}
          </div>
          <button
            type="button"
            aria-label="Increase"
            onClick={() => onChange(Math.min(max, value + 1))}
            className="h-8 w-8 rounded-lg glass-soft flex items-center justify-center hover:scale-105 transition disabled:opacity-30"
            disabled={value >= max}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {Array.from({ length: max - min + 1 }).map((_, i) => {
          const filled = i < value - min;
          return (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all"
              style={{
                background: filled
                  ? `var(--${color})`
                  : "oklch(0.3 0.04 250 / 0.5)",
                boxShadow: filled
                  ? `0 0 8px color-mix(in oklab, var(--${color}) 60%, transparent)`
                  : undefined,
              }}
            />
          );
        })}
      </div>
      <div
        className="mt-2 text-[10px] font-mono"
        style={{
          color: triggered ? `var(--${color})` : "oklch(0.65 0.02 230)",
          opacity: triggered ? 1 : 0.7,
        }}
      >
        {triggered ? "● boost active" : `○ ${thresholdNote}`}
      </div>
    </div>
  );
}

function ToggleRow({
  label, sub, Icon, color, active, onToggle, soft,
}: {
  label: string;
  sub: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  active: boolean;
  onToggle: () => void;
  /** Soft commitments don't activate scoring interventions but contribute to XP. */
  soft?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className="w-full text-left rounded-xl p-3 glass-soft flex items-center gap-3 transition hover:scale-[1.005]"
      style={{
        background: active
          ? `linear-gradient(135deg, color-mix(in oklab, var(--${color}) 16%, oklch(0.22 0.03 250 / 0.55)), oklch(0.22 0.03 250 / 0.55))`
          : undefined,
        borderColor: active ? `var(--${color})` : "transparent",
        borderWidth: 1,
        borderStyle: "solid",
        boxShadow: active
          ? `0 0 16px -6px color-mix(in oklab, var(--${color}) 55%, transparent)`
          : undefined,
      }}
    >
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: `color-mix(in oklab, var(--${color}) ${active ? 22 : 12}%, transparent)`,
          color: `var(--${color})`,
        }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium flex items-center gap-2">
          {label}
          {soft && (
            <span
              className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                color: "var(--neon-blue)",
                background: "color-mix(in oklab, var(--neon-blue) 10%, transparent)",
                border: "1px solid color-mix(in oklab, var(--neon-blue) 24%, transparent)",
              }}
            >
              soft
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <div
        className="h-6 w-11 rounded-full p-0.5 transition shrink-0 flex"
        style={{
          background: active
            ? `var(--${color})`
            : "oklch(0.3 0.04 250 / 0.7)",
          justifyContent: active ? "flex-end" : "flex-start",
          boxShadow: active
            ? `0 0 12px -2px color-mix(in oklab, var(--${color}) 60%, transparent)`
            : undefined,
        }}
      >
        <span
          className="h-5 w-5 rounded-full bg-white transition-all"
          style={{ background: active ? "oklch(0.12 0.03 250)" : "oklch(0.85 0.02 230)" }}
        />
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Aside cards: XP, Badges, Orbit preview, Quest Stack                  */
/* ------------------------------------------------------------------ */

function TwinXPCard({ xp, active }: { xp: number; active: number }) {
  // Roughly 8 scoring + 2 soft toggles → max ~90 XP in this playground.
  const pct = Math.min(100, Math.round((xp / 90) * 100));
  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--neon-green) 14%, oklch(0.22 0.03 250 / 0.65)), color-mix(in oklab, var(--neon-blue) 10%, oklch(0.22 0.03 250 / 0.55)))",
        border: "1px solid color-mix(in oklab, var(--neon-green) 30%, transparent)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--neon-green)]">
            Twin XP
          </div>
          <div className="font-display text-3xl mt-0.5 text-foreground tabular-nums">{xp}</div>
        </div>
        <Sparkles className="h-7 w-7 text-[var(--neon-green)]" />
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">
        Experiment depth <span className="text-foreground font-medium">{pct}%</span>
        {active > 0 && (
          <span className="text-[var(--neon-green)]">
            {" "}· {active} change{active === 1 ? "" : "s"} active
          </span>
        )}
      </div>
      <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-[oklch(0.3_0.04_250/0.5)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--neon-green), var(--neon-blue))",
            boxShadow: "0 0 12px color-mix(in oklab, var(--neon-blue) 60%, transparent)",
          }}
        />
      </div>
    </div>
  );
}

interface Badge {
  id: string;
  label: string;
  earned: boolean;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: "neon-green" | "neon-blue" | "neon-orange" | "neon-red";
}

function computeBadges(s: PlaygroundState): Badge[] {
  return [
    {
      id: "recovery",
      label: "Recovery Builder",
      earned: s.sleepMin >= 30 || s.wakeOn,
      hint: "Add sleep or anchor a wake time.",
      Icon: Moon,
      color: "neon-blue",
    },
    {
      id: "heart",
      label: "Heart Helper",
      earned: s.apobOn || (s.zone2Min >= 90 && s.fiberG >= 25),
      hint: "Discuss ApoB or stack zone-2 + fiber.",
      Icon: HeartPulse,
      color: "neon-red",
    },
    {
      id: "strength",
      label: "Strength Stacker",
      earned: s.strengthSess >= 2,
      hint: "Hit 2+ strength sessions / week.",
      Icon: Dumbbell,
      color: "neon-green",
    },
    {
      id: "glucose",
      label: "Glucose Guardian",
      earned: s.fiberG >= 25 && (s.proteinOn || s.strengthSess >= 2),
      hint: "Pair fiber 25g+ with protein or lifting.",
      Icon: Activity,
      color: "neon-orange",
    },
    {
      id: "doctor",
      label: "Doctor-Ready",
      earned: s.apobOn && s.vitdOn,
      hint: "Plan two clinician discussions.",
      Icon: Stethoscope,
      color: "neon-blue",
    },
  ];
}

function BadgesCard({ badges }: { badges: Badge[] }) {
  const earned = badges.filter((b) => b.earned).length;
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "oklch(0.22 0.03 250 / 0.65)",
        border: "1px solid color-mix(in oklab, var(--neon-blue) 25%, transparent)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[var(--neon-green)]" />
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--neon-green)]">
            Badges
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {earned} / {badges.length}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2">
        {badges.map((b) => {
          const Icon = b.Icon;
          return (
            <div
              key={b.id}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition"
              style={{
                background: b.earned
                  ? `linear-gradient(135deg, color-mix(in oklab, var(--${b.color}) 16%, transparent), oklch(0.22 0.03 250 / 0.45))`
                  : "oklch(0.22 0.03 250 / 0.45)",
                border: b.earned
                  ? `1px solid color-mix(in oklab, var(--${b.color}) 35%, transparent)`
                  : "1px solid color-mix(in oklab, var(--neon-blue) 12%, transparent)",
                opacity: b.earned ? 1 : 0.55,
                boxShadow: b.earned
                  ? `0 0 12px -4px color-mix(in oklab, var(--${b.color}) 55%, transparent)`
                  : undefined,
              }}
            >
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: `color-mix(in oklab, var(--${b.color}) ${b.earned ? 22 : 8}%, transparent)`,
                  color: `var(--${b.color})`,
                }}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium truncate">{b.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {b.earned ? "Earned" : b.hint}
                </div>
              </div>
              {b.earned && <Star className="h-3.5 w-3.5 text-[var(--neon-green)] shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ORBIT_ICONS: Record<DomainKey, React.ComponentType<{ className?: string }>> = {
  cognition: Brain,
  cardio: HeartPulse,
  metabolic: Activity,
  sleep: Moon,
  muscle: Dumbbell,
  inflammation: Flame,
};

function SystemOrbitPreview({
  proj,
}: {
  proj: ReturnType<typeof projectScores>;
}) {
  const N = INITIAL_DOMAINS.length;
  // Nodes sit at 34% of half-width from center (matches outer SVG ring r=68 in viewBox 200).
  // Inner ring r=42 frames the center readout; together these guarantee the icon boxes never
  // overlap the score, and labels stay clear of the card edge.
  const NODE_RADIUS_PCT = 34;
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "oklch(0.22 0.03 250 / 0.65)",
        border: "1px solid color-mix(in oklab, var(--neon-blue) 25%, transparent)",
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--neon-blue)] mb-2">
        Six-system preview
      </div>

      <div className="relative w-full aspect-square mx-auto" style={{ maxWidth: 280 }}>
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
          <circle
            cx="100" cy="100" r="68"
            stroke="oklch(0.5 0.05 230 / 0.3)"
            strokeWidth="1"
            fill="none"
          />
          <circle
            cx="100" cy="100" r="42"
            stroke="oklch(0.5 0.05 230 / 0.18)"
            strokeWidth="1"
            fill="none"
          />
        </svg>

        {/* Center summary */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="font-display text-3xl text-[var(--neon-green)] tabular-nums leading-none">
              {proj.healthspan}
            </div>
            <div className="text-[8px] font-mono uppercase tracking-[0.25em] text-muted-foreground mt-1.5">
              Readiness
            </div>
          </div>
        </div>

        {/* Nodes */}
        {INITIAL_DOMAINS.map((d, i) => {
          const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
          const x = 50 + Math.cos(angle) * NODE_RADIUS_PCT;
          const y = 50 + Math.sin(angle) * NODE_RADIUS_PCT;
          const score = proj.domains[d.key];
          const base = proj.baselineDomains[d.key];
          const lit = score > base;
          const color = score >= 75 ? "neon-green" : score >= 60 ? "neon-blue" : "neon-orange";
          const Icon = ORBIT_ICONS[d.key];
          return (
            <div
              key={d.key}
              className="absolute transition-all duration-400"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                opacity: lit ? 1 : 0.55,
                transform: `translate(-50%, -50%) scale(${lit ? 1.06 : 1})`,
              }}
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `color-mix(in oklab, var(--${color}) ${lit ? 22 : 8}%, transparent)`,
                  border: `1px solid color-mix(in oklab, var(--${color}) ${lit ? 50 : 20}%, transparent)`,
                  color: `var(--${color})`,
                  boxShadow: lit
                    ? `0 0 14px -2px color-mix(in oklab, var(--${color}) 70%, transparent)`
                    : undefined,
                }}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              {/* Label is absolutely positioned beneath each icon so long words (e.g. */}
              {/* INFLAMMATION) cannot push the icon off-axis or wrap. */}
              <div className="absolute left-1/2 top-full -translate-x-1/2 mt-1 text-[9px] font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                {d.short}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-muted-foreground text-center mt-3">
        Systems light up as you select interventions.
      </div>
    </div>
  );
}

function buildQuestList(s: PlaygroundState): { label: string; soft?: boolean }[] {
  const q: { label: string; soft?: boolean }[] = [];
  if (s.sleepMin > 0) q.push({ label: `Sleep +${s.sleepMin} min/night` });
  if (s.wakeOn) q.push({ label: "Consistent wake time" });
  if (s.zone2Min > 0) q.push({ label: `Zone 2 cardio ${s.zone2Min} min/week` });
  if (s.strengthSess > 0)
    q.push({ label: `Strength ${s.strengthSess}× / week` });
  if (s.fiberG > 10) q.push({ label: `Fiber ${s.fiberG} g/day` });
  if (s.proteinOn) q.push({ label: "Protein at every meal" });
  if (s.homeOn) q.push({ label: "More home-cooked meals", soft: true });
  if (s.apobOn) q.push({ label: "Discuss ApoB / lipids with clinician" });
  if (s.vitdOn) q.push({ label: "Discuss Vitamin D with clinician" });
  if (s.hrvOn) q.push({ label: "Discuss sleep / HRV with clinician", soft: true });
  return q;
}

function QuestStackCard({ quests }: { quests: { label: string; soft?: boolean }[] }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--neon-blue) 10%, oklch(0.22 0.03 250 / 0.65)), oklch(0.22 0.03 250 / 0.7))",
        border: "1px solid color-mix(in oklab, var(--neon-blue) 28%, transparent)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--neon-blue)]">
          Quest Stack · your 90-day experiment
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">{quests.length}</span>
      </div>
      {quests.length === 0 ? (
        <div className="text-[12px] text-muted-foreground py-3 text-center">
          Pick a habit on the left to start your quest.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {quests.map((q) => (
            <li
              key={q.label}
              className="flex items-start gap-2 text-[12px] leading-snug"
            >
              <span
                aria-hidden
                className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                style={{
                  background: q.soft ? "var(--neon-blue)" : "var(--neon-green)",
                  boxShadow: `0 0 6px ${q.soft ? "var(--neon-blue)" : "var(--neon-green)"}`,
                }}
              />
              <span>
                {q.label}
                {q.soft && (
                  <span className="ml-1.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                    soft
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
