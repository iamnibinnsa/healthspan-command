import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTwin } from "@/lib/twin-context";
import {
  Upload, FileText, Sparkles, CheckCircle2,
  ArrowRight, ShieldCheck, FlaskConical, Layers, Compass,
} from "lucide-react";

export const Route = createFileRoute("/upload")({
  component: LabUpload,
});

const STAGES = [
  "Finding the important health signals…",
  "Grouping markers by body system…",
  "Building your digital twin map…",
  "Preparing your first insights…",
];

const HEALTH_SIGNAL_LINES = [
  "› reading 14 of 14 helpful health signals",
  "› comparing against trusted reference ranges (NHANES · ADA · AHA)",
  "› supporting six body systems: cognition, heart, metabolic, sleep, muscle, immune",
  "› sketching your estimated age gap…",
  "› almost ready to meet your twin",
];

const PREVIEW_STEPS = [
  { Icon: FlaskConical, label: "We organize your markers" },
  { Icon: Layers,       label: "We build your six-system twin" },
  { Icon: Compass,      label: "You explore next steps" },
];

function LabUpload() {
  const { setLabsLoaded } = useTwin();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const finishToTwin = () => {
    setLabsLoaded(true);
    navigate({ to: "/twin" });
  };

  const run = (label: string) => {
    setFileName(label);
    setProcessing(true);
    setStage(0);
    setDone(false);
    const stageMs = 850;
    [1, 2, 3, 4].forEach((i) => setTimeout(() => setStage(i), i * stageMs));
    // Brief celebration window, then auto-route to the Digital Twin Map.
    setTimeout(() => setDone(true), stageMs * 4 + 250);
    setTimeout(() => finishToTwin(), stageMs * 4 + 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">Add your labs</div>
      <h1 className="text-4xl font-display font-semibold mt-2 mb-2">Add your health signals</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl leading-relaxed">
        Upload a lab report or explore a sample. MediTwin will organize the numbers into simple
        body-system insights.
      </p>

      {/* Curiosity strip */}
      <div className="inline-flex items-center gap-2 text-[11px] font-mono text-[var(--neon-green)] mb-8">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="uppercase tracking-[0.2em]">Next unlock · your six-system body map</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>

      {!processing ? (
        <div className="space-y-6">
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) run(f.name); }}
            className="block glass rounded-3xl p-10 sm:p-12 border-2 border-dashed border-[var(--neon-blue)]/40 text-center cursor-pointer hover:neon-border-blue transition"
          >
            <input type="file" accept="application/pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) run(f.name); }}
            />
            <div className="h-16 w-16 mx-auto rounded-2xl glass flex items-center justify-center mb-4">
              <Upload className="h-7 w-7 text-[var(--neon-blue)]" />
            </div>
            <div className="font-display text-xl font-semibold">Drag & drop a PDF</div>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse &mdash; your file stays on this device for the demo
            </p>
          </label>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={() => run("alex_morgan_labs_2024.pdf")}
            className="w-full glass rounded-2xl p-5 sm:p-6 flex items-center gap-4 hover:neon-border-green transition group text-left"
          >
            <div className="h-12 w-12 rounded-xl bg-[var(--neon-green)]/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-[var(--neon-green)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-lg font-semibold">Try Alex&rsquo;s sample twin</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                See a complete demo in under 60 seconds
              </div>
            </div>
            <span className="text-xs font-semibold neon-text-green opacity-70 group-hover:opacity-100 transition whitespace-nowrap">
              Explore Sample Twin <ArrowRight className="inline h-3 w-3 ml-0.5" />
            </span>
          </button>

          {/* 3-step preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {PREVIEW_STEPS.map((s, i) => (
              <div
                key={s.label}
                className="glass-soft rounded-2xl p-4 flex items-start gap-3"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in oklab, var(--neon-blue) 6%, oklch(0.22 0.03 250 / 0.55)), oklch(0.22 0.03 250 / 0.55))",
                  border: "1px solid color-mix(in oklab, var(--neon-blue) 22%, transparent)",
                }}
              >
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: "color-mix(in oklab, var(--neon-blue) 14%, transparent)",
                    color: "var(--neon-blue)",
                  }}
                >
                  <s.Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--neon-blue)]">
                    Step {i + 1}
                  </div>
                  <div className="text-sm font-medium leading-snug mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Privacy / care note */}
          <div
            className="rounded-xl px-4 py-3 flex items-start gap-2 text-[12px] text-muted-foreground"
            style={{
              background: "oklch(0.22 0.03 250 / 0.55)",
              border: "1px solid color-mix(in oklab, var(--neon-green) 22%, transparent)",
            }}
          >
            <ShieldCheck className="h-4 w-4 text-[var(--neon-green)] mt-0.5 shrink-0" />
            <span>
              Prototype mode: files stay on this device. Your twin works with what you choose to share.
            </span>
          </div>
        </div>
      ) : done ? (
        <CelebrationCard onContinue={finishToTwin} />
      ) : (
        <div className="glass rounded-3xl p-8 space-y-6 relative overflow-hidden">
          <div className="relative h-44 rounded-2xl glass-soft overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-40" />
            <div className="absolute left-0 right-0 h-12 scan-beam" style={{ animationDuration: "2.4s" }} />
            <svg viewBox="0 0 200 100" className="absolute inset-0 h-full w-full">
              <g stroke="var(--neon-blue)" strokeWidth="0.6" fill="none" opacity="0.7">
                <circle cx="100" cy="22" r="10" />
                <path d="M100 32 L100 62 M85 42 L115 42 M88 80 L100 62 L112 80" />
                <circle cx="100" cy="22" r="14" strokeOpacity="0.3" />
                <circle cx="100" cy="22" r="18" strokeOpacity="0.15" />
              </g>
              {[
                [100, 22, "var(--neon-blue)"],
                [85, 42, "var(--neon-red)"],
                [115, 42, "var(--neon-orange)"],
                [100, 55, "var(--neon-green)"],
                [88, 80, "var(--neon-orange)"],
                [112, 80, "var(--neon-green)"],
              ].map(([cx, cy, c], i) => (
                <circle key={i} cx={cx as number} cy={cy as number} r="1.6" fill={c as string}>
                  <animate attributeName="r" values="1.2;2.6;1.2" dur="1.6s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                </circle>
              ))}
            </svg>
            <div className="absolute bottom-2 left-3 font-mono text-[10px] text-[var(--neon-blue)] uppercase tracking-[0.25em]">
              shaping your twin · live
            </div>
            <div className="absolute top-2 right-3 font-mono text-[10px] text-[var(--neon-green)]">
              ● signals connected
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-border/40 pb-3">
            <FileText className="h-4 w-4 text-[var(--neon-blue)]" />
            <span className="font-mono text-xs">{fileName}</span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              stage {Math.min(stage + 1, STAGES.length)} / {STAGES.length}
            </span>
          </div>

          <div className="space-y-2">
            {STAGES.map((s, i) => {
              const done = stage > i;
              const active = stage === i;
              return (
                <div key={s} className={`flex items-center gap-3 p-3 rounded-xl transition ${
                  active ? "glass neon-border-blue" : done ? "glass-soft" : "opacity-40"
                }`}>
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-[var(--neon-green)]" />
                  ) : (
                    <div className={`h-5 w-5 rounded-full border-2 border-[var(--neon-blue)] ${active ? "animate-spin border-t-transparent" : ""}`} />
                  )}
                  <span className="text-sm">{s}</span>
                </div>
              );
            })}
          </div>

          {/* What's happening? mini-explainer */}
          <div
            className="rounded-xl px-4 py-3 flex items-start gap-2.5 text-[12px] leading-relaxed"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--neon-blue) 9%, transparent), color-mix(in oklab, var(--neon-green) 6%, transparent))",
              border: "1px solid color-mix(in oklab, var(--neon-blue) 25%, transparent)",
            }}
          >
            <Sparkles className="h-4 w-4 text-[var(--neon-blue)] mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--neon-blue)] mb-1">
                What&rsquo;s happening?
              </div>
              <p className="text-muted-foreground">
                We&rsquo;re turning raw numbers into simpler patterns across metabolism, heart,
                inflammation, muscle, cognition, and recovery.
              </p>
            </div>
          </div>

          <div className="font-mono text-[10px] leading-relaxed border-t border-border/30 pt-3 space-y-0.5">
            {HEALTH_SIGNAL_LINES.slice(0, Math.min(stage + 2, HEALTH_SIGNAL_LINES.length)).map((t) => (
              <div key={t} className="text-[var(--neon-green)]/70">{t}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Celebration card shown briefly between processing and the Twin Map  */
/* ------------------------------------------------------------------ */

function CelebrationCard({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="glass rounded-3xl p-10 sm:p-12 text-center relative overflow-hidden neon-border-green">
      <div
        aria-hidden
        className="absolute -top-24 -right-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--neon-green)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--neon-blue)" }}
      />

      <div className="relative">
        <div className="mx-auto h-16 w-16 rounded-2xl glass flex items-center justify-center mb-4 relative">
          <Sparkles className="h-7 w-7 text-[var(--neon-green)]" />
          <span
            aria-hidden
            className="absolute inset-0 rounded-2xl animate-ping"
            style={{ border: "1px solid var(--neon-green)", opacity: 0.4 }}
          />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--neon-green)] mb-2">
          Twin profile complete
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-semibold">
          Twin ready <span aria-hidden>&#x2728;</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
          Your six body systems are synced. Let&rsquo;s take a tour of your map.
        </p>
        <button
          onClick={onContinue}
          className="mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-xl btn-hero text-sm font-semibold"
        >
          Meet My Twin Map <ArrowRight className="h-4 w-4" />
        </button>
        <div className="text-[10px] font-mono text-muted-foreground mt-3">
          Auto-routing in a moment…
        </div>
      </div>
    </div>
  );
}
