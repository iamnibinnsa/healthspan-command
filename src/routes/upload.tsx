import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTwin } from "@/lib/twin-context";
import { supabase } from "@/lib/supabase";
import { Upload, FileText, Sparkles, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/upload")({
  component: LabUpload,
});

const STAGES = [
  "Reading your lab values…",
  "Matching them to demo reference ranges…",
  "Building your six-system twin…",
  "Organizing your first health signals…",
];

const TELEMETRY = [
  "› reading markers safely",
  "› 14 of 14 signals organized",
  "› reference frame: NHANES + ADA + AHA (demo)",
  "› twin systems built: cognitive, cardio, metabolic, sleep, muscle, inflammation",
  "› estimating your age-gap signal…",
  "› directional estimate engine v0.4",
];

type UploadApiResponse = {
  report_id: string;
  user_id?: string;
  file_name: string;
  extracted_characters: number;
  used_fallback: boolean;
  parsed: {
    person_name: string;
    biomarkers: {
      hba1c: number;
      fasting_glucose: number;
      apob: number;
      ldl_c: number;
      hdl_c: number;
      triglycerides: number;
      hs_crp: number;
      vitamin_d: number;
      resting_hr: number;
      hrv: number;
      sleep_duration: number;
      vo2_max: number;
    };
  };
};

const AI_API_BASE = import.meta.env.VITE_AI_API_BASE ?? "http://127.0.0.1:8000";

function LabUpload() {
  const { setLabsLoaded, setParsedBiomarkers, user } = useTwin();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (file: File) => {
    setFileName(file.name);
    setError(null);
    setProcessing(true);
    setStage(0);
    const stageMs = 850;
    [1, 2, 3, 4].forEach((i) => setTimeout(() => setStage(i), i * stageMs));

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (user?.id) {
        formData.append("user_id", user.id);
      }

      const response = await fetch(`${AI_API_BASE}/labs/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Upload failed (${response.status})`);
      }
      const data = (await response.json()) as UploadApiResponse;
      setParsedBiomarkers(data.parsed.biomarkers);

      if (user?.id) {
        const { error: dbError } = await (supabase as any).from("lab_reports").insert({
          user_id: user.id,
          report_id: data.report_id,
          file_name: data.file_name,
          extracted_characters: data.extracted_characters,
          used_fallback: data.used_fallback,
          parsed_payload: data.parsed,
        });
        if (dbError) {
          console.warn("Lab report insert warning:", dbError.message);
        }
      }

      setLabsLoaded(true);
      navigate({ to: "/dashboard" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed. Please retry.";
      setError(msg);
      setProcessing(false);
      setStage(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">Lab intake</div>
      <h1 className="text-4xl font-display font-semibold mt-2 mb-2">Upload your lab report</h1>
      <p className="text-sm text-muted-foreground mb-8">We extract markers, normalize them, and build your twin in seconds.</p>

      {!processing ? (
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-[var(--neon-red)]/40 bg-[var(--neon-red)]/10 px-4 py-3 text-sm text-[var(--neon-red)]">
              {error}
            </div>
          )}
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void run(f); }}
            className="block glass rounded-3xl p-12 border-2 border-dashed border-[var(--neon-blue)]/40 text-center cursor-pointer hover:neon-border-blue transition"
          >
            <input type="file" accept="application/pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void run(f); }}
            />
            <div className="h-16 w-16 mx-auto rounded-2xl glass flex items-center justify-center mb-4">
              <Upload className="h-7 w-7 text-[var(--neon-blue)]" />
            </div>
            <div className="font-display text-xl font-semibold">Drag & drop a PDF</div>
            <p className="text-sm text-muted-foreground mt-1">or click to browse · we parse and structure biomarkers</p>
          </label>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={() => {
              const mockPdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] >>
endobj
trailer
<< /Root 1 0 R >>
%%EOF`;
              const mockFile = new File([mockPdfContent], "alex_morgan_labs_2024.pdf", {
                type: "application/pdf",
              });
              void run(mockFile);
            }}
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
              twin.scan · live
            </div>
            <div className="absolute top-2 right-3 font-mono text-[10px] text-[var(--neon-green)]">
              ● signal locked
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

          <div className="font-mono text-[10px] leading-relaxed border-t border-border/30 pt-3 space-y-0.5">
            {TELEMETRY.slice(0, Math.min(stage + 2, TELEMETRY.length)).map((t) => (
              <div key={t} className="text-[var(--neon-green)]/70">{t}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
