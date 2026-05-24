import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, HeartPulse, Activity, Moon, Dumbbell, Flame, ShieldCheck, Sparkles } from "lucide-react";
import { CTA, MICROCOPY } from "@/lib/copy";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-16 sm:pb-20">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-soft text-[11px] font-mono text-[var(--neon-green)] border border-[var(--neon-green)]/30 w-fit">
              <Sparkles className="h-3 w-3" />
              <span className="uppercase tracking-[0.18em]">Step 1 of 4 · Build your twin profile</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-semibold leading-[1.02]">
              Ready to meet your{" "}
              <span className="bg-gradient-to-r from-[var(--neon-blue)] via-[var(--neon-green)] to-[var(--neon-orange)] bg-clip-text text-transparent">
                future-health
              </span>
              {" "}twin?
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              MediTwin turns your labs, habits, and wearable health signals into a friendly digital twin
              that helps you understand your body, try small changes, and build a 90-day guide
              with confidence.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/intake"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-hero text-sm font-semibold"
              >
                Meet My Twin <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-sm font-semibold hover:neon-border-green transition"
              >
                {CTA.exploreSampleTwin}
              </Link>
            </div>

            <div
              className="inline-flex items-center gap-2 text-[12px] text-muted-foreground rounded-xl px-3 py-2 max-w-xl"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in oklab, var(--neon-blue) 8%, transparent), color-mix(in oklab, var(--neon-green) 6%, transparent))",
                border: "1px solid color-mix(in oklab, var(--neon-blue) 22%, transparent)",
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--neon-green)] shrink-0" />
              <span>
                {MICROCOPY.educationalSignals} {MICROCOPY.noJudgment}
              </span>
            </div>

            <p className="text-[12px] text-muted-foreground max-w-xl leading-relaxed">
              {MICROCOPY.smallChanges}
            </p>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-2 text-xs text-muted-foreground">
              <Stat label="Body systems explored" value="6" />
              <Stat label="Health signals organized" value="12+" />
              <Stat label="Care plan" value="90 days" />
            </div>
          </div>

          {/* Twin diagram */}
          <div className="lg:col-span-5">
            <div className="relative aspect-square glass rounded-3xl p-6 overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <div className="absolute inset-6 rounded-full border border-[var(--neon-blue)]/30 animate-pulse" />
              <div className="absolute inset-12 rounded-full border border-[var(--neon-green)]/30" />
              <div className="absolute inset-20 rounded-full border border-[var(--neon-orange)]/30" />
              <div className="absolute inset-6 sweep">
                <div className="absolute top-1/2 left-1/2 h-1/2 w-1/2 origin-top-left -translate-x-0 -translate-y-0"
                  style={{ background: "conic-gradient(from 0deg, color-mix(in oklab, var(--neon-blue) 35%, transparent), transparent 60deg)" }}
                />
              </div>
              <div className="relative h-full grid grid-cols-3 grid-rows-3 items-center justify-items-center">
                <NodeIcon Icon={Brain} color="neon-blue" pos="" />
                <div />
                <NodeIcon Icon={HeartPulse} color="neon-red" pos="" />
                <NodeIcon Icon={Activity} color="neon-orange" pos="" />
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Your twin</div>
                  <div className="font-display text-2xl neon-text-green">Alex M.</div>
                  <div className="text-[10px] text-muted-foreground">Age 48 · feels supported</div>
                </div>
                <NodeIcon Icon={Flame} color="neon-orange" pos="" />
                <NodeIcon Icon={Dumbbell} color="neon-green" pos="" />
                <div />
                <NodeIcon Icon={Moon} color="neon-blue" pos="" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-foreground">{value}</div>
      <div className="uppercase tracking-wider text-[10px]">{label}</div>
    </div>
  );
}

function NodeIcon({ Icon, color }: { Icon: React.ComponentType<{ className?: string }>; color: string; pos?: string }) {
  return (
    <div className={`relative h-14 w-14 rounded-2xl glass flex items-center justify-center float`}>
      <Icon className={`h-6 w-6 text-[var(--${color})]`} />
      <span className={`absolute inset-0 rounded-2xl neon-border-${color === "neon-red" ? "red" : color.split("-")[1]} opacity-50`} />
    </div>
  );
}
