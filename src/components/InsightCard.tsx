import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";

/**
 * Calm, scannable card for an insight or recommendation.
 * Defaults to teal accent; pass `tone` to switch.
 */
export function InsightCard({
  title,
  children,
  icon,
  tone = "teal",
  footer,
  className = "",
}: {
  title: string;
  children?: ReactNode;
  icon?: ReactNode;
  tone?: "teal" | "mint" | "sky" | "amber" | "coral" | "violet";
  footer?: ReactNode;
  className?: string;
}) {
  const color = `var(--friendly-${tone})`;
  return (
    <div
      className={`relative rounded-2xl p-5 glass-soft transition hover:-translate-y-0.5 ${className}`}
      style={{
        borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
        boxShadow: `0 10px 40px -24px color-mix(in oklab, ${color} 70%, transparent)`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `color-mix(in oklab, ${color} 18%, transparent)`,
            color,
          }}
        >
          {icon ?? <Lightbulb className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-sm leading-snug">{title}</div>
          {children && (
            <div className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
              {children}
            </div>
          )}
          {footer && <div className="mt-3">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
