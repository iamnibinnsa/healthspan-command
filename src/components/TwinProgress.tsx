import { useState } from "react";
import { Sparkles, Trophy, X } from "lucide-react";
import { BADGES, useTwinProgress, type BadgeId } from "@/lib/twin-progress";

export function TwinProgressBadge() {
  const { xp, level, nextLevelXp, badges } = useTwinProgress();
  const [open, setOpen] = useState(false);
  const pct = Math.min(100, ((xp % 100) / 100) * 100);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg glass-soft hover:neon-border-blue transition group"
        title="Twin Progress — app journey, not medical outcomes"
      >
        <Sparkles className="h-3.5 w-3.5 text-[var(--neon-blue)]" />
        <div className="leading-tight text-left">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Lv {level}</div>
          <div className="text-[11px] font-mono font-semibold">{xp} XP</div>
        </div>
        <div className="hidden md:flex items-center gap-1 pl-2 border-l border-border/50">
          <Trophy className="h-3 w-3 text-[var(--friendly-amber)]" />
          <span className="text-[11px] font-semibold">{badges.length}</span>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass rounded-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 h-7 w-7 rounded-lg glass-soft flex items-center justify-center hover:scale-105 transition"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl glass flex items-center justify-center neon-border-blue">
                <Sparkles className="h-5 w-5 text-[var(--neon-blue)]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Twin Progress</div>
                <div className="font-display text-lg font-semibold">Level {level} · {xp} XP</div>
              </div>
            </div>

            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--friendly-teal)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground flex justify-between">
              <span>{xp % 100} / 100 to next level</span>
              <span>Next: Lv {level + 1} @ {nextLevelXp} XP</span>
            </div>

            <div className="mt-5">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Badges</div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(BADGES) as BadgeId[]).map((id) => {
                  const earned = badges.includes(id);
                  const meta = BADGES[id];
                  return (
                    <div
                      key={id}
                      className={`rounded-lg p-2.5 border text-xs transition ${
                        earned
                          ? "border-[var(--friendly-amber)]/40 bg-[var(--friendly-amber)]/5"
                          : "border-border/40 opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Trophy
                          className={`h-3 w-3 ${earned ? "text-[var(--friendly-amber)]" : "text-muted-foreground"}`}
                        />
                        <span className="font-semibold">{meta.label}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{meta.hint}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="mt-5 text-[10px] text-muted-foreground leading-relaxed">
              Twin XP tracks your app progress, not medical outcomes.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export function ProgressMiniCard({ className = "" }: { className?: string }) {
  const { xp, level, badges } = useTwinProgress();
  const pct = Math.min(100, ((xp % 100) / 100) * 100);
  return (
    <div className={`glass-soft rounded-xl p-3 flex items-center gap-3 ${className}`}>
      <div className="h-9 w-9 rounded-lg glass flex items-center justify-center">
        <Sparkles className="h-4 w-4 text-[var(--neon-blue)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[11px]">
          <span className="uppercase tracking-[0.18em] text-muted-foreground">Twin Progress</span>
          <span className="font-mono font-semibold">Lv {level} · {xp} XP</span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--friendly-teal)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          {badges.length} badge{badges.length === 1 ? "" : "s"} · journey progress, not medical outcomes
        </div>
      </div>
    </div>
  );
}
