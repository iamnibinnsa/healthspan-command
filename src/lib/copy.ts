/**
 * MediTwin copy dictionary.
 * Friendly, optimistic, non-clinical phrasing for consumer surfaces.
 * The Report page should keep clinical phrasing — do NOT use this dictionary there.
 */

export const FRIENDLY_COPY = {
  // Statuses
  status: {
    optimal: "On track",
    watch: "Worth supporting",
    priority: "Priority to discuss",
  },

  // Headlines
  heroTitle: "Meet your future-health twin",
  heroSubtitle: "Let's learn what your body may need next.",

  // Sections
  nextSteps: "Your next best steps",
  areasToNurture: "Areas to nurture",
  systemsToSupport: "Body systems to support",
  helpfulSignals: "Helpful signals",
  doctorNotes: "Doctor discussion notes",

  // Microcopy
  signalDisclaimer:
    "Markers are signals, not judgments. They simply hint at what your body might appreciate.",
  questIntro: "Pick a small quest to begin — every step earns insight.",
  notDiagnosis:
    "Educational decision-support, not a diagnosis, treatment, or prescription.",

  // Buttons
  ctaStart: "Start your journey",
  ctaContinue: "Continue the quest",
  ctaGeneratePlan: "Craft my 90-day quest plan",
  ctaSampleLab: "Try a sample lab report",
};

/** Friendly synonyms for harsh clinical words. Use when re-labeling consumer UI. */
export const SOFTEN: Record<string, string> = {
  abnormal: "worth a look",
  risk: "area to nurture",
  failure: "opportunity",
  disease: "condition to discuss",
  red: "priority",
  alert: "signal",
  danger: "priority discussion",
  bad: "support",
  bottleneck: "area to nurture",
  telemetry: "signals",
};

export type FriendlyStatus = "optimal" | "watch" | "priority";

export function friendlyStatusLabel(s: FriendlyStatus | string) {
  return FRIENDLY_COPY.status[(s as FriendlyStatus)] ?? s;
}
