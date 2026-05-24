import { STATUS_TONE, type StatusKey } from "@/lib/copy";

export type StatusKind = StatusKey;

/**
 * Backwards-compatible status pill.
 * Existing callers pass `status="optimal" | "watch" | "priority"` and we now
 * render a friendly label ("On track", "Worth a look", "Discuss soon") instead
 * of the raw machine word, while keeping the same visual pill API.
 */
export function StatusPill({
  status,
  rawLabel,
}: {
  status: StatusKind | string;
  /** Force showing the raw status word (used by the clinician brief). */
  rawLabel?: boolean;
}) {
  const key = (status as StatusKind) in STATUS_TONE ? (status as StatusKind) : "watch";
  const cls =
    key === "optimal" ? "status-optimal" : key === "priority" ? "status-priority" : "status-watch";
  const text = rawLabel ? key : STATUS_TONE[key].label;
  return <span className={`status-pill ${cls}`}>{text}</span>;
}
