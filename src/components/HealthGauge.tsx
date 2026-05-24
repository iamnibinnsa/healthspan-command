import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from "recharts";

export function HealthGauge({ score, label = "Healthspan" }: { score: number; label?: string }) {
  const color =
    score >= 75 ? "var(--neon-green)" : score >= 60 ? "var(--neon-blue)" : score >= 45 ? "var(--neon-orange)" : "var(--neon-coral)";
  const data = [{ name: "score", value: score, fill: color }];
  const status =
    score >= 75 ? "GLOWING"
    : score >= 60 ? "ON TRACK"
    : score >= 45 ? "WORTH A LOOK"
    : "DISCUSS SOON";

  return (
    <div className="relative h-64 w-full">
      {/* outer pulsing ring */}
      <div
        className="absolute inset-2 rounded-full border opacity-20 animate-pulse"
        style={{ borderColor: color }}
      />
      {/* tick marks */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90 opacity-60">
        {Array.from({ length: 40 }).map((_, i) => {
          const angle = (i / 40) * Math.PI * 1.5 - Math.PI * 0.25;
          const x1 = 50 + Math.cos(angle) * 46;
          const y1 = 50 + Math.sin(angle) * 46;
          const x2 = 50 + Math.cos(angle) * 49;
          const y2 = 50 + Math.sin(angle) * 49;
          const lit = i / 40 <= score / 100;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={lit ? color : "oklch(0.4 0.04 250 / 0.5)"}
              strokeWidth={0.8}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <ResponsiveContainer>
        <RadialBarChart innerRadius="72%" outerRadius="86%" data={data} startAngle={220} endAngle={-40}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "oklch(0.3 0.04 250 / 0.35)" }} dataKey="value" cornerRadius={20} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[9px] font-mono uppercase tracking-[0.35em] text-muted-foreground">{label}</div>
        <div className="text-6xl font-display font-bold leading-none mt-1" style={{ color, textShadow: `0 0 28px ${color}` }}>
          {score}
        </div>
        <div className="text-[10px] font-mono mt-2 px-2 py-0.5 rounded-full border" style={{ color, borderColor: color, background: `color-mix(in oklab, ${color} 8%, transparent)` }}>
          {status}
        </div>
      </div>
    </div>
  );
}
