import { Check } from "lucide-react";

/**
 * Gamified, friendly horizontal stepper for multi-step flows (intake, plan setup).
 *
 *   ◉───◉───◯───◯
 *   Hello   Habits  Body  Family
 *
 * Completed steps glow green, the active step pulses blue, future steps stay
 * dim. Designed to read like a quest map, not a progress bar.
 */
export function ProgressQuestStepper({
  steps,
  current,
  questLabel = "Your healthspan quest",
}: {
  steps: { label: string; hint?: string }[];
  current: number;
  questLabel?: string;
}) {
  const total = steps.length;
  const pct = Math.round(((current + 1) / total) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--neon-blue)]">
            {questLabel}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Step {current + 1} of {total} · {pct}% unlocked
          </div>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground hidden sm:block">
          +{(current + 1) * 25} insight points
        </div>
      </div>

      <div className="relative">
        {/* track */}
        <div className="absolute top-3 left-0 right-0 h-px bg-border" />
        <div
          className="absolute top-3 left-0 h-px transition-all duration-500"
          style={{
            width: `${(current / Math.max(1, total - 1)) * 100}%`,
            background:
              "linear-gradient(90deg, var(--neon-green), var(--neon-blue))",
            boxShadow: "0 0 10px color-mix(in oklab, var(--neon-blue) 60%, transparent)",
          }}
        />

        <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
          {steps.map((s, i) => {
            const done = i < current;
            const active = i === current;

            return (
              <li
                key={s.label}
                className="flex flex-col items-center text-center gap-1.5"
              >
                <div
                  className={`relative h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-mono transition`}
                  style={{
                    background: done
                      ? "var(--neon-green)"
                      : active
                        ? "color-mix(in oklab, var(--neon-blue) 30%, transparent)"
                        : "oklch(0.3 0.04 250 / 0.6)",
                    color: done
                      ? "oklch(0.12 0.03 250)"
                      : active
                        ? "var(--neon-blue)"
                        : "oklch(0.65 0.02 230)",
                    border: `1px solid ${
                      done
                        ? "var(--neon-green)"
                        : active
                          ? "var(--neon-blue)"
                          : "oklch(0.4 0.05 230 / 0.4)"
                    }`,
                    boxShadow: active
                      ? "0 0 16px -2px color-mix(in oklab, var(--neon-blue) 70%, transparent)"
                      : done
                        ? "0 0 12px -2px color-mix(in oklab, var(--neon-green) 70%, transparent)"
                        : "none",
                  }}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{
                        border: "1px solid var(--neon-blue)",
                        opacity: 0.5,
                      }}
                    />
                  )}
                </div>
                <div
                  className={`text-[10px] uppercase tracking-wider leading-tight ${
                    active
                      ? "text-foreground"
                      : done
                        ? "text-[var(--neon-green)]"
                        : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </div>
                {s.hint && (
                  <div className="text-[9px] text-muted-foreground hidden md:block">
                    {s.hint}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
