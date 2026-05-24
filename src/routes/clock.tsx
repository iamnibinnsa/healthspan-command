import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useTwin } from "@/lib/twin-context";
import { SAMPLE_BIOMARKERS } from "@/lib/mockData";
import {
  computeBloodBasedClock,
  simulateMethylationClock,
  interpretAcceleration,
  clinicianDiscussionItems,
  HORVATH_FACTS,
  DOMAIN_COLOR,
  type ClockResult,
  type ClockContributor,
  type ClockMethod,
} from "@/lib/horvathClock";
import { TrustNote } from "@/components/TrustNote";
import { CTA } from "@/lib/copy";
import {
  Dna, Beaker, Sparkles, ChevronRight, TrendingUp, TrendingDown,
  Loader2, Stethoscope, RefreshCw, Activity, BookOpen, Info,
} from "lucide-react";

export const Route = createFileRoute("/clock")({
  component: Clock,
});

/* ------------------------------------------------------------------ */
/*  Page                                                                 */
/* ------------------------------------------------------------------ */

function Clock() {
  const { intake } = useTwin();
  const [method, setMethod] = useState<ClockMethod>("blood-marker");
  const [computing, setComputing] = useState(false);
  const [stageText, setStageText] = useState("");
  const [result, setResult] = useState<ClockResult | null>(null);

  const compute = useCallback(() => {
    setComputing(true);
    setResult(null);

    if (method === "methylation") {
      const stages = [
        "Reading 353 CpG β-values…",
        "Applying Horvath linear weights…",
        "Calibrating non-linear age transform…",
        "Computing tissue-specific age…",
      ];
      let i = 0;
      setStageText(stages[0]);
      const interval = window.setInterval(() => {
        i += 1;
        if (i < stages.length) setStageText(stages[i]);
        else window.clearInterval(interval);
      }, 600);
      window.setTimeout(() => {
        window.clearInterval(interval);
        setResult(simulateMethylationClock(intake, SAMPLE_BIOMARKERS));
        setComputing(false);
        setStageText("");
      }, 2500);
    } else {
      setStageText("Aggregating blood markers and lifestyle inputs…");
      window.setTimeout(() => {
        setResult(computeBloodBasedClock(intake, SAMPLE_BIOMARKERS));
        setComputing(false);
        setStageText("");
      }, 900);
    }
  }, [method, intake]);

  const handleReset = useCallback(() => {
    setResult(null);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">
          Biological Age Clock
        </div>
        <h1 className="text-4xl font-display font-semibold mt-1">
          Horvath-style epigenetic clock
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          An educational prototype inspired by Steve Horvath&rsquo;s 2013 multi-tissue
          epigenetic clock. Compute a directional estimate of biological age from your
          blood markers and lifestyle context, or simulate a methylation-based analysis.
        </p>
      </div>

      {/* Explainer */}
      <ExplainerCard />

      {/* Method picker */}
      <MethodPicker method={method} onChange={setMethod} disabled={computing} />

      {/* Inputs panel for the active method */}
      {method === "blood-marker" ? (
        <BloodMarkerPanel
          intake={intake}
          onCompute={compute}
          computing={computing}
          stageText={stageText}
        />
      ) : (
        <MethylationPanel
          intake={intake}
          onCompute={compute}
          computing={computing}
          stageText={stageText}
        />
      )}

      {/* Result panel */}
      {result && !computing && <ResultPanel result={result} onReset={handleReset} />}

      {/* Disclaimer */}
      <TrustNote variant="clinical" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Explainer card                                                       */
/* ------------------------------------------------------------------ */

function ExplainerCard() {
  return (
    <div
      className="rounded-2xl p-5 sm:p-6"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--neon-blue) 8%, oklch(0.22 0.03 250 / 0.55)), oklch(0.22 0.03 250 / 0.5))",
        border: "1px solid color-mix(in oklab, var(--neon-blue) 28%, transparent)",
      }}
    >
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-xl glass-soft flex items-center justify-center shrink-0">
          <BookOpen className="h-5 w-5 text-[var(--neon-blue)]" />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="font-display text-lg font-semibold">
              What does Horvath&rsquo;s clock actually measure?
            </div>
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
              The original {HORVATH_FACTS.yearOriginal} clock by {HORVATH_FACTS.authorOriginal} reads
              DNA methylation β-values at <span className="text-foreground font-medium">{HORVATH_FACTS.cpgCount} specific CpG sites</span>{" "}
              and combines them with a non-linear age transform. It is multi-tissue
              and reports a median absolute deviation of about{" "}
              <span className="text-foreground font-medium">3.6 years</span>.
            </p>
            <a
              href={HORVATH_FACTS.calculatorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-[var(--neon-blue)] hover:underline"
            >
              Run the real analysis on the Clock Foundation calculator
              <ChevronRight className="h-3 w-3" />
            </a>
          </div>
          <div
            className="rounded-xl px-3.5 py-3 text-[12px] leading-relaxed flex gap-2 items-start"
            style={{
              background: "color-mix(in oklab, var(--neon-orange) 8%, transparent)",
              border: "1px solid color-mix(in oklab, var(--neon-orange) 26%, transparent)",
            }}
          >
            <Info className="h-4 w-4 text-[var(--neon-orange)] shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-foreground">
                This prototype does not have your methylation data.
              </div>
              <div className="text-muted-foreground mt-0.5">
                The default path computes a transparent <em>blood-marker proxy</em>{" "}
                using your existing biomarkers and lifestyle context. The methylation
                option simulates the analysis using your sample profile so you can
                see what the result format looks like.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Method picker                                                        */
/* ------------------------------------------------------------------ */

function MethodPicker({
  method, onChange, disabled,
}: {
  method: ClockMethod;
  onChange: (m: ClockMethod) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <MethodCard
        active={method === "blood-marker"}
        disabled={disabled}
        onClick={() => onChange("blood-marker")}
        Icon={Beaker}
        title="Blood-marker proxy"
        sub="Levine-style estimator over your existing biomarkers and lifestyle inputs. Transparent and itemized."
        tag="Recommended"
        color="neon-green"
      />
      <MethodCard
        active={method === "methylation"}
        disabled={disabled}
        onClick={() => onChange("methylation")}
        Icon={Dna}
        title="Methylation analysis"
        sub={`Simulated processing of ${HORVATH_FACTS.cpgCount} CpG sites — the pathway the real Horvath clock uses.`}
        tag="Demo"
        color="neon-blue"
      />
    </div>
  );
}

function MethodCard({
  active, disabled, onClick, Icon, title, sub, tag, color,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  tag: string;
  color: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className="text-left rounded-2xl p-4 transition disabled:opacity-50"
      style={{
        background: active
          ? `linear-gradient(135deg, color-mix(in oklab, var(--${color}) 14%, oklch(0.22 0.03 250 / 0.55)), oklch(0.22 0.03 250 / 0.5))`
          : "oklch(0.22 0.03 250 / 0.55)",
        border: active
          ? `1px solid color-mix(in oklab, var(--${color}) 50%, transparent)`
          : "1px solid color-mix(in oklab, var(--neon-blue) 14%, transparent)",
        boxShadow: active
          ? `0 0 14px -6px color-mix(in oklab, var(--${color}) 60%, transparent)`
          : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `color-mix(in oklab, var(--${color}) ${active ? 18 : 10}%, transparent)`,
            color: `var(--${color})`,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span
          className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            color: `var(--${color})`,
            background: `color-mix(in oklab, var(--${color}) 10%, transparent)`,
            border: `1px solid color-mix(in oklab, var(--${color}) 28%, transparent)`,
          }}
        >
          {tag}
        </span>
      </div>
      <div className="font-display text-base font-semibold mt-3">{title}</div>
      <div className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
        {sub}
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Blood-marker panel                                                   */
/* ------------------------------------------------------------------ */

function BloodMarkerPanel({
  intake, onCompute, computing, stageText,
}: {
  intake: ReturnType<typeof useTwin>["intake"];
  onCompute: () => void;
  computing: boolean;
  stageText: string;
}) {
  const markers = SAMPLE_BIOMARKERS;
  return (
    <div className="glass rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl glass-soft flex items-center justify-center">
          <Beaker className="h-5 w-5 text-[var(--neon-green)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg font-semibold">Inputs from your twin profile</div>
          <div className="text-[12px] text-muted-foreground">
            Pulled from your most recent labs and intake. Editable from the Labs and Get Started pages.
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Blood markers
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {markers.map((b) => (
            <KeyValue key={b.name} label={b.name} value={`${b.value} ${b.unit}`} sub={`target ${b.optimal}`} />
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Lifestyle context
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <KeyValue label="Age" value={`${intake.age}`} />
          <KeyValue label="Sleep" value={`${intake.sleepHours} hr/night`} />
          <KeyValue label="Exercise" value={`${intake.exerciseFreq} days/wk`} />
          <KeyValue label="Stress" value={`${intake.stress}/10`} />
          <KeyValue label="Diet quality" value={`${intake.diet}/10`} />
          <KeyValue label="Family history" value={intake.familyHistory.join(", ") || "—"} />
        </div>
      </div>

      <button
        type="button"
        onClick={onCompute}
        disabled={computing}
        className="w-full px-5 py-3 rounded-xl btn-hero text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {computing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {stageText || "Computing biological age…"}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Compute biological age
          </>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Methylation panel                                                    */
/* ------------------------------------------------------------------ */

function MethylationPanel({
  intake, onCompute, computing, stageText,
}: {
  intake: ReturnType<typeof useTwin>["intake"];
  onCompute: () => void;
  computing: boolean;
  stageText: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl glass-soft flex items-center justify-center">
          <Dna className="h-5 w-5 text-[var(--neon-blue)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg font-semibold">Methylation analysis</div>
          <div className="text-[12px] text-muted-foreground">
            In a real workflow you&rsquo;d upload Illumina IDAT/CSV files. For this prototype
            we&rsquo;ll run the simulation against {intake.name}&rsquo;s sample profile.
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{
          background: "color-mix(in oklab, var(--neon-blue) 6%, oklch(0.22 0.03 250 / 0.45))",
          border: "2px dashed color-mix(in oklab, var(--neon-blue) 35%, transparent)",
        }}
      >
        <Dna className="h-9 w-9 mx-auto text-[var(--neon-blue)]" />
        <div className="text-sm font-medium mt-2">Drop methylation IDAT or CSV files here</div>
        <div className="text-[11px] text-muted-foreground mt-1">
          Simulated for this prototype &mdash; no file is actually parsed.
        </div>
      </div>

      {/* Real-analysis pointer */}
      <div
        className="rounded-xl px-3.5 py-3 flex flex-wrap items-center gap-3 text-[12px]"
        style={{
          background: "color-mix(in oklab, var(--neon-blue) 8%, transparent)",
          border: "1px solid color-mix(in oklab, var(--neon-blue) 28%, transparent)",
        }}
      >
        <Info className="h-4 w-4 text-[var(--neon-blue)] shrink-0" />
        <div className="flex-1 leading-relaxed min-w-[14rem]">
          <span className="font-medium text-foreground">Have real methylation data?</span>{" "}
          <span className="text-muted-foreground">
            Run the actual {HORVATH_FACTS.cpgCount}-CpG Horvath analysis on the
            official {HORVATH_FACTS.calculatorSource} calculator.
          </span>
        </div>
        <a
          href={HORVATH_FACTS.calculatorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full transition hover:brightness-110"
          style={{
            color: "var(--neon-blue)",
            background: "color-mix(in oklab, var(--neon-blue) 12%, transparent)",
            border: "1px solid color-mix(in oklab, var(--neon-blue) 32%, transparent)",
          }}
        >
          Open calculator <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      <div className="grid sm:grid-cols-3 gap-2 text-[11px]">
        <KeyValue label="CpG sites" value={`${HORVATH_FACTS.cpgCount} markers`} />
        <KeyValue label="Tissue scope" value="Multi-tissue" />
        <KeyValue label="Reported MAD" value="≈ 3.6 years" />
      </div>

      <button
        type="button"
        onClick={onCompute}
        disabled={computing}
        className="w-full px-5 py-3 rounded-xl btn-hero text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {computing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {stageText || "Analyzing methylation array…"}
          </>
        ) : (
          <>
            <Dna className="h-4 w-4" />
            Run sample methylation analysis
          </>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Result panel                                                         */
/* ------------------------------------------------------------------ */

function ResultPanel({
  result, onReset,
}: {
  result: ClockResult;
  onReset: () => void;
}) {
  const interp = interpretAcceleration(result.ageAcceleration);
  const accelColor =
    interp.tone === "good"     ? "neon-green"
      : interp.tone === "watch"    ? "neon-orange"
      : interp.tone === "priority" ? "neon-red"
      : "neon-blue";

  const accelerators = useMemo(
    () =>
      [...result.contributors]
        .filter((c) => c.direction === "accelerates")
        .sort((a, b) => b.effect - a.effect),
    [result.contributors],
  );
  const decelerators = useMemo(
    () =>
      [...result.contributors]
        .filter((c) => c.direction === "decelerates")
        .sort((a, b) => a.effect - b.effect),
    [result.contributors],
  );

  const discussionItems = useMemo(() => clinicianDiscussionItems(result), [result]);

  return (
    <div className="space-y-5">
      {/* Hero result */}
      <div
        className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--neon-blue) 10%, oklch(0.22 0.03 250 / 0.6)), color-mix(in oklab, var(--neon-green) 8%, oklch(0.22 0.03 250 / 0.5)))",
          border: "1px solid color-mix(in oklab, var(--neon-blue) 28%, transparent)",
        }}
      >
        <div
          aria-hidden
          className="absolute -top-12 -right-10 h-44 w-44 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: `var(--${accelColor})` }}
        />

        <div className="flex items-center justify-between flex-wrap gap-3 mb-6 relative">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--neon-blue)]">
              Result
            </span>
            <span
              className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                color: result.method === "methylation" ? "var(--neon-blue)" : "var(--neon-green)",
                background: `color-mix(in oklab, var(--${result.method === "methylation" ? "neon-blue" : "neon-green"}) 10%, transparent)`,
                border: `1px solid color-mix(in oklab, var(--${result.method === "methylation" ? "neon-blue" : "neon-green"}) 28%, transparent)`,
              }}
            >
              {result.method === "methylation" ? "Methylation simulation" : "Blood-marker proxy"}
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Confidence: {result.confidence}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 relative">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Chronological age
            </div>
            <div className="font-display text-6xl tabular-nums neon-text-blue mt-1 leading-none">
              {result.chronologicalAge}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">years (calendar)</div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Estimated biological age
            </div>
            <div
              className="font-display text-6xl tabular-nums mt-1 leading-none"
              style={{ color: `var(--${accelColor})` }}
            >
              {result.biologicalAge}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              years (directional estimate)
            </div>
          </div>
        </div>

        {/* Age scale visualization */}
        <AgeScale
          chronological={result.chronologicalAge}
          biological={result.biologicalAge}
          accelColor={accelColor}
        />

        <div
          className="mt-6 rounded-xl p-4 flex flex-wrap items-start gap-3 relative"
          style={{
            background: `color-mix(in oklab, var(--${accelColor}) 10%, transparent)`,
            border: `1px solid color-mix(in oklab, var(--${accelColor}) 32%, transparent)`,
          }}
        >
          <div className="flex items-center gap-2">
            {result.ageAcceleration > 0 ? (
              <TrendingUp className="h-4 w-4" style={{ color: `var(--${accelColor})` }} />
            ) : (
              <TrendingDown className="h-4 w-4" style={{ color: `var(--${accelColor})` }} />
            )}
            <span
              className="font-display text-2xl tabular-nums"
              style={{ color: `var(--${accelColor})` }}
            >
              {result.ageAcceleration > 0 ? "+" : ""}
              {result.ageAcceleration} yr
            </span>
            <span
              className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ml-1"
              style={{
                color: `var(--${accelColor})`,
                background: `color-mix(in oklab, var(--${accelColor}) 14%, transparent)`,
                border: `1px solid color-mix(in oklab, var(--${accelColor}) 32%, transparent)`,
              }}
            >
              {interp.label}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed flex-1 min-w-[14rem]">
            {interp.blurb}
          </p>
        </div>
      </div>

      {/* Contributor breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <ContributorList
          title="What pushed it up"
          subtitle="Markers nudging biological age above chronological"
          items={accelerators}
          emptyText="Nothing meaningfully accelerating right now."
          tone="up"
        />
        <ContributorList
          title="What pulled it down"
          subtitle="Protective signals decelerating biological age"
          items={decelerators}
          emptyText="No strongly decelerating signals yet — small wins are worth adding."
          tone="down"
        />
      </div>

      {/* Formula transparency */}
      <FormulaCard result={result} />

      {/* Clinician discussion items */}
      {discussionItems.length > 0 && (
        <div className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="h-4 w-4 text-[var(--neon-blue)]" />
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              What to discuss with your clinician
            </div>
          </div>
          <ul className="space-y-2 text-sm list-disc pl-5">
            {discussionItems.map((q) => (
              <li key={q} className="leading-snug">{q}</li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground italic mt-3">
            Conversation starters &mdash; never instructions. Your clinician knows you best.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-end items-center">
        <span className="text-[12px] text-muted-foreground mr-auto">
          Computed {new Date(result.computedAt).toLocaleString()}
        </span>
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded-lg glass text-xs font-semibold inline-flex items-center gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Recompute
        </button>
        <Link
          to="/simulator"
          className="px-4 py-2 rounded-lg glass text-xs font-semibold inline-flex items-center gap-2"
        >
          <Activity className="h-3.5 w-3.5" />
          Try changes in simulator
        </Link>
        <Link
          to="/report"
          className="px-4 py-2 rounded-lg btn-hero text-xs font-semibold inline-flex items-center gap-2"
        >
          <Stethoscope className="h-3.5 w-3.5" />
          {CTA.openClinicianBrief}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Result sub-components                                                */
/* ------------------------------------------------------------------ */

function AgeScale({
  chronological, biological, accelColor,
}: {
  chronological: number;
  biological: number;
  accelColor: string;
}) {
  const lo = Math.max(0, Math.min(chronological, biological) - 8);
  const hi = Math.max(chronological, biological) + 8;
  const span = Math.max(1, hi - lo);
  const cPct = ((chronological - lo) / span) * 100;
  const bPct = ((biological - lo) / span) * 100;
  const fromPct = Math.min(cPct, bPct);
  const toPct = Math.max(cPct, bPct);

  return (
    <div className="mt-7 relative">
      <div className="h-1.5 rounded-full bg-[oklch(0.3_0.04_250/0.5)] relative">
        <div
          className="absolute top-0 bottom-0 rounded-full"
          style={{
            left: `${fromPct}%`,
            width: `${Math.max(0.5, toPct - fromPct)}%`,
            background: `var(--${accelColor})`,
            opacity: 0.7,
            boxShadow: `0 0 10px color-mix(in oklab, var(--${accelColor}) 60%, transparent)`,
          }}
        />
        {/* Chronological pin */}
        <Pin pct={cPct} label="Chronological" value={chronological} color="neon-blue" above />
        {/* Biological pin */}
        <Pin pct={bPct} label="Biological" value={biological} color={accelColor} above={false} />
      </div>
      <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-12">
        <span>{lo} yr</span>
        <span>{hi} yr</span>
      </div>
    </div>
  );
}

function Pin({
  pct, label, value, color, above,
}: {
  pct: number;
  label: string;
  value: number;
  color: string;
  above: boolean;
}) {
  return (
    <div
      className="absolute -translate-x-1/2"
      style={{ left: `${pct}%`, top: above ? -28 : 12 }}
    >
      <div
        className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded whitespace-nowrap"
        style={{
          color: `var(--${color})`,
          background: `color-mix(in oklab, var(--${color}) 12%, oklch(0.22 0.03 250 / 0.85))`,
          border: `1px solid color-mix(in oklab, var(--${color}) 30%, transparent)`,
        }}
      >
        {label} <span className="text-foreground tabular-nums">{value}</span>
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 h-3 w-3 rounded-full border-2"
        style={{
          top: above ? "100%" : -10,
          marginTop: above ? 2 : 0,
          background: "oklch(0.22 0.03 250)",
          borderColor: `var(--${color})`,
          boxShadow: `0 0 8px -2px color-mix(in oklab, var(--${color}) 70%, transparent)`,
        }}
      />
    </div>
  );
}

function ContributorList({
  title, subtitle, items, emptyText, tone,
}: {
  title: string;
  subtitle: string;
  items: ClockContributor[];
  emptyText: string;
  tone: "up" | "down";
}) {
  const headerIcon =
    tone === "up" ? (
      <TrendingUp className="h-4 w-4 text-[var(--neon-orange)]" />
    ) : (
      <TrendingDown className="h-4 w-4 text-[var(--neon-green)]" />
    );

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start gap-2 mb-3">
        {headerIcon}
        <div>
          <div className="text-sm font-display font-semibold leading-tight">{title}</div>
          <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
            {subtitle}
          </div>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-[12px] text-muted-foreground italic">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((c) => (
            <ContributorRow key={c.name} c={c} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ContributorRow({ c }: { c: ClockContributor }) {
  const color = DOMAIN_COLOR[c.domain];
  const sign = c.effect > 0 ? "+" : c.effect < 0 ? "" : "±";
  const accentColor = c.effect > 0 ? "neon-orange" : c.effect < 0 ? "neon-green" : "neon-blue";
  return (
    <li
      className="flex items-start gap-3 rounded-lg px-3 py-2"
      style={{
        background: "oklch(0.22 0.03 250 / 0.55)",
        border: "1px solid color-mix(in oklab, var(--neon-blue) 14%, transparent)",
      }}
    >
      <span
        className="inline-flex items-center text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 mt-0.5"
        style={{
          color: `var(--${color})`,
          background: `color-mix(in oklab, var(--${color}) 10%, transparent)`,
          border: `1px solid color-mix(in oklab, var(--${color}) 26%, transparent)`,
        }}
      >
        {c.domain}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-medium">{c.name}</span>
          <span className="text-[11px] text-muted-foreground">{c.detail}</span>
        </div>
        <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
          {c.rationale}
        </div>
      </div>
      <span
        className="font-mono text-sm tabular-nums shrink-0"
        style={{ color: `var(--${accentColor})` }}
      >
        {sign}
        {c.effect.toFixed(1)} yr
      </span>
    </li>
  );
}

function FormulaCard({ result }: { result: ClockResult }) {
  return (
    <details className="glass rounded-2xl group">
      <summary className="cursor-pointer list-none p-5 flex items-center gap-3">
        <BookOpen className="h-4 w-4 text-[var(--neon-blue)] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-display font-semibold">
            How this estimate is built
          </div>
          <div className="text-[11px] text-muted-foreground">
            Open to see the full per-marker contribution.
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90 shrink-0" />
      </summary>
      <div className="px-5 pb-5 pt-0 space-y-3">
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          {result.method === "methylation"
            ? `In a real workflow this analysis reads β-values at ${HORVATH_FACTS.cpgCount} CpG sites and applies Horvath's published linear weights plus a non-linear age transform. This prototype simulates the result using your sample profile.`
            : "Each marker contributes a small, bounded number of years to your chronological age. The list below is the full sum the estimator computed."}
        </p>
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-2 py-2 border-b border-border">Marker</th>
              <th className="px-2 py-2 border-b border-border">Domain</th>
              <th className="px-2 py-2 border-b border-border">Value</th>
              <th className="px-2 py-2 border-b border-border text-right">Effect</th>
            </tr>
          </thead>
          <tbody>
            {result.contributors.map((c) => (
              <tr key={c.name} className="border-b border-border/50 align-top">
                <td className="px-2 py-2 font-medium">{c.name}</td>
                <td className="px-2 py-2 text-muted-foreground">{c.domain}</td>
                <td className="px-2 py-2 text-muted-foreground">{c.detail}</td>
                <td
                  className="px-2 py-2 text-right font-mono tabular-nums"
                  style={{
                    color:
                      c.effect > 0   ? "var(--neon-orange)"
                      : c.effect < 0 ? "var(--neon-green)"
                                     : undefined,
                  }}
                >
                  {c.effect > 0 ? "+" : ""}
                  {c.effect.toFixed(1)} yr
                </td>
              </tr>
            ))}
            <tr>
              <td className="px-2 py-2 font-semibold" colSpan={3}>
                Total acceleration
              </td>
              <td
                className="px-2 py-2 text-right font-mono tabular-nums font-semibold"
                style={{
                  color:
                    result.ageAcceleration > 0   ? "var(--neon-orange)"
                    : result.ageAcceleration < 0 ? "var(--neon-green)"
                                                  : undefined,
                }}
              >
                {result.ageAcceleration > 0 ? "+" : ""}
                {result.ageAcceleration.toFixed(1)} yr
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10px] text-muted-foreground italic">
          Coefficients are educational and inspired by published blood-biomarker biological-age
          estimators. They are not the original Horvath methylation weights, which require DNA
          methylation array data at {HORVATH_FACTS.cpgCount} CpG sites &mdash; available through
          the{" "}
          <a
            href={HORVATH_FACTS.calculatorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-[var(--neon-blue)] hover:brightness-110"
          >
            {HORVATH_FACTS.calculatorSource} calculator
          </a>
          .
        </p>
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/*  Tiny shared pieces                                                   */
/* ------------------------------------------------------------------ */

function KeyValue({
  label, value, sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg px-3 py-2 border border-border/60 glass-soft">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-medium tabular-nums leading-tight mt-0.5">
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}
