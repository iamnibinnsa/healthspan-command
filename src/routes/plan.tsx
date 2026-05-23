import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { useTwin } from "@/lib/twin-context";
import { INTERVENTIONS, projectScores, INITIAL_DOMAINS } from "@/lib/mockData";
import { StatusPill } from "@/components/StatusPill";
import {
  Sparkles, Loader2, RefreshCw, TrendingDown, AlertTriangle,
  FileText, Stethoscope, Calendar, ShieldCheck, Activity,
  Clock, Target, ListChecks, ChevronRight
} from "lucide-react";
import { FRIENDLY_COPY } from "@/lib/copy";

export const Route = createFileRoute("/plan")({
  component: Plan,
});

/* ------------------------------------------------------------------ */
/*  Mock AI plan generator — deterministic from user context          */
/* ------------------------------------------------------------------ */

interface PhaseItem {
  label: string;
  tags?: string[];
}

interface Phase {
  title: string;
  subtitle: string;
  items: PhaseItem[];
}

interface GeneratedPlan {
  bottlenecks: { label: string; score: number; status: "priority" | "watch"; drivers: string; why: string }[];
  phases: Phase[];
  dailyHabits: string[];
  weeklyTargets: string[];
  physicianItems: string[];
  retestPlan: { timing: string; markers: string; note?: string }[];
  safetyNotes: string[];
  projectedScore: number;
  scoreDelta: number;
}

