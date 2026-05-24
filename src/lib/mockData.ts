export type Status = "optimal" | "watch" | "priority";

export interface Biomarker {
  name: string;
  value: number | string;
  unit: string;
  optimal: string;
  status: Status;
  note?: string;
}

export interface DomainScore {
  key: DomainKey;
  label: string;
  short: string;
  score: number;
  status: Status;
  drivers: string[];
  recommendations: string[];
  icon: string; // lucide icon name keyword
}

export type DomainKey =
  | "metabolic"
  | "cardio"
  | "inflammation"
  | "muscle"
  | "cognition"
  | "sleep";

export const SAMPLE_USER = {
  name: "Alex Morgan",
  age: 48,
  sex: "Male",
};

export const SAMPLE_BIOMARKERS: Biomarker[] = [
  { name: "HbA1c", value: 5.8, unit: "%", optimal: "< 5.4", status: "watch", note: "Pre-diabetic trend" },
  { name: "Fasting Glucose", value: 104, unit: "mg/dL", optimal: "70–95", status: "watch" },
  { name: "ApoB", value: 112, unit: "mg/dL", optimal: "< 80", status: "priority", note: "Elevated atherogenic particle count" },
  { name: "LDL-C", value: 142, unit: "mg/dL", optimal: "< 100", status: "priority" },
  { name: "HDL-C", value: 45, unit: "mg/dL", optimal: "> 50", status: "watch" },
  { name: "Triglycerides", value: 168, unit: "mg/dL", optimal: "< 100", status: "watch" },
  { name: "hs-CRP", value: 3.2, unit: "mg/L", optimal: "< 1.0", status: "priority", note: "Systemic inflammation" },
  { name: "Vitamin D", value: 22, unit: "ng/mL", optimal: "40–60", status: "priority" },
  { name: "Resting HR", value: 74, unit: "bpm", optimal: "55–65", status: "watch" },
  { name: "HRV", value: 32, unit: "ms", optimal: "> 50", status: "priority" },
  { name: "Sleep Duration", value: 5.8, unit: "hr/night", optimal: "7–8.5", status: "priority" },
  { name: "VO2 max", value: 32, unit: "ml/kg/min", optimal: "> 42", status: "watch" },
];

export const INITIAL_DOMAINS: DomainScore[] = [
  {
    key: "metabolic",
    label: "Metabolic Resilience",
    short: "Metabolic",
    score: 58,
    status: "watch",
    icon: "Activity",
    drivers: ["HbA1c 5.8%", "Fasting glucose 104", "Triglycerides 168"],
    recommendations: ["Add 30g fiber/day", "Zone 2 cardio 150 min/wk", "Reduce ultra-processed carbs"],
  },
  {
    key: "cardio",
    label: "Cardiovascular Longevity",
    short: "Cardio",
    score: 55,
    status: "priority",
    icon: "HeartPulse",
    drivers: ["ApoB 112", "LDL-C 142", "HDL 45"],
    recommendations: ["Discuss ApoB strategy with physician", "Soluble fiber + omega-3", "Zone 2 + strength"],
  },
  {
    key: "inflammation",
    label: "Inflammation / Immune Aging",
    short: "Inflammation",
    score: 52,
    status: "priority",
    icon: "Flame",
    drivers: ["hs-CRP 3.2", "Vitamin D 22", "Poor sleep"],
    recommendations: ["Correct vitamin D", "Anti-inflammatory diet", "Sleep optimization"],
  },
  {
    key: "muscle",
    label: "Muscle & Mobility Reserve",
    short: "Muscle",
    score: 63,
    status: "watch",
    icon: "Dumbbell",
    drivers: ["VO2 max 32", "Strength frequency low", "Protein intake unknown"],
    recommendations: ["Strength training 3×/wk", "Protein 1.6 g/kg", "Mobility daily"],
  },
  {
    key: "cognition",
    label: "Cognitive Resilience",
    short: "Cognition",
    score: 67,
    status: "watch",
    icon: "Brain",
    drivers: ["Sleep 5.8 hr", "Elevated ApoB (vascular risk)", "Stress"],
    recommendations: ["Sleep +45 min", "Aerobic + resistance", "Cognitive load variety"],
  },
  {
    key: "sleep",
    label: "Sleep & Recovery",
    short: "Sleep",
    score: 49,
    status: "priority",
    icon: "Moon",
    drivers: ["Sleep 5.8 hr", "HRV 32 ms", "RHR 74"],
    recommendations: ["+45 min sleep", "Wind-down protocol", "Reduce evening alcohol"],
  },
];

export const INITIAL_HEALTHSPAN = 57;
export const INITIAL_BIO_AGE_GAP = 7.2;

