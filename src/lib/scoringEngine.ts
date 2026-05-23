/**
 * MediTwin Healthspan Scoring Engine
 * ----------------------------------
 * IMPORTANT: This is an INTERPRETABLE HACKATHON PROTOTYPE scoring model.
 * It is NOT a clinically validated model and must not be used for diagnosis,
 * treatment, or medical decision-making. Each domain score is a transparent
 * weighted sum of normalized sub-scores derived from public, directional
 * heuristics (e.g. optimal HbA1c < 5.4%, ApoB < 80 mg/dL, sleep 7–8.5 h).
 *
 * Design goals:
 *  - Every sub-score is bounded 0–100 and computed by a small, readable
 *    piecewise-linear function (`band`) so a clinician or judge can audit it.
 *  - Every domain exposes its components (label, raw value, normalized score,
 *    weight) so the UI can render a "How this score is calculated" view.
 *  - The overall Healthspan Score is a fixed weighted sum across the six
 *    domains (weights documented in DOMAIN_WEIGHTS).
 */

import {
  SAMPLE_BIOMARKERS,
  type Biomarker,
  type DomainKey,
} from "./mockData";
import type { IntakeData } from "./twin-context";

// ---- Fixed domain weights for the overall Healthspan Score (sum = 1.00) ----
export const DOMAIN_WEIGHTS: Record<DomainKey, number> = {
  metabolic: 0.20,
  cardio: 0.20,
  inflammation: 0.15,
  muscle: 0.15,
  cognition: 0.15,
  sleep: 0.15,
};

export interface ScoreComponent {
  label: string;       // human-readable input name
  raw: string;         // raw value as displayed (e.g. "5.8 %")
  score: number;       // normalized sub-score 0–100
  weight: number;      // weight within the domain (0–1)
}

export interface DomainBreakdown {
  key: DomainKey;
  label: string;
  score: number;                  // 0–100
  components: ScoreComponent[];
  formula: string;                // plain-English description of the math
}

export interface HealthspanBreakdown {
  overall: number;                // 0–100
  domains: DomainBreakdown[];
  weights: Record<DomainKey, number>;
}

// ---------- helpers ----------
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/**
 * Piecewise-linear scorer.
 *  - At `best` (or beyond, in the favorable direction) → 100.
 *  - At `worst` (or beyond, in the unfavorable direction) → 0.
 *  - Linear in between.
 * `direction` = "lower" means lower raw values are healthier (e.g. HbA1c, ApoB);
 * `direction` = "higher" means higher raw values are healthier (e.g. HDL, VO2 max).
 */
function band(
  value: number,
  best: number,
  worst: number,
  direction: "lower" | "higher",
): number {
  if (direction === "lower") {
    if (value <= best) return 100;
    if (value >= worst) return 0;
    return clamp(100 * (worst - value) / (worst - best));
  } else {
    if (value >= best) return 100;
    if (value <= worst) return 0;
    return clamp(100 * (value - worst) / (best - worst));
  }
}

function bmValue(name: string, biomarkers: Biomarker[]): number {
  const b = biomarkers.find((x) => x.name === name);
  return typeof b?.value === "number" ? (b.value as number) : Number(b?.value ?? 0);
}

function bmUnit(name: string, biomarkers: Biomarker[]): string {
  return biomarkers.find((x) => x.name === name)?.unit ?? "";
}

function weighted(components: ScoreComponent[]): number {
  const total = components.reduce((s, c) => s + c.weight, 0) || 1;
  return Math.round(
    components.reduce((s, c) => s + c.score * c.weight, 0) / total,
  );
}

