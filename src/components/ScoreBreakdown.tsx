import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { HealthspanBreakdown } from "@/lib/scoringEngine";

/**
 * Transparent, expandable view of the Healthspan scoring engine.
 * Shows: overall formula → per-domain weight → per-component sub-score.
 */
export function ScoreBreakdown({ breakdown }: { breakdown: HealthspanBreakdown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--neon-blue)]">
            Transparent scoring
          </div>
          <div className="font-display text-lg mt-0.5">How your Twin Readiness Score is calculated</div>
        </div>
        <ChevronDown
          className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-6 border-t border-border/40 pt-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Interpretable hackathon prototype. Each input is mapped to a 0–100
            sub-score via a piecewise-linear band (optimal → 100, unfavorable →
            0). Domain scores are weighted sums of their sub-scores. The overall
            Healthspan Score is a fixed weighted sum across the six domains.
            <span className="block mt-2 italic">
              Not a clinically validated model. Educational directional estimate only.
            </span>
          </p>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Overall Healthspan Score formula
            </div>
            <div className="font-mono text-xs glass-soft rounded-lg p-3 leading-relaxed">
              0.20 × Metabolic + 0.20 × Cardio + 0.15 × Inflammation +
              0.15 × Muscle + 0.15 × Cognition + 0.15 × Sleep ={" "}
              <span className="text-[var(--neon-green)]">{breakdown.overall}</span>
            </div>
          </div>

          <div className="space-y-3">
            {breakdown.domains.map((d) => (
              <details key={d.key} className="glass-soft rounded-xl group">
                <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{d.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{d.formula}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      weight {Math.round(breakdown.weights[d.key] * 100)}%
                    </span>
                    <span className="font-display text-xl text-[var(--neon-blue)]">
                      {d.score}
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </div>
                </summary>
                <div className="px-4 pb-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground text-left">
                        <th className="py-1.5 font-medium">Input</th>
                        <th className="py-1.5 font-medium">Value</th>
                        <th className="py-1.5 font-medium">Sub-score</th>
                        <th className="py-1.5 font-medium text-right">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.components.map((c) => (
                        <tr key={c.label} className="border-t border-border/30">
                          <td className="py-1.5">{c.label}</td>
                          <td className="py-1.5 font-mono text-muted-foreground">{c.raw}</td>
                          <td className="py-1.5 font-mono">
                            <span
                              className={
                                c.score >= 75
                                  ? "text-[var(--neon-green)]"
                                  : c.score >= 50
                                    ? "text-[var(--neon-blue)]"
                                    : "text-[var(--neon-orange)]"
                              }
                            >
                              {Math.round(c.score)}
                            </span>
                          </td>
                          <td className="py-1.5 text-right text-muted-foreground">
                            {Math.round(c.weight * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
