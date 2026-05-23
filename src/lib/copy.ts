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
  heroTitle: "Ready to meet your future-health twin?",
  heroSubtitle:
    "MediTwin turns your labs, habits, and wearable signals into a friendly digital twin that helps you understand your body, explore what-if changes, and build a 90-day plan with confidence.",

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
  ctaStart: "Meet My Twin",
  ctaContinue: "Continue the quest",
  ctaGeneratePlan: "Craft my 90-day quest plan",
  ctaSampleLab: "Explore Sample Twin",
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
