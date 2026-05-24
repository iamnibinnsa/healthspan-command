import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { useTwin, type IntakeData } from "@/lib/twin-context";
import {
  ArrowRight, ArrowLeft, Sparkles, Check, Heart, Brain, Dumbbell,
  HeartPulse, Moon, Stethoscope, Activity, Droplet, ShieldAlert,
  HelpCircle, Lock, Watch, Gem, Compass, CircleDashed, Lightbulb, ShieldCheck,
} from "lucide-react";
import { ProgressQuestStepper } from "@/components/ProgressQuestStepper";
import { CTA } from "@/lib/copy";

export const Route = createFileRoute("/intake")({
  component: Intake,
});

/* ------------------------------------------------------------------ */
/*  Quest configuration                                                 */
/* ------------------------------------------------------------------ */

type IconCmp = React.ComponentType<{ className?: string }>;

const QUEST_STEPS = [
  { label: "Profile",  hint: "Create your twin"      },
  { label: "Rhythm",   hint: "Map your daily rhythm" },
  { label: "Signals",  hint: "Lifestyle signals"     },
  { label: "Context",  hint: "Family & devices"      },
];

const STEP_HEADERS = [
  {
    eyebrow: "Quest 1 of 4 · Profile",
    title:   "Let's create your twin",
    subtitle:"A few basics help LIFE personalize your health signals.",
  },
  {
    eyebrow: "Quest 2 of 4 · Rhythm",
    title:   "Map your daily rhythm",
    subtitle:"Sleep and movement are two of the biggest levers your twin can learn from.",
  },
  {
    eyebrow: "Quest 3 of 4 · Signals",
    title:   "Tune your stress & fuel signals",
    subtitle:"These signals help LIFE understand what your body may need more support with.",
  },
  {
    eyebrow: "Quest 4 of 4 · Context",
    title:   "Add your health context",
    subtitle:"Family history and wearables help your twin connect the dots — only if you choose to share.",
  },
] as const;

const INSIGHTS = [
  "Your twin will use these goals to spotlight what matters most to you — every page after this is filtered through them.",
  "Your sleep and movement rhythm shape your twin's first recovery suggestions, especially around energy and resilience.",
  "Your twin will use this to personalize recovery and nutrition suggestions — no restrictive rules, just gentle nudges.",
  "Your twin connects family context and wearable signals only when you choose to share them. You can change your mind anytime.",
];

const GOAL_OPTIONS: { id: string; label: string; sub: string; Icon: IconCmp; color: string }[] = [
  { id: "Live longer with energy",    label: "Live longer with energy",    sub: "Healthy years, not just years",    Icon: Heart,       color: "neon-green"  },
  { id: "Feel sharper",               label: "Feel sharper",               sub: "Focus, mood, and clarity",         Icon: Brain,       color: "neon-blue"   },
  { id: "Improve fitness",            label: "Improve fitness",            sub: "Strength and stamina",             Icon: Dumbbell,    color: "neon-green"  },
  { id: "Support heart & metabolism", label: "Support heart & metabolism", sub: "Glucose, lipids, blood pressure",  Icon: HeartPulse,  color: "neon-orange" },
  { id: "Sleep and recover better",   label: "Sleep and recover better",   sub: "Wake up restored",                 Icon: Moon,        color: "neon-blue"   },
  { id: "Prepare for a doctor visit", label: "Prepare for a doctor visit", sub: "Bring a clear conversation",       Icon: Stethoscope, color: "neon-green"  },
];

const HISTORY_OPTIONS: { id: string; label: string; Icon: IconCmp; color: string }[] = [
  { id: "Heart health",          label: "Heart health",          Icon: HeartPulse,  color: "neon-red"    },
  { id: "Blood sugar",           label: "Blood sugar",           Icon: Droplet,     color: "neon-orange" },
  { id: "Memory / brain health", label: "Memory / brain health", Icon: Brain,       color: "neon-blue"   },
  { id: "Cancer history",        label: "Cancer history",        Icon: ShieldAlert, color: "neon-orange" },
  { id: "Not sure",              label: "Not sure",               Icon: HelpCircle,  color: "neon-blue"   },
  { id: "Prefer not to say",     label: "Prefer not to say",      Icon: Lock,        color: "neon-blue"   },
];

