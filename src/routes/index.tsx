import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, HeartPulse, Activity, Moon, Dumbbell, Flame, Sparkles, Compass } from "lucide-react";
import { FRIENDLY_COPY } from "@/lib/copy";
import { GamifiedCTA } from "@/components/GamifiedCTA";
import { TrustNote } from "@/components/TrustNote";
import { InsightCard } from "@/components/InsightCard";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-20">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-7">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide"
              style={{
                color: "var(--friendly-mint)",
                background: "color-mix(in oklab, var(--friendly-mint) 12%, transparent)",
                border: "1px solid color-mix(in oklab, var(--friendly-mint) 35%, transparent)",
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              A calmer way to understand your body
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-semibold leading-[1.02]">
              Ready to meet your{" "}
              <span className="bg-gradient-to-r from-[var(--friendly-teal)] via-[var(--friendly-mint)] to-[var(--friendly-sky)] bg-clip-text text-transparent">
                future-health twin
              </span>
              ?
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {FRIENDLY_COPY.heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-3 pt-2 items-center">
              <Link to="/intake">
                <GamifiedCTA size="lg" tone="teal" xp={10}>
                  {FRIENDLY_COPY.ctaStart}
                </GamifiedCTA>
              </Link>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass text-sm font-semibold hover:brightness-110 transition"
              >
                {FRIENDLY_COPY.ctaSampleLab}
              </Link>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80">
              <Sparkles className="h-3 w-3 text-[var(--friendly-mint)]" />
              Step 1 of 4: Build your twin profile
            </div>

            <TrustNote className="max-w-xl">
              Private by design for this demo. Educational only — not a diagnosis or prescription.
            </TrustNote>

            <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
              <Stat label="6 body systems explored" value="6" />
              <Stat label="12+ health signals organized" value="12+" />
              <Stat label="90-day care plan" value="90 days" />
            </div>
          </div>

          {/* Twin diagram — preserved */}
          <div className="lg:col-span-5">
            <div className="relative aspect-square glass rounded-3xl p-6 overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <div className="absolute inset-6 rounded-full border border-[var(--friendly-teal)]/40 animate-pulse" />
              <div className="absolute inset-12 rounded-full border border-[var(--friendly-mint)]/30" />
              <div className="absolute inset-20 rounded-full border border-[var(--friendly-sky)]/30" />
              <div className="absolute inset-6 sweep">
                <div
                  className="absolute top-1/2 left-1/2 h-1/2 w-1/2 origin-top-left"
                  style={{ background: "conic-gradient(from 0deg, color-mix(in oklab, var(--friendly-teal) 35%, transparent), transparent 60deg)" }}
                />
              </div>
              <div className="relative h-full grid grid-cols-3 grid-rows-3 items-center justify-items-center">
                <NodeIcon Icon={Brain} color="neon-blue" />
                <div />
                <NodeIcon Icon={HeartPulse} color="neon-red" />
                <NodeIcon Icon={Activity} color="neon-orange" />
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Twin</div>
                  <div className="font-display text-2xl neon-text-green">Alex M.</div>
                  <div className="text-[10px] text-muted-foreground">Age 48</div>
                </div>
                <NodeIcon Icon={Flame} color="neon-orange" />
                <NodeIcon Icon={Dumbbell} color="neon-green" />
                <div />
                <NodeIcon Icon={Moon} color="neon-blue" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Friendly journey overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InsightCard
            tone="teal"
            icon={<Compass className="h-4 w-4" />}
            title="Quick intake quest"
          >
            Tell us a little about your sleep, movement, and goals — about 60 seconds.
          </InsightCard>
          <InsightCard
            tone="mint"
            icon={<Sparkles className="h-4 w-4" />}
            title="Meet your body map"
          >
            Six gentle body systems light up with helpful signals — never red alerts.
          </InsightCard>
          <InsightCard
            tone="sky"
            icon={<Activity className="h-4 w-4" />}
            title="Your 90-day quest plan"
          >
            Small, doable steps designed to nurture the areas that need it most.
          </InsightCard>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div
          className="rounded-3xl p-10 text-center glass-soft"
          style={{
            borderColor: "color-mix(in oklab, var(--friendly-teal) 35%, transparent)",
            boxShadow: "0 20px 60px -30px color-mix(in oklab, var(--friendly-teal) 60%, transparent)",
          }}
        >
          <h3 className="text-3xl font-display font-semibold">Ready to meet your twin?</h3>
          <p className="text-sm text-muted-foreground mt-2">{FRIENDLY_COPY.questIntro}</p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Link to="/intake">
              <GamifiedCTA tone="teal" xp={10}>{FRIENDLY_COPY.ctaStart}</GamifiedCTA>
            </Link>
            <Link to="/upload" className="px-5 py-2.5 rounded-xl glass-soft text-sm font-semibold">
              {FRIENDLY_COPY.ctaSampleLab}
            </Link>
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

function NodeIcon({ Icon, color }: { Icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="relative h-14 w-14 rounded-2xl glass flex items-center justify-center float">
      <Icon className={`h-6 w-6 text-[var(--${color})]`} />
      <span className={`absolute inset-0 rounded-2xl neon-border-${color === "neon-red" ? "red" : color.split("-")[1]} opacity-50`} />
    </div>
  );
}
