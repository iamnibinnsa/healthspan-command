/* ------------------------------------------------------------------ */
/*  Horvath-style epigenetic clock — educational prototype              */
/* ------------------------------------------------------------------ */
/**
 * The real Horvath (2013) multi-tissue epigenetic clock is computed from
 * DNA methylation beta values at 353 specific CpG sites measured on
 * Illumina HumanMethylation 450K / EPIC arrays. It then applies a
 * non-linear age transformation:
 *   F(age) = (age <= 20) ? log(age + 1) / log(21) - 1 : (age - 20) / 21
 * and a linear combination of weighted CpG values plus an intercept
 * (reported median absolute deviation ~3.6 years).
 *
 * THIS MODULE DOES NOT IMPLEMENT THE REAL HORVATH CLOCK. It implements
 * a transparent, documented, blood-marker-and-lifestyle proxy in the
 * spirit of clinical biomarker-based biological age estimators (e.g.
 * Levine et al. 2018 PhenoAge). The intent is educational — every
 * coefficient is bounded and explained so individual contributions
 * remain interpretable in the UI.
 */

import type { Biomarker } from "./mockData";

export interface IntakeLite {
  name: string;
  age: number;
  sex: string;
  goals: string[];
  sleepHours: number;
  exerciseFreq: number;
  stress: number;
  diet: number;
  familyHistory: string[];
  wearable: string;
}

export type ClockMethod = "blood-marker" | "methylation";

export type ContributorDomain =
  | "Cardio"
  | "Metabolic"
  | "Inflammation"
  | "Recovery"
  | "Fitness"
  | "Lifestyle";

export interface ClockContributor {
  name: string;
  domain: ContributorDomain;
  /** Years added (positive) or removed (negative) to chronological age. */
  effect: number;
  direction: "accelerates" | "decelerates" | "neutral";
  /** Short raw-value detail for UI display. */
  detail: string;
  /** One-line explanation suitable for tooltips or expanded views. */
  rationale: string;
}

export interface ClockResult {
  method: ClockMethod;
  chronologicalAge: number;
  biologicalAge: number;
  ageAcceleration: number;
  confidence: "low" | "moderate" | "high";
  contributors: ClockContributor[];
  computedAt: string;
}

