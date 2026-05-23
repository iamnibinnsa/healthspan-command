import type { ReactNode } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

/**
 * Playful, gamified call-to-action button.
 * Use for quest-style actions: "Start your journey", "Unlock your plan".
 */
export function GamifiedCTA({
  children,
  onClick,
  href,
  tone = "teal",
  icon,
  xp,
  className = "",
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  tone?: "teal" | "mint" | "sky" | "amber" | "violet";
  icon?: ReactNode;
  xp?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const color = `var(--friendly-${tone})`;
  const sizing =
    size === "lg"
      ? "px-6 py-3.5 text-sm"
      : size === "sm"
      ? "px-3.5 py-2 text-xs"
      : "px-5 py-2.5 text-sm";

  const Inner = (
    <span
      className={`relative inline-flex items-center gap-2 rounded-xl font-semibold transition group ${sizing} ${className}`}
      style={{
        color: "oklch(0.14 0.03 250)",
        background: `linear-gradient(135deg, ${color}, color-mix(in oklab, var(--friendly-mint) 70%, ${color}))`,
        boxShadow: `0 12px 36px -12px color-mix(in oklab, ${color} 70%, transparent)`,
      }}
    >
      <span className="opacity-90">{icon ?? <Sparkles className="h-4 w-4" />}</span>
      <span>{children}</span>
      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      {typeof xp === "number" && (
        <span
          className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold"
          style={{
            background: "oklch(0.14 0.03 250 / 0.25)",
            color: "oklch(0.14 0.03 250)",
          }}
        >
          +{xp} XP
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {Inner}
      </a>
    );
  }
  return (
    <button onClick={onClick} className="inline-block">
      {Inner}
    </button>
  );
}
