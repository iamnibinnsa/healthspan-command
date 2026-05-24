import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useTwin } from "@/lib/twin-context";
import {
  INITIAL_BIO_AGE_GAP, INITIAL_DOMAINS, INTERVENTIONS, SAMPLE_BIOMARKERS, projectScores,
  type Status, type Biomarker, type DomainKey,
} from "@/lib/mockData";
import { bandFromGap } from "@/lib/bioAgeProjection";
import { computeHealthspan } from "@/lib/scoringEngine";
import type { ParsedBiomarkers } from "@/lib/twin-context";
import { TrustNote } from "@/components/TrustNote";
import { Copy, Printer, FileText } from "lucide-react";

function parsedToBiomarkers(p: ParsedBiomarkers): Biomarker[] {
  const band = (v: number, lo: number, hi: number): Status =>
    v < lo ? "optimal" : v < hi ? "watch" : "priority";
  const rev = (v: number, lo: number, hi: number): Status =>
    v >= lo ? "optimal" : v >= hi ? "watch" : "priority";
  return [
    { name: "HbA1c",          value: p.hba1c,           unit: "%",        optimal: "< 5.4",    status: band(p.hba1c, 5.4, 6) },
    { name: "Fasting Glucose", value: p.fasting_glucose, unit: "mg/dL",    optimal: "70–95",    status: band(p.fasting_glucose, 95, 110) },
    { name: "ApoB",            value: p.apob,            unit: "mg/dL",    optimal: "< 80",     status: band(p.apob, 80, 100) },
    { name: "LDL-C",           value: p.ldl_c,           unit: "mg/dL",    optimal: "< 100",    status: band(p.ldl_c, 100, 130) },
    { name: "HDL-C",           value: p.hdl_c,           unit: "mg/dL",    optimal: "> 50",     status: rev(p.hdl_c, 50, 40) },
    { name: "Triglycerides",   value: p.triglycerides,   unit: "mg/dL",    optimal: "< 100",    status: band(p.triglycerides, 100, 175) },
    { name: "hs-CRP",          value: p.hs_crp,          unit: "mg/L",     optimal: "< 1.0",    status: band(p.hs_crp, 1, 3) },
    { name: "Vitamin D",       value: p.vitamin_d,       unit: "ng/mL",    optimal: "40–60",    status: rev(p.vitamin_d, 40, 25) },
    { name: "Resting HR",      value: p.resting_hr,      unit: "bpm",      optimal: "55–65",    status: band(p.resting_hr, 65, 75) },
    { name: "HRV",             value: p.hrv,             unit: "ms",       optimal: "> 50",     status: rev(p.hrv, 50, 35) },
    { name: "Sleep Duration",  value: p.sleep_duration,  unit: "hr/night", optimal: "7–8.5",    status: rev(p.sleep_duration, 7, 6) },
    { name: "VO2 max",         value: p.vo2_max,         unit: "ml/kg/min",optimal: "> 42",     status: rev(p.vo2_max, 42, 35) },
  ];
}

export const Route = createFileRoute("/report")({
  component: Report,
});

/* ------------------------------------------------------------------ */
/*  Static copy / metadata                                              */
/* ------------------------------------------------------------------ */

const PRIORITY_TITLE: Record<DomainKey, string> = {
  cardio:       "Discuss cardiovascular marker context",
  sleep:        "Review sleep / recovery trends",
  inflammation: "Consider repeating inflammation marker",
  metabolic:    "Discuss metabolic markers and trajectory",
  muscle:       "Review training cadence and muscle reserve",
  cognition:    "Review vascular and sleep contributions to cognition",
};

const PRIORITY_CONTEXT: Record<DomainKey, string> = {
  cardio:       "ApoB elevated, LDL-C above target, family history of cardiovascular disease.",
  sleep:        "Reported sleep duration short, HRV trending low, resting heart rate elevated.",
  inflammation: "hs-CRP elevated; Vitamin D below target; possible correlation with sleep deficit.",
  metabolic:    "HbA1c trending toward pre-diabetic; fasting glucose 104; triglycerides 168.",
  muscle:       "VO2 max below age-norm; current strength training frequency low.",
  cognition:    "Short sleep duration and elevated vascular markers — both modifiable in midlife.",
};

