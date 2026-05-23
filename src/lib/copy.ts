/**
 * MediTwin copy dictionary.
 * Friendly, optimistic, non-clinical phrasing for consumer surfaces.
 * The Clinician Visit Brief (report.tsx) should keep clinical phrasing —
 * do NOT use this dictionary there.
 */

export const FRIENDLY_COPY = {
  // Statuses
  status: {
    optimal: "Looks steady",
    watch: "Worth watching",
    priority: "Discuss soon",
  },

  // Headlines
  heroTitle: "Ready to meet your future-health twin?",
  heroSubtitle:
    "MediTwin turns your labs, habits, and wearable signals into a friendly digital twin that helps you understand your body, try small changes, and build a 90-day guide with confidence.",

  // Sections
  nextSteps: "Your next best steps",
  areasToSupport: "Areas to support first",
  systemsToSupport: "Body systems to support",
  helpfulSignals: "Health signals",
  doctorNotes: "Doctor discussion notes",
  readinessLabel: "Twin Readiness Score",
  ageGapLabel: "Estimated age gap",

  // Microcopy — supportive, calming
  noJudgment: "No judgment — this is your starting point.",
  skipAnything: "You can skip anything.",
  worksWithWhatYouShare: "Your twin works with what you choose to share.",
  educationalSignals: "These are educational signals, not diagnoses.",
  momentum: "Small changes can create momentum.",
  bringToClinician: "Bring these notes to a clinician if you want a deeper review.",
  signalDisclaimer:
    "These are signals, not judgments. They simply hint at what your body might appreciate.",
  notDiagnosis:
    "Educational decision-support, not a diagnosis, treatment, or prescription.",
  questIntro: "Pick a small step to begin — every action adds insight.",

  // Buttons — curiosity-driven
  ctaStart: "Meet My Twin",
  ctaSampleLab: "Explore Sample Twin",
  ctaUnlockLabs: "Unlock My Lab Twin",
  ctaFirstInsights: "See My First Insights",
  ctaTryImproving: "Try Improving My Score",
  ctaGeneratePlan: "Build My 90-Day Guide",
  ctaClinicianBrief: "Open Clinician Brief",
  ctaContinue: "Continue",
};

/** Friendly synonyms for harsh / jargon words. Use when re-labeling consumer UI. */
export const SOFTEN: Record<string, string> = {
  telemetry: "health signals",
  "mission plan": "90-day guide",
  bottleneck: "area to support first",
  bottlenecks: "areas to support first",
  risk: "signal",
  abnormal: "outside demo target",
  priority: "focus area",
  "healthspan scan": "Twin Journey",
  "generate 90-day plan": "Create My 90-Day Guide",
  "what-if engine": "Try small changes",
  "biological age gap": "Estimated age gap",
  "overall healthspan score": "Twin Readiness Score",
  failure: "opportunity",
  disease: "condition to discuss",
  alert: "signal",
  danger: "focus area",
};

export type FriendlyStatus = "optimal" | "watch" | "priority";

export function friendlyStatusLabel(s: FriendlyStatus | string) {
  return FRIENDLY_COPY.status[(s as FriendlyStatus)] ?? s;
}
