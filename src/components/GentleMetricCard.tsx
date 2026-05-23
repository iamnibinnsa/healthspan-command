import type { ReactNode } from "react";

/**
 * Gentle, low-anxiety metric card.
 * Replaces dense table rows with a calm visual.
 * Auto-picks a warm tone from value vs optimal range, but tone can be overridden.
 */
export function GentleMetricCard({
  label,
  value,
  unit,
  target,
  tone = "teal",
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  target?: string;
  tone?: "teal" | "mint" | "sky" | "amber" | "coral" | "violet";
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  const color = `var(--friendly-${tone})`;
  return (
    <div
      className="rounded-2xl p-4 glass-soft"
      style={{
        borderColor: `color-mix(in oklab, ${color} 30%, transparent)`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {icon && (
          <div style={{ color }} className="opacity-90">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <div className="font-display text-2xl font-semibold" style={{ color }}>
          {value}
        </div>
        {unit && <div className="text-xs text-muted-foreground">{unit}</div>}
      </div>
      {target && (
        <div className="text-[11px] text-muted-foreground mt-1">
          Friendly range: <span className="font-mono">{target}</span>
        </div>
      )}
      {hint && (
        <div className="mt-2 text-[12px] text-foreground/80 leading-snug">{hint}</div>
      )}
    </div>
  );
}
