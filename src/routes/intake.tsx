import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTwin } from "@/lib/twin-context";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { ProgressQuestStepper } from "@/components/ProgressQuestStepper";


export const Route = createFileRoute("/intake")({
  component: Intake,
});

const GOALS = ["Longevity", "Energy", "Cognition", "Body composition", "Athletic performance", "Disease prevention"];
const HISTORY = ["Cardiovascular disease", "Type 2 diabetes", "Alzheimer's / dementia", "Cancer", "None known"];
const WEARABLES = ["None", "Apple Watch", "Whoop", "Oura", "Garmin", "Fitbit"];

function Intake() {
  const { intake, setIntake } = useTwin();
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const [draft, setDraft] = useState(intake);

  const next = () => {
    if (step < 3) setStep(step + 1);
    else {
      setIntake(draft);
      navigate({ to: "/upload" });
    }
  };
  const back = () => setStep(Math.max(0, step - 1));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: "var(--friendly-teal)" }}>
        Quest {step + 1} of 4
      </div>
      <h1 className="text-4xl font-display font-semibold mt-2 mb-4">Tell us about you</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-xl">
        A few friendly questions so your twin can suggest the kindest next steps. No judgment — just signals.
      </p>

      <ProgressQuestStepper
        className="mb-6"
        currentIndex={step}
        steps={[
          { label: "About you" },
          { label: "Sleep & move" },
          { label: "Stress & food" },
          { label: "History" },
        ]}
      />

      <div className="glass rounded-3xl p-8 space-y-6 min-h-[420px]">

        {step === 0 && (
          <>
            <Field label="Name">
              <input
                className="w-full bg-input rounded-lg px-4 py-3 text-sm outline-none focus:neon-border-blue"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
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
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </Field>
            </div>
            <Field label="Primary health goals (select any)">
              <ChipGroup
                options={GOALS}
                values={draft.goals}
                onChange={(v) => setDraft({ ...draft, goals: v })}
                multi
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <SliderField label="Sleep (hours / night)" min={3} max={10} step={0.1}
              value={draft.sleepHours}
              onChange={(v) => setDraft({ ...draft, sleepHours: v })}
              display={`${draft.sleepHours.toFixed(1)} hr`}
            />
            <SliderField label="Exercise frequency (days / week)" min={0} max={7} step={1}
              value={draft.exerciseFreq}
              onChange={(v) => setDraft({ ...draft, exerciseFreq: v })}
              display={`${draft.exerciseFreq} days`}
            />
          </>
        )}

        {step === 2 && (
          <>
            <SliderField label="Stress level (1 low → 10 high)" min={1} max={10} step={1}
              value={draft.stress}
              onChange={(v) => setDraft({ ...draft, stress: v })}
              display={`${draft.stress}/10`}
            />
            <SliderField label="Diet quality (1 poor → 10 elite)" min={1} max={10} step={1}
              value={draft.diet}
              onChange={(v) => setDraft({ ...draft, diet: v })}
              display={`${draft.diet}/10`}
            />
          </>
        )}

        {step === 3 && (
          <>
            <Field label="Family history">
              <ChipGroup
                options={HISTORY}
                values={draft.familyHistory}
                onChange={(v) => setDraft({ ...draft, familyHistory: v })}
                multi
              />
            </Field>
            <Field label="Wearable">
              <ChipGroup
                options={WEARABLES}
                values={[draft.wearable]}
                onChange={(v) => setDraft({ ...draft, wearable: v[v.length - 1] ?? "None" })}
              />
            </Field>
          </>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={back}
          disabled={step === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass-soft text-sm disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={next} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-hero text-sm font-semibold">
          {step === 3 ? "Continue to Lab Upload" : "Next"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
      {children}
    </div>
  );
}

function SliderField({ label, min, max, step, value, onChange, display }: {
  label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; display: string;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-4">
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(+e.target.value)}
          className="w-full accent-[var(--neon-blue)]"
        />
        <span className="font-mono text-sm neon-text-blue min-w-20 text-right">{display}</span>
      </div>
    </Field>
  );
}

function ChipGroup({ options, values, onChange, multi }: {
  options: string[]; values: string[]; onChange: (v: string[]) => void; multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = values.includes(o);
        return (
          <button
            key={o}
            onClick={() => {
              if (!multi) onChange([o]);
              else if (active) onChange(values.filter((v) => v !== o));
              else onChange([...values, o]);
            }}
            className={`px-3 py-2 rounded-lg text-xs transition border ${
              active ? "bg-[var(--neon-blue)]/15 border-[var(--neon-blue)] neon-text-blue" : "glass-soft border-transparent"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
