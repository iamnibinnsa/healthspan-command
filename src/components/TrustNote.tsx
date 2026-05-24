import { ShieldCheck, Stethoscope } from "lucide-react";
import { DISCLAIMER_LONG, DISCLAIMER_SHORT } from "@/lib/copy";

/**
 * Soft, reassuring callout reminding users this is educational decision-support,
 * not a diagnosis. Two variants:
 *
 *  - "soft": small inline tone-setter for consumer pages (calm blue/green)
 *  - "clinical": more formal block for the clinician brief
 */
export function TrustNote({
  variant = "soft",
  className = "",
}: {
  variant?: "soft" | "clinical";
  className?: string;
}) {
  if (variant === "clinical") {
    return (
      <div
        className={`rounded-xl border border-border/60 p-4 flex gap-3 items-start text-xs leading-relaxed ${className}`}
        style={{ background: "oklch(0.22 0.03 250 / 0.55)" }}
      >
        <Stethoscope className="h-4 w-4 text-[var(--neon-blue)] mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold text-foreground mb-1">
            For clinician review
          </div>
          <p className="text-muted-foreground">{DISCLAIMER_LONG}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl px-4 py-3 flex gap-2.5 items-start text-[12px] leading-relaxed ${className}`}
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--neon-blue) 8%, transparent), color-mix(in oklab, var(--neon-green) 6%, transparent))",
        border: "1px solid color-mix(in oklab, var(--neon-blue) 25%, transparent)",
      }}
    >
      <ShieldCheck className="h-4 w-4 text-[var(--neon-green)] mt-0.5 shrink-0" />
      <span className="text-muted-foreground">{DISCLAIMER_SHORT}</span>
    </div>
  );
}
