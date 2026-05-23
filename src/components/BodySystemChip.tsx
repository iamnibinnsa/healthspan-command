import type { ReactNode } from "react";

/**
 * Compact rounded chip for body-system pills (Heart, Metabolism, Sleep, ...).
 * Friendlier alternative to harsh status tags.
 */
export function BodySystemChip({
  label,
  icon,
  tone = "teal",
  score,
  onClick,
  active = false,
}: {
  label: string;
  icon?: ReactNode;
  tone?: "teal" | "mint" | "sky" | "amber" | "coral" | "violet";
  score?: number;
  onClick?: () => void;
  active?: boolean;
}) {
  const color = `var(--friendly-${tone})`;
  const Comp: "button" | "div" = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${
        onClick ? "hover:-translate-y-0.5 cursor-pointer" : ""
      }`}
      style={{
        color,
        background: `color-mix(in oklab, ${color} ${active ? 22 : 10}%, transparent)`,
        border: `1px solid color-mix(in oklab, ${color} ${active ? 60 : 30}%, transparent)`,
      }}
    >
      {icon && <span className="opacity-90">{icon}</span>}
      <span className="text-foreground/90">{label}</span>
      {typeof score === "number" && (
        <span className="font-mono text-[11px]" style={{ color }}>
          {score}
        </span>
      )}
    </Comp>
  );
}
