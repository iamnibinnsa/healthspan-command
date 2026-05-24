import { STATUS_TONE, type StatusKey } from "@/lib/copy";

/**
 * Friendly drop-in for StatusPill.
 *
 *  optimal  → "On track"     (neon-green)
 *  watch    → "Worth a look" (neon-orange / amber)
 *  priority → "Discuss soon" (soft coral, used sparingly)
 *
 * Designed to feel calm, not alarming. Uses currentColor for the dot so the
 * pill stays consistent with surrounding glass surfaces.
 */
export function FriendlyStatusBadge({
  status,
  size = "sm",
  withDot = true,
  label,
}: {
  status: StatusKey | string;
  size?: "xs" | "sm" | "md";
  withDot?: boolean;
  /** Optional override label (else uses the friendly default). */
  label?: string;
}) {
  const key = (status as StatusKey) in STATUS_TONE ? (status as StatusKey) : "watch";
  const tone = STATUS_TONE[key];

  const sizing =
    size === "xs"
      ? "text-[9px] px-2 py-[2px]"
      : size === "md"
        ? "text-[11px] px-3 py-1"
        : "text-[10px] px-2.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide ${sizing}`}
      style={{
        color: `var(--${tone.color})`,
        background: `color-mix(in oklab, var(--${tone.color}) 12%, transparent)`,
        border: `1px solid color-mix(in oklab, var(--${tone.color}) 35%, transparent)`,
      }}
    >
      {withDot && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "currentColor", boxShadow: "0 0 6px currentColor" }}
        />
      )}
      {label ?? tone.label}
    </span>
  );
}
