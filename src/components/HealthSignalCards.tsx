import { HeartPulse, Activity, Flame, Moon, Dumbbell, Sparkles, Leaf, HeartHandshake, MessageCircle } from "lucide-react";
import type { Biomarker } from "@/lib/mockData";

type Tone = "steady" | "watching" | "discuss";

const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  optimal: { label: "Looks steady", tone: "steady" },
  watch: { label: "Worth watching", tone: "watching" },
  priority: { label: "Discuss soon", tone: "discuss" },
};

const TONE_COLOR: Record<Tone, string> = {
  steady: "var(--friendly-mint)",
  watching: "var(--friendly-amber)",
  discuss: "var(--friendly-coral)",
};

const TONE_ICON = {
  steady: Sparkles,
  watching: Leaf,
  discuss: HeartHandshake,
} as const;

// Plain-language explanations per marker
const MARKER_COPY: Record<string, string> = {
  "ApoB": "Counts the cholesterol particles that can build up in arteries — lower is gentler over time.",
  "LDL-C": "The 'delivery' cholesterol carried to your tissues. Lower numbers usually mean a calmer trend.",
  "HDL-C": "The 'return-trip' cholesterol helper — higher levels tend to be supportive.",
  "Triglycerides": "Circulating fats from recent meals. Lower numbers point to steadier metabolism.",
  "HbA1c": "Your three-month average blood-sugar level — a slow-moving energy signal.",
  "Fasting Glucose": "Morning blood sugar before eating — a snapshot of your baseline.",
  "hs-CRP": "A gentle measure of background inflammation in the body.",
  "Vitamin D": "Supports immunity, mood, and bone strength. Easy to support with daylight or food.",
  "HRV": "How adaptable your nervous system is — higher usually means better recovery.",
  "Resting HR": "How hard your heart works at rest. Lower trends often reflect more cardio fitness.",
  "Sleep Duration": "Nightly restorative hours — the foundation most other systems rely on.",
  "VO2 max": "Your aerobic engine size — more capacity means more daily reserve.",
};

const GROUPS: { title: string; icon: typeof HeartPulse; markers: string[] }[] = [
  { title: "Heart & circulation", icon: HeartPulse, markers: ["ApoB", "LDL-C", "HDL-C", "Triglycerides"] },
  { title: "Blood sugar energy", icon: Activity, markers: ["HbA1c", "Fasting Glucose"] },
  { title: "Inflammation balance", icon: Flame, markers: ["hs-CRP", "Vitamin D"] },
  { title: "Recovery signals", icon: Moon, markers: ["HRV", "Resting HR", "Sleep Duration"] },
  { title: "Fitness capacity", icon: Dumbbell, markers: ["VO2 max"] },
];

function SignalChip({ b }: { b: Biomarker }) {
  const meta = STATUS_MAP[b.status] ?? STATUS_MAP.watch;
  const color = TONE_COLOR[meta.tone];
  const Icon = TONE_ICON[meta.tone];
  return (
    <div
      className="rounded-xl p-3.5 transition hover:translate-y-[-1px]"
      style={{
        background: `color-mix(in oklab, ${color} 7%, transparent)`,
        border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{b.name}</div>
          <div className="font-display text-xl mt-0.5">
            {b.value}
            <span className="text-[11px] text-muted-foreground font-sans ml-1">{b.unit}</span>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold shrink-0"
          style={{
            color,
            border: `1px solid color-mix(in oklab, ${color} 45%, transparent)`,
            background: `color-mix(in oklab, ${color} 12%, transparent)`,
          }}
        >
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
      </div>
      <p className="text-[12px] leading-relaxed text-muted-foreground mt-2">
        {MARKER_COPY[b.name] ?? "A signal your twin tracks over time."}
      </p>
      {meta.tone === "discuss" && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px]" style={{ color }}>
          <MessageCircle className="h-3 w-3" /> Ask my clinician
        </div>
      )}
    </div>
  );
}

export function HealthSignalCards({ biomarkers }: { biomarkers: Biomarker[] }) {
  const byName = new Map(biomarkers.map((b) => [b.name, b]));
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Your key health signals</h2>
          <p className="text-[12px] text-muted-foreground mt-1 max-w-2xl">
            We grouped your lab markers into simple signals so you can understand what to ask about next.
          </p>
        </div>
        {/* Signal Guide legend */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          {(["steady", "watching", "discuss"] as Tone[]).map((t) => {
            const Icon = TONE_ICON[t];
            const color = TONE_COLOR[t];
            const label =
              t === "steady"
                ? "Steady · aligned with demo target"
                : t === "watching"
                  ? "Worth watching · track over time"
                  : "Discuss soon · bring up with a clinician";
            return (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  color,
                  border: `1px solid color-mix(in oklab, ${color} 35%, transparent)`,
                  background: `color-mix(in oklab, ${color} 8%, transparent)`,
                }}
              >
                <Icon className="h-3 w-3" />
                {label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {GROUPS.map((g) => {
          const items = g.markers.map((n) => byName.get(n)).filter(Boolean) as Biomarker[];
          if (!items.length) return null;
          return (
            <div key={g.title} className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center"
                  style={{ background: "color-mix(in oklab, var(--friendly-teal) 15%, transparent)" }}
                >
                  <g.icon className="h-4 w-4" style={{ color: "var(--friendly-teal)" }} />
                </div>
                <div>
                  <div className="font-display text-base font-semibold leading-tight">{g.title}</div>
                  <div className="text-[10px] text-muted-foreground">{items.length} signal{items.length > 1 ? "s" : ""}</div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {items.map((b) => (
                  <SignalChip key={b.name} b={b} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
