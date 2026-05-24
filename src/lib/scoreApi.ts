import type { HealthspanBreakdown } from "./scoringEngine";
import type { Biomarker, DomainKey, Status } from "./mockData";
import type { IntakeData, ParsedBiomarkers } from "./twin-context";

export type MediTwinScore = {
  overallHealthspanScore: number;
  biologicalAgeGap: number;
  chronologicalAge: number;
  domains: Array<{
    key: DomainKey;
    label: string;
    short: string;
    score: number;
    status: Status;
    icon: string;
    drivers: string[];
    recommendations: string[];
  }>;
  bottlenecks: Array<{
    key: string;
    label: string;
    score: number;
    drivers: string[];
  }>;
  biomarkers: Biomarker[];
  breakdown: HealthspanBreakdown;
  summary: string;
  disclaimer?: string;
};

export type ScoreComputeResponse = {
  snapshot_id: string;
  user_id?: string | null;
  source: "llm" | "fallback";
  score: MediTwinScore;
  created_at: string;
  persisted: boolean;
};

const AI_API_BASE = import.meta.env.VITE_AI_API_BASE ?? "http://127.0.0.1:8000";

function toApiIntake(intake: IntakeData) {
  return {
    name: intake.name || "Guest",
    age: intake.age >= 18 ? intake.age : 48,
    sex: intake.sex === "Female" || intake.sex === "Other" ? intake.sex : "Male",
    goals: intake.goals,
    family_history: intake.familyHistory,
    wearable: intake.wearable || "None",
    sleep_hours: intake.sleepHours,
    exercise_freq: intake.exerciseFreq,
    stress: intake.stress,
    diet: intake.diet,
  };
}

export async function fetchScoreCompute(args: {
  userId?: string | null;
  intake: IntakeData;
  biomarkers: ParsedBiomarkers;
  interventions: string[];
}): Promise<MediTwinScore> {
  const res = await fetch(`${AI_API_BASE}/score/compute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: args.userId ?? null,
      intake: toApiIntake(args.intake),
      biomarkers: args.biomarkers,
      interventions: args.interventions,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Score compute failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }

  const data = (await res.json()) as ScoreComputeResponse;
  return normalizeScore(data.score);
}

function normalizeScore(raw: MediTwinScore): MediTwinScore {
  return {
    ...raw,
    breakdown: {
      overall: raw.breakdown.overall,
      weights: raw.breakdown.weights,
      domains: raw.breakdown.domains.map((d) => ({
        ...d,
        key: d.key as DomainKey,
        components: d.components.map((c) => ({
          ...c,
          score: Math.round(c.score),
        })),
      })),
    },
    biomarkers: raw.biomarkers.map((b) => ({
      ...b,
      status: b.status as Status,
    })),
  };
}
