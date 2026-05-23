import { createFileRoute } from "@tanstack/react-router";
import { useTwin } from "@/lib/twin-context";
import { INITIAL_DOMAINS, INTERVENTIONS, SAMPLE_BIOMARKERS, projectScores, statusColor } from "@/lib/mockData";
import { Download, FileText } from "lucide-react";

export const Route = createFileRoute("/report")({
  component: Report,
});

function Report() {
  const { intake, interventions } = useTwin();
  const proj = projectScores(interventions);
  const flagged = SAMPLE_BIOMARKERS.filter((b) => b.status !== "optimal");
  const bottlenecks = [...INITIAL_DOMAINS]
    .map((d) => ({ ...d, score: proj.domains[d.key] }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
  const active = INTERVENTIONS.filter((i) => interventions.includes(i.id));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">Doctor / Longevity Coach Brief</div>
          <h1 className="text-4xl font-display font-semibold mt-1">Clinical brief</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg btn-hero text-xs font-semibold"
        >
          <Download className="h-3.5 w-3.5" /> Export PDF
        </button>
      </div>

      <div className="glass rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-border/50">
          <div className="h-12 w-12 rounded-xl glass flex items-center justify-center">
            <FileText className="h-5 w-5 text-[var(--neon-blue)]" />
          </div>
          <div>
            <div className="font-display text-xl font-semibold">{intake.name}</div>
            <div className="text-xs text-muted-foreground">Age {intake.age} · {intake.sex} · MediTwin Healthspan Brief</div>
          </div>
        </div>

        <Section title="Profile summary">
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <Kv k="Healthspan score" v={String(proj.healthspan)} />
            <Kv k="Biological age gap" v={`+${proj.bioAgeGap} yr`} />
            <Kv k="Sleep (intake)" v={`${intake.sleepHours} hr`} />
            <Kv k="Exercise" v={`${intake.exerciseFreq} days/wk`} />
            <Kv k="Stress" v={`${intake.stress}/10`} />
            <Kv k="Family history" v={intake.familyHistory.join(", ") || "—"} />
          </div>
        </Section>

        <Section title="Biomarker flags">
          <div className="space-y-2">
            {flagged.map((b) => {
              const c = statusColor(b.status);
              return (
                <div key={b.name} className="flex items-center gap-3 text-sm">
                  <span className={`h-2 w-2 rounded-full bg-[var(--${c})]`} />
                  <span className="font-medium w-40">{b.name}</span>
                  <span className="font-mono w-32">{b.value} {b.unit}</span>
                  <span className="text-muted-foreground text-xs">target {b.optimal}</span>
                  <span className={`ml-auto text-[10px] uppercase tracking-wider text-[var(--${c})]`}>{b.status}</span>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Domain scores (projected)">
          <div className="grid sm:grid-cols-3 gap-3">
            {INITIAL_DOMAINS.map((d) => (
              <div key={d.key} className="glass-soft rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm">{d.short}</span>
                <span className="font-display text-lg">{proj.domains[d.key]}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Top healthspan bottlenecks">
          <ul className="space-y-1.5 text-sm">
            {bottlenecks.map((b) => (
              <li key={b.key}>• <span className="font-medium">{b.label}</span> — score {b.score}; drivers: {b.drivers.join(", ")}.</li>
            ))}
          </ul>
        </Section>

        <Section title="Selected interventions">
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No interventions selected.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {active.map((i) => <li key={i.id}>✓ {i.label} <span className="text-xs text-muted-foreground">({i.category})</span></li>)}
            </ul>
          )}
        </Section>

        <Section title="Retest plan">
          <p className="text-sm text-muted-foreground">
            Week 12: comprehensive metabolic panel, advanced lipid panel including ApoB, hs-CRP,
            25-OH Vitamin D, HbA1c. Wearable trend review at week 6.
          </p>
        </Section>

        <Section title="Physician discussion items">
          <ul className="space-y-1.5 text-sm">
            <li>• ApoB target and pharmacologic strategy if remains &gt; 90.</li>
            <li>• Vitamin D dosing and recheck cadence.</li>
            <li>• Sleep apnea screening given short sleep, low HRV, elevated RHR.</li>
            <li>• Cardiovascular imaging (e.g., CAC) given family history.</li>
          </ul>
        </Section>

        <div className="text-[11px] text-muted-foreground italic border-t border-border/50 pt-4">
          MediTwin is an educational decision-support prototype. It does not diagnose, treat, or
          prescribe. All numbers are projected directional estimates and require clinician review.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--neon-blue)] mb-3">{title}</div>
      {children}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="glass-soft rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="font-display text-lg mt-1">{v}</div>
    </div>
  );
}
