import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Reusable, optimistic call-to-action card.
 * Has a soft glow, a subtle sparkle, and a clear primary action.
 *
 * Used on the home page, the post-intake hand-off, and any "ready to continue"
 * moment that should feel like a small win rather than a checkpoint.
 */
export function GamifiedCTA({
  eyebrow,
  title,
  subtitle,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
  icon,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel?: string;
  secondaryTo?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="relative glass rounded-3xl p-8 sm:p-10 overflow-hidden text-center neon-border-blue">
      <div
        aria-hidden
        className="absolute -top-20 -right-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--neon-green)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--neon-blue)" }}
      />

      <div className="relative">
        <div className="mx-auto h-14 w-14 rounded-2xl glass flex items-center justify-center mb-4">
          {icon ?? <Sparkles className="h-6 w-6 text-[var(--neon-green)]" />}
        </div>
        {eyebrow && (
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--neon-blue)] mb-2">
            {eyebrow}
          </div>
        )}
        <h3 className="text-2xl sm:text-3xl font-display font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Link
            to={primaryTo}
            className="px-6 py-3 rounded-xl btn-hero text-sm font-semibold inline-flex items-center gap-2"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {secondaryLabel && secondaryTo && (
            <Link
              to={secondaryTo}
              className="px-6 py-3 rounded-xl glass-soft text-sm font-semibold"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
