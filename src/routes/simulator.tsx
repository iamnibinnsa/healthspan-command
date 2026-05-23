import { createFileRoute, Link } from "@tanstack/react-router";
import { useTwin } from "@/lib/twin-context";
import {
  INITIAL_DOMAINS, INITIAL_BIO_AGE_GAP, INTERVENTIONS, projectScores,
} from "@/lib/mockData";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Legend, Tooltip,
  ReferenceLine, Cell,
} from "recharts";
import { Check, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

export const Route = createFileRoute("/simulator")({
  component: Simulator,
});

function Simulator() {
  const { interventions, toggleIntervention, setInterventions } = useTwin();
  const proj = projectScores(interventions);

  const chartData = INITIAL_DOMAINS.map((d) => ({
    name: d.short,
    Baseline: proj.baselineDomains[d.key],
    Projected: proj.domains[d.key],
    delta: proj.domains[d.key] - proj.baselineDomains[d.key],
  }));

  const healthDelta = proj.healthspan - proj.baselineHealthspan;
  const gapDelta = +(proj.bioAgeGap - INITIAL_BIO_AGE_GAP).toFixed(1);

  const selectAll = () => setInterventions(INTERVENTIONS.map((i) => i.id));
  const reset = () => setInterventions([]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">What-If Engine</div>
          <h1 className="text-4xl font-display font-semibold mt-1">Healthspan Simulator</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Toggle interventions to model directional changes to your six domain scores,
            overall Healthspan Score, and Biological Age Gap.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={selectAll} className="px-3 py-1.5 rounded-lg glass-soft text-xs">Select all</button>
          <button onClick={reset} className="px-3 py-1.5 rounded-lg glass-soft text-xs">Reset</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Kpi
          label="Healthspan Score"
          base={proj.baselineHealthspan}
          value={proj.healthspan}
          delta={healthDelta}
          unit=""
          color="neon-blue"
          higherIsBetter
        />
        <Kpi
          label="Biological Age Gap"
          base={INITIAL_BIO_AGE_GAP}
          value={proj.bioAgeGap}
          delta={gapDelta}
          unit=" yr"
          color="neon-orange"
        />
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Active interventions</div>
          <div className="font-display text-5xl neon-text-green mt-2 flex items-baseline gap-1">
            {interventions.length}
            <span className="text-2xl text-muted-foreground">/{INTERVENTIONS.length}</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 italic">
            Projected directional estimate — not a clinical prediction.
          </div>
          <Sparkles className="absolute -right-3 -bottom-3 h-20 w-20 text-[var(--neon-green)]/10" />
        </div>
      </div>

      {/* Interventions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {INTERVENTIONS.map((i) => {
          const active = interventions.includes(i.id);
          const effectList = Object.entries(i.effects)
            .map(([k, v]) => `+${v} ${k}`)
            .join(" · ");
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
              <div className="text-[10px] font-mono text-[var(--neon-blue)] mt-2 leading-relaxed">{effectList}</div>
            </button>
          );
        })}
      </div>

      {/* Before/After chart */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Before vs Projected — domain scores</div>
            <div className="font-display text-lg mt-1">Six-domain telemetry shift</div>
          </div>
          <div className="text-[11px] text-muted-foreground italic">
            Projected directional estimate, not a clinical prediction.
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={chartData} barGap={6}>
              <defs>
                <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.55 0.06 230)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="oklch(0.4 0.05 230)" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="projectedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--neon-green)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--neon-blue)" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.4 0.05 230 / 0.2)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "oklch(0.85 0.02 230)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "oklch(0.7 0.02 230)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "oklch(0.5 0.05 230 / 0.08)" }}
                contentStyle={{
                  background: "oklch(0.2 0.03 250 / 0.95)",
                  border: "1px solid oklch(0.4 0.05 230 / 0.4)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number, name) => [`${v}`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={75} stroke="var(--neon-green)" strokeDasharray="3 4" strokeOpacity={0.4} label={{ value: "optimal", fill: "var(--neon-green)", fontSize: 10, position: "right" }} />
              <Bar dataKey="Baseline" fill="url(#baselineGrad)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Projected" fill="url(#projectedGrad)" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fillOpacity={entry.delta > 0 ? 1 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-domain delta strip */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-5">
          {chartData.map((d) => (
            <div key={d.name} className="glass-soft rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.name}</div>
              <div className="font-mono text-sm mt-0.5">
                {d.Baseline} → <span className="text-[var(--neon-green)]">{d.Projected}</span>
              </div>
              <div className={`text-[10px] font-mono ${d.delta > 0 ? "text-[var(--neon-green)]" : "text-muted-foreground"}`}>
                {d.delta > 0 ? `+${d.delta}` : d.delta} pts
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link to="/plan" className="px-5 py-2.5 rounded-lg btn-hero text-sm font-semibold">Generate 90-Day Plan →</Link>
      </div>
    </div>
  );
}

function Kpi({
  label, base, value, delta, unit, color, higherIsBetter,
}: {
  label: string; base: number; value: number; delta: number;
  unit: string; color: string; higherIsBetter?: boolean;
}) {
  const good = higherIsBetter ? delta > 0 : delta < 0;
  const TrendIcon = delta === 0 ? null : higherIsBetter ? (delta > 0 ? TrendingUp : TrendingDown) : (delta < 0 ? TrendingDown : TrendingUp);
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display text-5xl text-[var(--${color})] mt-2`}>{value}{unit}</div>
      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
        Baseline {base}{unit}
        {delta !== 0 && (
          <span className={`inline-flex items-center gap-0.5 font-mono ${good ? "text-[var(--neon-green)]" : "text-[var(--neon-red)]"}`}>
            {TrendIcon && <TrendIcon className="h-3 w-3" />}
            {delta > 0 ? "+" : ""}{Number(delta.toFixed(1))}{unit}
          </span>
        )}
      </div>
    </div>
  );
}
