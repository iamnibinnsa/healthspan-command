import type { ReactNode } from "react";
import { scoreToStatus, STATUS_TONE } from "@/lib/copy";

/**
 * Compact chip for representing a body system (Cardio, Sleep, etc).
 * Used to replace dense table rows or as a quick at-a-glance cluster.
 */
export function BodySystemChip({
  icon,
  label,
  score,
  active = false,
  onClick,
}: {
  icon?: ReactNode;
  label: string;
  score: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const status = scoreToStatus(score);
  const tone = STATUS_TONE[status];

  const Wrapper: any = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={`group inline-flex items-center gap-2.5 px-3 py-2 rounded-full transition border ${
        active ? `neon-border-${tone.color.split("-")[1]}` : ""
      }`}
      style={{
        background: `color-mix(in oklab, var(--${tone.color}) 8%, oklch(0.22 0.03 250 / 0.55))`,
        borderColor: active
          ? `var(--${tone.color})`
          : "color-mix(in oklab, var(--" + tone.color + ") 25%, transparent)",
      }}
    >
      <span
        className="h-6 w-6 rounded-full flex items-center justify-center"
        style={{
          background: `color-mix(in oklab, var(--${tone.color}) 22%, transparent)`,
          color: `var(--${tone.color})`,
        }}
      >
        {icon}
      </span>
      <span className="text-xs font-medium">{label}</span>
      <span
        className="font-display text-sm leading-none"
        style={{ color: `var(--${tone.color})` }}
      >
        {score}
      </span>
    </Wrapper>
  );
}
