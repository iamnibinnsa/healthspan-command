import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type BadgeId =
  | "twin-builder"
  | "signal-explorer"
  | "system-mapper"
  | "recovery-builder"
  | "heart-helper"
  | "momentum-maker"
  | "doctor-ready";

export const BADGES: Record<BadgeId, { label: string; hint: string }> = {
  "twin-builder": { label: "Twin Builder", hint: "Completed your intake" },
  "signal-explorer": { label: "Signal Explorer", hint: "Shared your lab signals" },
  "system-mapper": { label: "System Mapper", hint: "Explored your twin map" },
  "recovery-builder": { label: "Recovery Builder", hint: "Prioritized sleep & recovery" },
  "heart-helper": { label: "Heart Helper", hint: "Flagged ApoB / lipids to discuss" },
  "momentum-maker": { label: "Momentum Maker", hint: "Generated your 90-day guide" },
  "doctor-ready": { label: "Doctor-Ready", hint: "Opened your clinician brief" },
};

type State = {
  xp: number;
  badges: BadgeId[];
  events: string[]; // idempotency keys
};

const STORAGE_KEY = "meditwin.progress.v1";

const empty: State = { xp: 0, badges: [], events: [] };

function load(): State {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      xp: Number(parsed.xp) || 0,
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return empty;
  }
}

function save(s: State) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

type Ctx = {
  xp: number;
  level: number;
  nextLevelXp: number;
  badges: BadgeId[];
  awardXp: (eventKey: string, amount: number, label?: string) => void;
  awardBadge: (id: BadgeId) => void;
  reset: () => void;
};

const ProgressCtx = createContext<Ctx | null>(null);

export function TwinProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(empty);
  const hydrated = useRef(false);

  useEffect(() => {
    setState(load());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current) save(state);
  }, [state]);

  const awardXp = useCallback((eventKey: string, amount: number, label?: string) => {
    setState((prev) => {
      if (prev.events.includes(eventKey)) return prev;
      const next: State = {
        ...prev,
        xp: prev.xp + amount,
        events: [...prev.events, eventKey],
      };
      queueMicrotask(() => {
        toast(`+${amount} Twin XP`, {
          description: label ?? "Progress saved",
          duration: 2200,
        });
      });
      return next;
    });
  }, []);

  const awardBadge = useCallback((id: BadgeId) => {
    setState((prev) => {
      if (prev.badges.includes(id)) return prev;
      const meta = BADGES[id];
      queueMicrotask(() => {
        toast.success(`Badge unlocked · ${meta.label}`, {
          description: meta.hint,
          duration: 3200,
        });
      });
      return { ...prev, badges: [...prev.badges, id] };
    });
  }, []);

  const reset = useCallback(() => setState(empty), []);

  const value = useMemo<Ctx>(() => {
    const level = Math.floor(state.xp / 100) + 1;
    const nextLevelXp = level * 100;
    return {
      xp: state.xp,
      level,
      nextLevelXp,
      badges: state.badges,
      awardXp,
      awardBadge,
      reset,
    };
  }, [state, awardXp, awardBadge, reset]);

  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
}

export function useTwinProgress() {
  const ctx = useContext(ProgressCtx);
  if (!ctx) throw new Error("useTwinProgress must be used inside TwinProgressProvider");
  return ctx;
}

/** Fire an event exactly once on mount. */
export function useAwardOnMount(eventKey: string, amount: number, label?: string) {
  const { awardXp } = useTwinProgress();
  useEffect(() => {
    awardXp(eventKey, amount, label);
  }, [eventKey, amount, label, awardXp]);
}
