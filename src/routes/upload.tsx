import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTwin } from "@/lib/twin-context";
import { Upload, FileText, Sparkles, CheckCircle2, ListTree, LayoutGrid, Compass } from "lucide-react";
import { TrustNote } from "@/components/TrustNote";

export const Route = createFileRoute("/upload")({
  component: LabUpload,
});

const STAGES = [
  "Finding the important health signals...",
  "Grouping markers by body system...",
  "Building your digital twin map...",
  "Preparing your first insights...",
];

const TELEMETRY = [
  "› parser.ocr.engine = lovable/lab-v3",
  "› signals.found = 14 / 14",
  "› reference.frame = NHANES + ADA + AHA",
  "› twin.systems.built = cognition, heart, metabolism, sleep, muscle, inflammation",
  "› bio_age.delta = computing…",
  "› projection.engine = directional-estimate v0.4",
];

const PREVIEW_STEPS = [
  { icon: <ListTree className="h-4 w-4" />, title: "We organize your markers", tone: "var(--friendly-teal)" },
  { icon: <LayoutGrid className="h-4 w-4" />, title: "We build your six-system twin", tone: "var(--friendly-sky)" },
  { icon: <Compass className="h-4 w-4" />, title: "You explore next steps", tone: "var(--friendly-mint)" },
];