export interface Intervention {
  id: string;
  label: string;
  description: string;
  effects: Partial<Record<DomainKey, number>>;
  healthspan: number;
  bioAge: number; // years reduced from gap
  category: "Exercise" | "Nutrition" | "Sleep" | "Medical";
}

/**
 * Intervention effects on the six domain scores.
 * Values are interpretable hackathon prototype deltas (points, 0-100 scale)
 * derived from public directional evidence — NOT clinically validated.
 */
export const INTERVENTIONS: Intervention[] = [
  {
    id: "zone2",
    label: "Zone 2 cardio 150 min/week",
    description: "Mitochondrial efficiency, glucose disposal, VO2.",
    category: "Exercise",
    effects: { metabolic: 8, cardio: 5, cognition: 4, sleep: 3 },
    healthspan: 0, bioAge: 0,
  },
  {
    id: "strength",
    label: "Strength training 3×/week",
    description: "Muscle reserve, insulin sensitivity, bone density.",
    category: "Exercise",
    effects: { muscle: 10, metabolic: 4, cognition: 3 },
    healthspan: 0, bioAge: 0,
  },
  {
    id: "sleep45",
    label: "Sleep +45 min / night",
    description: "Recovery, glymphatic clearance, hormonal balance.",
    category: "Sleep",
    effects: { sleep: 10, inflammation: 5, cognition: 5, metabolic: 3 },
    healthspan: 0, bioAge: 0,
  },
  {
    id: "fiber",
    label: "Fiber 30 g/day",
    description: "Microbiome, ApoB modulation, glucose control.",
    category: "Nutrition",
    effects: { metabolic: 5, cardio: 3, inflammation: 2 },
    healthspan: 0, bioAge: 0,
  },
  {
    id: "protein",
    label: "Protein optimization (1.6 g/kg)",
    description: "Lean mass preservation, satiety, recovery.",
    category: "Nutrition",
    effects: { muscle: 6, metabolic: 2 },
    healthspan: 0, bioAge: 0,
  },
  {
    id: "alcohol",
    label: "Reduce alcohol",
    description: "Sleep quality, liver, inflammation.",
    category: "Nutrition",
    effects: { sleep: 4, inflammation: 4, metabolic: 2 },
    healthspan: 0, bioAge: 0,
  },
  {
    id: "vitd",
    label: "Vitamin D correction",
    description: "Immune modulation, bone, mood.",
    category: "Medical",
    effects: { inflammation: 5, muscle: 2 },
    healthspan: 0, bioAge: 0,
  },
  {
    id: "apob",
    label: "Discuss ApoB / lipid strategy with physician",
    description: "Physician-guided opportunity to address atherogenic particle burden.",
    category: "Medical",
    effects: { cardio: 8 },
    healthspan: 0, bioAge: 0,
  },
];

export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// Domain weights for overall Healthspan Score (must mirror scoringEngine.ts).
const DOMAIN_WEIGHTS_LOCAL: Record<DomainKey, number> = {
  metabolic: 0.20, cardio: 0.20, inflammation: 0.15,
  muscle: 0.15, cognition: 0.15, sleep: 0.15,
};

/**
 * Projects domain scores, overall Healthspan Score, and Biological Age Gap
 * given a set of active intervention IDs.
 *
 *   newGap = initialGap - ((newScore - oldScore) * 0.18)
 *
 * All values are projected directional estimates, not clinical predictions.
 */
export function projectScores(activeIds: string[]) {
  const baseline: Record<DomainKey, number> = {
    metabolic: 58, cardio: 55, inflammation: 52,
    muscle: 63, cognition: 67, sleep: 49,
  };
  const projected: Record<DomainKey, number> = { ...baseline };

  for (const id of activeIds) {
    const ix = INTERVENTIONS.find((i) => i.id === id);
    if (!ix) continue;
    for (const [k, v] of Object.entries(ix.effects)) {
      projected[k as DomainKey] = clamp(projected[k as DomainKey] + (v as number));
    }
  }

  const weightedAvg = (s: Record<DomainKey, number>) =>
    (Object.keys(s) as DomainKey[]).reduce((sum, k) => sum + s[k] * DOMAIN_WEIGHTS_LOCAL[k], 0);

  const oldScore = weightedAvg(baseline);
  const newScore = weightedAvg(projected);
  const gap = Math.max(0, INITIAL_BIO_AGE_GAP - (newScore - oldScore) * 0.18);

  return {
    domains: projected,
    baselineDomains: baseline,
    healthspan: Math.round(newScore),
    baselineHealthspan: Math.round(oldScore),
    bioAgeGap: +gap.toFixed(1),
  };
}


export function statusColor(s: Status) {
  return s === "optimal" ? "neon-green" : s === "watch" ? "neon-orange" : "neon-coral";
}
