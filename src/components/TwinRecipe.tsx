import { ChevronDown, Activity, HeartPulse, Flame, Dumbbell, Brain, Moon } from "lucide-react";
import type { HealthspanBreakdown } from "@/lib/scoringEngine";
import type { DomainKey } from "@/lib/mockData";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";

const INGREDIENTS: Record<
  DomainKey,
  { name: string; icon: typeof Activity; blurb: string; emoji: string }
> = {
  metabolic:    { name: "Blood sugar energy",    icon: Activity,    emoji: "🌾", blurb: "How smoothly your body turns food into steady energy." },
  cardio:       { name: "Heart & circulation",   icon: HeartPulse,  emoji: "❤️", blurb: "How well your heart and vessels carry oxygen long-term." },
  inflammation: { name: "Inflammation balance",  icon: Flame,       emoji: "🌿", blurb: "The background 'noise' your immune system is running at." },
  muscle:       { name: "Strength & mobility",   icon: Dumbbell,    emoji: "🪨", blurb: "Your movement reserve and resilience as you age." },
  cognition:    { name: "Brain energy",          icon: Brain,       emoji: "✨", blurb: "Focus, memory, and clarity over the long run." },
  sleep:        { name: "Recovery rhythm",       icon: Moon,        emoji: "🌙", blurb: "How well your body restores itself overnight." },
};

function toneFor(score: number) {
  if (score >= 75) return "var(--friendly-mint)";
  if (score >= 60) return "var(--friendly-teal)";
  if (score >= 45) return "var(--friendly-amber)";
  return "var(--friendly-coral)";
}

function levelLabel(score: number) {
  if (score >= 75) return "Strong";
  if (score >= 60) return "Steady";
  if (score >= 45) return "Building";
  return "Needs support";
}

export function TwinRecipe({ breakdown }: { breakdown: HealthspanBreakdown }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">How MediTwin builds your score</h2>
        <p className="text-[12px] text-muted-foreground mt-1 max-w-2xl">
          Six ingredients blend into your Twin Readiness Score. Each one is weighted by how much it
          shapes long-term healthspan — none of them define you on their own.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {breakdown.domains.map((d) => {
          const meta = INGREDIENTS[d.key];
          const weight = Math.round(breakdown.weights[d.key] * 100);
          const tone = toneFor(d.score);
          const level = levelLabel(d.score);
          return (
            <details
              key={d.key}
              className="glass rounded-2xl p-5 group transition"
              style={{ border: `1px solid color-mix(in oklab, ${tone} 30%, transparent)` }}
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: `color-mix(in oklab, ${tone} 15%, transparent)` }}
                    >
                      <span>{meta.emoji}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-base font-semibold leading-tight truncate">
                        {meta.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                        Weight {weight}% · {level}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-2xl leading-none" style={{ color: tone }}>
                      {d.score}
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground mt-1 ml-auto transition-transform group-open:rotate-180" />
                  </div>
                </div>

                <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${d.score}%`, background: tone }}
                  />
                </div>

                <p className="text-[12px] leading-relaxed text-muted-foreground mt-3">{meta.blurb}</p>
              </summary>

              <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Inputs feeding this ingredient
                </div>
                <ul className="space-y-1.5 text-[12px]">
                  {d.components.map((c) => (
                    <li key={c.label} className="flex items-center justify-between gap-3">
                      <span className="truncate">{c.label}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-muted-foreground text-[11px]">{c.raw}</span>
                        <span
                          className="font-mono text-[11px]"
                          style={{ color: toneFor(c.score) }}
                        >
                          {Math.round(c.score)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground italic">
        This is an interpretable prototype model for education — not a clinical score.
      </p>

      <details className="glass-soft rounded-2xl group">
        <summary className="cursor-pointer list-none flex items-center justify-between px-5 py-3.5">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              For the technically curious
            </div>
            <div className="text-sm font-medium mt-0.5">See the full formula and sub-score math</div>
          </div>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
        </summary>
        <div className="px-2 pb-2">
          <ScoreBreakdown breakdown={breakdown} />
        </div>
      </details>
    </section>
  );
}
