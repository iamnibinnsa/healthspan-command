export type StatusKind = "optimal" | "watch" | "priority";

export function StatusPill({ status }: { status: StatusKind | string }) {
  const s = (status as StatusKind) || "watch";
  const cls = s === "optimal" ? "status-optimal" : s === "priority" ? "status-priority" : "status-watch";
  return <span className={`status-pill ${cls}`}>{s}</span>;
}
