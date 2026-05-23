import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useTwin } from "@/lib/twin-context";
import { useTwinProgress } from "@/lib/twin-progress";
import { INITIAL_DOMAINS, INTERVENTIONS, SAMPLE_BIOMARKERS, projectScores } from "@/lib/mockData";
import { FileText, Copy, ArrowLeft, Printer } from "lucide-react";

export const Route = createFileRoute("/report")({
  component: Report,
});

const STATUS_LABEL: Record<string, string> = {
  optimal: "In range",
  watch: "Monitor",
  priority: "Discuss",
};

const STATUS_NOTE_MAP: Record<string, string> = {
  "HbA1c": "Trending toward pre-diabetic range",
  "Fasting Glucose": "Above optimal fasting target",
  "ApoB": "Atherogenic particle load elevated",
  "LDL-C": "Above conventional target",
  "HDL-C": "Below protective threshold",
  "Triglycerides": "Suggests metabolic load",
  "hs-CRP": "Possible low-grade inflammation; consider repeat",
  "Vitamin D": "Insufficient; supplementation discussion",
  "Resting HR": "Above typical recovery range",
  "HRV": "Lower autonomic recovery signal",
  "Sleep Duration": "Short of restorative range",
  "VO2 max": "Aerobic capacity opportunity",
};

