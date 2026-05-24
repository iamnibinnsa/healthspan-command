import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { useTwin, type IntakeData } from "@/lib/twin-context";
import {
  INTERVENTIONS, projectScores, INITIAL_DOMAINS, type DomainKey,
} from "@/lib/mockData";
import { projectBioAge } from "@/lib/bioAgeProjection";
import { TrustNote } from "@/components/TrustNote";
import { SECTION_COPY, CTA, MICROCOPY } from "@/lib/copy";
import {
  Sparkles, Loader2, RefreshCw, TrendingDown, TrendingUp,
  FileText, Stethoscope, Calendar, ShieldCheck, Activity,
  Target, ListChecks, ChevronRight, Compass, Trophy, Info,
  Moon, HeartPulse, Brain, Dumbbell, Flame, CheckCircle2, Circle, Copy,
  Dna,
} from "lucide-react";

export const Route = createFileRoute("/plan")({
  component: Plan,
});

/* ------------------------------------------------------------------ */
/*  Mock AI plan generator — deterministic from user context          */
/* ------------------------------------------------------------------ */

type Difficulty = "easy" | "medium" | "clinician-guided";
type SystemBadge = "Recovery" | "Heart" | "Metabolic" | "Inflammation" | "Muscle" | "Cognition";

interface PhaseItem {
  label: string;
  tags?: string[];
  difficulty: Difficulty;
  system: SystemBadge;
}

interface Phase {
  title: string;
  subtitle: string;
  items: PhaseItem[];
}

interface Bottleneck {
  key: DomainKey;
  label: string;
  score: number;
  status: "priority" | "watch";
  drivers: string;
  why: string;
}

interface GeneratedPlan {
  bottlenecks: Bottleneck[];
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

  const bottlenecks: Bottleneck[] = top3.map((d) => ({
    key: d.key,
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
      title: "Weeks 1–2 · Find your rhythm",
      subtitle: "Anchor a few easy habits and a steady wake time. Do not optimize yet.",
      items: [
        { label: "Sleep tracking + lights-out target 10:30 pm", tags: isSleep ? ["+45 min enabled"] : ["Baseline"], difficulty: "easy", system: "Recovery" },
        { label: "Walk 30 min after dinner (glucose buffering)", tags: isZone2 ? ["Zone 2 prep"] : ["Base movement"], difficulty: "easy", system: "Metabolic" },
        { label: "Add 1 fiber-rich serving daily (legumes, vegetables)", tags: isFiber ? ["30 g/day target"] : ["Foundation"], difficulty: "easy", system: "Metabolic" },
        { label: isVitD ? "Begin vitamin D correction after physician confirmation" : "Schedule physician discussion for vitamin D and ApoB", tags: ["Physician-guided"], difficulty: "clinician-guided", system: "Inflammation" },
      ],
    },
    {
      title: "Weeks 3–6 · Build momentum",
      subtitle: "Layer in cardio, strength, and meal anchors. Track adherence, not perfection.",
      items: [
        { label: isZone2 ? "Zone 2 cardio 3×/week, 45 min each (150 min total)" : "Build aerobic base to 3×/week moderate effort", tags: isZone2 ? ["150 min/wk"] : ["Build"], difficulty: "medium", system: "Heart" },
        { label: isStrength ? "Strength training 2–3×/week (compound lifts)" : "Introduce 2 strength sessions per week", tags: isStrength ? ["3×/wk target"] : ["Build"], difficulty: "medium", system: "Muscle" },
        { label: isProtein ? "Protein target 1.6 g/kg body weight per day" : "Audit protein at each meal; aim 30 g per sitting", tags: isProtein ? ["1.6 g/kg"] : ["Build"], difficulty: "medium", system: "Muscle" },
        { label: isAlc ? "Reduce alcohol to ≤ 2 drinks/week" : "Audit alcohol frequency; target 4+ alcohol-free days", tags: isAlc ? ["≤2 drinks/wk"] : ["Reduce"], difficulty: "medium", system: "Recovery" },
      ],
    },
    {
      title: "Weeks 7–12 · Review and refine",
      subtitle: "Recheck signals, celebrate wins, and adjust gently with your clinician.",
      items: [
        { label: isZone2 ? "Zone 2 volume stable; add 1× Zone 5 interval session/week" : "Increase aerobic volume and add 1 interval session", tags: ["Progress"], difficulty: "medium", system: "Heart" },
        { label: isStrength ? "Strength 3×/week with progressive overload tracking" : "Progress to 3 sessions with load progression", tags: ["Overload"], difficulty: "medium", system: "Muscle" },
        { label: "Recheck labs at week 12 (see retest path below)", tags: ["Retest"], difficulty: "clinician-guided", system: "Metabolic" },
        { label: isApoB ? "Review ApoB trajectory with physician; discuss pharmacotherapy if > 90 mg/dL" : "Schedule lipid review if ApoB remains elevated", tags: ["Physician-guided"], difficulty: "clinician-guided", system: "Heart" },
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
    { timing: "Week 12", markers: "Re-run bio age clock with refreshed labs", note: "Optional educational re-check — uses your new biomarkers to update the proxy" },
  ];

  const safetyNotes = [
    "This plan is an educational decision-support output. It is not a diagnosis, treatment plan, or prescription.",
    "Do not start or change supplements, medications, or exercise intensity without your physician.",
    "Stop any activity that causes chest pain, dizziness, or unusual symptoms and contact a clinician immediately.",
    "Estimated age gap projections are directional estimates for demonstration purposes — not clinical predictions.",
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

const PLAN_API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

function safeBuildPlan(interventions: string[]): GeneratedPlan {
  try {
    return buildPlan(interventions);
  } catch {
    return buildPlan([]);
  }
}

async function tryFetchPlanFromApi(
  interventions: string[],
  intake: IntakeData,
): Promise<GeneratedPlan | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${PLAN_API_BASE}/api/plan/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interventions, intake }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.phases) && data.phases.length > 0) {
      return data as GeneratedPlan;
    }
    return null;
  } catch {
    return null;
  }
}

