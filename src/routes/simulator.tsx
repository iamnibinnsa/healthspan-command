import { createFileRoute, Link } from "@tanstack/react-router";
import { useTwin } from "@/lib/twin-context";
import {
  INITIAL_DOMAINS, INITIAL_HEALTHSPAN, INITIAL_BIO_AGE_GAP, INTERVENTIONS, projectScores,
} from "@/lib/mockData";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Legend, Tooltip } from "recharts";
import { Check } from "lucide-react";

export const Route = createFileRoute("/simulator")({
  component: Simulator,
});

function Simulator() {
  const { interventions, toggleIntervention, setInterventions } = useTwin();
  const proj = projectScores(interventions);

  const chartData = INITIAL_DOMAINS.map((d) => ({
    name: d.short,
    Baseline: d.score,
    Projected: proj.domains[d.key],
  }));

  const selectAll = () => setInterventions(INTERVENTIONS.map((i) => i.id));
  const reset = () => setInterventions([]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">What-If Engine</div>
          <h1 className="text-4xl font-display font-semibold mt-1">Healthspan Simulator</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Toggle interventions to project directional changes to your healthspan score, biological age gap, and six domain scores.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={selectAll} className="px-3 py-1.5 rounded-lg glass-soft text-xs">Select all</button>
          <button onClick={reset} className="px-3 py-1.5 rounded-lg glass-soft text-xs">Reset</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Kpi label="Healthspan Score" base={INITIAL_HEALTHSPAN} value={proj.healthspan} unit="" color="neon-blue" higher />
        <Kpi label="Biological Age Gap" base={INITIAL_BIO_AGE_GAP} value={proj.bioAgeGap} unit=" yr" color="neon-orange" />
        <div className="glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Active interventions</div>
          <div className="font-display text-5xl neon-text-green mt-2">{interventions.length}<span className="text-2xl text-muted-foreground">/{INTERVENTIONS.length}</span></div>
          <div className="text-[11px] text-muted-foreground mt-2">Projected directional estimate — not a clinical prediction.</div>
        </div>
      </div>

      {/* Interventions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {INTERVENTIONS.map((i) => {
          const active = interventions.includes(i.id);
          return (
            <button
              key={i.id}
              onClick={() => toggleIntervention(i.id)}
              className={`text-left rounded-2xl p-5 transition border ${
                active
                  ? "glass neon-border-green border-transparent"
                  : "glass-soft border-transparent hover:neon-border-blue"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{i.category}</span>
                <div className={`h-5 w-5 rounded-md flex items-center justify-center ${active ? "bg-[var(--neon-green)] text-[oklch(0.12_0.03_250)]" : "border border-border"}`}>
                  {active && <Check className="h-3 w-3" />}
                </div>
              </div>
              <div className="font-display font-semibold leading-snug">{i.label}</div>
              <div className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{i.description}</div>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="glass rounded-2xl p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Before vs Projected — domain scores</div>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={chartData} barGap={6}>
              <CartesianGrid stroke="oklch(0.4 0.05 230 / 0.25)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "oklch(0.85 0.02 230)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "oklch(0.7 0.02 230)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "oklch(0.2 0.03 250 / 0.95)", border: "1px solid oklch(0.4 0.05 230 / 0.4)", borderRadius: 12, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Baseline" fill="oklch(0.5 0.05 230)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Projected" fill="var(--neon-green)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link to="/plan" className="px-5 py-2.5 rounded-lg btn-hero text-sm font-semibold">Generate 90-Day Plan →</Link>
      </div>
    </div>
  );
}

function Kpi({ label, base, value, unit, color, higher }: { label: string; base: number; value: number; unit: string; color: string; higher?: boolean }) {
  const delta = value - base;
  const good = higher ? delta > 0 : delta < 0;
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display text-5xl text-[var(--${color})] mt-2`}>{value}{unit}</div>
      <div className="text-[11px] text-muted-foreground mt-1">
        Baseline {base}{unit} ·{" "}
        <span className={good ? "text-[var(--neon-green)]" : delta === 0 ? "" : "text-[var(--neon-red)]"}>
          {delta > 0 ? "+" : ""}{Number(delta.toFixed(1))}{unit}
        </span>
      </div>
    </div>
  );
}