const WEARABLE_OPTIONS: { id: string; label: string; Icon: IconCmp }[] = [
  { id: "Apple Watch", label: "Apple Watch",      Icon: Watch          },
  { id: "Oura",        label: "Oura",             Icon: Gem            },
  { id: "Whoop",       label: "Whoop",            Icon: Activity       },
  { id: "Garmin",      label: "Garmin",           Icon: Compass        },
  { id: "Fitbit",      label: "Fitbit",           Icon: Heart          },
  { id: "None",        label: "No wearable yet",  Icon: CircleDashed   },
];

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

function Intake() {
  const { intake, setIntake } = useTwin();
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const [draft, setDraft] = useState<IntakeData>(intake);

  const next = () => {
    if (step < 3) setStep(step + 1);
    else {
      setIntake(draft);
      navigate({ to: "/upload" });
    }
  };
  const back = () => setStep(Math.max(0, step - 1));

  // Soft XP economy: 10 per goal (cap 6) + 25 per advanced step.
  const xp = useMemo(
    () => 10 * Math.min(draft.goals.length, 6) + 25 * step,
    [draft.goals.length, step],
  );

  const header = STEP_HEADERS[step];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <ProgressQuestStepper
          steps={QUEST_STEPS}
          current={step}
          questLabel="Twin Builder Quest"
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-5 lg:gap-6">
        {/* MAIN COLUMN */}
        <div className="lg:col-span-8 space-y-5">
          <header>
            <div className="flex items-center gap-2 text-[var(--neon-green)] mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em]">
                {header.eyebrow}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-semibold leading-tight">
              {header.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              {header.subtitle}
            </p>
          </header>

          <div className="glass rounded-3xl p-5 sm:p-7 space-y-6">
            {step === 0 && <Step1 draft={draft} setDraft={setDraft} />}
            {step === 1 && <Step2 draft={draft} setDraft={setDraft} />}
            {step === 2 && <Step3 draft={draft} setDraft={setDraft} />}
            {step === 3 && <Step4 draft={draft} setDraft={setDraft} />}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={back}
              disabled={step === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass-soft text-sm disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={next}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-hero text-sm font-semibold"
            >
              {step === 3
                ? CTA.unlockLabTwin
                : step === 0
                  ? "Begin quest"
                  : "Keep going"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ASIDE COLUMN */}
        <aside className="lg:col-span-4 space-y-3 lg:sticky lg:top-24 self-start">
          <TwinXPCard xp={xp} step={step} goalCount={draft.goals.length} />
          <InsightUnlockedCard text={INSIGHTS[step]} />
          <PrivacyNote />
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step bodies                                                          */
/* ------------------------------------------------------------------ */

interface StepProps {
  draft: IntakeData;
  setDraft: (d: IntakeData) => void;
}

function Step1({ draft, setDraft }: StepProps) {
  const toggleGoal = (id: string) =>
    setDraft({
      ...draft,
      goals: draft.goals.includes(id)
        ? draft.goals.filter((g) => g !== id)
        : [...draft.goals, id],
    });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Your name">
          <input
            className="w-full bg-input rounded-lg px-4 py-3 text-sm outline-none focus:neon-border-blue transition"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="What should we call you?"
          />
        </Field>
        <Field label="Age">
          <input
            type="number"
            min={1}
            max={120}
            className="w-full bg-input rounded-lg px-4 py-3 text-sm outline-none focus:neon-border-blue transition"
            value={draft.age}
            onChange={(e) => setDraft({ ...draft, age: +e.target.value })}
          />
        </Field>
        <Field label="Sex">
          <select
            className="w-full bg-input rounded-lg px-4 py-3 text-sm outline-none focus:neon-border-blue transition"
            value={draft.sex}
            onChange={(e) => setDraft({ ...draft, sex: e.target.value })}
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </Field>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-3">
        Used only to personalize reference ranges and recommendations.
      </p>

      <div>
        <div className="flex items-end justify-between flex-wrap gap-2 mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              What matters most to you right now?
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Pick any that resonate — you can change these later.
            </div>
          </div>
          <span className="text-[10px] font-mono text-[var(--neon-green)] tabular-nums">
            +{draft.goals.length * 10} Twin XP
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GOAL_OPTIONS.map((g) => (
            <GoalCard
              key={g.id}
              label={g.label}
              sub={g.sub}
              Icon={g.Icon}
              color={g.color}
              active={draft.goals.includes(g.id)}
              onClick={() => toggleGoal(g.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({ draft, setDraft }: StepProps) {
  const sleep = draft.sleepHours;
  const sleepLabel =
    sleep < 6 ? "Needs recovery support" : sleep < 7 ? "Building consistency" : "Strong recovery window";
  const sleepColor =
    sleep < 6 ? "neon-orange" : sleep < 7 ? "neon-blue" : "neon-green";

  const ex = draft.exerciseFreq;
  const exLabel = ex <= 1 ? "Starting point" : ex <= 4 ? "Momentum building" : "Strong routine";
  const exColor = ex <= 1 ? "neon-orange" : ex <= 4 ? "neon-blue" : "neon-green";

  return (
    <div className="space-y-5">
      <SliderCard
        Icon={Moon}
        title="On a typical night, how long do you sleep?"
        value={sleep}
        display={`${sleep.toFixed(1)} hr`}
        min={3}
        max={10}
        step={0.1}
        ringPct={Math.min(100, Math.max(0, ((sleep - 3) / 7) * 100))}
        liveLabel={sleepLabel}
        color={sleepColor}
        onChange={(v) => setDraft({ ...draft, sleepHours: v })}
      />
      <SliderCard
        Icon={Dumbbell}
        title="How many days a week do you move your body?"
        value={ex}
        display={`${ex} ${ex === 1 ? "day" : "days"}`}
        min={0}
        max={7}
        step={1}
        ringPct={(ex / 7) * 100}
        liveLabel={exLabel}
        color={exColor}
        onChange={(v) => setDraft({ ...draft, exerciseFreq: v })}
      />

      <div
        className="text-[12px] text-muted-foreground rounded-xl px-4 py-3 flex items-start gap-2"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--neon-blue) 8%, transparent), transparent)",
          border: "1px solid color-mix(in oklab, var(--neon-blue) 22%, transparent)",
        }}
      >
        <Sparkles className="h-4 w-4 text-[var(--neon-blue)] mt-0.5 shrink-0" />
        No judgment — this is your starting point, not a scorecard.
      </div>
    </div>
  );
}

function Step3({ draft, setDraft }: StepProps) {
  return (
    <div className="space-y-5">
      <GaugeCard
        title="How stressed have you felt lately?"
        value={draft.stress}
        bands={[
          { label: "Calm",       to: 3,  color: "neon-green"  },
          { label: "Steady",     to: 6,  color: "neon-blue"   },
          { label: "Loaded",     to: 8,  color: "neon-orange" },
          { label: "Overloaded", to: 10, color: "neon-red"    },
        ]}
        coachCopy="High stress can affect sleep, glucose, and recovery. We'll help you find gentle first steps."
        onChange={(v) => setDraft({ ...draft, stress: v })}
      />
      <GaugeCard
        title="How would you describe the way you've been eating?"
        value={draft.diet}
        bands={[
          { label: "Inconsistent", to: 3,  color: "neon-orange" },
          { label: "Building",     to: 5,  color: "neon-orange" },
          { label: "Balanced",     to: 7,  color: "neon-blue"   },
          { label: "Nourishing",   to: 10, color: "neon-green"  },
        ]}
        coachCopy="This helps us suggest practical nutrition habits, not restrictive rules."
        onChange={(v) => setDraft({ ...draft, diet: v })}
      />
    </div>
  );
}

function Step4({ draft, setDraft }: StepProps) {
  const toggleHistory = (id: string) =>
    setDraft({
      ...draft,
      familyHistory: draft.familyHistory.includes(id)
        ? draft.familyHistory.filter((x) => x !== id)
        : [...draft.familyHistory, id],
    });

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Anything that runs in your family?
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 mb-3">
          All optional. You can skip anything — your twin still works with what you share.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {HISTORY_OPTIONS.map((h) => (
            <ChoiceCard
              key={h.id}
              label={h.label}
              Icon={h.Icon}
              color={h.color}
              active={draft.familyHistory.includes(h.id)}
              onClick={() => toggleHistory(h.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Do you wear anything that tracks you?
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 mb-3">
          Pick one — your twin works great even without a device.
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {WEARABLE_OPTIONS.map((w) => (
            <ChoiceCard
              key={w.id}
              label={w.label}
              Icon={w.Icon}
              color="neon-blue"
              active={draft.wearable === w.id}
              onClick={() => setDraft({ ...draft, wearable: w.id })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cards                                                                */
/* ------------------------------------------------------------------ */

function GoalCard({
  label, sub, Icon, color, active, onClick,
}: {
  label: string; sub: string; Icon: IconCmp; color: string;
  active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="relative text-left glass-soft rounded-2xl p-4 transition group hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: active
          ? `linear-gradient(135deg, color-mix(in oklab, var(--${color}) 18%, oklch(0.22 0.03 250 / 0.6)), color-mix(in oklab, var(--${color}) 5%, oklch(0.22 0.03 250 / 0.55)))`
          : undefined,
        border: active
          ? `1px solid var(--${color})`
          : "1px solid color-mix(in oklab, var(--neon-blue) 18%, transparent)",
        boxShadow: active
          ? `0 0 22px -6px color-mix(in oklab, var(--${color}) 60%, transparent)`
          : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition"
          style={{
            background: `color-mix(in oklab, var(--${color}) ${active ? 24 : 12}%, transparent)`,
            color: `var(--${color})`,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold leading-snug">{label}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{sub}</div>
        </div>
        <span
          className="h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition"
          style={
            active
              ? { background: `var(--${color})`, color: "oklch(0.12 0.03 250)" }
              : { border: "1px solid oklch(0.4 0.05 230 / 0.5)" }
          }
        >
          {active && <Check className="h-3 w-3" />}
        </span>
      </div>
      {active && (
        <span className="absolute top-2 right-2 text-[9px] font-mono text-[var(--neon-green)] animate-pulse pointer-events-none">
          +10 XP
        </span>
      )}
    </button>
  );
}

function ChoiceCard({
  label, Icon, color, active, onClick,
}: {
  label: string; Icon: IconCmp; color: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="text-left rounded-xl p-3 transition flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] glass-soft"
      style={{
        background: active
          ? `linear-gradient(135deg, color-mix(in oklab, var(--${color}) 16%, oklch(0.22 0.03 250 / 0.6)), oklch(0.22 0.03 250 / 0.55))`
          : undefined,
        border: active
          ? `1px solid var(--${color})`
          : "1px solid transparent",
        boxShadow: active
          ? `0 0 18px -6px color-mix(in oklab, var(--${color}) 55%, transparent)`
          : undefined,
      }}
    >
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: `color-mix(in oklab, var(--${color}) ${active ? 22 : 10}%, transparent)`,
          color: `var(--${color})`,
        }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-sm font-medium flex-1 truncate">{label}</div>
      {active && <Check className="h-4 w-4 shrink-0" style={{ color: `var(--${color})` }} />}
    </button>
  );
}

function SliderCard({
  Icon, title, value, display, min, max, step, ringPct, liveLabel, color, onChange,
}: {
  Icon: IconCmp; title: string; value: number; display: string;
  min: number; max: number; step: number; ringPct: number;
  liveLabel: string; color: string; onChange: (v: number) => void;
}) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const off = c - (ringPct / 100) * c;

  return (
    <div
      className="rounded-2xl p-5 transition"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, var(--${color}) 9%, oklch(0.22 0.03 250 / 0.6)), oklch(0.22 0.03 250 / 0.55))`,
        border: `1px solid color-mix(in oklab, var(--${color}) 28%, transparent)`,
      }}
    >
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0">
          <svg viewBox="0 0 60 60" className="absolute inset-0 -rotate-90">
            <circle cx="30" cy="30" r={r} stroke="oklch(0.4 0.04 250 / 0.4)" strokeWidth="4" fill="none" />
            <circle
              cx="30" cy="30" r={r}
              stroke={`var(--${color})`}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={off}
              style={{
                transition: "stroke-dashoffset .4s ease, stroke .4s ease",
                filter: `drop-shadow(0 0 6px var(--${color}))`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: `var(--${color})` }}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-snug">{title}</div>
          <div className="mt-2 flex items-baseline justify-between gap-3 flex-wrap">
            <div className="font-display text-2xl tabular-nums" style={{ color: `var(--${color})` }}>
              {display}
            </div>
            <span
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                color: `var(--${color})`,
                background: `color-mix(in oklab, var(--${color}) 14%, transparent)`,
                border: `1px solid color-mix(in oklab, var(--${color}) 35%, transparent)`,
              }}
            >
              {liveLabel}
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(+e.target.value)}
            className="w-full mt-3"
            style={{ accentColor: `var(--${color})` }}
          />
        </div>
      </div>
    </div>
  );
}

function GaugeCard({
  title, value, bands, coachCopy, onChange,
}: {
  title: string;
  value: number;
  bands: { label: string; to: number; color: string }[];
  coachCopy: string;
  onChange: (v: number) => void;
}) {
  const activeBand = bands.find((b) => value <= b.to) ?? bands[bands.length - 1];
  const pct = (value / 10) * 100;

  return (
    <div
      className="rounded-2xl p-5 transition"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, var(--${activeBand.color}) 8%, oklch(0.22 0.03 250 / 0.6)), oklch(0.22 0.03 250 / 0.55))`,
        border: `1px solid color-mix(in oklab, var(--${activeBand.color}) 28%, transparent)`,
      }}
    >
      <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
        <div className="text-sm font-medium leading-snug">{title}</div>
        <span
          className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{
            color: `var(--${activeBand.color})`,
            background: `color-mix(in oklab, var(--${activeBand.color}) 14%, transparent)`,
            border: `1px solid color-mix(in oklab, var(--${activeBand.color}) 35%, transparent)`,
          }}
        >
          {activeBand.label} · {value}/10
        </span>
      </div>

      <div className="relative h-3 rounded-full overflow-hidden bg-[oklch(0.3_0.04_250/0.5)] flex">
        {bands.map((b, i) => {
          const prevTo = i === 0 ? 0 : bands[i - 1].to;
          const span = ((b.to - prevTo) / 10) * 100;
          return (
            <div
              key={`${b.label}-${i}`}
              style={{
                width: `${span}%`,
                background: `color-mix(in oklab, var(--${b.color}) 50%, transparent)`,
              }}
            />
          );
        })}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-5 w-1.5 rounded-full"
          style={{
            left: `calc(${pct}% - 3px)`,
            background: `var(--${activeBand.color})`,
            boxShadow: `0 0 10px var(--${activeBand.color})`,
            transition: "left .25s ease, background .35s ease",
          }}
        />
      </div>

      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full mt-3"
        style={{ accentColor: `var(--${activeBand.color})` }}
      />

      <div className="grid grid-cols-4 text-[10px] uppercase tracking-wider mt-1">
        {bands.map((b) => (
          <div
            key={b.label}
            className="truncate"
            style={{
              color:
                b.label === activeBand.label
                  ? `var(--${b.color})`
                  : "oklch(0.65 0.02 230 / 0.7)",
            }}
          >
            {b.label}
          </div>
        ))}
      </div>

      <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed">{coachCopy}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Aside cards                                                          */
/* ------------------------------------------------------------------ */

function TwinXPCard({ xp, step, goalCount }: { xp: number; step: number; goalCount: number }) {
  const pct = Math.round(((step + 1) / 4) * 100);
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
          <div className="font-display text-3xl mt-0.5 text-foreground tabular-nums">
            {xp}
          </div>
        </div>
        <Sparkles className="h-7 w-7 text-[var(--neon-green)]" />
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">
        Twin profile <span className="text-foreground font-medium">{pct}%</span> built
        {goalCount > 0 && step === 0 && (
          <span className="text-[var(--neon-green)]"> · {goalCount} goal{goalCount === 1 ? "" : "s"} chosen</span>
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

function InsightUnlockedCard({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--neon-blue) 12%, oklch(0.22 0.03 250 / 0.65)), oklch(0.22 0.03 250 / 0.7))",
        border: "1px solid color-mix(in oklab, var(--neon-blue) 28%, transparent)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4 text-[var(--neon-blue)]" />
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--neon-blue)]">
          Insight unlocked
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function PrivacyNote() {
  return (
    <div
      className="rounded-xl p-3 flex gap-2 items-start text-[12px] text-muted-foreground"
      style={{
        background: "oklch(0.22 0.03 250 / 0.55)",
        border: "1px solid color-mix(in oklab, var(--neon-green) 22%, transparent)",
      }}
    >
      <ShieldCheck className="h-4 w-4 text-[var(--neon-green)] mt-0.5 shrink-0" />
      <span>
        Your inputs help personalize your twin. This demo does not store sensitive medical data unless connected to a backend.
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tiny helper                                                          */
/* ------------------------------------------------------------------ */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
      {children}
    </div>
  );
}