async function resolvePlan(
  interventions: string[],
  intake: IntakeData,
  minMs = 1200,
): Promise<{ plan: GeneratedPlan; usedFallback: boolean }> {
  const started = Date.now();
  let plan: GeneratedPlan;
  let usedFallback = false;
  const apiConfigured = Boolean(import.meta.env.VITE_API_URL);

  try {
    if (apiConfigured) {
      const remote = await tryFetchPlanFromApi(interventions, intake);
      if (remote) {
        plan = remote;
      } else {
        plan = safeBuildPlan(interventions);
        usedFallback = true;
      }
    } else {
      plan = safeBuildPlan(interventions);
    }
  } catch {
    plan = safeBuildPlan(interventions);
    usedFallback = apiConfigured;
  }
  const elapsed = Date.now() - started;
  if (elapsed < minMs) {
    await new Promise((r) => setTimeout(r, minMs - elapsed));
  }
  return { plan, usedFallback };
}

/* ------------------------------------------------------------------ */
/*  Static metadata for the gamified roadmap                            */
/* ------------------------------------------------------------------ */

const SYSTEM_META: Record<SystemBadge, { color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  Recovery:     { color: "neon-blue",   Icon: Moon },
  Heart:        { color: "neon-red",    Icon: HeartPulse },
  Metabolic:    { color: "neon-green",  Icon: Activity },
  Inflammation: { color: "neon-orange", Icon: Flame },
  Muscle:       { color: "neon-green",  Icon: Dumbbell },
  Cognition:    { color: "neon-blue",   Icon: Brain },
};

const FOCUS_META: Record<DomainKey, {
  shortName: string;
  Icon: React.ComponentType<{ className?: string }>;
  reason: string;
  firstAction: string;
  color: string;
}> = {
  sleep: {
    shortName: "Recovery rhythm",
    Icon: Moon,
    reason: "Sleep is your body's nightly repair window — small, consistent shifts ripple into mood, focus, and inflammation.",
    firstAction: "Set a steady wake time and lights-out window this week.",
    color: "neon-blue",
  },
  inflammation: {
    shortName: "Inflammation balance",
    Icon: Flame,
    reason: "Low-grade inflammation is a quiet driver behind many age-related shifts. Calming it tends to lift several systems together.",
    firstAction: "Add one fiber-rich, plant-forward meal per day.",
    color: "neon-orange",
  },
  cardio: {
    shortName: "Heart & metabolic support",
    Icon: HeartPulse,
    reason: "Vascular health is your long-game engine. Easy daily movement and a clinician chat about lipids go a long way.",
    firstAction: "Walk 10 minutes after your largest meal.",
    color: "neon-orange",
  },
  metabolic: {
    shortName: "Metabolic resilience",
    Icon: Activity,
    reason: "Steady glucose and insulin sensitivity protect almost every other system over time.",
    firstAction: "Anchor each meal with protein and one fiber source.",
    color: "neon-green",
  },
  muscle: {
    shortName: "Strength & muscle reserve",
    Icon: Dumbbell,
    reason: "Muscle is your aging insurance — it stabilizes glucose, joints, and bone for decades.",
    firstAction: "Schedule two short strength sessions this week.",
    color: "neon-green",
  },
  cognition: {
    shortName: "Cognitive clarity",
    Icon: Brain,
    reason: "Sleep quality and vascular health are your most modifiable cognitive levers in midlife.",
    firstAction: "Keep a consistent wake time even on weekends.",
    color: "neon-blue",
  },
};

interface DoctorQuestion {
  ask: string;
  why: string;
  bring: string;
}

const DOCTOR_QUESTIONS: DoctorQuestion[] = [
  {
    ask: "Should we run an ApoB or advanced lipid panel?",
    why: "ApoB-rich particles reflect long-term cardiovascular risk more cleanly than LDL-C alone.",
    bring: "Your most recent lipid panel and any family history of early heart disease.",
  },
  {
    ask: "What does my Vitamin D level suggest about supplementation?",
    why: "Low vitamin D is linked to immune, mood, and bone outcomes — and it is one of the simplest things to correct.",
    bring: "Recent 25-OH vitamin D level if available, plus current supplements you take.",
  },
  {
    ask: "Could we look at my fasting glucose and HbA1c trend?",
    why: "Insulin sensitivity drifts gradually. Catching changes early makes course-correction far easier.",
    bring: "Last two fasting glucose readings and HbA1c, plus a quick log of recent meals.",
  },
  {
    ask: "Is hs-CRP something we should track over time?",
    why: "Persistent low-grade inflammation predicts cardiovascular and metabolic events down the road.",
    bring: "Past hs-CRP values, recent illness history, and any current GI or joint symptoms.",
  },
  {
    ask: "Are there cardiovascular screens worth considering for my age?",
    why: "Calcium scoring or imaging can clarify risk earlier than blood tests alone for some people.",
    bring: "Current blood pressure log and any cardiovascular family history.",
  },
];

function difficultyXP(d: Difficulty): number {
  return d === "easy" ? 5 : d === "medium" ? 10 : 15;
}

