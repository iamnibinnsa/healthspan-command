import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTwin } from "@/lib/twin-context";
import { useTwinProgress } from "@/lib/twin-progress";
import {
  INITIAL_DOMAINS, INITIAL_BIO_AGE_GAP, projectScores, type DomainKey,
} from "@/lib/mockData";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Legend, Tooltip,
  ReferenceLine, Cell,
} from "recharts";
import {
  Sparkles, Moon, Activity, HeartPulse, Flame, Dumbbell, Brain, Trophy,
  Plus, Minus, ArrowRight, Stethoscope, Salad, Footprints,
} from "lucide-react";

export const Route = createFileRoute("/simulator")({
  component: Simulator,
});

const ICONS = { Activity, HeartPulse, Flame, Dumbbell, Brain, Moon } as const;

// ---------- helpers ----------
function Toggle({
  active, onClick, children, tone = "var(--friendly-teal)",
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left p-3 rounded-xl transition"
      style={{
        background: active ? `color-mix(in oklab, ${tone} 12%, transparent)` : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? `color-mix(in oklab, ${tone} 50%, transparent)` : "rgba(255,255,255,0.06)"}`,
      }}
    >
      <span
        className="h-5 w-9 rounded-full p-0.5 transition shrink-0"
        style={{ background: active ? tone : "rgba(255,255,255,0.15)" }}
      >
        <span
          className="block h-4 w-4 rounded-full bg-white transition-transform"
          style={{ transform: active ? "translateX(16px)" : "translateX(0)" }}
        />
      </span>
      <span className="text-sm flex-1">{children}</span>
    </button>
  );
}

function Slider({
  label, value, min, max, step, unit, onChange, tone = "var(--friendly-teal)",
  hint,
}: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; onChange: (n: number) => void; tone?: string; hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-display text-lg" style={{ color: tone }}>
          {value > 0 ? "+" : ""}{value}<span className="text-[11px] text-muted-foreground font-sans ml-1">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none rounded-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${tone} 0%, ${tone} ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Stepper({
  label, value, min, max, onChange, tone = "var(--friendly-teal)", suffix,
}: {
  label: string; value: number; min: number; max: number;
  onChange: (n: number) => void; tone?: string; suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-xl"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-7 w-7 rounded-lg glass-soft flex items-center justify-center hover:scale-105 transition"
        >
          <Minus className="h-3 w-3" />
        </button>
        <div className="w-14 text-center">
          <span className="font-display text-lg" style={{ color: tone }}>{value}</span>
          {suffix && <div className="text-[10px] text-muted-foreground -mt-1">{suffix}</div>}
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-7 w-7 rounded-lg glass-soft flex items-center justify-center hover:scale-105 transition"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ---------- main ----------
function Simulator() {
  const { setInterventions } = useTwin();

  // Rich controls
  const [sleepMin, setSleepMin] = useState(0);
  const [wakeTime, setWakeTime] = useState(false);
  const [zone2, setZone2] = useState(0);
  const [strengthDays, setStrengthDays] = useState(0);
  const [fiberG, setFiberG] = useState(15);
  const [proteinMeal, setProteinMeal] = useState(false);
  const [homeCooked, setHomeCooked] = useState(false);
  const [discussApoB, setDiscussApoB] = useState(false);
  const [discussVitD, setDiscussVitD] = useState(false);
  const [discussSleep, setDiscussSleep] = useState(false);

  // Map rich controls → existing intervention IDs (preserves logic)
  const activeIds = useMemo(() => {
    const ids: string[] = [];
    if (sleepMin >= 30) ids.push("sleep45");
    if (wakeTime) ids.push("alcohol"); // sleep-hygiene proxy
    if (zone2 >= 75) ids.push("zone2");
    if (strengthDays >= 2) ids.push("strength");
    if (fiberG >= 25) ids.push("fiber");
    if (proteinMeal) ids.push("protein");
    if (discussApoB) ids.push("apob");
    if (discussVitD) ids.push("vitd");
    return ids;
  }, [sleepMin, wakeTime, zone2, strengthDays, fiberG, proteinMeal, discussApoB, discussVitD]);

  useEffect(() => {
    setInterventions(activeIds);
  }, [activeIds, setInterventions]);

  const proj = projectScores(activeIds);
  const healthDelta = proj.healthspan - proj.baselineHealthspan;
  const gapDelta = +(proj.bioAgeGap - INITIAL_BIO_AGE_GAP).toFixed(1);

  const chartData = INITIAL_DOMAINS.map((d) => ({
    name: d.short,
    Before: proj.baselineDomains[d.key],
    "With selected changes": proj.domains[d.key],
    delta: proj.domains[d.key] - proj.baselineDomains[d.key],
  }));

  // XP — 10 per slider point of progress + 25 per toggle/quest
  const xp =
    Math.round(sleepMin / 9) * 10 +
    Math.round(zone2 / 18) * 10 +
    strengthDays * 25 +
    Math.max(0, fiberG - 15) * 4 +
    [wakeTime, proteinMeal, homeCooked, discussApoB, discussVitD, discussSleep].filter(Boolean).length * 25;

  // Badges
  const badges = [
    { id: "recovery", label: "Recovery Builder", earned: sleepMin >= 30 || wakeTime, icon: Moon, tone: "var(--friendly-teal)" },
    { id: "heart", label: "Heart Helper", earned: zone2 >= 75 || discussApoB, icon: HeartPulse, tone: "var(--friendly-coral)" },
    { id: "strength", label: "Strength Stacker", earned: strengthDays >= 2, icon: Dumbbell, tone: "var(--friendly-mint)" },
    { id: "glucose", label: "Glucose Guardian", earned: fiberG >= 25 || proteinMeal, icon: Activity, tone: "var(--friendly-amber)" },
    { id: "doctor", label: "Doctor-Ready", earned: discussApoB || discussVitD || discussSleep, icon: Stethoscope, tone: "var(--friendly-teal)" },
  ];

  // Quest stack
  const quests: string[] = [];
  if (sleepMin > 0) quests.push(`Sleep +${sleepMin} min/night`);
  if (wakeTime) quests.push("Consistent wake time");
  if (zone2 > 0) quests.push(`Zone 2 cardio ${zone2} min/week`);
  if (strengthDays > 0) quests.push(`Strength ${strengthDays}×/week`);
  if (fiberG > 15) quests.push(`Fiber target ${fiberG} g/day`);
  if (proteinMeal) quests.push("Protein at every meal");
  if (homeCooked) quests.push("More home-cooked meals");
  if (discussApoB) quests.push("Discuss ApoB/lipids with clinician");
  if (discussVitD) quests.push("Discuss Vitamin D with clinician");
  if (discussSleep) quests.push("Discuss sleep/HRV with clinician");

  // Mini orbit system lighting
  const systemTone = (key: DomainKey) => {
    const delta = proj.domains[key] - proj.baselineDomains[key];
    if (delta >= 8) return "var(--friendly-mint)";
    if (delta >= 3) return "var(--friendly-teal)";
    if (delta > 0) return "var(--friendly-amber)";
    return "rgba(255,255,255,0.2)";
  };

  // Celebratory animation trigger
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (healthDelta >= 10) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 2200);
      return () => clearTimeout(t);
    }
  }, [healthDelta]);

  const reset = () => {
    setSleepMin(0); setWakeTime(false); setZone2(0); setStrengthDays(0);
    setFiberG(15); setProteinMeal(false); setHomeCooked(false);
    setDiscussApoB(false); setDiscussVitD(false); setDiscussSleep(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8 relative">
      {celebrate && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="glass rounded-2xl px-5 py-3 flex items-center gap-2.5"
            style={{
              border: "1px solid color-mix(in oklab, var(--friendly-mint) 50%, transparent)",
              boxShadow: "0 0 32px color-mix(in oklab, var(--friendly-mint) 35%, transparent)",
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: "var(--friendly-mint)" }} />
            <span className="text-sm font-semibold">Big shift unlocked! +{healthDelta} points</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: "var(--friendly-teal)" }}>
            Intervention playground
          </div>
          <h1 className="text-4xl font-display font-semibold mt-1">
            Try small changes. See what may improve.
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Explore how sleep, movement, food, and clinician follow-up could support your six body systems.
            These are directional estimates, not predictions.
          </p>
        </div>
        <button onClick={reset} className="px-3 py-1.5 rounded-lg glass-soft text-xs">Reset</button>
      </div>

      {/* Top summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Current score" value={proj.baselineHealthspan} tone="var(--friendly-amber)" />
        <SummaryCard
          label="Potential score"
          value={proj.healthspan}
          tone="var(--friendly-mint)"
          delta={healthDelta > 0 ? `+${healthDelta}` : undefined}
        />
        <SummaryCard
          label="Opportunity unlocked"
          value={Math.max(0, healthDelta)}
          tone="var(--friendly-teal)"
          suffix="pts"
          hint={gapDelta < 0 ? `Age gap −${Math.abs(gapDelta)} yr` : "Add a few changes to unlock"}
        />
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Active changes</div>
          <div className="font-display text-5xl mt-2" style={{ color: "var(--friendly-teal)" }}>
            {quests.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">+{xp} Twin XP</div>
          <Trophy className="absolute -right-3 -bottom-3 h-20 w-20" style={{ color: "color-mix(in oklab, var(--friendly-mint) 12%, transparent)" }} />
        </div>
      </div>

      {/* Main grid: playground + quest stack */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* Playground */}
        <div className="lg:col-span-8 space-y-4">
          {/* Recovery */}
          <PlaygroundSection
            title="Recovery Rhythm"
            icon={Moon}
            tone="var(--friendly-teal)"
            affects={["Recovery", "Cognition", "Inflammation"]}
          >
            <Slider
              label="Sleep extension"
              value={sleepMin} min={0} max={90} step={15}
              unit="min/night" onChange={setSleepMin} tone="var(--friendly-teal)"
              hint={sleepMin >= 30 ? "Unlocks the +45 min recovery effect" : "Nudge past 30 min to unlock impact"}
            />
            <Toggle active={wakeTime} onClick={() => setWakeTime((v) => !v)}>
              Consistent wake time (7 days/week)
            </Toggle>
          </PlaygroundSection>

          {/* Movement */}
          <PlaygroundSection
            title="Movement Builder"
            icon={Footprints}
            tone="var(--friendly-mint)"
            affects={["Metabolic", "Heart", "Muscle", "Cognition"]}
          >
            <Slider
              label="Zone 2 cardio"
              value={zone2} min={0} max={180} step={15}
              unit="min/week" onChange={setZone2} tone="var(--friendly-mint)"
              hint={zone2 >= 75 ? "Unlocks aerobic base effect" : "Aim past 75 min/week to unlock impact"}
            />
            <Stepper
              label="Strength sessions"
              value={strengthDays} min={0} max={4} suffix="/week"
              onChange={setStrengthDays} tone="var(--friendly-mint)"
            />
          </PlaygroundSection>

          {/* Fuel */}
          <PlaygroundSection
            title="Fuel & Nutrition"
            icon={Salad}
            tone="var(--friendly-amber)"
            affects={["Metabolic", "Inflammation", "Muscle"]}
          >
            <Slider
              label="Fiber target"
              value={fiberG} min={10} max={40} step={5}
              unit="g/day" onChange={setFiberG} tone="var(--friendly-amber)"
              hint={fiberG >= 25 ? "Unlocks microbiome + glucose effect" : "Aim past 25 g/day to unlock impact"}
            />
            <Toggle active={proteinMeal} onClick={() => setProteinMeal((v) => !v)} tone="var(--friendly-amber)">
              Protein at each meal
            </Toggle>
            <Toggle active={homeCooked} onClick={() => setHomeCooked((v) => !v)} tone="var(--friendly-amber)">
              More home-cooked meals
            </Toggle>
          </PlaygroundSection>

          {/* Clinician */}
          <PlaygroundSection
            title="Clinician Conversation"
            icon={Stethoscope}
            tone="var(--friendly-coral)"
            affects={["Discussion quests"]}
            footer="Adds a doctor-discussion quest, not automatic treatment."
          >
            <Toggle active={discussApoB} onClick={() => setDiscussApoB((v) => !v)} tone="var(--friendly-coral)">
              Discuss ApoB / lipids
            </Toggle>
            <Toggle active={discussVitD} onClick={() => setDiscussVitD((v) => !v)} tone="var(--friendly-coral)">
              Discuss Vitamin D
            </Toggle>
            <Toggle active={discussSleep} onClick={() => setDiscussSleep((v) => !v)} tone="var(--friendly-coral)">
              Discuss sleep / HRV concerns
            </Toggle>
          </PlaygroundSection>
        </div>

        {/* Quest stack + mini orbit + badges */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Mini orbit */}
          <div className="glass rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
              Six systems lighting up
            </div>
            <div className="relative aspect-square max-w-[240px] mx-auto">
              <div className="absolute inset-[14%] rounded-full border border-white/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-display text-2xl" style={{ color: "var(--friendly-mint)" }}>
                    {proj.healthspan}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">readiness</div>
                </div>
              </div>
              {INITIAL_DOMAINS.map((d, i) => {
                const angle = (i / INITIAL_DOMAINS.length) * Math.PI * 2 - Math.PI / 2;
                const x = 50 + 42 * Math.cos(angle);
                const y = 50 + 42 * Math.sin(angle);
                const Icon = ICONS[d.icon as keyof typeof ICONS] ?? Activity;
                const tone = systemTone(d.key);
                const lit = tone !== "rgba(255,255,255,0.2)";
                return (
                  <div
                    key={d.key}
                    className="absolute -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-xl glass flex items-center justify-center transition-all duration-500"
                    style={{
                      left: `${x}%`, top: `${y}%`,
                      border: `1px solid color-mix(in oklab, ${tone} 50%, transparent)`,
                      boxShadow: lit ? `0 0 16px color-mix(in oklab, ${tone} 50%, transparent)` : "none",
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: tone }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quest stack */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Your 90-day experiment
              </div>
              <span className="text-[10px] text-muted-foreground">{quests.length} quests</span>
            </div>
            {quests.length === 0 ? (
              <div className="text-xs text-muted-foreground italic py-4 text-center">
                Pick a change to stack your first quest.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {quests.map((q) => (
                  <li
                    key={q}
                    className="text-[13px] flex items-start gap-2 p-2 rounded-lg animate-in fade-in slide-in-from-left-1 duration-300"
                    style={{ background: "color-mix(in oklab, var(--friendly-teal) 8%, transparent)" }}
                  >
                    <Sparkles className="h-3 w-3 mt-0.5 shrink-0" style={{ color: "var(--friendly-teal)" }} />
                    {q}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Badges */}
          <div className="glass rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Badges</div>
            <div className="grid grid-cols-2 gap-2">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl p-3 flex items-center gap-2 transition"
                  style={{
                    background: b.earned ? `color-mix(in oklab, ${b.tone} 12%, transparent)` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${b.earned ? `color-mix(in oklab, ${b.tone} 45%, transparent)` : "rgba(255,255,255,0.06)"}`,
                    opacity: b.earned ? 1 : 0.5,
                  }}
                >
                  <b.icon className="h-4 w-4 shrink-0" style={{ color: b.earned ? b.tone : "rgba(255,255,255,0.4)" }} />
                  <span className="text-[11px] font-medium leading-tight">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Before / After chart */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Before vs With selected changes
            </div>
            <div className="font-display text-lg mt-1">Six-system projection</div>
          </div>
          <div className="text-[11px] text-muted-foreground italic">
            Directional demo estimate — not a clinical prediction.
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={chartData} barGap={6}>
              <defs>
                <linearGradient id="beforeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.55 0.06 230)" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="oklch(0.4 0.05 230)" stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="afterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--friendly-mint)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--friendly-teal)" stopOpacity={0.85} />
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
                  borderRadius: 12, fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={75} stroke="var(--friendly-mint)" strokeDasharray="3 4" strokeOpacity={0.4}
                label={{ value: "strong", fill: "var(--friendly-mint)", fontSize: 10, position: "right" }} />
              <Bar dataKey="Before" fill="url(#beforeGrad)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="With selected changes" fill="url(#afterGrad)" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fillOpacity={entry.delta > 0 ? 1 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link
          to="/plan"
          className="px-6 py-3 rounded-xl btn-hero text-sm font-semibold inline-flex items-center gap-2"
        >
          Build My 90-Day Guide <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({
  label, value, tone, suffix, delta, hint,
}: {
  label: string; value: number; tone: string; suffix?: string; delta?: string; hint?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-5xl mt-2 flex items-baseline gap-1.5" style={{ color: tone }}>
        {value}
        {suffix && <span className="text-base text-muted-foreground font-sans">{suffix}</span>}
        {delta && (
          <span className="text-sm font-mono" style={{ color: "var(--friendly-mint)" }}>{delta}</span>
        )}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function PlaygroundSection({
  title, icon: Icon, tone, affects, children, footer,
}: {
  title: string; icon: typeof Activity; tone: string;
  affects: string[]; children: React.ReactNode; footer?: string;
}) {
  return (
    <div
      className="glass rounded-2xl p-5"
      style={{ border: `1px solid color-mix(in oklab, ${tone} 25%, transparent)` }}
    >
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: `color-mix(in oklab, ${tone} 15%, transparent)` }}
          >
            <Icon className="h-5 w-5" style={{ color: tone }} />
          </div>
          <div className="font-display text-lg font-semibold">{title}</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {affects.map((a) => (
            <span
              key={a}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                color: tone,
                border: `1px solid color-mix(in oklab, ${tone} 35%, transparent)`,
                background: `color-mix(in oklab, ${tone} 8%, transparent)`,
              }}
            >
              {a}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
      {footer && <div className="text-[11px] text-muted-foreground mt-3 italic">{footer}</div>}
    </div>
  );
}
