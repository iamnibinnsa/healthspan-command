import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTwin } from "@/lib/twin-context";
import { useTwinProgress } from "@/lib/twin-progress";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Heart,
  Brain,
  Activity,
  Moon,
  Dumbbell,
  Stethoscope,
  Sparkles,
  Watch,
  Droplet,
  HelpCircle,
  EyeOff,
  Smartphone,
  CircleDot,
} from "lucide-react";
import { ProgressQuestStepper } from "@/components/ProgressQuestStepper";
import { InsightCard } from "@/components/InsightCard";
import { TrustNote } from "@/components/TrustNote";

export const Route = createFileRoute("/intake")({
  component: Intake,
});

// ─── Option catalogues (friendly labels stored as state values) ───────────────
const GOALS: { label: string; icon: React.ReactNode; tone: string }[] = [
  { label: "Live longer with energy", icon: <Sparkles className="h-5 w-5" />, tone: "var(--friendly-teal)" },
  { label: "Feel sharper", icon: <Brain className="h-5 w-5" />, tone: "var(--friendly-sky)" },
  { label: "Improve fitness", icon: <Dumbbell className="h-5 w-5" />, tone: "var(--friendly-mint)" },
  { label: "Support heart & metabolism", icon: <Heart className="h-5 w-5" />, tone: "var(--friendly-coral)" },
  { label: "Sleep and recover better", icon: <Moon className="h-5 w-5" />, tone: "var(--friendly-violet)" },
  { label: "Prepare for a doctor visit", icon: <Stethoscope className="h-5 w-5" />, tone: "var(--friendly-amber)" },
];

const HISTORY: { label: string; icon: React.ReactNode }[] = [
  { label: "Heart health", icon: <Heart className="h-5 w-5" /> },
  { label: "Blood sugar", icon: <Droplet className="h-5 w-5" /> },
  { label: "Memory / brain health", icon: <Brain className="h-5 w-5" /> },
  { label: "Cancer history", icon: <Activity className="h-5 w-5" /> },
  { label: "Not sure", icon: <HelpCircle className="h-5 w-5" /> },
  { label: "Prefer not to say", icon: <EyeOff className="h-5 w-5" /> },
];

const WEARABLES: { label: string; icon: React.ReactNode }[] = [
  { label: "Apple Watch", icon: <Watch className="h-5 w-5" /> },
  { label: "Oura", icon: <CircleDot className="h-5 w-5" /> },
  { label: "Whoop", icon: <Activity className="h-5 w-5" /> },
  { label: "Garmin", icon: <Watch className="h-5 w-5" /> },
  { label: "Fitbit", icon: <Smartphone className="h-5 w-5" /> },
  { label: "No wearable yet", icon: <EyeOff className="h-5 w-5" /> },
];

const QUEST_STEPS = [
  { label: "Twin profile", title: "Let's create your twin", sub: "A few basics help MediTwin personalize your health signals." },
  { label: "Daily rhythm", title: "Map your daily rhythm", sub: "Sleep and movement are two of the biggest levers your twin can learn from." },
  { label: "Lifestyle signals", title: "Tune your stress & fuel signals", sub: "These signals help MediTwin understand what your body may need more support with." },
  { label: "Health context", title: "Add your health context", sub: "Family history and wearables help your twin connect the dots — only if you choose to share." },
];

const INSIGHTS = [
  { title: "Twin foundation unlocked", body: "Your goals shape every recommendation your twin makes next." },
  { title: "Recovery profile unlocked", body: "Sleep & movement tune the cardio, metabolic, and cognitive systems." },
  { title: "Stress & nutrition lens unlocked", body: "Your twin will personalize recovery and nutrition suggestions." },
  { title: "Context layer unlocked", body: "Family history sharpens screening; wearables enrich your daily signal." },
];

