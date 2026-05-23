import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { useTwin } from "@/lib/twin-context";
import { useTwinProgress } from "@/lib/twin-progress";
import { INTERVENTIONS, projectScores, INITIAL_DOMAINS } from "@/lib/mockData";
import {
  Sparkles, Loader2, FileText, Stethoscope, Calendar, ShieldCheck,
  Clock, Target, ChevronRight, Zap, User, SlidersHorizontal,
  HeartHandshake, Map, Compass, Check, Moon, HeartPulse, Flame,
  Dumbbell, Brain, Activity, Copy, ArrowRight, FlaskConical,
  Trophy, Star,
} from "lucide-react";

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
  bottlenecks: { key: string; label: string; score: number; status: "priority" | "watch"; drivers: string; why: string }[];
  phases: Phase[];
  dailyHabits: string[];
  weeklyTargets: string[];
  physicianItems: string[];
  retestPlan: { timing: string; markers: string; note?: string }[];
  safetyNotes: string[];
  projectedScore: number;
  scoreDelta: number;
}

function buildPlan(interventions: string[]): GeneratedPlan {
  const proj = projectScores(interventions);
  const domainEntries = INITIAL_DOMAINS.map((d) => ({
    ...d,
    projected: proj.domains[d.key],
  }));
  const sorted = [...domainEntries].sort((a, b) => a.projected - b.projected);
  const top3 = sorted.slice(0, 3);

  const whyMap: Record<string, string> = {
    metabolic: "Steady glucose protects your heart, brain, and energy. Small consistent shifts compound.",
    cardio: "Lower ApoB particles early changes the long-term trajectory of vascular aging.",
    inflammation: "Calming chronic low-grade inflammation improves recovery and lowers downstream risk.",
    muscle: "Muscle preserves function and supports metabolic health as you age.",
    cognition: "Sleep and vascular health are the strongest modifiable levers for long-term focus.",
    sleep: "Sleep is when your body clears, repairs, and restores hormonal balance.",
  };

  const bottlenecks = top3.map((d) => ({
    key: d.key,
    label: d.label,
    score: Math.round(d.projected),
    status: (d.projected < 55 ? "priority" : "watch") as "priority" | "watch",
    drivers: d.drivers.slice(0, 2).join(" · "),
    why: whyMap[d.key] || "",
  }));

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
      subtitle: "Anchor one habit per area. Don't optimize yet.",
      items: [
        { label: "Set a consistent sleep & wake window", tags: isSleep ? ["+45 min enabled"] : ["Baseline"] },
        { label: "Add a 10-minute walk after your largest meal", tags: isZone2 ? ["Zone 2 prep"] : ["Base"] },
        { label: "Add one high-fiber meal each day", tags: isFiber ? ["30 g/day target"] : ["Foundation"] },
        { label: "Schedule a clinician discussion for labs & vitamin D", tags: ["Clinician"] },
      ],
    },
    {
      title: "Weeks 3–6 · Build momentum",
      subtitle: "Layer in intensity. Track adherence, not perfection.",
      items: [
        { label: isZone2 ? "Build cardio base: 3 × 45 min Zone 2 per week" : "Build cardio base to 3 moderate sessions a week", tags: isZone2 ? ["150 min/wk"] : ["Build"] },
        { label: isStrength ? "Add 2–3 strength sessions per week" : "Introduce 2 strength sessions per week", tags: isStrength ? ["3×/wk"] : ["Build"] },
        { label: isProtein ? "Track protein at each meal (~1.6 g/kg/day)" : "Audit protein per meal (aim 30 g)", tags: isProtein ? ["1.6 g/kg"] : ["Track"] },
        { label: isAlc ? "Keep alcohol at ≤ 2 drinks per week" : "Reduce alcohol; target 4+ alcohol-free days", tags: ["Reduce"] },
      ],
    },
    {
      title: "Weeks 7–12 · Review and refine",
      subtitle: "Progress, recalibrate, and retest.",
      items: [
        { label: isZone2 ? "Progress training volume; add 1 interval session" : "Increase aerobic volume and add 1 interval session", tags: ["Progress"] },
        { label: "Retest selected biomarkers (see retest path)", tags: ["Retest"] },
        { label: isApoB ? "Review ApoB, Vitamin D, hs-CRP with clinician" : "Review ApoB / Vitamin D / hs-CRP with clinician", tags: ["Clinician"] },
        { label: "Adjust your plan based on results", tags: ["Refine"] },
      ],
    },
  ];

  const dailyHabits = [
    "7+ hours sleep with a consistent wake time",
    isFiber ? "30 g fiber via whole foods" : "Add one high-fiber meal",
    isAlc ? "Alcohol ≤ 2 drinks/week" : "4+ alcohol-free days",
    "10+ min morning sunlight",
    "Hydration 2.5–3.0 L",
    isProtein ? "Protein 1.6 g/kg across meals" : "Protein at every meal (~30 g)",
  ];

  const weeklyTargets = [
    isZone2 ? "150 min Zone 2" : "120+ min moderate cardio",
    isStrength ? "3 strength sessions" : "2+ strength sessions",
    "1 mobility / recovery session",
    "≥ 5 home-cooked dinners",
  ];

  const physicianItems = [
    "ApoB target and lipid management strategy",
    isVitD ? "Vitamin D dosing and 3-month recheck" : "Vitamin D status and supplementation plan",
    "Fasting glucose trend and HbA1c trajectory",
    "Cardiovascular screening (CAC or advanced lipid panel)",
    "hs-CRP elevation if it remains > 2 mg/L",
  ];

  const retestPlan = [
    { timing: "Week 6", markers: "Spot-check fasting glucose, sleep & HRV trends", note: "Track trend, not single values" },
    { timing: "Week 12", markers: "Lipid panel, ApoB, HbA1c, hs-CRP, Vitamin D", note: "Compare to baseline; review with clinician" },
  ];

  const safetyNotes = [
    "This guide is educational support, not a diagnosis or prescription.",
    "Talk to your clinician before changing supplements, medications, or exercise intensity.",
    "Stop and call a clinician if you feel chest pain, dizziness, or anything unusual.",
    "Projections are directional estimates for demonstration, not clinical predictions.",
  ];

  return {
    bottlenecks,
    phases,
    dailyHabits,
    weeklyTargets,
    physicianItems,
    retestPlan,
    safetyNotes,
    projectedScore: proj.healthspan,
    scoreDelta: proj.healthspan - proj.baselineHealthspan,
  };
}

