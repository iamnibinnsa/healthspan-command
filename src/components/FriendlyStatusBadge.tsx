import { Sparkles, Leaf, HeartHandshake } from "lucide-react";
import { friendlyStatusLabel, type FriendlyStatus } from "@/lib/copy";

/**
 * A softer, friendlier alternative to StatusPill.
 * Uses warm tokens (teal / amber / coral) instead of neon red.
 */
export function FriendlyStatusBadge({
  status,
  label,
  className = "",
}: {
  status: FriendlyStatus | string;
  label?: string;
  className?: string;
}) {
  const s = (status as FriendlyStatus) ?? "watch";

  const palette =
    s === "optimal"
      ? { color: "var(--friendly-mint)", Icon: Sparkles }
      : s === "priority"
      ? { color: "var(--friendly-coral)", Icon: HeartHandshake }
      : { color: "var(--friendly-amber)", Icon: Leaf };

  const { color, Icon } = palette;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${className}`}
      style={{
        color,
        border: `1px solid color-mix(in oklab, ${color} 45%, transparent)`,
        background: `color-mix(in oklab, ${color} 12%, transparent)`,
      }}
    >
      <Icon className="h-3 w-3" />
      {label ?? friendlyStatusLabel(s)}
    </span>
  );
}