function Intake() {
  const { intake, setIntake } = useTwin();
  const { awardXp, awardBadge } = useTwinProgress();
  const [step, setStep] = useState(0);
  const [xp, setXp] = useState(0);
  const [pulseXp, setPulseXp] = useState(false);
  const navigate = useNavigate();
  const [draft, setDraft] = useState(intake);

  const next = () => {
    if (step < 3) setStep(step + 1);
    else {
      setIntake(draft);
      awardXp("intake.complete", 10, "Intake completed");
      awardBadge("twin-builder");
      navigate({ to: "/upload" });
    }
  };
  const back = () => setStep(Math.max(0, step - 1));

  const awardXp = (amount: number) => {
    setXp((x) => x + amount);
    setPulseXp(true);
    setTimeout(() => setPulseXp(false), 600);
  };

  const percent = ((step + 1) / 4) * 100;
  const current = QUEST_STEPS[step];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
      {/* Header: quest meta + XP */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-mono uppercase tracking-[0.3em]" style={{ color: "var(--friendly-teal)" }}>
          Twin Builder Quest · Step {step + 1} of 4 · {percent}%
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono transition-all ${
            pulseXp ? "scale-110" : "scale-100"
          }`}
          style={{
            background: "color-mix(in oklab, var(--friendly-mint) 12%, transparent)",
            border: "1px solid color-mix(in oklab, var(--friendly-mint) 35%, transparent)",
            color: "var(--friendly-mint)",
          }}
        >
          <Sparkles className="h-3.5 w-3.5" /> Twin XP {xp}
        </div>
      </div>

      <ProgressQuestStepper
        className="mb-8"
        currentIndex={step}
        steps={QUEST_STEPS.map((s) => ({ label: s.label }))}
      />

      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        {/* Main step panel */}
        <div className="glass rounded-3xl p-6 sm:p-8 animate-fade-in" key={step}>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold leading-tight">{current.title}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">{current.sub}</p>

          <div className="mt-7 space-y-6">
            {step === 0 && (
              <Step1
                draft={draft}
                setDraft={setDraft}
                onGoalAdded={() => awardXp(10)}
              />
            )}
            {step === 1 && <Step2 draft={draft} setDraft={setDraft} />}
            {step === 2 && <Step3 draft={draft} setDraft={setDraft} />}
            {step === 3 && <Step4 draft={draft} setDraft={setDraft} />}
          </div>
        </div>

        {/* Side rail: insight + trust */}
        <aside className="space-y-4 lg:sticky lg:top-6 self-start">
          <InsightCard
            title={INSIGHTS[step].title}
            tone={step === 0 ? "teal" : step === 1 ? "sky" : step === 2 ? "mint" : "violet"}
            icon={<Sparkles className="h-4 w-4" />}
          >
            {INSIGHTS[step].body}
          </InsightCard>

          <TrustNote>
            Your inputs help personalize your twin. This demo does not store sensitive medical data unless connected to a backend.
          </TrustNote>

          <div
            className="rounded-2xl p-4 text-[12px] text-muted-foreground"
            style={{
              background: "color-mix(in oklab, var(--friendly-violet) 6%, transparent)",
              border: "1px solid color-mix(in oklab, var(--friendly-violet) 18%, transparent)",
            }}
          >
            <div className="font-display font-semibold text-foreground text-sm mb-1">What's next</div>
            {step < 3
              ? `Step ${step + 2} of 4 — ${QUEST_STEPS[step + 1].label}`
              : "Connect your labs to unlock your full Lab Twin."}
          </div>
        </aside>
      </div>

      {/* Nav */}
      <div className="flex justify-between mt-6">
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
          {step === 3 ? "Unlock My Lab Twin" : "Continue Quest"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 1: Profile + Goals ──────────────────────────────────────────────────
function Step1({
  draft,
  setDraft,
  onGoalAdded,
}: {
  draft: any;
  setDraft: (d: any) => void;
  onGoalAdded: () => void;
}) {
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Your name" hint="Just so your twin can greet you.">
          <input
            className="w-full bg-input rounded-lg px-4 py-3 text-sm outline-none focus:neon-border-blue"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. Alex"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <input
              type="number"
              className="w-full bg-input rounded-lg px-4 py-3 text-sm outline-none"
              value={draft.age}
              onChange={(e) => setDraft({ ...draft, age: +e.target.value })}
            />
          </Field>
          <Field label="Sex">
            <select
              className="w-full bg-input rounded-lg px-4 py-3 text-sm outline-none"
              value={draft.sex}
              onChange={(e) => setDraft({ ...draft, sex: e.target.value })}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>
        </div>
      </div>
      <p className="text-[12px] text-muted-foreground -mt-2">
        Used only to personalize reference ranges and recommendations.
      </p>

      <Field label="What matters most to you right now?" hint="Pick any that resonate — your twin will tailor next steps.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GOALS.map((g) => {
            const active = draft.goals.includes(g.label);
            return (
              <button
                key={g.label}
                onClick={() => {
                  if (active) {
                    setDraft({ ...draft, goals: draft.goals.filter((v: string) => v !== g.label) });
                  } else {
                    setDraft({ ...draft, goals: [...draft.goals, g.label] });
                    onGoalAdded();
                  }
                }}
                className="group relative text-left rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: active
                    ? `color-mix(in oklab, ${g.tone} 14%, transparent)`
                    : "color-mix(in oklab, var(--foreground) 4%, transparent)",
                  border: `1px solid ${active ? g.tone : "color-mix(in oklab, var(--foreground) 10%, transparent)"}`,
                  boxShadow: active ? `0 0 24px -8px ${g.tone}` : "none",
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: `color-mix(in oklab, ${g.tone} 18%, transparent)`,
                      color: g.tone,
                    }}
                  >
                    {g.icon}
                  </div>
                  {active && (
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center animate-scale-in"
                      style={{ background: g.tone, color: "oklch(0.15 0.03 250)" }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
                <div className="mt-3 text-sm font-display font-semibold leading-tight">{g.label}</div>
                {active && (
                  <div
                    className="absolute top-2 right-12 text-[10px] font-mono animate-fade-in"
                    style={{ color: "var(--friendly-mint)" }}
                  >
                    +10 XP
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Field>
    </>
  );
}

// ─── Step 2: Sleep & Exercise ─────────────────────────────────────────────────
function Step2({ draft, setDraft }: { draft: any; setDraft: (d: any) => void }) {
  const sleepLabel =
    draft.sleepHours < 6
      ? "Needs recovery support"
      : draft.sleepHours < 7.5
      ? "Building consistency"
      : "Strong recovery window";
  const exerciseLabel =
    draft.exerciseFreq < 2 ? "Starting point" : draft.exerciseFreq < 4 ? "Momentum building" : "Strong routine";

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <SliderCard
          icon={<Moon className="h-5 w-5" />}
          tone="var(--friendly-violet)"
          title="Sleep per night"
          value={draft.sleepHours}
          min={3}
          max={10}
          step={0.1}
          display={`${draft.sleepHours.toFixed(1)} hr`}
          label={sleepLabel}
          ringPercent={Math.min(100, (draft.sleepHours / 9) * 100)}
          onChange={(v) => setDraft({ ...draft, sleepHours: v })}
        />
        <SliderCard
          icon={<Dumbbell className="h-5 w-5" />}
          tone="var(--friendly-mint)"
          title="Exercise days / week"
          value={draft.exerciseFreq}
          min={0}
          max={7}
          step={1}
          display={`${draft.exerciseFreq} days`}
          label={exerciseLabel}
          ringPercent={(draft.exerciseFreq / 7) * 100}
          onChange={(v) => setDraft({ ...draft, exerciseFreq: v })}
        />
      </div>
      <p className="text-[12px] text-center text-muted-foreground italic">
        No judgment — this is your starting point, not a scorecard.
      </p>
    </>
  );
}

// ─── Step 3: Stress & Diet ────────────────────────────────────────────────────
function Step3({ draft, setDraft }: { draft: any; setDraft: (d: any) => void }) {
  const stressLabel =
    draft.stress <= 3 ? "Calm" : draft.stress <= 6 ? "Steady" : draft.stress <= 8 ? "Loaded" : "Overloaded";
  const dietLabel =
    draft.diet <= 3 ? "Inconsistent" : draft.diet <= 6 ? "Building" : draft.diet <= 8 ? "Balanced" : "Nourishing";

  return (
    <div className="space-y-5">
      <GaugeCard
        icon={<Activity className="h-5 w-5" />}
        tone="var(--friendly-amber)"
        title="Stress level"
        value={draft.stress}
        min={1}
        max={10}
        label={stressLabel}
        coach="High stress can affect sleep, glucose, and recovery. We'll help you find gentle first steps."
        onChange={(v) => setDraft({ ...draft, stress: v })}
      />
      <GaugeCard
        icon={<Heart className="h-5 w-5" />}
        tone="var(--friendly-teal)"
        title="Diet quality"
        value={draft.diet}
        min={1}
        max={10}
        label={dietLabel}
        coach="This helps us suggest practical nutrition habits, not restrictive rules."
        onChange={(v) => setDraft({ ...draft, diet: v })}
      />
    </div>
  );
}

// ─── Step 4: History & Wearables ──────────────────────────────────────────────
function Step4({ draft, setDraft }: { draft: any; setDraft: (d: any) => void }) {
  return (
    <>
      <Field label="Family history" hint="Areas your relatives have faced — helps your twin watch the right signals.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HISTORY.map((h) => {
            const active = draft.familyHistory.includes(h.label);
            return (
              <SelectCard
                key={h.label}
                icon={h.icon}
                label={h.label}
                active={active}
                tone="var(--friendly-sky)"
                onClick={() => {
                  if (active) setDraft({ ...draft, familyHistory: draft.familyHistory.filter((v: string) => v !== h.label) });
                  else setDraft({ ...draft, familyHistory: [...draft.familyHistory, h.label] });
                }}
              />
            );
          })}
        </div>
      </Field>

      <Field label="Wearable device" hint="If you wear one, your twin can connect richer daily signals later.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {WEARABLES.map((w) => {
            const active = draft.wearable === w.label;
            return (
              <SelectCard
                key={w.label}
                icon={w.icon}
                label={w.label}
                active={active}
                tone="var(--friendly-mint)"
                onClick={() => setDraft({ ...draft, wearable: w.label })}
              />
            );
          })}
        </div>
      </Field>

      <p className="text-[12px] text-center text-muted-foreground italic">
        You can skip anything. Your twin still works with what you share.
      </p>
    </>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">{label}</div>
        {hint && <div className="text-[12px] text-muted-foreground/80 mt-0.5">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function SelectCard({
  icon,
  label,
  active,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative text-left rounded-2xl p-3.5 transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-3"
      style={{
        background: active
          ? `color-mix(in oklab, ${tone} 14%, transparent)`
          : "color-mix(in oklab, var(--foreground) 4%, transparent)",
        border: `1px solid ${active ? tone : "color-mix(in oklab, var(--foreground) 10%, transparent)"}`,
        boxShadow: active ? `0 0 22px -10px ${tone}` : "none",
      }}
    >
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in oklab, ${tone} 18%, transparent)`, color: tone }}
      >
        {icon}
      </div>
      <div className="text-sm font-display font-semibold leading-tight flex-1">{label}</div>
      {active && (
        <div
          className="h-5 w-5 rounded-full flex items-center justify-center animate-scale-in shrink-0"
          style={{ background: tone, color: "oklch(0.15 0.03 250)" }}
        >
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  );
}

