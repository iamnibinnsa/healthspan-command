import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import {
  Activity, HeartPulse, Flame, Dumbbell, Brain, Moon, AlertTriangle, ArrowRight,
} from "lucide-react";
import { useTwin } from "@/lib/twin-context";
import {
  INITIAL_DOMAINS, INITIAL_BIO_AGE_GAP, SAMPLE_BIOMARKERS, projectScores, statusColor,
} from "@/lib/mockData";
import { HealthGauge } from "@/components/HealthGauge";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const ICONS = { Activity, HeartPulse, Flame, Dumbbell, Brain, Moon } as const;

function Dashboard() {
  const { interventions, intake } = useTwin();
  const projected = projectScores(interventions);
  const domains = INITIAL_DOMAINS.map((d) => ({ ...d, score: projected.domains[d.key] }));

  const radarData = domains.map((d) => ({ domain: d.short, score: d.score, fullMark: 100 }));
  const bottlenecks = [...domains].sort((a, b) => a.score - b.score).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">
            Mission Control · {intake.name}
          </div>
          <h1 className="text-4xl font-display font-semibold mt-1">Healthspan Mission Control</h1>
        </div>
        <Link to="/simulator" className="px-4 py-2 rounded-lg btn-hero text-xs font-semibold inline-flex items-center gap-2">
          Open Simulator <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Top row */}
      <div className="grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 glass rounded-2xl p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Overall Healthspan Score</div>
          <HealthGauge score={projected.healthspan} />
          <div className="text-center text-xs text-muted-foreground -mt-2">Projected directional estimate</div>
        </div>

        <div className="lg:col-span-3 glass rounded-2xl p-6 flex flex-col justify-between">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Biological Age Gap</div>
          <div className="py-4">
            <div className="font-display text-6xl neon-text-orange">+{projected.bioAgeGap}</div>
            <div className="text-xs text-muted-foreground mt-1">
              years vs chronological ({intake.age})
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Started at +{INITIAL_BIO_AGE_GAP} years. Simulate interventions to project change.
          </div>
        </div>

        <div className="lg:col-span-5 glass rounded-2xl p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Top 3 healthspan bottlenecks</div>
          <div className="space-y-3">
            {bottlenecks.map((b) => (
              <div key={b.key} className="flex items-center gap-3 p-3 rounded-xl glass-soft">
                <AlertTriangle className="h-4 w-4 text-[var(--neon-orange)]" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{b.label}</div>
                  <div className="text-[11px] text-muted-foreground">{b.drivers.join(" · ")}</div>
                </div>
                <div className="font-mono text-sm neon-text-orange">{b.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Radar + system cards */}
      <div className="grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 glass rounded-2xl p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Six-domain twin map</div>
          <div className="h-80">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="oklch(0.5 0.05 230 / 0.4)" />
                <PolarAngleAxis dataKey="domain" tick={{ fill: "oklch(0.85 0.02 230)", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="var(--neon-blue)" fill="var(--neon-blue)" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
          {domains.map((d) => {
            const Icon = ICONS[d.icon as keyof typeof ICONS] ?? Activity;
            const color = d.score >= 75 ? "neon-green" : d.score >= 60 ? "neon-blue" : "neon-orange";
            return (
              <div key={d.key} className={`glass rounded-2xl p-5 hover:neon-border-${color} transition`}>
                <div className="flex items-start justify-between">
                  <div className={`h-10 w-10 rounded-xl bg-[var(--${color})]/15 flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 text-[var(--${color})]`} />
                  </div>
                  <div className={`font-display text-3xl text-[var(--${color})]`}>{d.score}</div>
                </div>
                <div className="mt-3 font-display font-semibold">{d.label}</div>
                <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                  {d.drivers.join(" · ")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Biomarkers */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Biomarker flags</div>
          <span className="text-[11px] text-muted-foreground">12 markers analyzed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground text-left">
                <th className="py-2 font-medium">Marker</th>
                <th className="py-2 font-medium">Value</th>
                <th className="py-2 font-medium">Optimal</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_BIOMARKERS.map((b) => {
                const c = statusColor(b.status);
                return (
                  <tr key={b.name} className="border-t border-border/40">
                    <td className="py-3 font-medium">{b.name}</td>
                    <td className="py-3 font-mono">{b.value} <span className="text-muted-foreground text-xs">{b.unit}</span></td>
                    <td className="py-3 text-muted-foreground">{b.optimal}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--${c})]`}>
                        <span className={`h-2 w-2 rounded-full bg-[var(--${c})]`} />
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{b.note ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-end">
        <Link to="/twin" className="px-5 py-2.5 rounded-lg glass text-sm font-semibold">Open Digital Twin Map</Link>
        <Link to="/simulator" className="px-5 py-2.5 rounded-lg btn-hero text-sm font-semibold">What-If Simulator</Link>
      </div>
    </div>
  );
}
