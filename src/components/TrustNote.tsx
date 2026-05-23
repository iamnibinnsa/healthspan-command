import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

/**
 * Small reassurance note. Use to remind the user this is supportive,
 * educational guidance — not medical judgment.
 */
export function TrustNote({
  children,
  icon,
  className = "",
}: {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed ${className}`}
      style={{
        color: "color-mix(in oklab, var(--foreground) 80%, transparent)",
        background: "color-mix(in oklab, var(--friendly-teal) 6%, transparent)",
        border: "1px solid color-mix(in oklab, var(--friendly-teal) 22%, transparent)",
      }}
    >
      <span style={{ color: "var(--friendly-teal)" }} className="mt-0.5">
        {icon ?? <ShieldCheck className="h-3.5 w-3.5" />}
      </span>
      <span>{children}</span>
    </div>
  );
}