function buildPlan(
  interventions: string[],
): GeneratedPlan {
  const proj = projectScores(interventions);
  const active = INTERVENTIONS.filter((i) => interventions.includes(i.id));

  const domainEntries = INITIAL_DOMAINS.map((d) => ({
    ...d,
    projected: proj.domains[d.key],
  }));
  const sorted = [...domainEntries].sort((a, b) => a.projected - b.projected);
  const top3 = sorted.slice(0, 3);

  const whyMap: Record<string, string> = {
    metabolic: "Insulin resistance accelerates vascular aging and glycation end-products. Early metabolic correction has outsized downstream cardiovascular and cognitive benefit.",
    cardio: "ApoB-rich particles drive atherogenic risk over decades. Lowering particle number early changes the trajectory of vascular aging.",
    inflammation: "Chronic low-grade inflammation is a convergent pathway for multiple diseases of aging. hs-CRP elevation predicts future cardiac events.",
    muscle: "Sarcopenia is a leading predictor of functional decline and mortality. Muscle is also an endocrine organ; preserving it protects metabolic health.",
    cognition: "Sleep and vascular health are the dominant modifiable levers for cognitive trajectory in midlife. Small deltas compound over years.",
    sleep: "Sleep is the primary recovery and clearance window. Short sleep impairs glucose regulation, HRV, and neurodegenerative clearance.",
  };

  const bottlenecks = top3.map((d) => ({
    label: d.label,
    score: Math.round(d.projected),
    status: (d.projected < 55 ? "priority" : "watch") as "priority" | "watch",
    drivers: d.drivers.slice(0, 2).join(" · "),
    why: whyMap[d.key] || "", 
  }));

  // --- Phases (context-aware) ---
  const isStrength = interventions.includes("strength");
  const isZone2 = interventions.includes("zone2");
  const isSleep = interventions.includes("sleep45");
  const isFiber = interventions.includes("fiber");
  const isProtein = interventions.includes("protein");
  const isAlc = interventions.includes("alcohol");
  const isVitD = interventions.includes("vitd");
  const isApoB = interventions.includes("apob");

  const phases: Phase[] = [
    {
      title: "Weeks 1–2 · Foundation",
      subtitle: "Anchor one habit per domain. Do not optimize yet.",
      items: [
        { label: "Sleep tracking + lights-out target 10:30 pm", tags: isSleep ? ["+45 min enabled"] : ["Baseline"] },
        { label: "Walk 30 min after dinner (glucose buffering)", tags: isZone2 ? ["Zone 2 prep"] : ["Base movement"] },
        { label: "Add 1 fiber-rich serving daily (legumes, vegetables)", tags: isFiber ? ["30 g/day target"] : ["Foundation"] },
        { label: isVitD ? "Begin vitamin D correction after physician confirmation" : "Schedule physician discussion for vitamin D and ApoB", tags: ["Physician-guided"] },
      ],
    },
    {
      title: "Weeks 3–6 · Build",
      subtitle: "Layer in intensity. Track adherence, not perfection.",
      items: [
        { label: isZone2 ? "Zone 2 cardio 3×/week, 45 min each (150 min total)" : "Build aerobic base to 3×/week moderate effort", tags: isZone2 ? ["150 min/wk"] : ["Build"] },
        { label: isStrength ? "Strength training 2–3×/week (compound lifts)" : "Introduce 2 strength sessions per week", tags: isStrength ? ["3×/wk target"] : ["Build"] },
        { label: isProtein ? "Protein target 1.6 g/kg body weight per day" : "Audit protein at each meal; aim 30 g per sitting", tags: isProtein ? ["1.6 g/kg"] : ["Build"] },
        { label: isAlc ? "Reduce alcohol to ≤ 2 drinks/week" : "Audit alcohol frequency; target 4+ alcohol-free days", tags: isAlc ? ["≤2 drinks/wk"] : ["Reduce"] },
      ],
    },
    {
      title: "Weeks 7–12 · Optimize",
      subtitle: "Progressive overload, recalibration, and testing.",
      items: [
        { label: isZone2 ? "Zone 2 volume stable; add 1× Zone 5 interval session/week" : "Increase aerobic volume and add 1 interval session", tags: ["Progress"] },
        { label: isStrength ? "Strength 3×/week with progressive overload tracking" : "Progress to 3 sessions with load progression", tags: ["Overload"] },
        { label: "Recheck labs at week 12 (see retest plan below)", tags: ["Retest"] },
        { label: isApoB ? "Review ApoB trajectory with physician; discuss pharmacotherapy if > 90 mg/dL" : "Schedule lipid review if ApoB remains elevated", tags: ["Physician-guided"] },
      ],
    },
  ];

  const dailyHabits = [
    "7+ hours sleep with consistent wake time",
    isFiber ? "30 g fiber via whole foods" : "Add 1 high-fiber meal",
    isAlc ? "Alcohol ≤ 2 drinks/week" : "4+ alcohol-free days",
    "Morning sunlight 10+ min (circadian anchor)",
    "Hydration target 2.5–3.0 L",
    isProtein ? "Protein 1.6 g/kg distributed across meals" : "Protein at every meal (target 30 g)",
  ];

  const weeklyTargets = [
    isZone2 ? "150 min Zone 2" : "120+ min moderate cardio",
    isStrength ? "3 strength sessions" : "2+ strength sessions",
    "1 mobility / recovery session",
    "≥ 5 home-cooked dinners",
    "1 weigh-in + waist measure (same day/time)",
  ];

  const physicianItems = [
    "ApoB target and lipid management strategy — potential area to evaluate with clinician",
    "Vitamin D dosing and 3-month recheck — discuss supplementation plan",
    "Fasting glucose trend and HbA1c trajectory — educational insight, not a diagnosis",
    "Cardiovascular screening (CAC score, advanced lipid panel if indicated)",
    "hs-CRP elevation — discuss inflammatory workup if remains > 2 mg/L",
  ];

  const retestPlan = [
    { timing: "Week 6", markers: "Spot-check fasting glucose, sleep & HRV trends from wearable", note: "Track directional trend, not single values" },
    { timing: "Week 12", markers: "Full panel: lipid panel, ApoB, HbA1c, hs-CRP, Vitamin D", note: "Compare to baseline; discuss with clinician" },
  ];

  const safetyNotes = [
    "This plan is an educational decision-support output. It is not a diagnosis, treatment plan, or prescription.",
    "Do not start or change supplements, medications, or exercise intensity without your physician.",
    "Stop any activity that causes chest pain, dizziness, or unusual symptoms and contact a clinician immediately.",
    "Biological age gap projections are directional estimates for demonstration purposes — not clinical predictions.",
  ];

  const scoreDelta = proj.healthspan - proj.baselineHealthspan;

  return {
    bottlenecks,
    phases,
    dailyHabits,
    weeklyTargets,
    physicianItems,
    retestPlan,
    safetyNotes,
    projectedScore: proj.healthspan,
    scoreDelta,
  };
}

/* ------------------------------------------------------------------ */
/*  Plan page component                                                 */
/* ------------------------------------------------------------------ */

