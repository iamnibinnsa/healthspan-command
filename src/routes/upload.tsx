import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTwin } from "@/lib/twin-context";
import { Upload, FileText, Sparkles, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/upload")({
  component: LabUpload,
});

const STAGES = [
  "Extracting biomarkers from PDF…",
  "Normalizing lab values against reference ranges…",
  "Modeling six-system digital twin…",
  "Compiling healthspan telemetry…",
];

const TELEMETRY = [
  "› parser.ocr.engine = lovable/lab-v3",
  "› markers.detected = 14 / 14",
  "› reference.frame = NHANES + ADA + AHA",
  "› twin.systems.built = cognitive, cardio, metabolic, sleep, muscle, inflammation",
  "› bio_age.delta = computing…",
  "› projection.engine = directional-estimate v0.4",
];

function LabUpload() {
  const { setLabsLoaded } = useTwin();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const run = (label: string) => {
    setFileName(label);
    setProcessing(true);
    setStage(0);
    const stageMs = 850;
    [1, 2, 3, 4].forEach((i) => setTimeout(() => setStage(i), i * stageMs));
    setTimeout(() => {
      setLabsLoaded(true);
      navigate({ to: "/dashboard" });
    }, stageMs * 4 + 400);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">Lab intake</div>
      <h1 className="text-4xl font-display font-semibold mt-2 mb-2">Upload your lab report</h1>
      <p className="text-sm text-muted-foreground mb-8">We extract markers, normalize them, and build your twin in seconds.</p>

      {!processing ? (
        <div className="space-y-6">
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) run(f.name); }}
            className="block glass rounded-3xl p-12 border-2 border-dashed border-[var(--neon-blue)]/40 text-center cursor-pointer hover:neon-border-blue transition"
          >
            <input type="file" accept="application/pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) run(f.name); }}
            />
            <div className="h-16 w-16 mx-auto rounded-2xl glass flex items-center justify-center mb-4">
              <Upload className="h-7 w-7 text-[var(--neon-blue)]" />
            </div>
            <div className="font-display text-xl font-semibold">Drag & drop a PDF</div>
            <p className="text-sm text-muted-foreground mt-1">or click to browse · we process locally for the demo</p>
          </label>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={() => run("alex_morgan_labs_2024.pdf")}
            className="w-full glass rounded-2xl p-6 flex items-center gap-4 hover:neon-border-green transition group"
          >
            <div className="h-12 w-12 rounded-xl bg-[var(--neon-green)]/15 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[var(--neon-green)]" />
            </div>
            <div className="text-left flex-1">
              <div className="font-display text-lg font-semibold">Use Sample Lab Report</div>
              <div className="text-xs text-muted-foreground">Alex Morgan · 48 · comprehensive metabolic + lipid panel</div>
            </div>
            <span className="text-xs neon-text-green opacity-0 group-hover:opacity-100 transition">Load →</span>
          </button>
        </div>
      ) : (
        <div className="glass rounded-3xl p-10 space-y-6">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[var(--neon-blue)]" />
            <span className="font-mono text-sm">{fileName}</span>
          </div>
          <div className="space-y-3">
            {STAGES.map((s, i) => {
              const done = stage > i;
              const active = stage === i;
              return (
                <div key={s} className={`flex items-center gap-3 p-4 rounded-xl ${
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
        </div>
      )}
    </div>
  );
}
