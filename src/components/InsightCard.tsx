import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

type Tone = "calm" | "watch" | "support" | "celebrate";

const TONE: Record<
  Tone,
  { color: string; ring: string; bg: string; chip: string }
> = {
  calm:      { color: "var(--neon-blue)",   ring: "neon-border-blue",   bg: "color-mix(in oklab, var(--neon-blue) 8%, transparent)",   chip: "Insight"   },
  watch:     { color: "var(--neon-orange)", ring: "neon-border-orange", bg: "color-mix(in oklab, var(--neon-orange) 9%, transparent)", chip: "Worth a look" },
  support:   { color: "var(--neon-red)",    ring: "neon-border-red",    bg: "color-mix(in oklab, var(--neon-red) 9%, transparent)",    chip: "Bring to doctor" },
  celebrate: { color: "var(--neon-green)",  ring: "neon-border-green",  bg: "color-mix(in oklab, var(--neon-green) 10%, transparent)", chip: "Win!" },
};

/**
 * Scannable card for insights, "next best steps", and area summaries.
 * Replaces dense table rows with a more visual, less intimidating block.
 */
export function InsightCard({
  icon,
  title,
  description,
  tone = "calm",
  badge,
  meta,
  children,
  onClick,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  tone?: Tone;
  badge?: string;
  /** Right-side metric (e.g. score "63"). */
  meta?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  const Wrapper: any = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={`group block w-full text-left glass rounded-2xl p-5 transition hover:${t.ring}`}
      style={{
        background: `linear-gradient(135deg, ${t.bg}, transparent 70%), oklch(0.22 0.03 250 / 0.55)`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `color-mix(in oklab, ${t.color} 14%, transparent)`,
            color: t.color,
          }}
        >
          {icon ?? <Sparkles className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: t.color }}
            >
              {badge ?? t.chip}
            </span>
          </div>
          <div className="font-display font-semibold leading-snug mt-1">{title}</div>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              {description}
            </p>
          )}
          {children && <div className="mt-3">{children}</div>}
        </div>
        {meta != null && (
          <div
            className="font-display text-3xl leading-none ml-2 shrink-0"
            style={{ color: t.color }}
          >
            {meta}
          </div>
        )}
      </div>
    </Wrapper>
  );
}
