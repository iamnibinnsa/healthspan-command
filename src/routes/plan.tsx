import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTwin } from "@/lib/twin-context";
import { INTERVENTIONS, projectScores, INITIAL_DOMAINS } from "@/lib/mockData";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/plan")({
  component: Plan,
});

function Plan() {
  const { interventions } = useTwin();
  const [generated, setGenerated] = useState(false);
  const proj = projectScores(interventions);
  const active = INTERVENTIONS.filter((i) => interventions.includes(i.id));
  const bottleneck = [...INITIAL_DOMAINS].sort((a, b) => proj.domains[a.key] - proj.domains[b.key])[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">Personalized plan</div>
      <h1 className="text-4xl font-display font-semibold mt-1 mb-8">Your 90-Day Healthspan Plan</h1>

      {!generated ? (
        <div className="glass rounded-3xl p-12 text-center">
          <div className="h-16 w-16 mx-auto rounded-2xl glass flex items-center justify-center mb-4">
            <Sparkles className="h-7 w-7 text-[var(--neon-green)]" />
          </div>
          <h2 className="text-2xl font-display font-semibold">Ready to generate</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            We'll build a structured 90-day plan from your twin profile and your {active.length} selected interventions.
          </p>
          <button
            onClick={() => setGenerated(true)}
            className="mt-6 px-8 py-3 rounded-xl btn-hero text-sm font-semibold"
          >
            Generate My 90-Day Healthspan Plan
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <Block title="Top priorities">
            <ul className="space-y-2 text-sm">
              <li>• Address <span className="neon-text-orange">{bottleneck.label}</span> — lowest projected domain at {proj.domains[bottleneck.key]}.</li>
              <li>• Discuss ApoB strategy and Vitamin D correction with physician.</li>
              <li>• Establish sleep floor of 7 hours minimum.</li>
            </ul>
          </Block>

          <Block title="Week 1–2 · Foundation">
            <List items={[
              "Baseline sleep tracking; lights-out target 10:45 pm.",
              "Walk 30 min daily after dinner (glucose buffering).",
              "Begin vitamin D 4,000 IU/day after physician confirmation.",
              "Add 1 serving of fiber-rich legumes daily.",
            ]} />
          </Block>

          <Block title="Week 3–6 · Build">
            <List items={[
              "Zone 2 cardio 3×/week, 45 min each.",
              "Strength training 2×/week (compound lifts).",
              "Protein target 1.6 g/kg body weight per day.",
              "Reduce alcohol to ≤ 2 drinks/week.",
            ]} />
          </Block>

          <Block title="Week 7–12 · Optimize">
            <List items={[
              "Zone 2 progress to 150 min/week, add 1× Zone 5 interval session.",
              "Strength 3×/week with progressive overload.",
              "Recheck labs at week 12 (HbA1c, ApoB, hs-CRP, Vitamin D).",
              "Discuss lipid pharmacotherapy if ApoB > 90 mg/dL.",
            ]} />
          </Block>

          <div className="grid md:grid-cols-2 gap-4">
            <Block title="Daily habits">
              <List items={["7+ hr sleep", "30 g fiber", "10k steps", "10 min sunlight", "Hydration target 2.5L"]} />
            </Block>
            <Block title="Weekly targets">
              <List items={["150 min Zone 2", "2–3 strength sessions", "1 mobility session", "≥ 5 home-cooked dinners"]} />
            </Block>
          </div>

          <Block title="Physician discussion items">
            <List items={[
              "ApoB target and lipid management strategy.",
              "Vitamin D dosing and 3-month recheck.",
              "Fasting glucose trend and HbA1c trajectory.",
              "Cardiovascular screening (CAC score, advanced lipid panel).",
            ]} />
          </Block>

          <Block title="Retest plan">
            <List items={[
              "Week 6: spot-check fasting glucose, sleep & HRV trends from wearable.",
              "Week 12: full lipid panel, ApoB, HbA1c, hs-CRP, Vitamin D.",
            ]} />
          </Block>

          <Block title="Safety notes" tone="warn">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This plan is an educational decision-support output, not medical advice. Do not start
              or change supplements or medications without your physician. Stop any activity that
              causes chest pain, dizziness, or unusual symptoms and contact a clinician.
            </p>
          </Block>

          <div className="flex justify-end gap-3">
            <Link to="/report" className="px-5 py-2.5 rounded-lg btn-hero text-sm font-semibold">Open clinician brief →</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Block({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "warn" }) {
  return (
    <div className={`glass rounded-2xl p-6 ${tone === "warn" ? "neon-border-orange" : ""}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{title}</div>
      {children}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((i) => (
        <li key={i} className="flex gap-2"><span className="text-[var(--neon-green)]">›</span>{i}</li>
      ))}
    </ul>
  );
}