function formatWeeklyPlanText(
  plan: GeneratedPlan,
  intake: { name: string; age: number },
  interventions: string[],
): string {
  const lines: string[] = [];
  lines.push(`MediTwin · 90-Day Healthspan Guide`);
  lines.push(`For ${intake.name} (Age ${intake.age})`);
  lines.push(`Habits selected: ${interventions.length}`);
  lines.push(
    `Projected score: ${plan.projectedScore}${plan.scoreDelta > 0 ? ` (+${plan.scoreDelta})` : ""}`,
  );
  lines.push("");
  lines.push("YOUR FOCUS FOR THE NEXT 90 DAYS");
  plan.bottlenecks.forEach((b, i) => {
    const meta = FOCUS_META[b.key];
    lines.push(`  ${i + 1}. ${meta?.shortName ?? b.label}`);
    if (meta) lines.push(`     First action: ${meta.firstAction}`);
  });
  lines.push("");
  plan.phases.forEach((phase) => {
    lines.push(phase.title.toUpperCase());
    lines.push(`  ${phase.subtitle}`);
    phase.items.forEach((item) => {
      lines.push(
        `  - [${item.system} · ${item.difficulty}] ${item.label}` +
          (item.tags ? ` (${item.tags.join(", ")})` : ""),
      );
    });
    lines.push("");
  });
  lines.push("WEEKLY AIMS");
  plan.weeklyTargets.forEach((t) => lines.push(`  - ${t}`));
  lines.push("");
  lines.push("DAILY HABITS");
  plan.dailyHabits.forEach((h) => lines.push(`  - ${h}`));
  lines.push("");
  lines.push("DOCTOR DISCUSSION PACK");
  DOCTOR_QUESTIONS.forEach((q, i) => {
    lines.push(`  Q${i + 1}. ${q.ask}`);
    lines.push(`     Why: ${q.why}`);
    lines.push(`     Bring: ${q.bring}`);
  });
  lines.push("");
  lines.push("RETEST PATH");
  plan.retestPlan.forEach((r) => {
    lines.push(`  ${r.timing}: ${r.markers}`);
    if (r.note) lines.push(`     ${r.note}`);
  });
  lines.push("");
  lines.push("This is an educational guide — not a diagnosis or prescription.");
  lines.push("Discuss any medical changes with your clinician.");
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Plan page component                                                 */
/* ------------------------------------------------------------------ */

function Plan() {
  const { interventions, intake } = useTwin();
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [seed, setSeed] = useState(0);
  const [planOverride, setPlanOverride] = useState<GeneratedPlan | null>(null);
  const [planFallback, setPlanFallback] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const draftPlan = useMemo(() => safeBuildPlan(interventions), [interventions, seed]);
  const plan = planOverride ?? draftPlan;
  const bioAge = useMemo(
    () => projectBioAge(intake.age, interventions),
    [intake.age, interventions],
  );

  const runPlanGeneration = useCallback(async () => {
    setGenerating(true);
    try {
      const { plan: nextPlan, usedFallback } = await resolvePlan(interventions, intake);
      setPlanOverride(nextPlan);
      setPlanFallback(usedFallback);
      setGenerated(true);
    } catch {
      setPlanOverride(safeBuildPlan(interventions));
      setPlanFallback(true);
      setGenerated(true);
    } finally {
      setGenerating(false);
    }
  }, [interventions, intake]);

  const handleGenerate = useCallback(() => {
    void runPlanGeneration();
  }, [runPlanGeneration]);

  const handleRegenerate = useCallback(() => {
    setChecked(new Set());
    setSeed((s) => s + 1);
    void runPlanGeneration();
  }, [runPlanGeneration]);

  const toggleChecked = useCallback((key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const allItems = useMemo(
    () =>
      plan.phases.flatMap((p, pi) =>
        p.items.map((item, ii) => ({ key: `${pi}-${ii}`, phaseIdx: pi, ...item })),
      ),
    [plan.phases],
  );
  const totalCount = allItems.length;
  const doneCount = allItems.filter((it) => checked.has(it.key)).length;
  const maxXP = allItems.reduce((sum, it) => sum + difficultyXP(it.difficulty), 0);
  const questXP = allItems
    .filter((it) => checked.has(it.key))
    .reduce((sum, it) => sum + difficultyXP(it.difficulty), 0);

  const copyWeeklyPlan = useCallback(() => {
    const text = formatWeeklyPlanText(plan, intake, interventions);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [plan, intake, interventions]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">
            {generated ? SECTION_COPY.nextBestSteps : "Your 90-day guide"}
          </div>
          <h1 className="text-4xl font-display font-semibold mt-1">
            {generated ? "Your 90-day healthspan guide" : "Let\u2019s build your 90-day guide"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            {generated
              ? "Three phases. Small weekly actions. Clear notes to bring to your clinician."
              : "We\u2019ll turn your twin map and selected changes into a simple plan you can follow, adjust, and discuss with a clinician."}
          </p>
        </div>
        {generated && (
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="px-4 py-2 rounded-lg glass text-xs font-semibold inline-flex items-center gap-2 hover:brightness-110 transition disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Refreshing…" : "Refresh my plan"}
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
            <h2 className="text-xl font-display font-semibold">Shaping your gentle 90-day plan…</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Weaving the {interventions.length} habit{interventions.length === 1 ? "" : "s"} you chose into your twin&rsquo;s story, with help from public health research.
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
        <div className="mt-8 space-y-5">
          {/* Twin context strip */}
          <div className="glass rounded-2xl p-5 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl glass-soft flex items-center justify-center">
                <Activity className="h-5 w-5 text-[var(--neon-blue)]" />
              </div>
              <div>
                <div className="text-sm font-medium">{intake.name} · Age {intake.age}</div>
                <div className="text-xs text-muted-foreground">
                  {interventions.length} habit{interventions.length !== 1 ? "s" : ""} you&rsquo;re curious about
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {INTERVENTIONS.filter((i) => interventions.includes(i.id)).slice(0, 6).map((i) => (
                <span key={i.id} className="text-[11px] px-2 py-1 rounded-full border border-[var(--neon-green)]/30 text-[var(--neon-green)] font-mono">
                  {i.label}
                </span>
              ))}
            </div>
          </div>

          {/* Main "Your guide is almost ready" card */}
          <div className="glass rounded-3xl p-7 sm:p-9 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-12 -right-12 h-48 w-48 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{ background: "var(--neon-green)" }}
            />
            <div className="relative">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="h-14 w-14 rounded-2xl glass flex items-center justify-center shrink-0 relative">
                  <Sparkles className="h-7 w-7 text-[var(--neon-green)]" />
                  <div className="absolute inset-0 rounded-2xl border border-[var(--neon-green)]/20 animate-ping" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--neon-green)]">
                    Almost ready
                  </div>
                  <h2 className="text-2xl font-display font-semibold mt-1">
                    Your guide is almost ready
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
                    We&rsquo;ll bundle everything below into a single, gentle 90-day guide you can revisit
                    any time, adjust, and bring to your clinician.
                  </p>
                </div>
              </div>

              {/* What's inside */}
              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <IngredientRow
                  Icon={Activity}
                  color="neon-blue"
                  title="Based on your twin profile"
                  sub={`${intake.name} \u00b7 Age ${intake.age}`}
                />
                <IngredientRow
                  Icon={ListChecks}
                  color="neon-green"
                  title="Your selected changes"
                  sub={
                    interventions.length === 0
                      ? "Starter set will be used"
                      : `${interventions.length} habit${interventions.length === 1 ? "" : "s"} from the simulator`
                  }
                />
                <IngredientRow
                  Icon={Target}
                  color="neon-orange"
                  title="Your top areas to support"
                  sub="Drawn from your six-system map"
                />
                <IngredientRow
                  Icon={Stethoscope}
                  color="neon-blue"
                  title="Doctor discussion notes"
                  sub="Conversation starters, never instructions"
                />
              </div>

              {/* Empty state — only if no interventions selected */}
              {interventions.length === 0 && (
                <div
                  className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    background: "color-mix(in oklab, var(--neon-blue) 8%, oklch(0.22 0.03 250 / 0.6))",
                    border: "1px solid color-mix(in oklab, var(--neon-blue) 28%, transparent)",
                  }}
                >
                  <Info className="h-4 w-4 text-[var(--neon-blue)] shrink-0" />
                  <div className="flex-1 text-[13px] leading-relaxed">
                    No changes selected yet &mdash; we&rsquo;ll create a gentle starter plan.{" "}
                    <span className="text-muted-foreground">
                      You can also visit the simulator to personalize it.
                    </span>
                  </div>
                  <Link
                    to="/simulator"
                    className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full transition hover:brightness-110"
                    style={{
                      color: "var(--neon-blue)",
                      background: "color-mix(in oklab, var(--neon-blue) 12%, transparent)",
                      border: "1px solid color-mix(in oklab, var(--neon-blue) 32%, transparent)",
                    }}
                  >
                    {CTA.tryImprovingScore} <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* CTA + reassurance */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="text-[11px] text-muted-foreground italic max-w-md leading-relaxed">
                  {MICROCOPY.educationalSignals} This is not a diagnosis or prescription &mdash;
                  it&rsquo;s a next-step guide to help you organize gentle habits.
                </p>
                <button
                  onClick={handleGenerate}
                  className="px-6 py-3 rounded-xl btn-hero text-sm font-semibold inline-flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {CTA.create90DayGuide}
                </button>
              </div>
            </div>
          </div>

          {/* Phase preview */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--neon-blue)]" />
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Sneak peek at your 90 days
                </div>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                3 phases &middot; 12 weeks
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <PhasePreview
                step={1}
                range="Week 1–2"
                title="Find your rhythm"
                sub="Anchor a few easy habits, set a steady wake time, and tune in to your body."
                color="neon-blue"
                Icon={Compass}
              />
              <PhasePreview
                step={2}
                range="Week 3–6"
                title="Build momentum"
                sub="Layer in cardio, strength, and meal anchors. Track adherence, not perfection."
                color="neon-green"
                Icon={TrendingUp}
              />
              <PhasePreview
                step={3}
                range="Week 7–12"
                title="Review and refine"
                sub="Recheck signals, celebrate wins, and gently adjust with your clinician."
                color="neon-orange"
                Icon={RefreshCw}
              />
            </div>
          </div>

          {/* Next unlock teaser */}
          <div
            className="rounded-2xl px-5 py-3 flex items-center gap-3 flex-wrap"
            style={{
              background:
                "linear-gradient(90deg, color-mix(in oklab, var(--neon-green) 12%, transparent), color-mix(in oklab, var(--neon-blue) 8%, transparent))",
              border: "1px solid color-mix(in oklab, var(--neon-green) 25%, transparent)",
            }}
          >
            <Trophy className="h-4 w-4 text-[var(--neon-green)] shrink-0" />
            <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-[var(--neon-green)]">
              Next unlock
            </span>
            <span className="text-[13px] text-muted-foreground">
              your personal healthspan quest board
            </span>
          </div>

          <div className="max-w-2xl">
            <TrustNote />
          </div>
        </div>
      )}

      {/* --- Generated report --- */}
      {generated && !generating && (
        <div className="mt-8 space-y-6">
          {planFallback && (
            <div
              className="rounded-xl px-4 py-3 flex items-start gap-2 text-[12px] text-muted-foreground leading-relaxed"
              style={{
                background: "color-mix(in oklab, var(--neon-blue) 8%, transparent)",
                border: "1px solid color-mix(in oklab, var(--neon-blue) 22%, transparent)",
              }}
            >
              <Info className="h-4 w-4 text-[var(--neon-blue)] shrink-0 mt-0.5" />
              <span>
                Showing your demo guide from twin data. If the plan service is offline, this
                fallback keeps your 90-day guide available for the hackathon walkthrough.
              </span>
            </div>
          )}
          {/* Quest unlocked badge strip */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="status-pill status-optimal">Quest unlocked</span>
            <span className="text-xs text-muted-foreground font-mono">
              QUEST-ID · MT-{Date.now().toString(36).slice(-6).toUpperCase()}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Built with longevity research · directional only
            </span>
          </div>

          {/* KPI strip */}
          <div className="grid sm:grid-cols-3 gap-4">
            <KpiCard
              icon={<Target className="h-5 w-5 text-[var(--neon-blue)]" />}
              label="Where you could be in 90 days"
              value={`${plan.projectedScore}`}
              sub={plan.scoreDelta > 0 ? `+${plan.scoreDelta} from today` : "Holding steady"}
              color="blue"
            />
            <KpiCard
              icon={<TrendingDown className="h-5 w-5 text-[var(--neon-green)]" />}
              label={SECTION_COPY.estimatedAgeGap}
              value={`+${Math.max(0, 7.2 - plan.scoreDelta * 0.18).toFixed(1)} yr`}
              sub={plan.scoreDelta > 0 ? "Friendly preview" : "No change yet"}
              color="green"
            />
            <KpiCard
              icon={<ListChecks className="h-5 w-5 text-[var(--neon-orange)]" />}
              label="Habits in your quest"
              value={`${interventions.length}`}
              sub={interventions.length > 0 ? "Personalized for you" : "Longevity starter set"}
              color="orange"
            />
          </div>

          {/* Your focus for the next 90 days */}
          <SectionCard
            icon={<Target className="h-4 w-4 text-[var(--neon-orange)]" />}
            title="Your focus for the next 90 days"
          >
            <p className="text-[12px] text-muted-foreground -mt-2 mb-3 leading-relaxed">
              Three areas worth gentle attention first, drawn from your six-system map.
            </p>

            {/* Bio age context — gives the focus a measurable target */}
            <Link
              to="/clock"
              className="group flex flex-wrap items-center gap-3 mb-4 rounded-xl px-3.5 py-2.5 transition hover:brightness-110"
              style={{
                background:
                  "linear-gradient(90deg, color-mix(in oklab, var(--neon-blue) 8%, transparent), color-mix(in oklab, var(--neon-green) 6%, transparent))",
                border: "1px solid color-mix(in oklab, var(--neon-blue) 22%, transparent)",
              }}
            >
              <Dna className="h-4 w-4 text-[var(--neon-blue)] shrink-0" />
              <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--neon-blue)]">
                Bio age target
              </span>
              <span className="text-[12px] text-muted-foreground leading-snug">
                Today{" "}
                <span className="font-display tabular-nums text-[var(--neon-blue)]">
                  {bioAge.baselineBioAge} yr
                </span>
                {bioAge.yearsImproved > 0 ? (
                  <>
                    {" "}
                    · with these habits, ≈{" "}
                    <span className="font-display tabular-nums text-[var(--neon-green)]">
                      {bioAge.projectedBioAge} yr
                    </span>{" "}
                    in 90 days{" "}
                    <span className="font-mono text-[var(--neon-green)]">
                      (−{bioAge.yearsImproved} yr)
                    </span>
                  </>
                ) : (
                  <> · pick a few habits in the simulator to start trimming this</>
                )}
              </span>
              <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-[var(--neon-blue)] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">
                See clock <ChevronRight className="h-3 w-3" />
              </span>
            </Link>

            <div className="grid md:grid-cols-3 gap-3">
              {plan.bottlenecks.map((b, i) => (
                <FocusCard key={b.key} order={i + 1} bottleneck={b} />
              ))}
            </div>
          </SectionCard>

          {/* Quest Roadmap */}
          <SectionCard
            icon={<Compass className="h-4 w-4 text-[var(--neon-blue)]" />}
            title="Your quest roadmap"
          >
            <QuestProgressHeader
              xp={questXP}
              maxXp={maxXP}
              doneCount={doneCount}
              totalCount={totalCount}
            />
            <div className="space-y-4 mt-4">
              {plan.phases.map((phase, idx) => (
                <QuestPhase
                  key={idx}
                  phaseIdx={idx}
                  phase={phase}
                  checked={checked}
                  onToggle={toggleChecked}
                />
              ))}
            </div>
          </SectionCard>

          {/* Weekly rhythm */}
          <SectionCard
            icon={<Calendar className="h-4 w-4 text-[var(--neon-green)]" />}
            title="Weekly rhythm"
          >
            <p className="text-[12px] text-muted-foreground -mt-2 mb-4 leading-relaxed">
              A simple template you can adjust. Consistency beats intensity.
            </p>
            <WeeklyRhythm interventions={interventions} />
          </SectionCard>

          {/* Doctor discussion pack */}
          <SectionCard
            icon={<Stethoscope className="h-4 w-4 text-[var(--neon-blue)]" />}
            title="Doctor discussion pack"
          >
            <p className="text-[12px] text-muted-foreground -mt-2 mb-4 leading-relaxed">
              Open a card to see why each conversation matters and what to bring along.
              These are gentle starters &mdash; never instructions.
            </p>
            <div className="space-y-2">
              {DOCTOR_QUESTIONS.map((q, i) => (
                <DoctorQuestionCard key={i} idx={i + 1} q={q} />
              ))}
            </div>
          </SectionCard>

          {/* Retest path */}
          <SectionCard
            icon={<FileText className="h-4 w-4 text-[var(--neon-green)]" />}
            title="Retest path"
          >
            <RetestTimeline retestPlan={plan.retestPlan} />
          </SectionCard>

          {/* Safety — calmer */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "oklch(0.22 0.03 250 / 0.55)",
              border: "1px solid color-mix(in oklab, var(--neon-orange) 28%, transparent)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-[var(--neon-orange)]" />
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Before you change anything medical&hellip;
              </div>
            </div>
            <ul className="space-y-1.5">
              {plan.safetyNotes.map((note, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-[13px] text-muted-foreground leading-relaxed"
                >
                  <span className="text-[var(--neon-orange)] mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA footer */}
          <div className="space-y-4 pt-2">
            <TrustNote />
            <div className="flex flex-wrap gap-3 justify-end items-center">
              <span className="text-xs text-muted-foreground mr-auto max-w-md leading-relaxed">
                {MICROCOPY.bringToClinician} Save for later or revisit weekly.
              </span>
              <button
                type="button"
                onClick={copyWeeklyPlan}
                className="px-5 py-2.5 rounded-lg glass text-sm font-semibold inline-flex items-center gap-2 transition hover:brightness-110"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy My Weekly Plan"}
              </button>
              <Link
                to="/simulator"
                className="px-5 py-2.5 rounded-lg glass text-sm font-semibold"
              >
                Back to Simulator
              </Link>
              <Link
                to="/report"
                className="px-5 py-2.5 rounded-lg btn-hero text-sm font-semibold"
              >
                {CTA.openClinicianBrief}
              </Link>
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

function IngredientRow({ Icon, color, title, sub }: {
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  sub: string;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl p-3"
      style={{
        background: "oklch(0.22 0.03 250 / 0.55)",
        border: `1px solid color-mix(in oklab, var(--${color}) 22%, transparent)`,
      }}
    >
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: `color-mix(in oklab, var(--${color}) 14%, transparent)`,
          color: `var(--${color})`,
        }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium leading-snug">{title}</div>
        <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function PhasePreview({ step, range, title, sub, color, Icon }: {
  step: number;
  range: string;
  title: string;
  sub: string;
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden flex flex-col"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, var(--${color}) 10%, oklch(0.22 0.03 250 / 0.55)), oklch(0.22 0.03 250 / 0.5))`,
        border: `1px solid color-mix(in oklab, var(--${color}) 24%, transparent)`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `color-mix(in oklab, var(--${color}) 16%, transparent)`,
            color: `var(--${color})`,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span
          className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            color: `var(--${color})`,
            background: `color-mix(in oklab, var(--${color}) 10%, transparent)`,
            border: `1px solid color-mix(in oklab, var(--${color}) 28%, transparent)`,
          }}
        >
          Phase {step}
        </span>
      </div>
      <div
        className="text-[10px] font-mono uppercase tracking-[0.2em] mt-3"
        style={{ color: `var(--${color})` }}
      >
        {range}
      </div>
      <div className="font-display text-base font-semibold mt-1 leading-tight">{title}</div>
      <div className="text-[12px] text-muted-foreground mt-1.5 leading-snug">{sub}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Focus / Quest / Weekly / Doctor / Retest sub-components             */
/* ------------------------------------------------------------------ */

function FocusCard({ order, bottleneck }: { order: number; bottleneck: Bottleneck }) {
  const meta = FOCUS_META[bottleneck.key];
  const Icon = meta.Icon;
  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden flex flex-col gap-3"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, var(--${meta.color}) 12%, oklch(0.22 0.03 250 / 0.55)), oklch(0.22 0.03 250 / 0.5))`,
        border: `1px solid color-mix(in oklab, var(--${meta.color}) 28%, transparent)`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `color-mix(in oklab, var(--${meta.color}) 16%, transparent)`,
            color: `var(--${meta.color})`,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Focus {order}
          </div>
          <div className="font-display text-base font-semibold leading-tight">
            {meta.shortName}
          </div>
        </div>
      </div>
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        {meta.reason}
      </p>
      <div
        className="rounded-lg px-3 py-2 text-[12px] flex items-start gap-2"
        style={{
          background: `color-mix(in oklab, var(--${meta.color}) 10%, transparent)`,
          border: `1px solid color-mix(in oklab, var(--${meta.color}) 22%, transparent)`,
        }}
      >
        <Sparkles
          className="h-3.5 w-3.5 shrink-0 mt-0.5"
          style={{ color: `var(--${meta.color})` }}
        />
        <div className="min-w-0">
          <div
            className="text-[10px] font-mono uppercase tracking-wider opacity-90"
            style={{ color: `var(--${meta.color})` }}
          >
            First action
          </div>
          <div className="text-foreground mt-0.5 leading-snug">{meta.firstAction}</div>
        </div>
      </div>
    </div>
  );
}

function QuestProgressHeader({
  xp, maxXp, doneCount, totalCount,
}: {
  xp: number;
  maxXp: number;
  doneCount: number;
  totalCount: number;
}) {
  const pct = maxXp > 0 ? Math.round((xp / maxXp) * 100) : 0;
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--neon-green) 12%, oklch(0.22 0.03 250 / 0.6)), color-mix(in oklab, var(--neon-blue) 8%, oklch(0.22 0.03 250 / 0.55)))",
        border: "1px solid color-mix(in oklab, var(--neon-green) 28%, transparent)",
      }}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--neon-green)]">
            Quest XP
          </div>
          <div className="font-display text-2xl tabular-nums mt-0.5">
            {xp}
            <span className="text-muted-foreground text-base"> / {maxXp}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[var(--neon-green)]" />
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Quests done
            </div>
            <div className="font-display text-2xl tabular-nums text-[var(--neon-green)]">
              {doneCount}
              <span className="text-muted-foreground text-base">/{totalCount}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full overflow-hidden bg-[oklch(0.3_0.04_250/0.5)]">
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

const PHASE_COLORS = ["neon-blue", "neon-green", "neon-orange"] as const;
const PHASE_TITLES = ["Find your rhythm", "Build momentum", "Review and refine"];
const PHASE_RANGES = ["Weeks 1–2", "Weeks 3–6", "Weeks 7–12"];

function QuestPhase({
  phaseIdx, phase, checked, onToggle,
}: {
  phaseIdx: number;
  phase: Phase;
  checked: Set<string>;
  onToggle: (k: string) => void;
}) {
  const phaseColor = PHASE_COLORS[phaseIdx] ?? "neon-blue";
  const completedInPhase = phase.items.filter((_, i) => checked.has(`${phaseIdx}-${i}`)).length;
  const phaseProgress = phase.items.length > 0 ? (completedInPhase / phase.items.length) * 100 : 0;

  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, var(--${phaseColor}) 8%, oklch(0.22 0.03 250 / 0.55)), oklch(0.22 0.03 250 / 0.5))`,
        border: `1px solid color-mix(in oklab, var(--${phaseColor}) 24%, transparent)`,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 font-display font-semibold"
          style={{
            background: `color-mix(in oklab, var(--${phaseColor}) 18%, transparent)`,
            color: `var(--${phaseColor})`,
          }}
        >
          {phaseIdx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] font-mono uppercase tracking-[0.2em]"
            style={{ color: `var(--${phaseColor})` }}
          >
            Phase {phaseIdx + 1} · {PHASE_RANGES[phaseIdx] ?? phase.title}
          </div>
          <div className="font-display text-lg font-semibold leading-tight">
            {PHASE_TITLES[phaseIdx] ?? phase.title}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{phase.subtitle}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Progress
          </div>
          <div
            className="font-display text-lg tabular-nums"
            style={{ color: `var(--${phaseColor})` }}
          >
            {Math.round(phaseProgress)}%
          </div>
        </div>
      </div>

      <div className="h-1 rounded-full overflow-hidden bg-[oklch(0.3_0.04_250/0.5)] mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${phaseProgress}%`, background: `var(--${phaseColor})` }}
        />
      </div>

      <div className="space-y-2">
        {phase.items.map((item, idx) => {
          const itemKey = `${phaseIdx}-${idx}`;
          return (
            <QuestChecklistItem
              key={itemKey}
              item={item}
              isDone={checked.has(itemKey)}
              onToggle={() => onToggle(itemKey)}
            />
          );
        })}
      </div>
    </div>
  );
}

