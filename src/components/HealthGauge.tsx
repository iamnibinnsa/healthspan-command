import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from "recharts";

export function HealthGauge({ score, label = "Healthspan" }: { score: number; label?: string }) {
  const color =
    score >= 75 ? "var(--neon-green)" : score >= 60 ? "var(--neon-blue)" : score >= 45 ? "var(--neon-orange)" : "var(--neon-red)";
  const data = [{ name: "score", value: score, fill: color }];
  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer>
        <RadialBarChart innerRadius="78%" outerRadius="100%" data={data} startAngle={220} endAngle={-40}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "oklch(0.3 0.04 250 / 0.5)" }} dataKey="value" cornerRadius={20} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-display font-bold" style={{ color, textShadow: `0 0 20px ${color}` }}>
          {score}
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}
