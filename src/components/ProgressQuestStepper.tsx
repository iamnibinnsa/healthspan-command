import { Check } from "lucide-react";

export interface QuestStep {
  label: string;
  hint?: string;
}

/**
 * Horizontal step progress with playful "quest" labeling.
 * Show progress through a flow (Intake → Labs → Twin → Plan).
 */
export function ProgressQuestStepper({
  steps,
  currentIndex,
  className = "",
}: {
  steps: QuestStep[];
  currentIndex: number;
  className?: string;
}) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-2">
        {steps.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const color = done
            ? "var(--friendly-mint)"
            : active
            ? "var(--friendly-teal)"
            : "color-mix(in oklab, var(--foreground) 25%, transparent)";

          return (
            <div key={s.label} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold font-mono transition"
                  style={{
                    color: done || active ? "oklch(0.15 0.03 250)" : color,
                    background: done || active ? color : "transparent",
                    border: `1px solid ${color}`,
                    boxShadow: active
                      ? `0 0 16px -2px ${color}`
                      : "none",
                  }}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <div
                  className={`text-[10px] uppercase tracking-wider text-center leading-tight ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                  style={{ maxWidth: 80 }}
                >
                  {s.label}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="h-px flex-1 mb-5"
                  style={{
                    background: `linear-gradient(90deg, ${
                      done ? "var(--friendly-mint)" : "var(--friendly-teal)"
                    }, color-mix(in oklab, var(--foreground) 15%, transparent))`,
                    opacity: done ? 0.8 : 0.35,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