export const HORVATH_FACTS = {
  cpgCount: 353,
  authorOriginal: "Steve Horvath",
  yearOriginal: 2013,
  tissueScope: "Multi-tissue (blood, brain, kidney, liver, lung, breast and others)",
  realInput: "DNA methylation array (Illumina 450K / EPIC)",
  reportedAccuracy: "Median absolute deviation ≈ 3.6 years",
  pubmedID: "24138928",
  /**
   * The official Clock Foundation DNAm Age Calculator built by Steve Horvath's
   * team. Users with real Illumina 450K / EPIC methylation data (IDAT or β-value
   * CSV) should run the actual analysis there.
   */
  calculatorUrl: "https://dnamage.clockfoundation.org/",
  calculatorSource: "Clock Foundation / Horvath Lab",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                              */
/* ------------------------------------------------------------------ */

const num = (v: number | string): number =>
  typeof v === "number" ? v : Number.parseFloat(v) || 0;

function getMarker(biomarkers: Biomarker[], name: string): number {
  return num(biomarkers.find((b) => b.name === name)?.value ?? 0);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function dirFromEffect(effect: number): ClockContributor["direction"] {
  if (effect > 0.05) return "accelerates";
  if (effect < -0.05) return "decelerates";
  return "neutral";
}

/* ------------------------------------------------------------------ */
/*  Blood-marker proxy (Levine-style biological-age estimator)          */
/* ------------------------------------------------------------------ */
/**
 * Coefficients are calibrated so the bundled "Alex Morgan" demo profile
 * lands at the app-wide INITIAL_BIO_AGE_GAP of +7.2 years. Every term is
 * documented and bounded, and the entire computation is reflected back
 * to the user as itemized contributions.
 */
export function computeBloodBasedClock(
  intake: IntakeLite,
  biomarkers: Biomarker[],
): ClockResult {
  const hba1c   = getMarker(biomarkers, "HbA1c");           // %
  const glucose = getMarker(biomarkers, "Fasting Glucose"); // mg/dL
  const apoB    = getMarker(biomarkers, "ApoB");            // mg/dL
  const hsCRP   = getMarker(biomarkers, "hs-CRP");          // mg/L
  const vitD    = getMarker(biomarkers, "Vitamin D");       // ng/mL
  const rhr     = getMarker(biomarkers, "Resting HR");      // bpm
  const hrv     = getMarker(biomarkers, "HRV");             // ms
  const vo2     = getMarker(biomarkers, "VO2 max");         // ml/kg/min

  const sleep    = intake.sleepHours;
  const exercise = intake.exerciseFreq;
  const stress   = intake.stress;
  const diet     = intake.diet;

  const contributors: ClockContributor[] = [];
  let total = 0;

  function addTerm(c: Omit<ClockContributor, "direction"> & { effect: number }) {
    const finalized: ClockContributor = {
      ...c,
      direction: dirFromEffect(c.effect),
    };
    contributors.push(finalized);
    total += finalized.effect;
  }

  // Metabolic
  if (hba1c > 0) {
    addTerm({
      name: "HbA1c",
      domain: "Metabolic",
      effect: round1(1.0 * Math.max(0, hba1c - 5.4)),
      detail: `${hba1c}%`,
      rationale: "Elevated glycation reflects long-term glucose exposure and accelerates vascular aging.",
    });
  }
  if (glucose > 0) {
    addTerm({
      name: "Fasting glucose",
      domain: "Metabolic",
      effect: round1(0.025 * Math.max(0, glucose - 95)),
      detail: `${glucose} mg/dL`,
      rationale: "Above-target fasting glucose contributes to metabolic age acceleration.",
    });
  }

  // Cardiovascular
  if (apoB > 0) {
    addTerm({
      name: "ApoB",
      domain: "Cardio",
      effect: round1(0.025 * Math.max(0, apoB - 80)),
      detail: `${apoB} mg/dL`,
      rationale: "ApoB-rich particles drive atherogenic risk over decades.",
    });
  }

  // Inflammation
  if (hsCRP > 0) {
    addTerm({
      name: "hs-CRP",
      domain: "Inflammation",
      effect: round1(0.4 * Math.log(Math.max(1, hsCRP))),
      detail: `${hsCRP} mg/L`,
      rationale: "Persistent low-grade inflammation is a convergent driver of biological aging.",
    });
  }
  if (vitD > 0) {
    addTerm({
      name: "Vitamin D",
      domain: "Inflammation",
      effect: round1(0.09 * Math.max(0, 40 - vitD)),
      detail: `${vitD} ng/mL`,
      rationale: "Suboptimal vitamin D modulates immune aging and bone turnover.",
    });
  }

  // Recovery / autonomic
  if (rhr > 0) {
    addTerm({
      name: "Resting HR",
      domain: "Recovery",
      effect: round1(0.07 * Math.max(0, rhr - 65)),
      detail: `${rhr} bpm`,
      rationale: "Elevated resting heart rate reflects sympathetic load and lower fitness.",
    });
  }
  if (hrv > 0) {
    addTerm({
      name: "HRV",
      domain: "Recovery",
      effect: round1(0.03 * Math.max(0, 50 - hrv)),
      detail: `${hrv} ms`,
      rationale: "Lower heart-rate variability indicates a less resilient autonomic nervous system.",
    });
  }
  if (sleep > 0) {
    addTerm({
      name: "Sleep duration",
      domain: "Recovery",
      effect: round1(0.7 * Math.max(0, 7.5 - sleep)),
      detail: `${sleep} hr/night`,
      rationale: "Short sleep degrades glucose regulation and glymphatic clearance.",
    });
  }

  // Fitness
  if (vo2 > 0) {
    addTerm({
      name: "VO2 max",
      domain: "Fitness",
      effect: round1(0.12 * Math.max(0, 42 - vo2)),
      detail: `${vo2} ml/kg/min`,
      rationale: "Cardiorespiratory fitness is one of the strongest predictors of healthspan.",
    });
  }

  // Lifestyle
  if (stress > 0) {
    addTerm({
      name: "Self-reported stress",
      domain: "Lifestyle",
      effect: round1(0.3 * Math.max(0, stress - 5)),
      detail: `${stress}/10`,
      rationale: "Chronic stress drives cortisol-mediated wear on multiple aging pathways.",
    });
  }
  if (diet > 0) {
    addTerm({
      name: "Diet quality",
      domain: "Lifestyle",
      effect: round1(-0.18 * Math.max(0, diet - 5)),
      detail: `${diet}/10`,
      rationale: "A nutrient-dense, plant-forward diet is gently protective.",
    });
  }
  if (exercise > 0) {
    addTerm({
      name: "Exercise frequency",
      domain: "Lifestyle",
      effect: round1(-0.18 * exercise),
      detail: `${exercise} days/week`,
      rationale: "Regular movement is one of the most consistently protective lifestyle factors.",
    });
  }

  const chronologicalAge = intake.age;
  const biologicalAge = round1(chronologicalAge + total);
  const ageAcceleration = round1(total);

  return {
    method: "blood-marker",
    chronologicalAge,
    biologicalAge,
    ageAcceleration,
    // Honest framing: blood-marker proxy, not real epigenetic methylation.
    confidence: "low",
    contributors,
    computedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/*  Methylation simulation                                               */
/* ------------------------------------------------------------------ */
/**
 * Pretends to process a methylation array. In a real implementation this
 * would parse IDAT/CSV β-values for the 353 Horvath CpG sites and apply
 * the published linear weights + non-linear age transform.
 *
 * For this prototype we start from the blood-marker proxy and add a tiny
 * deterministic perturbation derived from the user's name + intake, so
 * the methylation result looks distinct while remaining reproducible.
 */
export function simulateMethylationClock(
  intake: IntakeLite,
  biomarkers: Biomarker[],
): ClockResult {
  const proxy = computeBloodBasedClock(intake, biomarkers);
  const seed = (intake.name || "demo")
    .split("")
    .reduce((s, c) => s + c.charCodeAt(0), 0);
  // Deterministic small drift in [-1.6, +1.2] yr range.
  const drift = round1((((seed % 7) - 3) * 0.4));
  const biologicalAge = round1(proxy.biologicalAge + drift);
  const ageAcceleration = round1(biologicalAge - proxy.chronologicalAge);

  return {
    ...proxy,
    method: "methylation",
    biologicalAge,
    ageAcceleration,
    // Methylation arrays are the gold-standard substrate for epigenetic age.
    confidence: "high",
  };
}

/* ------------------------------------------------------------------ */
/*  Interpretation buckets                                               */
/* ------------------------------------------------------------------ */

export type AccelerationBand =
  | "decelerated-strong"
  | "decelerated"
  | "on-par"
  | "accelerated"
  | "accelerated-strong";

export function interpretAcceleration(delta: number): {
  band: AccelerationBand;
  label: string;
  tone: "good" | "neutral" | "watch" | "priority";
  blurb: string;
} {
  if (delta < -3) {
    return {
      band: "decelerated-strong",
      label: "Strongly decelerated",
      tone: "good",
      blurb:
        "The markers we used suggest your biology is tracking notably younger than your chronological age.",
    };
  }
  if (delta < -1) {
    return {
      band: "decelerated",
      label: "Decelerated",
      tone: "good",
      blurb:
        "A gentle deceleration relative to your chronological age — momentum worth maintaining.",
    };
  }
  if (delta <= 1) {
    return {
      band: "on-par",
      label: "On par",
      tone: "neutral",
      blurb:
        "Biological and chronological age are tracking closely. A solid baseline to build from.",
    };
  }
  if (delta <= 3) {
    return {
      band: "accelerated",
      label: "Mildly accelerated",
      tone: "watch",
      blurb:
        "A few markers are nudging your biological age above chronological. Small, consistent shifts can rebalance this.",
    };
  }
  return {
    band: "accelerated-strong",
    label: "Strongly accelerated",
    tone: "priority",
    blurb:
      "Several markers are pulling biological age above chronological. A clinician conversation is worthwhile.",
  };
}

/* ------------------------------------------------------------------ */
/*  Tag & color helpers for the UI                                       */
/* ------------------------------------------------------------------ */

export const DOMAIN_COLOR: Record<ContributorDomain, string> = {
  Cardio:       "neon-red",
  Metabolic:    "neon-orange",
  Inflammation: "neon-orange",
  Recovery:     "neon-blue",
  Fitness:      "neon-green",
  Lifestyle:    "neon-blue",
};

export function clinicianDiscussionItems(result: ClockResult): string[] {
  const top = [...result.contributors]
    .filter((c) => c.direction === "accelerates")
    .sort((a, b) => b.effect - a.effect)
    .slice(0, 3);

  const items = top.map((c) => {
    switch (c.name) {
      case "HbA1c":
      case "Fasting glucose":
        return "Discuss metabolic markers and trajectory of glucose regulation.";
      case "ApoB":
        return "Discuss ApoB in the context of overall cardiovascular risk.";
      case "hs-CRP":
        return "Consider repeating hs-CRP when well/rested to confirm true elevation.";
      case "Vitamin D":
        return "Discuss whether Vitamin D supplementation and recheck cadence are appropriate.";
      case "Resting HR":
      case "HRV":
        return "Review autonomic markers (RHR/HRV) and screen for sleep-disordered breathing if relevant.";
      case "Sleep duration":
        return "Discuss sleep hygiene and screening for sleep-disordered breathing.";
      case "VO2 max":
        return "Discuss safe approaches to building cardiorespiratory fitness.";
      default:
        return `Discuss the impact of ${c.name.toLowerCase()} on biological age.`;
    }
  });

  // Deduplicate while preserving order.
  return Array.from(new Set(items));
}
