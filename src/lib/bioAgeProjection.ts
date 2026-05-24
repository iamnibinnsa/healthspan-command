/* ------------------------------------------------------------------ */
/*  Biological-age projection                                           */
/* ------------------------------------------------------------------ */
/**
 * Surfaces biological age across the app (Snapshot, Twin Map, Simulator,
 * 90-Day Plan, Doctor Brief) without duplicating logic.
 *
 * - Baseline numbers come from the same `INITIAL_BIO_AGE_GAP` constant the
 *   rest of the app uses (currently calibrated to the bundled demo profile).
 * - Intervention-shifted numbers reuse `projectScores`, so a +1 readiness
 *   point converts to roughly −0.18 years of bio-age in lock-step with the
 *   simulator and the existing `bioAgeGap` field everywhere else.
 *
 * This is intentionally a thin layer over existing logic — no new scoring,
 * no parallel models. Real Horvath methylation work belongs in
 * `horvathClock.ts`; this helper is purely the cross-tab read of "how does
 * bio-age look right now and how could it look with these tweaks?"
 */

import { INITIAL_BIO_AGE_GAP, projectScores } from "./mockData";

export interface BioAgeProjection {
  chronologicalAge: number;
  baselineBioAge: number;
  projectedBioAge: number;
  baselineGap: number;
  projectedGap: number;
  /** Years removed from the gap. Positive = improvement. */
  yearsImproved: number;
  /** Signed delta in bio-age years. Negative = improvement. */
  deltaYears: number;
}

/**
 * Project biological age for a chronological age + a set of active
 * intervention IDs (uses the same effect table as `projectScores`).
 */
export function projectBioAge(
  chronologicalAge: number,
  interventionIds: string[] = [],
): BioAgeProjection {
  const proj = projectScores(interventionIds);
  const baselineBioAge = +(chronologicalAge + INITIAL_BIO_AGE_GAP).toFixed(1);
  const projectedBioAge = +(chronologicalAge + proj.bioAgeGap).toFixed(1);
  const yearsImproved = +(INITIAL_BIO_AGE_GAP - proj.bioAgeGap).toFixed(1);
  return {
    chronologicalAge,
    baselineBioAge,
    projectedBioAge,
    baselineGap: INITIAL_BIO_AGE_GAP,
    projectedGap: proj.bioAgeGap,
    yearsImproved,
    deltaYears: +(projectedBioAge - baselineBioAge).toFixed(1),
  };
}

/**
 * Years of bio-age that would be removed from the gap by applying a *subset*
 * of intervention IDs in isolation. Used by Simulator section chips
 * ("Recovery Rhythm: −0.6 yr potential").
 */
export function bioAgeReductionFromIds(ids: string[]): number {
  if (!ids.length) return 0;
  const proj = projectScores(ids);
  return +(INITIAL_BIO_AGE_GAP - proj.bioAgeGap).toFixed(1);
}

/* ------------------------------------------------------------------ */
/*  Tone bands — for chip labels only, never medical interpretation    */
/* ------------------------------------------------------------------ */

export type BioAgeBand = "ahead" | "on-par" | "mild" | "accelerated";

export interface BioAgeBandInfo {
  band: BioAgeBand;
  label: string;
  /** Maps to existing `--neon-*` CSS variable names. */
  color: "neon-green" | "neon-blue" | "neon-orange" | "neon-red";
  blurb: string;
}

/**
 * Tone-of-voice bands derived from the gap (years above chronological age).
 * Bands are intentionally wider on the "lagging" side because the demo
 * profile starts at +7.2 yr; even with every intervention enabled the gap
 * stays positive, and we never want to render an alarming "strongly
 * accelerated" label for a prototype.
 */
export function bandFromGap(gap: number): BioAgeBandInfo {
  if (gap < 0) {
    return {
      band: "ahead",
      label: "Tracking younger",
      color: "neon-green",
      blurb: "Your markers suggest a body that's a touch younger than your chronological age.",
    };
  }
  if (gap <= 2) {
    return {
      band: "on-par",
      label: "On par",
      color: "neon-blue",
      blurb: "Biological and chronological age are tracking closely. A solid baseline to build from.",
    };
  }
  if (gap <= 5) {
    return {
      band: "mild",
      label: "Mildly accelerated",
      color: "neon-orange",
      blurb: "A few markers are nudging biological age above chronological. Small, consistent shifts can rebalance this.",
    };
  }
  return {
    band: "accelerated",
    label: "Worth a chat",
    color: "neon-orange",
    blurb: "Several markers are pulling biological age above chronological. A clinician conversation could help frame next steps.",
  };
}
