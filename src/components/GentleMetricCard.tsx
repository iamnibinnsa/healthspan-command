import { FriendlyStatusBadge } from "@/components/FriendlyStatusBadge";
import type { StatusKey } from "@/lib/copy";

/**
 * Visual replacement for biomarker table rows.
 *
 * Shows the marker name, current value with units, an optimal target, a small
 * mini-progress bar visualizing how close it sits to its optimal range, plus
 * a friendly status badge instead of an aggressive "ABNORMAL" red label.
 */
export function GentleMetricCard({
  name,
  value,
  unit,
  optimal,
  status,
  note,
}: {
  name: string;
  value: number | string;
  unit: string;
  optimal: string;
  status: StatusKey | string;
  note?: string;
}) {
  const key = (["optimal", "watch", "priority"].includes(status as string)
    ? status
    : "watch") as StatusKey;

  const fillPct = key === "optimal" ? 92 : key === "watch" ? 62 : 35;

  const color =
    key === "optimal"
      ? "var(--neon-green)"
      : key === "watch"
        ? "var(--neon-orange)"
        : "var(--neon-red)";

  return (
    <div
      className="glass-soft rounded-xl p-4 transition hover:scale-[1.01]"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, ${color} 6%, transparent), oklch(0.22 0.03 250 / 0.55))`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{name}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            target {optimal}
          </div>
        </div>
        <FriendlyStatusBadge status={key} size="xs" />
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-2xl" style={{ color }}>
          {value}
        </span>
        <span className="text-[11px] text-muted-foreground">{unit}</span>
      </div>

      {/* Mini progress: where the value sits relative to its target band. */}
      <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-[oklch(0.3_0.04_250/0.5)]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${fillPct}%`,
            background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 50%, transparent))`,
            boxShadow: `0 0 12px -2px ${color}`,
          }}
        />
      </div>

      {note && (
        <p className="text-[11px] text-muted-foreground mt-2 leading-snug">{note}</p>
      )}
    </div>
  );
}