function SliderCard({
  icon,
  tone,
  title,
  value,
  min,
  max,
  step,
  display,
  label,
  ringPercent,
  onChange,
}: {
  icon: React.ReactNode;
  tone: string;
  title: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  label: string;
  ringPercent: number;
  onChange: (v: number) => void;
}) {
  const circumference = 2 * Math.PI * 26;
  const dash = (ringPercent / 100) * circumference;
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: `color-mix(in oklab, ${tone} 6%, transparent)`,
        border: `1px solid color-mix(in oklab, ${tone} 24%, transparent)`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="color-mix(in oklab, var(--foreground) 10%, transparent)" strokeWidth="4" />
            <circle
              cx="32" cy="32" r="26" fill="none" stroke={tone} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: "stroke-dasharray 0.3s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: tone }}>
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-display font-semibold">{title}</div>
          <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: tone }}>
            {label}
          </div>
        </div>
        <div className="font-mono text-lg" style={{ color: tone }}>{display}</div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full mt-4"
        style={{ accentColor: tone }}
      />
    </div>
  );
}

function GaugeCard({
  icon,
  tone,
  title,
  value,
  min,
  max,
  label,
  coach,
  onChange,
}: {
  icon: React.ReactNode;
  tone: string;
  title: string;
  value: number;
  min: number;
  max: number;
  label: string;
  coach: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: `color-mix(in oklab, ${tone} 6%, transparent)`,
        border: `1px solid color-mix(in oklab, ${tone} 24%, transparent)`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in oklab, ${tone} 18%, transparent)`, color: tone }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-display font-semibold">{title}</div>
          <div className="text-[12px] text-muted-foreground">{coach}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg" style={{ color: tone }}>{value}/{max}</div>
          <div className="text-[10px] uppercase tracking-wider font-mono" style={{ color: tone }}>{label}</div>
        </div>
      </div>
      <div className="mt-4 relative">
        <div
          className="h-2 rounded-full"
          style={{
            background: `linear-gradient(90deg,
              color-mix(in oklab, var(--friendly-mint) 70%, transparent),
              color-mix(in oklab, var(--friendly-teal) 70%, transparent),
              color-mix(in oklab, var(--friendly-amber) 70%, transparent),
              color-mix(in oklab, var(--friendly-coral) 70%, transparent))`,
            opacity: 0.45,
          }}
        />
        <input
          type="range" min={min} max={max} step={1} value={value}
          onChange={(e) => onChange(+e.target.value)}
          className="w-full absolute inset-0 opacity-0 cursor-pointer h-2"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full shadow-lg pointer-events-none transition-all"
          style={{
            left: `calc(${pct}% - 8px)`,
            background: tone,
            boxShadow: `0 0 16px -2px ${tone}`,
          }}
        />
      </div>
    </div>
  );
}