/* ------------------------------------------------------------------ */
/*  Focus area mapping                                                  */
/* ------------------------------------------------------------------ */

const FOCUS_MAP: Record<string, { title: string; icon: typeof Moon; reason: string; firstAction: string; tone: string }> = {
  sleep: {
    title: "Recovery rhythm",
    icon: Moon,
    reason: "Consistent sleep is your strongest recovery lever — it shows up across HRV, glucose, and mood.",
    firstAction: "Pick a lights-out time you can hit 5 nights this week.",
    tone: "teal",
  },
  inflammation: {
    title: "Inflammation balance",
    icon: Flame,
    reason: "Calmer baseline inflammation helps almost every other system feel better.",
    firstAction: "Add one anti-inflammatory meal (fish, leafy greens, olive oil) this week.",
    tone: "coral",
  },
  cardio: {
    title: "Heart & metabolic support",
    icon: HeartPulse,
    reason: "Lowering ApoB and building cardio base early changes long-term vascular trajectory.",
    firstAction: "Two 20-minute easy walks this week, ideally after meals.",
    tone: "blue",
  },
  metabolic: {
    title: "Steady energy",
    icon: Activity,
    reason: "Smoother glucose protects energy, focus, and your heart over time.",
    firstAction: "One 10-minute post-meal walk per day this week.",
    tone: "amber",
  },
  muscle: {
    title: "Strength foundation",
    icon: Dumbbell,
    reason: "Muscle protects function and supports metabolic health as you age.",
    firstAction: "Two short bodyweight strength sessions this week.",
    tone: "blue",
  },
  cognition: {
    title: "Brain & focus",
    icon: Brain,
    reason: "Sleep and movement together do most of the work for long-term cognitive health.",
    firstAction: "Pair morning sunlight with your first walk of the day.",
    tone: "teal",
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers — classify checklist items                                  */
/* ------------------------------------------------------------------ */

type System = "Recovery" | "Heart" | "Metabolic" | "Inflammation" | "Muscle" | "Cognition";
type Difficulty = "easy" | "medium" | "clinician-guided";

function classifyItem(label: string, tags: string[] = []): { system: System; difficulty: Difficulty; xp: number } {
  const l = label.toLowerCase();
  const tagJoin = tags.join(" ").toLowerCase();

  let system: System = "Recovery";
  if (/sleep|wake|rhythm|recovery|mobility/.test(l)) system = "Recovery";
  else if (/walk|zone|cardio|interval|aerobic|apob|lipid/.test(l)) system = "Heart";
  else if (/fiber|protein|glucose|hba1c|meal|nutrition/.test(l)) system = "Metabolic";
  else if (/alcohol|hs-crp|vitamin d|inflammation/.test(l)) system = "Inflammation";
  else if (/strength|lift|muscle/.test(l)) system = "Muscle";
  else if (/focus|cogniti|brain/.test(l)) system = "Cognition";

  let difficulty: Difficulty = "easy";
  if (/clinician|physician|review|retest/.test(l) || /clinician/.test(tagJoin)) difficulty = "clinician-guided";
  else if (/strength|interval|progress|track|overload|cardio base|build/.test(l) || /build|progress|track|overload/.test(tagJoin)) difficulty = "medium";

  const xp = difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 25;
  return { system, difficulty, xp };
}

const SYSTEM_TONE: Record<System, string> = {
  Recovery: "var(--neon-green)",
  Heart: "var(--neon-blue)",
  Metabolic: "var(--neon-orange)",
  Inflammation: "var(--neon-red)",
  Muscle: "var(--neon-blue)",
  Cognition: "var(--neon-green)",
};

/* ------------------------------------------------------------------ */

function Plan() {
  const { interventions, intake } = useTwin();
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [seed, setSeed] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const plan = useMemo(() => buildPlan(interventions), [interventions, seed]);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1800);
  }, []);

  const top3Domains = useMemo(() => {
    const proj = projectScores(interventions);
    const entries = INITIAL_DOMAINS.map((d) => ({ ...d, projected: proj.domains[d.key] }));
    return [...entries].sort((a, b) => a.projected - b.projected).slice(0, 3);
  }, [interventions]);

  // Total XP earned
  const totalXp = useMemo(() => {
    let sum = 0;
    plan.phases.forEach((p, pi) => {
      p.items.forEach((it, ii) => {
        const id = `${pi}-${ii}`;
        if (checked[id]) {
          const { xp } = classifyItem(it.label, it.tags);
          sum += xp;
        }
      });
    });
    return sum;
  }, [checked, plan, seed]);

  const totalPossibleXp = useMemo(() => {
    let sum = 0;
    plan.phases.forEach((p) => p.items.forEach((it) => { sum += classifyItem(it.label, it.tags).xp; }));
    return sum;
  }, [plan]);

  const copyWeekly = useCallback(() => {
    const lines = [
      `MediTwin · 90-day guide for ${intake.name || "you"}`,
      "",
      "Daily anchors:",
      ...plan.dailyHabits.map((h) => `  • ${h}`),
      "",
      "Weekly targets:",
      ...plan.weeklyTargets.map((t) => `  • ${t}`),
      "",
      "Phases:",
      ...plan.phases.flatMap((p) => [`  ${p.title}`, ...p.items.map((it) => `    - ${it.label}`), ""]),
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [plan, intake]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">AI-generated guide</div>
        <h1 className="text-4xl font-display font-semibold mt-2">
          {generated ? "Your 90-day healthspan guide" : "Let's build your 90-day guide"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto leading-relaxed">
          {generated
            ? "Three phases. Small weekly actions. Clear notes to bring to your clinician."
            : "We'll turn your twin map and selected changes into a simple plan you can follow, adjust, and discuss with a clinician."}
        </p>
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
            <h2 className="text-xl font-display font-semibold">MediTwin is shaping your guide</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Turning {interventions.length} selected changes into weekly actions and clinician notes…
            </p>
          </div>
        </div>
      )}

      {/* --- Pre-generate CTA --- */}
      {!generated && !generating && (
        <div className="mt-6 space-y-6">
          <div className="glass rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[var(--neon-green)]/5 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative z-10">
              <div className="h-14 w-14 mx-auto rounded-2xl glass flex items-center justify-center mb-4 relative">
                <Sparkles className="h-6 w-6 text-[var(--neon-green)]" />
                <div className="absolute inset-0 rounded-2xl border border-[var(--neon-green)]/20 animate-ping" />
              </div>
              <h2 className="text-2xl font-display font-semibold">Your guide is almost ready</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
                Based on your twin profile, selected changes, and top focus areas.
              </p>

              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left max-w-3xl mx-auto">
                <div className="glass-soft rounded-xl p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[var(--neon-blue)]/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-[var(--neon-blue)]" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Your twin profile</div>
                    <div className="text-[11px] text-muted-foreground">{intake.name} · Age {intake.age}</div>
                  </div>
                </div>
                <div className="glass-soft rounded-xl p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[var(--neon-green)]/10 flex items-center justify-center shrink-0">
                    <SlidersHorizontal className="h-4 w-4 text-[var(--neon-green)]" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Selected changes</div>
                    <div className="text-[11px] text-muted-foreground">
                      {interventions.length > 0 ? `${interventions.length} personalized` : "Default starter set"}
                    </div>
                  </div>
                </div>
                <div className="glass-soft rounded-xl p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[var(--neon-orange)]/10 flex items-center justify-center shrink-0">
                    <Zap className="h-4 w-4 text-[var(--neon-orange)]" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Top areas to support</div>
                    <div className="text-[11px] text-muted-foreground">{top3Domains.map((d) => d.label).join(" · ")}</div>
                  </div>
                </div>
                <div className="glass-soft rounded-xl p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[var(--neon-blue)]/10 flex items-center justify-center shrink-0">
                    <HeartHandshake className="h-4 w-4 text-[var(--neon-blue)]" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Doctor discussion notes</div>
                    <div className="text-[11px] text-muted-foreground">Included in every plan</div>
                  </div>
                </div>
              </div>

              {interventions.length === 0 && (
                <div className="mt-5 glass-soft rounded-xl p-4 max-w-lg mx-auto text-left flex items-start gap-3">
                  <Compass className="h-5 w-5 text-[var(--neon-blue)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm">No changes selected yet — we'll create a gentle starter plan. You can also visit the simulator to personalize it.</p>
                    <Link to="/simulator" className="text-xs text-[var(--neon-blue)] underline mt-1 inline-block hover:text-[var(--neon-green)] transition">
                      Personalize in simulator →
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleGenerate}
                  className="px-8 py-3 rounded-xl btn-hero text-sm font-semibold inline-flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Create My 90-Day Guide
                </button>
              </div>

              <p className="mt-4 text-[11px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                This is not a diagnosis or prescription. It's an educational support plan to help you organize next steps.
              </p>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Map className="h-4 w-4 text-[var(--neon-blue)]" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">What your guide looks like</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { week: "Week 1–2", title: "Find your rhythm", desc: "Anchor one habit per area. Don't optimize yet.", color: "--neon-blue" },
                { week: "Week 3–6", title: "Build momentum", desc: "Layer in intensity. Track adherence, not perfection.", color: "--neon-green" },
                { week: "Week 7–12", title: "Review and refine", desc: "Progress, recalibrate, and retest.", color: "--neon-orange" },
              ].map((phase) => (
                <div key={phase.week} className="glass-soft rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `var(${phase.color})`, opacity: 0.6 }} />
                  <div className="text-[10px] font-mono uppercase tracking-wider mt-1" style={{ color: `var(${phase.color})` }}>{phase.week}</div>
                  <div className="text-sm font-medium mt-1">{phase.title}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{phase.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[var(--neon-green)]" />
              Next unlock: your personal healthspan quest board
            </p>
          </div>
        </div>
      )}

      {/* --- Generated guide --- */}
      {generated && !generating && (
        <div className="mt-8 space-y-6">
          {/* Focus card */}
          <FocusCard bottlenecks={plan.bottlenecks} />

          {/* XP banner */}
          <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--neon-green)]/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-[var(--neon-green)]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Quest progress</div>
                <div className="text-sm">
                  <span className="font-display text-xl text-[var(--neon-green)]">{totalXp}</span>
                  <span className="text-muted-foreground"> / {totalPossibleXp} XP</span>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-[180px] max-w-md">
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--neon-green)] to-[var(--neon-blue)] transition-all duration-700"
                  style={{ width: `${totalPossibleXp ? (totalXp / totalPossibleXp) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quest Roadmap */}
          <SectionCard icon={<Calendar className="h-4 w-4 text-[var(--neon-blue)]" />} title="Quest roadmap">
            <div className="space-y-5">
              {plan.phases.map((phase, pi) => {
                const phaseColor = ["--neon-blue", "--neon-green", "--neon-orange"][pi];
                return (
                  <div key={pi} className="glass-soft rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ background: `var(${phaseColor})`, opacity: 0.7 }} />
                    <div className="pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-mono" style={{ background: `color-mix(in oklab, var(${phaseColor}) 18%, transparent)`, color: `var(${phaseColor})` }}>
                          {pi + 1}
                        </span>
                        <div className="text-xs font-mono uppercase tracking-wider" style={{ color: `var(${phaseColor})` }}>{phase.title}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-4">{phase.subtitle}</div>
                      <div className="space-y-2">
                        {phase.items.map((item, ii) => {
                          const id = `${pi}-${ii}`;
                          const isDone = !!checked[id];
                          const { system, difficulty, xp } = classifyItem(item.label, item.tags);
                          return (
                            <button
                              key={id}
                              onClick={() => setChecked((c) => ({ ...c, [id]: !c[id] }))}
                              className={`group w-full text-left rounded-xl border transition-all p-3 flex items-start gap-3 ${isDone ? "border-[var(--neon-green)]/40 bg-[var(--neon-green)]/5" : "border-white/8 hover:border-white/20 bg-white/[0.02]"}`}
                            >
                              <span className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${isDone ? "border-[var(--neon-green)] bg-[var(--neon-green)]/20" : "border-white/30 group-hover:border-white/50"}`}>
                                {isDone && <Check className="h-3 w-3 text-[var(--neon-green)]" />}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm leading-snug ${isDone ? "line-through text-muted-foreground" : ""}`}>{item.label}</div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider" style={{ color: SYSTEM_TONE[system], background: `color-mix(in oklab, ${SYSTEM_TONE[system]} 12%, transparent)` }}>
                                    {system}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${difficulty === "easy" ? "text-[var(--neon-green)] bg-[var(--neon-green)]/10" : difficulty === "medium" ? "text-[var(--neon-orange)] bg-[var(--neon-orange)]/10" : "text-[var(--neon-blue)] bg-[var(--neon-blue)]/10"}`}>
                                    {difficulty}
                                  </span>
                                </div>
                              </div>
                              <div className="text-[11px] font-mono shrink-0 flex items-center gap-1 text-[var(--neon-green)]">
                                <Star className="h-3 w-3" />+{xp}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Weekly rhythm */}
          <WeeklyRhythm interventions={interventions} />

          {/* Doctor discussion pack */}
          <DoctorPack physicianItems={plan.physicianItems} />

          {/* Retest path */}
          <RetestPath retests={plan.retestPlan} />

          {/* Safety */}
          <SectionCard icon={<ShieldCheck className="h-4 w-4 text-[var(--neon-blue)]" />} title="Before you change anything medical…">
            <ul className="space-y-2">
              {plan.safetyNotes.map((note, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
                  <span className="text-[var(--neon-blue)]">•</span>{note}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground">
              This guide is a thinking partner, not a clinician. Decisions about supplements, medications, or screening belong with your doctor.
            </p>
          </SectionCard>

          {/* CTA footer */}
          <div className="flex flex-wrap gap-3 justify-between items-center pt-2">
            <div className="text-[11px] text-muted-foreground max-w-md">
              Directional educational guide. Discuss all changes with a licensed clinician.
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={copyWeekly}
                className="px-5 py-2.5 rounded-lg glass text-sm font-semibold inline-flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy My Weekly Plan"}
              </button>
              <Link to="/simulator" className="px-5 py-2.5 rounded-lg glass text-sm font-semibold inline-flex items-center gap-2">
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Simulator
              </Link>
              <Link to="/report" className="px-5 py-2.5 rounded-lg btn-hero text-sm font-semibold inline-flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Open Clinician Brief
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Focus card                                                          */
/* ------------------------------------------------------------------ */

function FocusCard({ bottlenecks }: { bottlenecks: GeneratedPlan["bottlenecks"] }) {
  return (
    <div className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[var(--neon-green)]/5 blur-3xl pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-4 w-4 text-[var(--neon-green)]" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Your focus for the next 90 days</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-semibold mb-5">Three areas to support — gently.</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {bottlenecks.map((b, i) => {
            const focus = FOCUS_MAP[b.key] || FOCUS_MAP.sleep;
            const Icon = focus.icon;
            const tone = focus.tone === "teal" ? "--neon-green" : focus.tone === "coral" ? "--neon-red" : focus.tone === "amber" ? "--neon-orange" : "--neon-blue";
            return (
              <div key={i} className="glass-soft rounded-2xl p-5 relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in oklab, var(${tone}) 14%, transparent)` }}>
                    <Icon className="h-5 w-5" style={{ color: `var(${tone})` }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Focus {i + 1}</div>
                    <div className="text-sm font-medium">{focus.title}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{focus.reason}</p>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">First action</div>
                <p className="text-sm mt-1 leading-snug">{focus.firstAction}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Weekly rhythm                                                       */
/* ------------------------------------------------------------------ */

type Chip = { label: string; tone: "move" | "sleep" | "nutri" | "recov" };
const CHIP_TONE: Record<Chip["tone"], string> = {
  move: "--neon-blue",
  sleep: "--neon-green",
  nutri: "--neon-orange",
  recov: "--neon-red",
};
const CHIP_LABEL: Record<Chip["tone"], string> = {
  move: "Move",
  sleep: "Sleep",
  nutri: "Fuel",
  recov: "Recover",
};

function WeeklyRhythm({ interventions }: { interventions: string[] }) {
  const isStrength = interventions.includes("strength");
  const isZone2 = interventions.includes("zone2");
  const isFiber = interventions.includes("fiber");
  const isProtein = interventions.includes("protein");

  const week: { day: string; chips: Chip[] }[] = [
    { day: "Mon", chips: [{ tone: "move", label: isStrength ? "Strength" : "Light strength" }, { tone: "sleep", label: "7h+" }, { tone: "nutri", label: isProtein ? "Protein" : "Veg + protein" }] },
    { day: "Tue", chips: [{ tone: "move", label: isZone2 ? "Zone 2 45m" : "30m walk" }, { tone: "sleep", label: "7h+" }, { tone: "nutri", label: isFiber ? "Fiber" : "Whole foods" }] },
    { day: "Wed", chips: [{ tone: "move", label: isStrength ? "Strength" : "Mobility" }, { tone: "sleep", label: "7h+" }, { tone: "recov", label: "Stretch" }] },
    { day: "Thu", chips: [{ tone: "move", label: isZone2 ? "Zone 2 45m" : "Walk + steps" }, { tone: "sleep", label: "7h+" }, { tone: "nutri", label: "Hydrate" }] },
    { day: "Fri", chips: [{ tone: "move", label: isStrength ? "Strength" : "Bodyweight" }, { tone: "sleep", label: "7h+" }, { tone: "nutri", label: isProtein ? "Protein" : "Cook in" }] },
    { day: "Sat", chips: [{ tone: "move", label: "Long walk" }, { tone: "sleep", label: "7h+" }, { tone: "recov", label: "Sauna / bath" }] },
    { day: "Sun", chips: [{ tone: "move", label: "Mobility" }, { tone: "sleep", label: "7h+" }, { tone: "nutri", label: "Meal prep" }, { tone: "recov", label: "Reflect" }] },
  ];

  return (
    <SectionCard icon={<Clock className="h-4 w-4 text-[var(--neon-green)]" />} title="Weekly rhythm">
      <p className="text-xs text-muted-foreground mb-4">A gentle weekly template. Adjust to your life — consistency beats perfection.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {week.map((d) => (
          <div key={d.day} className="glass-soft rounded-xl p-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">{d.day}</div>
            <div className="flex flex-col gap-1.5">
              {d.chips.map((c, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-1 rounded-md font-medium"
                  style={{
                    color: `var(${CHIP_TONE[c.tone]})`,
                    background: `color-mix(in oklab, var(${CHIP_TONE[c.tone]}) 10%, transparent)`,
                  }}
                  title={CHIP_LABEL[c.tone]}
                >
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        {(["move", "sleep", "nutri", "recov"] as Chip["tone"][]).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: `var(${CHIP_TONE[t]})` }} />
            {CHIP_LABEL[t]}
          </span>
        ))}
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Doctor pack                                                         */
/* ------------------------------------------------------------------ */

function DoctorPack({ physicianItems }: { physicianItems: string[] }) {
  const questions = [
    {
      ask: "Is my ApoB in a range we should actively lower?",
      why: "ApoB tracks the particles that drive vascular risk over decades.",
      data: "Most recent lipid panel + ApoB; family cardiovascular history.",
    },
    {
      ask: "How should we approach my Vitamin D level?",
      why: "Vitamin D supports immune function and may influence inflammation.",
      data: "Current 25-OH Vitamin D value; current supplementation.",
    },
    {
      ask: "What does my fasting glucose / HbA1c trend mean for me?",
      why: "Early glucose drift is one of the most modifiable long-term risks.",
      data: "Last 2 fasting glucose values and HbA1c.",
    },
    {
      ask: "If hs-CRP stays elevated, what else should we look at?",
      why: "Persistent low-grade inflammation can change long-term risk.",
      data: "hs-CRP trend, any recent infections, sleep & alcohol context.",
    },
    {
      ask: "Are there cardiovascular screening steps worth considering?",
      why: "CAC or advanced lipid panels can refine personalized risk.",
      data: "Family history, blood pressure log, prior screening results.",
    },
  ].slice(0, Math.max(3, Math.min(5, physicianItems.length)));

  return (
    <SectionCard icon={<Stethoscope className="h-4 w-4 text-[var(--neon-blue)]" />} title="Doctor discussion pack">
      <p className="text-xs text-muted-foreground mb-4">A small set of conversations to bring to your next visit. None of these are directives.</p>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="glass-soft rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-lg bg-[var(--neon-blue)]/10 flex items-center justify-center shrink-0 text-[var(--neon-blue)] font-mono text-xs">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{q.ask}</div>
                <div className="mt-2 grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--neon-green)] mb-0.5">Why it matters</div>
                    <p className="leading-relaxed">{q.why}</p>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--neon-orange)] mb-0.5">Bring to visit</div>
                    <p className="leading-relaxed">{q.data}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Retest path                                                         */
/* ------------------------------------------------------------------ */

function RetestPath({ retests }: { retests: GeneratedPlan["retestPlan"] }) {
  const stops = [
    { time: "Today", title: "Baseline", note: "Where you start. No judgment.", color: "--neon-blue" },
    { time: retests[0]?.timing || "Week 6", title: "Check-in", note: retests[0]?.markers || "Spot-check trends.", color: "--neon-green" },
    { time: retests[1]?.timing || "Week 12", title: "Lab review", note: retests[1]?.markers || "Full panel + clinician review.", color: "--neon-orange" },
  ];
  return (
    <SectionCard icon={<FlaskConical className="h-4 w-4 text-[var(--neon-green)]" />} title="Retest path">
      <div className="relative pt-2">
        <div className="absolute left-4 right-4 top-7 h-px bg-gradient-to-r from-[var(--neon-blue)] via-[var(--neon-green)] to-[var(--neon-orange)] opacity-40" />
        <div className="grid grid-cols-3 gap-4 relative">
          {stops.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full glass flex items-center justify-center mb-3 relative z-10" style={{ borderColor: `var(${s.color})`, borderWidth: 1 }}>
                <span className="h-2 w-2 rounded-full" style={{ background: `var(${s.color})` }} />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: `var(${s.color})` }}>{s.time}</div>
              <div className="text-sm font-medium mt-1">{s.title}</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 max-w-[180px]">{s.note}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */

function SectionCard({ icon, title, children }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      </div>
      {children}
    </div>
  );
}