function LabUpload() {
  const { setLabsLoaded } = useTwin();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const run = (label: string) => {
    setFileName(label);
    setProcessing(true);
    setStage(0);
    setDone(false);
    const stageMs = 850;
    [1, 2, 3, 4].forEach((i) => setTimeout(() => setStage(i), i * stageMs));
    setTimeout(() => {
      setLabsLoaded(true);
      setDone(true);
    }, stageMs * 4 + 300);
    setTimeout(() => {
      navigate({ to: "/twin" });
    }, stageMs * 4 + 1800);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
      <div className="text-[11px] font-mono uppercase tracking-[0.3em]" style={{ color: "var(--friendly-teal)" }}>
        Quest · Step 2 of 4
      </div>
      <h1 className="text-4xl font-display font-semibold mt-2 mb-2">Add your health signals</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xl">
        Upload a lab report or explore a sample. MediTwin will organize the numbers into simple body-system insights.
      </p>

      {!processing ? (
        <div className="space-y-6">
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) run(f.name); }}
            className="block glass rounded-3xl p-10 sm:p-12 border-2 border-dashed text-center cursor-pointer transition hover:-translate-y-0.5"
            style={{ borderColor: "color-mix(in oklab, var(--friendly-teal) 45%, transparent)" }}
          >
            <input type="file" accept="application/pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) run(f.name); }}
            />
            <div
              className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "color-mix(in oklab, var(--friendly-teal) 14%, transparent)",
                color: "var(--friendly-teal)",
              }}
            >
              <Upload className="h-7 w-7" />
            </div>
            <div className="font-display text-xl font-semibold">Drag & drop a PDF</div>
            <p className="text-sm text-muted-foreground mt-1">or click to browse — we process locally for the demo</p>
          </label>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={() => run("alex_morgan_labs_2024.pdf")}
            className="w-full glass rounded-2xl p-5 flex items-center gap-4 transition group hover:-translate-y-0.5"
            style={{
              border: "1px solid color-mix(in oklab, var(--friendly-mint) 40%, transparent)",
              boxShadow: "0 10px 40px -24px color-mix(in oklab, var(--friendly-mint) 70%, transparent)",
            }}
          >
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "color-mix(in oklab, var(--friendly-mint) 18%, transparent)",
                color: "var(--friendly-mint)",
              }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="font-display text-lg font-semibold">Try Alex's sample twin</div>
              <div className="text-xs text-muted-foreground mt-0.5">See a complete demo in under 60 seconds</div>
            </div>
            <span
              className="text-xs font-mono uppercase tracking-wider opacity-70 group-hover:opacity-100 transition shrink-0"
              style={{ color: "var(--friendly-mint)" }}
            >
              Explore Sample Twin →
            </span>
          </button>

          {/* 3-step preview */}
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            {PREVIEW_STEPS.map((s, i) => (
              <div
                key={s.title}
                className="rounded-2xl p-4 glass-soft"
                style={{ border: `1px solid color-mix(in oklab, ${s.tone} 22%, transparent)` }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center"
                    style={{ background: `color-mix(in oklab, ${s.tone} 18%, transparent)`, color: s.tone }}
                  >
                    {s.icon}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: s.tone }}>
                    Step {i + 1}
                  </div>
                </div>
                <div className="mt-2 text-sm font-display font-semibold leading-snug">{s.title}</div>
              </div>
            ))}
          </div>

          <div
            className="text-center text-[12px] font-mono uppercase tracking-[0.2em]"
            style={{ color: "var(--friendly-sky)" }}
          >
            ✨ Next unlock: your six-system body map
          </div>

          <TrustNote>
            Prototype mode: files are used only to populate the demo experience.
          </TrustNote>
        </div>
      ) : (
        <div className="glass rounded-3xl p-8 space-y-6 relative overflow-hidden">
          {/* Scanner visualization — preserved */}
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
                [85, 42, "var(--friendly-teal)"],
                [115, 42, "var(--friendly-sky)"],
                [100, 55, "var(--friendly-mint)"],
                [88, 80, "var(--friendly-amber)"],
                [112, 80, "var(--friendly-violet)"],
              ].map(([cx, cy, c], i) => (
                <circle key={i} cx={cx as number} cy={cy as number} r="1.6" fill={c as string}>
                  <animate attributeName="r" values="1.2;2.6;1.2" dur="1.6s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                </circle>
              ))}
            </svg>
            <div className="absolute bottom-2 left-3 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--friendly-teal)" }}>
              twin.scan · live
            </div>
            <div className="absolute top-2 right-3 font-mono text-[10px]" style={{ color: "var(--friendly-mint)" }}>
              ● signal locked
            </div>
          </div>

          {/* What's happening explainer */}
          <div
            className="rounded-2xl p-4 text-[13px] leading-relaxed"
            style={{
              background: "color-mix(in oklab, var(--friendly-teal) 6%, transparent)",
              border: "1px solid color-mix(in oklab, var(--friendly-teal) 22%, transparent)",
            }}
          >
            <div className="text-[11px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--friendly-teal)" }}>
              What's happening?
            </div>
            We're turning raw numbers into simpler patterns across metabolism, heart, inflammation, muscle, cognition, and recovery.
          </div>

          <div className="flex items-center gap-3 border-b border-border/40 pb-3">
            <FileText className="h-4 w-4" style={{ color: "var(--friendly-teal)" }} />
            <span className="font-mono text-xs">{fileName}</span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              milestone {Math.min(stage + 1, STAGES.length)} / {STAGES.length}
            </span>
          </div>

          <div className="space-y-2">
            {STAGES.map((s, i) => {
              const isDone = stage > i;
              const active = stage === i;
              return (
                <div key={s} className={`flex items-center gap-3 p-3 rounded-xl transition ${
                  active ? "glass neon-border-blue" : isDone ? "glass-soft" : "opacity-40"
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5" style={{ color: "var(--friendly-mint)" }} />
                  ) : (
                    <div
                      className={`h-5 w-5 rounded-full border-2 ${active ? "animate-spin border-t-transparent" : ""}`}
                      style={{ borderColor: "var(--friendly-teal)" }}
                    />
                  )}
                  <span className="text-sm">{s}</span>
                </div>
              );
            })}
          </div>

          <div className="font-mono text-[10px] leading-relaxed border-t border-border/30 pt-3 space-y-0.5">
            {TELEMETRY.slice(0, Math.min(stage + 2, TELEMETRY.length)).map((t) => (
              <div key={t} style={{ color: "color-mix(in oklab, var(--friendly-mint) 70%, transparent)" }}>{t}</div>
            ))}
          </div>

          {done && (
            <div
              className="rounded-2xl p-5 text-center animate-fade-in"
              style={{
                background: "color-mix(in oklab, var(--friendly-mint) 12%, transparent)",
                border: "1px solid color-mix(in oklab, var(--friendly-mint) 40%, transparent)",
                boxShadow: "0 0 40px -10px color-mix(in oklab, var(--friendly-mint) 60%, transparent)",
              }}
            >
              <div className="text-2xl font-display font-semibold" style={{ color: "var(--friendly-mint)" }}>
                Twin ready ✨
              </div>
              <button
                onClick={() => navigate({ to: "/twin" })}
                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-hero text-sm font-semibold"
              >
                Meet My Twin Map →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
