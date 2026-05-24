/**
 * Shared copy dictionary for MediTwin.
 *
 * Single source of truth for friendly, optimistic language so that pages stay
 * consistent and we never accidentally re-introduce jargon like
 * "abnormal", "risk", "failure", or "telemetry" in consumer-facing surfaces.
 *
 * Clinical pages (Report) intentionally keep precise medical wording.
 */

export type StatusKey = "optimal" | "watch" | "priority";

export const STATUS_TONE: Record<
  StatusKey,
  {
    /** Soft, consumer-friendly label. */
    label: string;
    /** Tiny verb users can read like a quest hint. */
    quest: string;
    /** Tailwind-compatible color token (already defined in styles.css). */
    color: "neon-green" | "neon-blue" | "neon-orange" | "neon-coral" | "neon-red";
    /** A single emoji-free icon glyph kept for compact contexts. */
    glyph: "✓" | "○" | "!";
  }
> = {
  optimal:  { label: "On track",     quest: "Keep going",   color: "neon-green",  glyph: "✓" },
  watch:    { label: "Worth a look", quest: "Gently nudge", color: "neon-orange", glyph: "○" },
  priority: { label: "Discuss soon", quest: "Bring to doctor", color: "neon-coral", glyph: "!" },
};

/** Map any score (0-100) to a status key using the same thresholds the gauge uses. */
export function scoreToStatus(score: number): StatusKey {
  if (score >= 75) return "optimal";
  if (score >= 60) return "watch";
  return "priority";
}

/** Friendly headline for the gauge / hero score readouts. */
export function scoreHeadline(score: number): string {
  if (score >= 85) return "Glowing";
  if (score >= 75) return "On track";
  if (score >= 60) return "Doing well";
  if (score >= 45) return "Worth a look";
  return "Discuss soon";
}

/**
 * Consistent section labels used across pages so we never say
 * "bottlenecks", "abnormal", or "red alert" in the consumer UI.
 */
export const SECTION_COPY = {
  areasToNurture:      "Areas to nurture",
  areasToSupportFirst: "Areas to support first",
  bodySystems:         "Body systems to support",
  helpfulSignals:      "Helpful health signals",
  nextBestSteps:       "Your next best steps",
  doctorNotes:         "Doctor discussion notes",
  unlockedInsights:    "Unlocked insights",
  twinSummary:         "Meet your future-health twin",
  questProgress:       "Your healthspan quest",
  twinReadinessScore:  "Twin Readiness Score",
  estimatedAgeGap:     "Estimated age gap",
} as const;

/** Curiosity-driven CTAs — keep premium, not childish. */
export const CTA = {
  meetMyTwin:           "Meet My Twin",
  exploreSampleTwin:    "Explore Sample Twin",
  unlockLabTwin:        "Unlock My Lab Twin",
  seeFirstInsights:     "See My First Insights",
  tryImprovingScore:    "Try Improving My Score",
  build90DayGuide:      "Build My 90-Day Guide",
  create90DayGuide:     "Create My 90-Day Guide",
  openClinicianBrief:   "Open Clinician Brief",
} as const;

/** Supportive microcopy sprinkled across consumer surfaces. */
export const MICROCOPY = {
  noJudgment:
    "No judgment — this is your starting point.",
  canSkip:
    "You can skip anything.",
  twinWorksWithShare:
    "Your twin works with what you choose to share.",
  educationalSignals:
    "These are educational signals, not diagnoses.",
  smallChanges:
    "Small changes can create momentum.",
  bringToClinician:
    "Bring these notes to a clinician if you want a deeper review.",
} as const;

/** Tiny optimistic descriptions paired with each domain key. */
export const DOMAIN_BLURBS: Record<string, string> = {
  metabolic:    "How your body turns food into steady energy.",
  cardio:       "How well your heart and vessels move with you.",
  inflammation: "How calm your immune system feels day to day.",
  muscle:       "Strength, mobility, and reserves for the years ahead.",
  cognition:    "Focus, memory, and mental sharpness.",
  sleep:        "Recovery, repair, and overnight reset.",
};

/** Standardized educational disclaimer used by TrustNote. */
export const DISCLAIMER_SHORT =
  "These are educational signals, not diagnoses. Discuss medical decisions with your clinician.";
export const DISCLAIMER_LONG =
  "LIFE is an educational decision-support prototype. It does not diagnose, treat, or prescribe. All scores and projections are directional estimates intended to spark a better conversation with a licensed clinician.";