function Plan() {
  const { interventions, intake } = useTwin();
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [seed, setSeed] = useState(0);

  const plan = useMemo(() => buildPlan(interventions), [interventions, seed]);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1800);
  }, []);

  const handleRegenerate = useCallback(() => {
    setGenerating(true);
    setSeed((s) => s + 1);
    setTimeout(() => {
      setGenerating(false);
    }, 1400);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">AI-generated plan</div>
          <h1 className="text-4xl font-display font-semibold mt-1">Your 90-Day Healthspan Plan</h1>
        </div>
        {generated && (
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="px-4 py-2 rounded-lg glass text-xs font-semibold inline-flex items-center gap-2 hover:brightness-110 transition disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Regenerating…" : "Regenerate Plan"}
          </button>
        )}
      </div>

      {/* --- Generation overlay --- */}
      {generating && (
        <div className="mt-8 glass rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 scan-beam opacity-40" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-20 w-20 rounded-full border-2 border-[var(--neon-green)]/40 flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-[var(--neon-green)] animate-spin" />
              <div className="absolute inset-0 rounded-full border border-[var(--neon-green)]/20 animate-ping" />
            </div>
            <h2 className="text-xl font-display font-semibold">MediTwin is generating your plan</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Cross-referencing {interventions.length} interventions against your twin profile and public directional evidence…
            </p>
            <div className="mt-6 flex gap-2 text-[11px] font-mono text-muted-foreground">
              <span className="px-2 py-1 rounded border border-[var(--neon-blue)]/20">MODEL: longevity-v1</span>
              <span className="px-2 py-1 rounded border border-[var(--neon-blue)]/20">TEMP: 0.2</span>
              <span className="px-2 py-1 rounded border border-[var(--neon-blue)]/20">EVIDENCE: directional-only</span>
            </div>
          </div>
        </div>
      )}

      {/* --- Pre-generate CTA --- */}
      {!generated && !generating && (
        <div className="mt-8">
          {/* Quick context card */}
          <div className="glass rounded-2xl p-5 mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl glass-soft flex items-center justify-center">
                <Activity className="h-5 w-5 text-[var(--neon-blue)]" />
              </div>
              <div>
                <div className="text-sm font-medium">{intake.name} · Age {intake.age}</div>
                <div className="text-xs text-muted-foreground">
                  {interventions.length} intervention{interventions.length !== 1 ? "s" : ""} selected
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {interventions.length === 0 && (
                <span className="text-xs text-muted-foreground">No interventions selected — <Link to="/simulator" className="underline text-[var(--neon-blue)]">open simulator</Link></span>
              )}
              {INTERVENTIONS.filter((i) => interventions.includes(i.id)).map((i) => (
                <span key={i.id} className="text-[11px] px-2 py-1 rounded-full border border-[var(--neon-green)]/30 text-[var(--neon-green)] font-mono">
                  {i.label}
                </span>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-12 text-center">
            <div className="h-16 w-16 mx-auto rounded-2xl glass flex items-center justify-center mb-4 relative">
              <Sparkles className="h-7 w-7 text-[var(--neon-green)]" />
              <div className="absolute inset-0 rounded-2xl border border-[var(--neon-green)]/20 animate-ping" />
            </div>
            <h2 className="text-2xl font-display font-semibold">Ready to generate</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
              MediTwin will build a structured 90-day protocol from your twin profile,
              your {interventions.length} selected interventions, and public directional evidence.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleGenerate}
                className="px-8 py-3 rounded-xl btn-hero text-sm font-semibold inline-flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {FRIENDLY_COPY.ctaGeneratePlan}
              </button>
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground max-w-md mx-auto">
              {FRIENDLY_COPY.notDiagnosis}
            </p>

          </div>
        </div>
      )}

      {/* --- Generated report --- */}
      {generated && !generating && (
        <div className="mt-8 space-y-6">
          {/* Report header badge */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="status-pill status-optimal">AI-GENERATED</span>
            <span className="text-xs text-muted-foreground font-mono">PLAN-ID: MT-{Date.now().toString(36).slice(-6).toUpperCase()}</span>
            <span className="text-xs text-muted-foreground font-mono">MODEL: longevity-v1 · EVIDENCE: directional-only</span>
          </div>

          {/* KPI strip */}
          <div className="grid sm:grid-cols-3 gap-4">
            <KpiCard
              icon={<Target className="h-5 w-5 text-[var(--neon-blue)]" />}
              label="Projected Healthspan"
              value={`${plan.projectedScore}`}
              sub={plan.scoreDelta > 0 ? `+${plan.scoreDelta} from baseline` : "Baseline maintained"}
              color="blue"
            />
            <KpiCard
              icon={<TrendingDown className="h-5 w-5 text-[var(--neon-green)]" />}
              label="Biological Age Gap"
              value={`+${Math.max(0, (7.2 - plan.scoreDelta * 0.18)).toFixed(1)} yr`}
              sub={plan.scoreDelta > 0 ? `Directional estimate` : "No change projected"}
              color="green"
            />
            <KpiCard
              icon={<ListChecks className="h-5 w-5 text-[var(--neon-orange)]" />}
              label="Active Interventions"
              value={`${interventions.length}`}
              sub={interventions.length > 0 ? "Personalized protocol" : "General longevity protocol"}
              color="orange"
            />
          </div>

          {/* Bottlenecks */}
          <SectionCard icon={<AlertTriangle className="h-4 w-4 text-[var(--neon-red)]" />} title="Top 3 Healthspan Bottlenecks">
            <div className="space-y-4">
              {plan.bottlenecks.map((b, i) => (
                <div key={i} className="glass-soft rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
                    <span className="text-sm font-medium">{b.label}</span>
                    <StatusPill status={b.status} />
                    <span className="ml-auto font-display text-xl text-[var(--neon-orange)]">{b.score}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono mb-1.5">DRIVERS: {b.drivers}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.why}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 90-Day Protocol */}
          <SectionCard icon={<Calendar className="h-4 w-4 text-[var(--neon-blue)]" />} title="90-Day Protocol">
            <div className="space-y-4">
              {plan.phases.map((phase, idx) => (
                <div key={idx} className="glass-soft rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--neon-blue)] to-transparent opacity-60" />
                  <div className="pl-3">
                    <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-wider">{phase.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 mb-3">{phase.subtitle}</div>
                    <ul className="space-y-2">
                      {phase.items.map((item, j) => (
                        <li key={j} className="flex gap-2 text-sm">
                          <span className="text-[var(--neon-green)] mt-0.5">›</span>
                          <div className="flex-1">
                            {item.label}
                            {item.tags && (
                              <span className="ml-2 inline-flex gap-1.5">
                                {item.tags.map((t) => (
                                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--neon-blue)]/20 text-[var(--neon-blue)] font-mono">{t}</span>
                                ))}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Daily + Weekly grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <SectionCard icon={<Clock className="h-4 w-4 text-[var(--neon-green)]" />} title="Daily Habits">
              <ul className="space-y-2">
                {plan.dailyHabits.map((h, i) => (
                  <li key={i} className="flex gap-2 text-sm"><span className="text-[var(--neon-green)]">›</span>{h}</li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard icon={<Target className="h-4 w-4 text-[var(--neon-orange)]" />} title="Weekly Targets">
              <ul className="space-y-2">
                {plan.weeklyTargets.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm"><span className="text-[var(--neon-orange)]">›</span>{t}</li>
                ))}
              </ul>
            </SectionCard>
          </div>

          {/* Physician items */}
          <SectionCard icon={<Stethoscope className="h-4 w-4 text-[var(--neon-blue)]" />} title="Physician Discussion Items">
            <div className="space-y-3">
              {plan.physicianItems.map((item, i) => (
                <div key={i} className="flex gap-3 text-sm glass-soft rounded-lg p-3">
                  <ChevronRight className="h-4 w-4 text-[var(--neon-blue)] mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              These items are educational discussion prompts, not directives. Shared decision-making with your clinician is essential.
            </p>
          </SectionCard>

          {/* Retest plan */}
          <SectionCard icon={<FileText className="h-4 w-4 text-[var(--neon-green)]" />} title="Biomarker Retest Plan">
            <div className="space-y-3">
              {plan.retestPlan.map((r, i) => (
                <div key={i} className="flex gap-4 glass-soft rounded-lg p-4 items-start">
                  <div className="text-xs font-mono text-[var(--neon-green)] uppercase tracking-wider shrink-0 mt-0.5 w-20">{r.timing}</div>
                  <div className="flex-1">
                    <div className="text-sm">{r.markers}</div>
                    {r.note && <div className="text-[11px] text-muted-foreground mt-1">{r.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Safety */}
          <SectionCard icon={<ShieldCheck className="h-4 w-4 text-[var(--neon-orange)]" />} title="Safety Notes" warn>
            <ul className="space-y-2">
              {plan.safetyNotes.map((note, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
                  <span className="text-[var(--neon-orange)]">•</span>{note}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* CTA footer */}
          <div className="flex flex-wrap gap-3 justify-between items-center pt-2">
            <div className="text-[11px] text-muted-foreground max-w-lg">
              This plan is a hackathon prototype output. All scores and projections are interpretable directional estimates,
              not clinical predictions. Discuss all changes with a licensed clinician.
            </div>
            <div className="flex gap-3">
              <Link to="/report" className="px-5 py-2.5 rounded-lg glass text-sm font-semibold">Open Clinician Brief</Link>
              <Link to="/simulator" className="px-5 py-2.5 rounded-lg btn-hero text-sm font-semibold">Back to Simulator</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: "blue" | "green" | "orange";
}) {
  const colorVar = color === "blue" ? "--neon-blue" : color === "green" ? "--neon-green" : "--neon-orange";
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center`} style={{ background: `color-mix(in oklab, var(${colorVar}) 12%, transparent)` }}>
        {icon}
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-display text-3xl" style={{ color: `var(${colorVar})` }}>{value}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

function SectionCard({ icon, title, children, warn }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div className={`glass rounded-2xl p-6 ${warn ? "neon-border-orange" : ""}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      </div>
      {children}
    </div>
  );
}