const CLINICIAN_QUESTIONS: string[] = [
  "Would you interpret ApoB in the context of my overall cardiovascular risk?",
  "Should hs-CRP be repeated when I am well/rested to confirm a true elevation?",
  "Would Vitamin D retesting be appropriate after a supplementation discussion?",
  "Given short sleep duration and elevated resting heart rate, would screening for sleep-disordered breathing be reasonable?",
  "Are cardiovascular imaging or screens (e.g., calcium scoring) appropriate for my age and family history?",
  "Would tracking a blood-marker biological-age proxy (HbA1c, ApoB, hs-CRP, Vitamin D, HRV, VO2) over time be a useful longitudinal datapoint for our discussions?",
];

const FOLLOW_UPS: { timing: string; what: string; detail: string }[] = [
  {
    timing: "Week 6",
    what: "Wearable + lifestyle trend review",
    detail:
      "Sleep duration, HRV, resting heart rate, exercise consistency, and self-reported energy/stress.",
  },
  {
    timing: "Week 12",
    what: "Lab review discussion",
    detail:
      "Lipid panel including ApoB, hs-CRP, 25-OH Vitamin D, HbA1c, and fasting glucose. Compare to baseline.",
  },
  {
    timing: "Week 12",
    what: "Re-run blood-marker bio-age proxy",
    detail:
      "Recompute the biological-age estimator with refreshed labs. Educational longitudinal datapoint, not a clinical diagnosis.",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                              */
/* ------------------------------------------------------------------ */

function dietQualityLabel(d: number): string {
  if (d <= 3) return "Below average";
  if (d <= 5) return "Average";
  if (d <= 7) return "Good";
  return "Excellent";
}

function stressLabel(s: number): string {
  if (s <= 3) return "Low";
  if (s <= 6) return "Moderate";
  return "High";
}

function statusLabel(status: Status): string {
  return status === "optimal"
    ? "Within target"
    : status === "watch"
      ? "Monitor"
      : "Discuss";
}

function statusDotColor(status: Status): string {
  return status === "optimal"
    ? "oklch(0.65 0.13 160)"
    : status === "watch"
      ? "oklch(0.72 0.13 85)"
      : "oklch(0.62 0.18 25)";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatClinicianSummaryText(args: {
  intake: ReturnType<typeof useTwin>["intake"];
  generatedAt: Date;
  bottlenecks: { key: DomainKey; label: string; score: number }[];
  active: typeof INTERVENTIONS;
  biomarkers: Biomarker[];
  bioBandLabel: string;
  baselineScore: number;
  projectedScore: number;
  scoreDelta: number;
  dynamicBaseGap: number;
  dynamicProjectedGap: number;
  domainScores: Record<DomainKey, number>;
}): string {
  const {
    intake, generatedAt, bottlenecks, active, biomarkers, bioBandLabel,
    baselineScore, projectedScore, scoreDelta,
    dynamicBaseGap, dynamicProjectedGap, domainScores,
  } = args;
  const baselineBioAge = +(intake.age + dynamicBaseGap).toFixed(1);
  const projectedBioAge = +(intake.age + dynamicProjectedGap).toFixed(1);
  const yearsImproved = +(dynamicBaseGap - dynamicProjectedGap).toFixed(1);

  const lines: string[] = [];
  lines.push("LIFE Clinician Visit Brief");
  lines.push(`Generated: ${formatDate(generatedAt)} · Prototype educational report`);
  lines.push("");

  lines.push("PATIENT / USER SNAPSHOT");
  lines.push(`  Name:                  ${intake.name}`);
  lines.push(`  Age (chronological):   ${intake.age} yr`);
  lines.push(`  Sex:                   ${intake.sex}`);
  lines.push(
    `  Biological age (proxy): ${projectedBioAge} yr  (+${dynamicProjectedGap.toFixed(1)} vs chronological · ${bioBandLabel})`,
  );
  lines.push(`  Primary goals:         ${intake.goals.join(", ") || "—"}`);
  lines.push(`  Wearable:              ${intake.wearable}`);
  lines.push(
    "  Note: bio-age is a blood-marker proxy (Levine-style estimator), not an Illumina",
  );
  lines.push("        450K/EPIC Horvath methylation clock. Educational discussion only.");
  lines.push("");

  lines.push("KEY DISCUSSION PRIORITIES");
  bottlenecks.slice(0, 3).forEach((b, i) => {
    lines.push(`  ${i + 1}. ${PRIORITY_TITLE[b.key]}`);
    lines.push(`     Context: ${PRIORITY_CONTEXT[b.key]}`);
  });
  lines.push("");

  lines.push("BIOMARKER SUMMARY");
  biomarkers.forEach((b) => {
    lines.push(
      `  ${b.name}: ${b.value} ${b.unit}  (target ${b.optimal})  — ${statusLabel(b.status)}` +
        (b.note ? `; ${b.note}` : ""),
    );
  });
  lines.push("");

  lines.push("USER-REPORTED LIFESTYLE CONTEXT");
  lines.push(`  Sleep:          ${intake.sleepHours} hr/night`);
  lines.push(`  Exercise:       ${intake.exerciseFreq} days/week`);
  lines.push(`  Stress:         ${intake.stress}/10 (${stressLabel(intake.stress)})`);
  lines.push(`  Diet quality:   ${dietQualityLabel(intake.diet)} (${intake.diet}/10)`);
  lines.push(`  Family history: ${intake.familyHistory.join(", ") || "—"}`);
  lines.push(`  Wearable:       ${intake.wearable}`);
  lines.push("");

  lines.push("DIGITAL TWIN DOMAIN SUMMARY (prototype directional estimates)");
  INITIAL_DOMAINS.forEach((d) => {
    lines.push(`  ${d.label}: ${domainScores[d.key]}/100`);
  });
  lines.push("");

  lines.push("COMPOSITE SNAPSHOT & 90-DAY PROJECTION");
  const projDelta = scoreDelta > 0 ? `(+${scoreDelta})` : "(no change)";
  const bioDeltaStr = yearsImproved > 0 ? `· −${yearsImproved} yr` : "(no change)";
  lines.push(
    `  Today    Healthspan ${baselineScore}/100   ` +
      `Bio-age proxy ${baselineBioAge} yr (+${dynamicBaseGap.toFixed(1)})`,
  );
  lines.push(
    `  90 days  Healthspan ${projectedScore}/100 ${projDelta}   ` +
      `Bio-age proxy ${projectedBioAge} yr (+${dynamicProjectedGap.toFixed(1)}) ${bioDeltaStr}`,
  );
  lines.push(
    "  Note: assumes maintenance of the interventions listed in 'Selected User Interventions'.",
  );
  lines.push("");

  lines.push("SELECTED USER INTERVENTIONS (educational, not prescribed)");
  if (active.length === 0) {
    lines.push("  None selected.");
  } else {
    active.forEach((i) => {
      lines.push(`  - ${i.label} (${i.category})`);
    });
  }
  lines.push("");

  lines.push("QUESTIONS FOR CLINICIAN");
  CLINICIAN_QUESTIONS.forEach((q, i) => {
    lines.push(`  Q${i + 1}. ${q}`);
  });
  lines.push("");

  lines.push("SUGGESTED FOLLOW-UP / RETEST DISCUSSION");
  FOLLOW_UPS.forEach((f) => {
    lines.push(`  ${f.timing}: ${f.what}`);
    lines.push(`     ${f.detail}`);
  });
  lines.push("");

  lines.push("SAFETY & SCOPE");
  lines.push(
    "  LIFE is an educational decision-support prototype. It does not diagnose,",
  );
  lines.push("  treat, prescribe, or replace clinical judgment.");
  lines.push("");
  lines.push("Generated by LIFE");

  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Page component                                                       */
/* ------------------------------------------------------------------ */

function Report() {
  const { intake, interventions, parsedBiomarkers } = useTwin();

  const activeBiomarkers: Biomarker[] = parsedBiomarkers
    ? parsedToBiomarkers(parsedBiomarkers)
    : SAMPLE_BIOMARKERS;

  // Real personalized baseline (no interventions) using actual biomarkers
  const baseBreakdown = useMemo(
    () => computeHealthspan(intake, [], activeBiomarkers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intake, parsedBiomarkers],
  );

  // Mock intervention effect table for gap reduction and domain/score deltas
  const proj = projectScores(interventions);
  const healthDelta = proj.healthspan - proj.baselineHealthspan;
  const baselineScore = baseBreakdown.overall;
  const projectedScore = Math.min(100, Math.round(baselineScore + healthDelta));
  const scoreDelta = healthDelta;

  // Dynamic bio-age: personalized baseline + intervention gap reduction
  const interventionGapReduction = Math.max(0, INITIAL_BIO_AGE_GAP - proj.bioAgeGap);
  const dynamicBaseGap = Math.max(0, +((100 - baselineScore) * 0.14).toFixed(1));
  const dynamicProjectedGap = Math.max(0, +(dynamicBaseGap - interventionGapReduction).toFixed(1));
  const bioBand = bandFromGap(dynamicProjectedGap);

  // Domain scores: real baseline + mock intervention deltas
  const domainScores = useMemo(() => {
    const baseMap = Object.fromEntries(
      baseBreakdown.domains.map((d) => [d.key, d.score])
    ) as Record<DomainKey, number>;
    return Object.fromEntries(
      INITIAL_DOMAINS.map((d) => {
        const mockDelta = proj.domains[d.key] - proj.baselineDomains[d.key];
        return [d.key, Math.min(100, Math.round((baseMap[d.key] ?? proj.baselineDomains[d.key]) + mockDelta))];
      })
    ) as Record<DomainKey, number>;
  }, [baseBreakdown, proj.domains, proj.baselineDomains]);

  const generatedAt = useMemo(() => new Date(), []);
  const [copied, setCopied] = useState(false);

  // Bottlenecks sorted by real projected domain score (lowest first)
  const bottlenecks = useMemo(
    () =>
      [...INITIAL_DOMAINS]
        .map((d) => ({ key: d.key, label: d.label, score: domainScores[d.key] }))
        .sort((a, b) => a.score - b.score),
    [domainScores],
  );
  const top3 = bottlenecks.slice(0, 3);
  const active = INTERVENTIONS.filter((i) => interventions.includes(i.id));

  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") window.print();
  }, []);

  const handleCopy = useCallback(() => {
    const text = formatClinicianSummaryText({
      intake,
      generatedAt,
      bottlenecks: top3,
      active,
      biomarkers: activeBiomarkers,
      bioBandLabel: bioBand.label,
      baselineScore,
      projectedScore,
      scoreDelta,
      dynamicBaseGap,
      dynamicProjectedGap,
      domainScores,
    });
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [intake, generatedAt, top3, active, activeBiomarkers, bioBand, baselineScore, projectedScore, scoreDelta, dynamicBaseGap, dynamicProjectedGap, domainScores]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* On-screen action bar — hidden on print */}
      <div className="no-print flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">
            For your physician or longevity coach
          </div>
          <h1 className="text-4xl font-display font-semibold mt-1">Clinician Visit Brief</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            A concise summary to help guide a conversation with your physician or longevity coach.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass text-xs font-semibold transition hover:brightness-110"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy clinician summary"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg btn-hero text-xs font-semibold"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Printable document */}
      <div className="report-doc glass rounded-3xl p-8 space-y-6">
        {/* Identity strip */}
        <div className="flex items-center gap-4 pb-4 border-b border-border/50">
          <div className="h-12 w-12 rounded-xl glass flex items-center justify-center print:hidden">
            <FileText className="h-5 w-5 text-[var(--neon-blue)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl font-semibold">{intake.name}</div>
            <div className="text-xs text-muted-foreground">
              Age {intake.age} · {intake.sex} · LIFE Clinician Visit Brief
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border border-[var(--neon-orange)]/40 text-[var(--neon-orange)] whitespace-nowrap">
            Prototype educational report
          </span>
        </div>

        {/* 1 · Patient / User Snapshot */}
        <ReportSection step={1} title="Patient / User Snapshot">
          <div className="grid sm:grid-cols-3 gap-3">
            <Kv k="Name" v={intake.name} />
            <Kv k="Age (chronological)" v={`${intake.age} yr`} />
            <Kv
              k="Biological age (proxy)"
              v={`${+(intake.age + dynamicProjectedGap).toFixed(1)} yr · +${dynamicProjectedGap.toFixed(1)} vs chronological · ${bioBand.label}`}
            />
            <Kv k="Sex" v={intake.sex} />
            <Kv k="Primary goals" v={intake.goals.join(", ") || "—"} />
            <Kv k="Wearable source" v={intake.wearable} />
            <Kv k="Date generated" v={formatDate(generatedAt)} />
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-2 leading-snug">
            Biological age is a blood-marker proxy (Levine-style estimator over the lab panel
            below) &mdash; not an Illumina 450K/EPIC methylation Horvath clock. Provided for
            educational discussion only.
          </p>
        </ReportSection>

        {/* 2 · Key Discussion Priorities */}
        <ReportSection step={2} title="Key Discussion Priorities">
          <ol className="space-y-2.5 text-sm list-decimal pl-5">
            {top3.map((b) => (
              <li key={b.key} className="leading-snug">
                <div className="font-medium">{PRIORITY_TITLE[b.key]}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {PRIORITY_CONTEXT[b.key]}
                </div>
              </li>
            ))}
          </ol>
        </ReportSection>

        {/* 3 · Biomarker Summary */}
        <ReportSection step={3} title="Biomarker Summary">
          <BiomarkerTable markers={activeBiomarkers} />
        </ReportSection>

        {/* 4 · User-Reported Lifestyle Context */}
        <ReportSection step={4} title="User-Reported Lifestyle Context">
          <div className="grid sm:grid-cols-3 gap-3">
            <Kv k="Sleep" v={`${intake.sleepHours} hr/night`} />
            <Kv k="Exercise" v={`${intake.exerciseFreq} days/week`} />
            <Kv k="Stress" v={`${intake.stress}/10 · ${stressLabel(intake.stress)}`} />
            <Kv k="Diet quality" v={`${dietQualityLabel(intake.diet)} (${intake.diet}/10)`} />
            <Kv k="Family history" v={intake.familyHistory.join(", ") || "—"} />
            <Kv k="Wearable" v={intake.wearable} />
          </div>
        </ReportSection>

        {/* 5 · Digital Twin Domain Summary */}
        <ReportSection step={5} title="Digital Twin Domain Summary">
          <p className="text-[11px] text-muted-foreground italic mb-3">
            Prototype directional estimates &mdash; not clinical predictions.
          </p>
          <div className="grid sm:grid-cols-3 gap-2">
            {INITIAL_DOMAINS.map((d) => (
              <div
                key={d.key}
                className="border border-border rounded-md p-2.5 flex items-center justify-between text-sm"
              >
                <span>{d.label}</span>
                <span className="font-mono tabular-nums">{domainScores[d.key]} / 100</span>
              </div>
            ))}
          </div>

          {/* Composite snapshot vs. 90-day projection — bridges this brief
              with the user's simulator selections so the clinician sees both
              the current baseline and the target the user is working toward. */}
          <div className="mt-4 border-t border-border/60 pt-3 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Composite snapshot &amp; 90-day projection
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="border border-border rounded-md p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Today
                </div>
                <div className="text-sm mt-1">
                  Healthspan score{" "}
                  <span className="font-mono tabular-nums">
                    {baselineScore} / 100
                  </span>
                </div>
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  Bio-age proxy{" "}
                  <span className="font-mono tabular-nums">
                    {+(intake.age + dynamicBaseGap).toFixed(1)} yr
                  </span>{" "}
                  (+{dynamicBaseGap.toFixed(1)} vs chronological)
                </div>
              </div>
              <div className="border border-border rounded-md p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Projected at 90 days
                  {active.length === 0 && (
                    <span className="italic"> (no interventions selected yet)</span>
                  )}
                </div>
                <div className="text-sm mt-1">
                  Healthspan score{" "}
                  <span className="font-mono tabular-nums">
                    {projectedScore} / 100
                  </span>
                  {scoreDelta > 0 && (
                    <span className="text-muted-foreground"> (+{scoreDelta})</span>
                  )}
                </div>
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  Bio-age proxy{" "}
                  <span className="font-mono tabular-nums">
                    {+(intake.age + dynamicProjectedGap).toFixed(1)} yr
                  </span>{" "}
                  (+{dynamicProjectedGap.toFixed(1)})
                  {dynamicProjectedGap < dynamicBaseGap && (
                    <span> · −{+(dynamicBaseGap - dynamicProjectedGap).toFixed(1)} yr</span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic leading-snug">
              Projected values assume the user maintains the interventions in section 6 for ~90 days.
              Directional educational estimates, not clinical predictions.
            </p>
          </div>
        </ReportSection>

        {/* 6 · Selected User Interventions */}
        <ReportSection step={6} title="Selected User Interventions">
          <p className="text-[11px] text-muted-foreground italic mb-3">
            User-selected exploration items &mdash; educational, not prescribed.
          </p>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No interventions selected.</p>
          ) : (
            <ul className="space-y-1.5 text-sm list-disc pl-5">
              {active.map((i) => (
                <li key={i.id}>
                  {i.label}{" "}
                  <span className="text-xs text-muted-foreground">({i.category})</span>
                </li>
              ))}
            </ul>
          )}
        </ReportSection>

        {/* 7 · Questions for Clinician */}
        <ReportSection step={7} title="Questions for Clinician">
          <ol className="space-y-2 text-sm list-decimal pl-5">
            {CLINICIAN_QUESTIONS.map((q, i) => (
              <li key={i} className="leading-snug">
                {q}
              </li>
            ))}
          </ol>
        </ReportSection>

        {/* 8 · Suggested Follow-Up */}
        <ReportSection step={8} title="Suggested Follow-Up / Retest Discussion">
          <div className="grid sm:grid-cols-3 gap-3">
            {FOLLOW_UPS.map((f, i) => (
              <div
                key={`${f.timing}-${i}`}
                className="border border-border rounded-md p-3"
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--neon-blue)]">
                  {f.timing}
                </div>
                <div className="text-sm font-medium mt-0.5">{f.what}</div>
                <div className="text-[12px] text-muted-foreground mt-1.5 leading-snug">
                  {f.detail}
                </div>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* 9 · Safety & Scope */}
        <ReportSection step={9} title="Safety & Scope">
          <p className="text-sm text-muted-foreground leading-relaxed">
            LIFE is an educational decision-support prototype. It does not diagnose,
            treat, prescribe, or replace clinical judgment. All thresholds, projections, and
            discussion items are directional and intended to support the user&rsquo;s
            conversation with a licensed clinician.
          </p>
        </ReportSection>

        {/* Trust note + footer */}
        <div className="border-t border-border/50 pt-4">
          <TrustNote variant="clinical" />
        </div>
        <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          <span>Generated by LIFE</span>
          <span>{formatDate(generatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                       */
/* ------------------------------------------------------------------ */

function ReportSection({
  step, title, children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="report-section">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground tabular-nums w-5">
          {String(step).padStart(2, "0")}
        </span>
        <div className="report-section-title text-[11px] uppercase tracking-[0.22em] text-[var(--neon-blue)] flex-1">
          {title}
        </div>
      </div>
      <div className="pl-7 print:pl-0">{children}</div>
    </section>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-border rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="text-sm font-medium mt-1 break-words">{v}</div>
    </div>
  );
}

function BiomarkerTable({ markers }: { markers: Biomarker[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="report-table w-full text-[12.5px] border-collapse">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-2 py-2 border-b border-border">Marker</th>
            <th className="px-2 py-2 border-b border-border text-right">Value</th>
            <th className="px-2 py-2 border-b border-border">Unit</th>
            <th className="px-2 py-2 border-b border-border">Demo target</th>
            <th className="px-2 py-2 border-b border-border">Status</th>
            <th className="px-2 py-2 border-b border-border">Notes</th>
          </tr>
        </thead>
        <tbody>
          {markers.map((b) => (
            <tr key={b.name} className="align-top border-b border-border/50">
              <td className="px-2 py-2 font-medium">{b.name}</td>
              <td className="px-2 py-2 font-mono tabular-nums text-right">{b.value}</td>
              <td className="px-2 py-2 text-muted-foreground">{b.unit}</td>
              <td className="px-2 py-2 text-muted-foreground">{b.optimal}</td>
              <td className="px-2 py-2">
                <StatusLabel status={b.status} />
              </td>
              <td className="px-2 py-2 text-muted-foreground">{b.note ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-muted-foreground italic mt-2 leading-snug">
        Demo target / reference values are illustrative for prototype purposes &mdash; refer to
        lab-specific reference ranges in clinical interpretation.
      </p>
    </div>
  );
}

function StatusLabel({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] whitespace-nowrap">
      <span
        aria-hidden
        className="status-dot h-1.5 w-1.5 rounded-full inline-block"
        style={{ background: statusDotColor(status) }}
      />
      {statusLabel(status)}
    </span>
  );
}