function Report() {
  const { intake, interventions } = useTwin();
  const proj = projectScores(interventions);
  const bottlenecks = [...INITIAL_DOMAINS]
    .map((d) => ({ ...d, score: proj.domains[d.key] }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
  const active = INTERVENTIONS.filter((i) => interventions.includes(i.id));
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });

  const [copied, setCopied] = useState(false);

  const copySummary = useCallback(() => {
    const lines = [
      `MediTwin · Clinician Visit Brief`,
      `Patient: ${intake.name}  |  Age: ${intake.age}  |  Sex: ${intake.sex}`,
      `Generated: ${generatedDate}  |  Prototype educational report`,
      ``,
      `KEY DISCUSSION PRIORITIES`,
      `1. Discuss cardiovascular marker context (ApoB / LDL-C / HDL-C)`,
      `2. Review sleep & recovery trends (sleep duration, HRV, resting HR)`,
      `3. Consider repeating inflammation marker (hs-CRP) when well-rested`,
      ``,
      `BIOMARKER SUMMARY`,
      ...SAMPLE_BIOMARKERS.map((b) =>
        `  ${b.name}: ${b.value} ${b.unit} (target ${b.optimal}) — ${STATUS_LABEL[b.status]}`,
      ),
      ``,
      `LIFESTYLE CONTEXT (self-reported)`,
      `  Sleep: ${intake.sleepHours} hr/night`,
      `  Exercise: ${intake.exerciseFreq} days/week`,
      `  Stress: ${intake.stress}/10`,
      `  Diet quality: ${intake.diet}/10`,
      `  Family history: ${intake.familyHistory.join(", ") || "—"}`,
      `  Wearable: ${intake.wearable}`,
      ``,
      `DIGITAL TWIN DOMAIN SUMMARY (prototype directional estimates)`,
      ...INITIAL_DOMAINS.map((d) => `  ${d.label}: ${proj.domains[d.key]}`),
      ``,
      `USER-SELECTED INTERVENTIONS (educational)`,
      ...(active.length ? active.map((i) => `  - ${i.label}`) : ["  None selected"]),
      ``,
      `QUESTIONS FOR CLINICIAN`,
      `  1. Would you interpret ApoB in the context of my overall cardiovascular risk?`,
      `  2. Should hs-CRP be repeated when I am well-rested and free of infection?`,
      `  3. Would Vitamin D retesting be appropriate after a supplementation discussion?`,
      `  4. Are there cardiovascular screening steps (e.g., CAC) worth considering given family history?`,
      ``,
      `SUGGESTED FOLLOW-UP`,
      `  Week 6: Wearable & lifestyle trend review`,
      `  Week 12: Lab review discussion (lipid panel + ApoB, HbA1c, hs-CRP, Vitamin D)`,
      ``,
      `SAFETY & SCOPE`,
      `  MediTwin is an educational decision-support prototype. It does not diagnose,`,
      `  treat, prescribe, or replace clinical judgment.`,
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [intake, interventions, proj, active, generatedDate]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 print-page">
      {/* Header (screen) */}
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap no-print">
        <div>
          <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">
            Clinician Visit Brief
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold mt-1">Clinician Visit Brief</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            A concise summary to help guide a conversation with your physician or longevity coach.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/plan" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass text-xs font-semibold">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to guide
          </Link>
          <button
            onClick={copySummary}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass text-xs font-semibold"
          >
            <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy clinician summary"}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg btn-hero text-xs font-semibold"
          >
            <Printer className="h-3.5 w-3.5" /> Export PDF / Print
          </button>
        </div>
      </div>

      {/* Print-only document title */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-semibold">Clinician Visit Brief</h1>
        <div className="text-xs muted">A concise summary to help guide a conversation with your physician or longevity coach.</div>
      </div>

      <div className="glass rounded-3xl p-6 sm:p-8 space-y-7 print-card">
        {/* 1. Patient snapshot */}
        <Section number="1" title="Patient / User Snapshot">
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <Kv k="Name" v={intake.name || "—"} />
            <Kv k="Age" v={String(intake.age)} />
            <Kv k="Sex" v={intake.sex || "—"} />
            <Kv k="Primary goals" v={intake.goals.length ? intake.goals.join(", ") : "—"} />
            <Kv k="Wearable source" v={intake.wearable || "None"} />
            <Kv k="Date generated" v={generatedDate} />
          </div>
          <div className="mt-3 text-[11px] muted italic">Prototype educational report — not a clinical document.</div>
        </Section>

        {/* 2. Key discussion priorities */}
        <Section number="2" title="Key Discussion Priorities">
          <ol className="space-y-2 text-sm">
            <PriorityItem n={1} text="Discuss cardiovascular marker context (ApoB, LDL-C, HDL-C trajectory)." />
            <PriorityItem n={2} text="Review sleep and recovery trends (sleep duration, HRV, resting heart rate)." />
            <PriorityItem n={3} text="Consider repeating the inflammation marker (hs-CRP) when well-rested and free of infection." />
          </ol>
        </Section>

        {/* 3. Biomarker summary */}
        <Section number="3" title="Biomarker Summary">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider muted">
                  <th className="py-2 px-2 border-b border-border/60 font-medium">Marker</th>
                  <th className="py-2 px-2 border-b border-border/60 font-medium">Value</th>
                  <th className="py-2 px-2 border-b border-border/60 font-medium">Unit</th>
                  <th className="py-2 px-2 border-b border-border/60 font-medium">Demo target</th>
                  <th className="py-2 px-2 border-b border-border/60 font-medium">Status</th>
                  <th className="py-2 px-2 border-b border-border/60 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_BIOMARKERS.map((b) => (
                  <tr key={b.name} className="align-top">
                    <td className="py-2 px-2 border-b border-border/30 font-medium">{b.name}</td>
                    <td className="py-2 px-2 border-b border-border/30 font-mono">{b.value}</td>
                    <td className="py-2 px-2 border-b border-border/30 muted">{b.unit}</td>
                    <td className="py-2 px-2 border-b border-border/30 muted">{b.optimal}</td>
                    <td className="py-2 px-2 border-b border-border/30">
                      <StatusLabel status={b.status} />
                    </td>
                    <td className="py-2 px-2 border-b border-border/30 muted text-xs">
                      {b.note || STATUS_NOTE_MAP[b.name] || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[11px] muted">Demo targets shown for educational context only; clinician should interpret in full clinical context.</div>
        </Section>

        {/* 4. Lifestyle context */}
        <Section number="4" title="User-Reported Lifestyle Context">
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <Kv k="Sleep" v={`${intake.sleepHours} hr/night`} />
            <Kv k="Exercise" v={`${intake.exerciseFreq} days/week`} />
            <Kv k="Stress" v={`${intake.stress}/10`} />
            <Kv k="Diet quality" v={`${intake.diet}/10`} />
            <Kv k="Family history" v={intake.familyHistory.join(", ") || "—"} />
            <Kv k="Wearable" v={intake.wearable || "None"} />
          </div>
        </Section>

        {/* 5. Digital twin domain summary */}
        <Section number="5" title="Digital Twin Domain Summary">
          <div className="grid sm:grid-cols-3 gap-3">
            {INITIAL_DOMAINS.map((d) => (
              <div key={d.key} className="glass-soft rounded-lg p-3 flex items-center justify-between print-card">
                <div>
                  <div className="text-sm font-medium">{d.short}</div>
                  <div className="text-[10px] muted uppercase tracking-wider">{d.label}</div>
                </div>
                <div className="font-display text-xl">{proj.domains[d.key]}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11px] muted italic">Prototype directional estimates — not validated clinical scores.</div>
          <div className="mt-3 text-sm">
            <div className="text-[11px] uppercase tracking-wider muted mb-1">Areas with lowest projected score</div>
            <ul className="space-y-1">
              {bottlenecks.map((b) => (
                <li key={b.key} className="text-sm">
                  <span className="font-medium">{b.label}</span>{" "}
                  <span className="muted">— score {b.score}; drivers: {b.drivers.join(", ")}.</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* 6. Selected interventions */}
        <Section number="6" title="Selected User Interventions">
          {active.length === 0 ? (
            <p className="text-sm muted">None selected yet.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {active.map((i) => (
                <li key={i.id}>
                  • <span className="font-medium">{i.label}</span>{" "}
                  <span className="text-xs muted">({i.category})</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 text-[11px] muted italic">
            User-selected, educational only. Not a prescription or treatment recommendation.
          </div>
        </Section>

        {/* 7. Questions for clinician */}
        <Section number="7" title="Questions for Clinician">
          <ul className="space-y-2 text-sm">
            <QItem text="Would you interpret ApoB in the context of my overall cardiovascular risk?" />
            <QItem text="Should hs-CRP be repeated when I am well-rested and free of infection?" />
            <QItem text="Would Vitamin D retesting be appropriate after a supplementation discussion?" />
            <QItem text="Given family history, are there cardiovascular screening steps (e.g., CAC, advanced lipid panel) worth considering?" />
            <QItem text="How should we interpret the fasting glucose and HbA1c trend together?" />
          </ul>
        </Section>

        {/* 8. Follow-up */}
        <Section number="8" title="Suggested Follow-Up / Retest Discussion">
          <ul className="space-y-2 text-sm">
            <li>
              <span className="font-medium">Week 6:</span>{" "}
              <span className="muted">Wearable and lifestyle trend review — sleep duration, HRV, resting heart rate, adherence to changes.</span>
            </li>
            <li>
              <span className="font-medium">Week 12:</span>{" "}
              <span className="muted">Lab review discussion — lipid panel with ApoB, HbA1c, hs-CRP, 25-OH Vitamin D, comprehensive metabolic panel.</span>
            </li>
          </ul>
        </Section>

        {/* 9. Safety */}
        <Section number="9" title="Safety & Scope">
          <p className="text-sm leading-relaxed">
            MediTwin is an educational decision-support prototype. It does not diagnose, treat, prescribe, or replace clinical judgment.
            All scores, projections, and discussion points are directional and intended to support — not substitute — a clinician conversation.
          </p>
        </Section>

        {/* Footer */}
        <div className="pt-4 border-t border-border/50 flex items-center justify-between text-[11px] muted">
          <span>Generated by MediTwin · {generatedDate}</span>
          <span>Prototype educational report</span>
        </div>
      </div>

      {/* Print-only footer */}
      <div className="print-footer hidden">
        Generated by MediTwin — educational prototype. Not for clinical decision-making.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="print-section">
      <div className="flex items-baseline gap-3 mb-3 border-b border-border/40 pb-2">
        <span className="text-[10px] font-mono text-[var(--neon-blue)] uppercase tracking-[0.25em]">{number}</span>
        <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="glass-soft rounded-lg p-3 print-card">
      <div className="text-[10px] uppercase tracking-wider muted">{k}</div>
      <div className="text-sm mt-0.5">{v}</div>
    </div>
  );
}

function PriorityItem({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="h-6 w-6 rounded-full glass-soft flex items-center justify-center text-[11px] font-mono text-[var(--neon-blue)] shrink-0 print-card">
        {n}
      </span>
      <span className="leading-snug pt-0.5">{text}</span>
    </li>
  );
}

function QItem({ text }: { text: string }) {
  return (
    <li className="flex gap-2">
      <FileText className="h-3.5 w-3.5 text-[var(--neon-blue)] shrink-0 mt-1" />
      <span>{text}</span>
    </li>
  );
}

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: string }> = {
    optimal: { label: "In range", tone: "text-foreground" },
    watch: { label: "Monitor", tone: "text-[var(--neon-orange)]" },
    priority: { label: "Discuss", tone: "text-[var(--neon-red)]" },
  };
  const s = map[status] || map.watch;
  return <span className={`text-[11px] uppercase tracking-wider ${s.tone}`}>{s.label}</span>;
}