// ---------- main engine ----------
export function computeHealthspan(
  intake: IntakeData,
  interventionIds: string[] = [],
  biomarkers: Biomarker[] = SAMPLE_BIOMARKERS,
): HealthspanBreakdown {
  const hba1c = bmValue("HbA1c", biomarkers);
  const glucose = bmValue("Fasting Glucose", biomarkers);
  const tg = bmValue("Triglycerides", biomarkers);
  const apoB = bmValue("ApoB", biomarkers);
  const ldl = bmValue("LDL-C", biomarkers);
  const hdl = bmValue("HDL-C", biomarkers);
  const rhr = bmValue("Resting HR", biomarkers);
  const crp = bmValue("hs-CRP", biomarkers);
  const vitD = bmValue("Vitamin D", biomarkers);
  const hrv = bmValue("HRV", biomarkers);
  const vo2 = bmValue("VO2 max", biomarkers);

  const sleep = intake.sleepHours;
  const exercise = intake.exerciseFreq;   // days/week
  const stress = intake.stress;           // 0–10 (higher = worse)
  const strengthOn = interventionIds.includes("strength");
  const proteinOn = interventionIds.includes("protein");

  // Sleep is "best" at 7.75h, falls off in either direction.
  const sleepScore = clamp(100 - Math.abs(sleep - 7.75) * 25);
  const stressScore = clamp(100 - stress * 10); // 0 stress → 100, 10 → 0
  // Exercise: 0 days → 0, 5+ days → 100.
  const exerciseScore = clamp((exercise / 5) * 100);

  // ----- 1. Metabolic Resilience -----
  const metabolicComponents: ScoreComponent[] = [
    { label: "HbA1c",            raw: `${hba1c} %`,        score: band(hba1c, 5.2, 6.5, "lower"),     weight: 0.30 },
    { label: "Fasting glucose",  raw: `${glucose} mg/dL`,  score: band(glucose, 85, 125, "lower"),    weight: 0.20 },
    { label: "Triglycerides",    raw: `${tg} mg/dL`,       score: band(tg, 80, 200, "lower"),         weight: 0.20 },
    { label: "Exercise",         raw: `${exercise} d/wk`,  score: exerciseScore,                       weight: 0.20 },
    { label: "Sleep",            raw: `${sleep} h`,        score: sleepScore,                          weight: 0.10 },
  ];

  // ----- 2. Cardiovascular Longevity -----
  const cardioComponents: ScoreComponent[] = [
    { label: "ApoB",             raw: `${apoB} mg/dL`,     score: band(apoB, 70, 130, "lower"),       weight: 0.35 },
    { label: "LDL-C",            raw: `${ldl} mg/dL`,      score: band(ldl, 90, 160, "lower"),        weight: 0.20 },
    { label: "HDL-C",            raw: `${hdl} mg/dL`,      score: band(hdl, 60, 35, "higher"),        weight: 0.15 },
    { label: "Triglycerides",    raw: `${tg} mg/dL`,       score: band(tg, 80, 200, "lower"),         weight: 0.15 },
    { label: "Resting HR",       raw: `${rhr} bpm`,        score: band(rhr, 58, 85, "lower"),         weight: 0.15 },
  ];

  // ----- 3. Inflammation / Immune Aging -----
  const inflammationComponents: ScoreComponent[] = [
    { label: "hs-CRP",           raw: `${crp} mg/L`,       score: band(crp, 0.5, 4.0, "lower"),       weight: 0.40 },
    { label: "Vitamin D",        raw: `${vitD} ng/mL`,     score: band(vitD, 50, 20, "higher"),       weight: 0.25 },
    { label: "Sleep",            raw: `${sleep} h`,        score: sleepScore,                          weight: 0.20 },
    { label: "Stress",           raw: `${stress}/10`,      score: stressScore,                         weight: 0.15 },
  ];

  // ----- 4. Muscle & Mobility Reserve -----
  const muscleComponents: ScoreComponent[] = [
    { label: "Exercise",         raw: `${exercise} d/wk`,  score: exerciseScore,                       weight: 0.25 },
    { label: "Strength training",raw: strengthOn ? "On" : "Off", score: strengthOn ? 100 : 30,         weight: 0.25 },
    { label: "VO2 max",          raw: `${vo2} ${bmUnit("VO2 max", biomarkers)}`, score: band(vo2, 45, 25, "higher"), weight: 0.30 },
    { label: "Protein optimization", raw: proteinOn ? "On" : "Off", score: proteinOn ? 100 : 40,       weight: 0.20 },
  ];

  // ----- 5. Cognitive Resilience -----
  // Depends partly on metabolic health (vascular contribution to brain aging).
  const metabolicScore = weighted(metabolicComponents);
  const cognitionComponents: ScoreComponent[] = [
    { label: "Sleep",            raw: `${sleep} h`,        score: sleepScore,                          weight: 0.35 },
    { label: "Stress",           raw: `${stress}/10`,      score: stressScore,                         weight: 0.20 },
    { label: "Exercise",         raw: `${exercise} d/wk`,  score: exerciseScore,                       weight: 0.20 },
    { label: "Metabolic score",  raw: `${metabolicScore}`, score: metabolicScore,                      weight: 0.25 },
  ];

  // ----- 6. Sleep & Recovery -----
  const sleepRecoveryComponents: ScoreComponent[] = [
    { label: "Sleep duration",   raw: `${sleep} h`,        score: sleepScore,                          weight: 0.40 },
    { label: "HRV",              raw: `${hrv} ms`,         score: band(hrv, 60, 20, "higher"),        weight: 0.25 },
    { label: "Resting HR",       raw: `${rhr} bpm`,        score: band(rhr, 58, 85, "lower"),         weight: 0.20 },
    { label: "Stress",           raw: `${stress}/10`,      score: stressScore,                         weight: 0.15 },
  ];

  const domains: DomainBreakdown[] = [
    { key: "metabolic",    label: "Metabolic Resilience",       score: weighted(metabolicComponents),       components: metabolicComponents,       formula: "Weighted sum: HbA1c 30%, fasting glucose 20%, triglycerides 20%, exercise 20%, sleep 10%." },
    { key: "cardio",       label: "Cardiovascular Longevity",   score: weighted(cardioComponents),          components: cardioComponents,          formula: "Weighted sum: ApoB 35%, LDL-C 20%, HDL-C 15%, triglycerides 15%, resting HR 15%." },
    { key: "inflammation", label: "Inflammation / Immune Aging",score: weighted(inflammationComponents),    components: inflammationComponents,    formula: "Weighted sum: hs-CRP 40%, vitamin D 25%, sleep 20%, stress 15%." },
    { key: "muscle",       label: "Muscle & Mobility Reserve",  score: weighted(muscleComponents),          components: muscleComponents,          formula: "Weighted sum: exercise 25%, strength training 25%, VO2 max 30%, protein 20%." },
    { key: "cognition",    label: "Cognitive Resilience",       score: weighted(cognitionComponents),       components: cognitionComponents,       formula: "Weighted sum: sleep 35%, stress 20%, exercise 20%, metabolic score 25%." },
    { key: "sleep",        label: "Sleep & Recovery",           score: weighted(sleepRecoveryComponents),   components: sleepRecoveryComponents,   formula: "Weighted sum: sleep duration 40%, HRV 25%, resting HR 20%, stress 15%." },
  ];

  const overall = Math.round(
    domains.reduce((s, d) => s + d.score * DOMAIN_WEIGHTS[d.key], 0),
  );

  return { overall, domains, weights: DOMAIN_WEIGHTS };
}