function QuestChecklistItem({
  item, isDone, onToggle,
}: {
  item: PhaseItem;
  isDone: boolean;
  onToggle: () => void;
}) {
  const sysMeta = SYSTEM_META[item.system];
  const SysIcon = sysMeta.Icon;
  const xp = difficultyXP(item.difficulty);
  const diffColor =
    item.difficulty === "easy" ? "neon-green"
      : item.difficulty === "medium" ? "neon-blue"
        : "neon-orange";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isDone}
      className="w-full text-left flex items-start gap-3 rounded-xl p-3 glass-soft transition hover:scale-[1.005]"
      style={{
        opacity: isDone ? 0.7 : 1,
        borderColor: isDone ? "var(--neon-green)" : undefined,
        boxShadow: isDone
          ? "0 0 14px -6px color-mix(in oklab, var(--neon-green) 60%, transparent)"
          : undefined,
      }}
    >
      <div className="shrink-0 mt-0.5">
        {isDone ? (
          <CheckCircle2 className="h-5 w-5 text-[var(--neon-green)]" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-medium leading-snug ${isDone ? "line-through opacity-80" : ""}`}
        >
          {item.label}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              color: `var(--${sysMeta.color})`,
              background: `color-mix(in oklab, var(--${sysMeta.color}) 10%, transparent)`,
              border: `1px solid color-mix(in oklab, var(--${sysMeta.color}) 26%, transparent)`,
            }}
          >
            <SysIcon className="h-2.5 w-2.5" />
            {item.system}
          </span>
          <span
            className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              color: `var(--${diffColor})`,
              background: `color-mix(in oklab, var(--${diffColor}) 8%, transparent)`,
              border: `1px solid color-mix(in oklab, var(--${diffColor}) 22%, transparent)`,
            }}
          >
            {item.difficulty}
          </span>
          <span
            className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded text-[var(--neon-green)]"
            style={{ background: "color-mix(in oklab, var(--neon-green) 8%, transparent)" }}
          >
            <Sparkles className="h-2.5 w-2.5" /> +{xp} XP
          </span>
          {item.tags?.map((t) => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--neon-blue)]/20 text-[var(--neon-blue)] font-mono"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

interface RhythmChip {
  kind: string;
  color: string;
}
interface RhythmDay {
  short: string;
  full: string;
  chips: RhythmChip[];
}

function WeeklyRhythm({ interventions }: { interventions: string[] }) {
  const isStrength = interventions.includes("strength");
  const isZone2 = interventions.includes("zone2");

  const days: RhythmDay[] = [
    { short: "M", full: "Mon", chips: [
      { kind: isStrength ? "Strength" : "Move",   color: "neon-green" },
      { kind: "Sleep",      color: "neon-blue"   },
    ]},
    { short: "T", full: "Tue", chips: [
      { kind: isZone2 ? "Zone 2"    : "Walk",     color: "neon-orange" },
      { kind: "Nutrition",  color: "neon-green"  },
    ]},
    { short: "W", full: "Wed", chips: [
      { kind: isStrength ? "Strength" : "Move",   color: "neon-green" },
      { kind: "Recovery",   color: "neon-blue"   },
    ]},
    { short: "T", full: "Thu", chips: [
      { kind: isZone2 ? "Zone 2"    : "Walk",     color: "neon-orange" },
      { kind: "Nutrition",  color: "neon-green"  },
    ]},
    { short: "F", full: "Fri", chips: [
      { kind: isStrength ? "Strength" : "Move",   color: "neon-green" },
      { kind: "Sleep",      color: "neon-blue"   },
    ]},
    { short: "S", full: "Sat", chips: [
      { kind: "Long walk",  color: "neon-orange" },
      { kind: "Cook in",    color: "neon-green"  },
    ]},
    { short: "S", full: "Sun", chips: [
      { kind: "Recovery",   color: "neon-blue"   },
      { kind: "Reflect",    color: "neon-blue"   },
    ]},
  ];

  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {days.map((d, idx) => (
        <div
          key={idx}
          className="rounded-xl p-1.5 sm:p-2 glass-soft flex flex-col gap-1 min-w-0"
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground text-center">
            <span className="sm:hidden">{d.short}</span>
            <span className="hidden sm:inline">{d.full}</span>
          </div>
          <div className="flex flex-col gap-1">
            {d.chips.map((c, i) => (
              <span
                key={`${i}-${c.kind}`}
                className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider px-1 sm:px-1.5 py-0.5 rounded text-center truncate"
                style={{
                  color: `var(--${c.color})`,
                  background: `color-mix(in oklab, var(--${c.color}) 10%, transparent)`,
                  border: `1px solid color-mix(in oklab, var(--${c.color}) 22%, transparent)`,
                }}
              >
                {c.kind}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DoctorQuestionCard({ idx, q }: { idx: number; q: DoctorQuestion }) {
  return (
    <details className="group glass-soft rounded-xl">
      <summary className="cursor-pointer list-none p-3 flex items-start gap-3">
        <span className="text-[10px] font-mono text-[var(--neon-blue)] mt-1 shrink-0 tabular-nums">
          Q{idx}
        </span>
        <div className="flex-1 min-w-0 text-sm font-medium">{q.ask}</div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90 shrink-0 mt-0.5" />
      </summary>
      <div className="px-3 pb-3 pt-0 space-y-2.5 text-[12px] leading-relaxed">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--neon-blue)]">
            Why it matters
          </div>
          <div className="text-muted-foreground mt-0.5">{q.why}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--neon-green)]">
            What to bring
          </div>
          <div className="text-muted-foreground mt-0.5">{q.bring}</div>
        </div>
      </div>
    </details>
  );
}

function RetestTimeline({
  retestPlan,
}: {
  retestPlan: GeneratedPlan["retestPlan"];
}) {
  const nodes: { label: string; note: string; sub?: string; color: string; isBio?: boolean }[] = [
    { label: "Today", note: "Baseline saved", color: "neon-blue" },
    ...retestPlan.map((r, i) => {
      const isBio = /bio age/i.test(r.markers);
      return {
        label: r.timing,
        note: r.markers,
        sub: r.note,
        color: isBio ? "neon-blue" : i === 0 ? "neon-orange" : "neon-green",
        isBio,
      };
    }),
  ];

  // Choose grid columns dynamically so 4 milestones (Today + 3 retests) lay out cleanly.
  const colsClass =
    nodes.length >= 4 ? "sm:grid-cols-4"
    : nodes.length === 3 ? "sm:grid-cols-3"
    : "sm:grid-cols-2";

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute left-5 right-5 top-5 h-px hidden sm:block"
        style={{
          background:
            "linear-gradient(90deg, var(--neon-blue) 0%, var(--neon-orange) 50%, var(--neon-green) 100%)",
          opacity: 0.4,
        }}
      />
      <div className={`grid ${colsClass} gap-4 relative`}>
        {nodes.map((n, i) => (
          <div key={i} className="flex sm:flex-col gap-3 sm:items-center sm:text-center">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 relative z-10 font-mono text-[10px] uppercase tracking-wider tabular-nums"
              style={{
                background: "oklch(0.22 0.03 250 / 0.95)",
                border: `2px solid var(--${n.color})`,
                boxShadow: `0 0 12px -2px color-mix(in oklab, var(--${n.color}) 70%, transparent)`,
                color: `var(--${n.color})`,
              }}
            >
              {n.isBio ? <Dna className="h-4 w-4" /> : i + 1}
            </div>
            <div className="min-w-0 flex-1 sm:flex-initial">
              <div
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: `var(--${n.color})` }}
              >
                {n.label}
              </div>
              <div className="text-[13px] font-medium mt-0.5 leading-snug">{n.note}</div>
              {n.sub && (
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {n.sub}
                </div>
              )}
              {n.isBio && (
                <Link
                  to="/clock"
                  className="inline-flex items-center gap-1 mt-2 text-[10px] font-mono uppercase tracking-wider text-[var(--neon-blue)] hover:brightness-125 transition"
                >
                  Open clock <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
