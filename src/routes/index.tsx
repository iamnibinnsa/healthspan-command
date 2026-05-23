import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Brain, HeartPulse, Activity, Moon, Dumbbell, Flame, ShieldCheck, Atom } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-28">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-7">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-soft text-[11px] uppercase tracking-[0.2em] text-[var(--neon-blue)]">
              <Sparkles className="h-3 w-3" /> Caltech Longevity Hackathon · MVP
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-semibold leading-[1.02]">
              Meet your{" "}
              <span className="bg-gradient-to-r from-[var(--neon-blue)] via-[var(--neon-green)] to-[var(--neon-orange)] bg-clip-text text-transparent">
                Digital Medicine Twin
              </span>{" "}
              for Longevity
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Upload labs. Map healthspan risks across six body systems. Simulate interventions in
              real time. Generate a 90-day plan and a brief you can hand to your physician.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/intake" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-hero text-sm font-semibold">
                Start Healthspan Scan <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-sm font-semibold hover:neon-border-green transition"
              >
                Try Sample Demo
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-4 text-xs text-muted-foreground">
              <Stat label="Body systems mapped" value="6" />
              <Stat label="Biomarkers tracked" value="12+" />
              <Stat label="Demo plan" value="90 days" />
            </div>
          </div>

          {/* Twin diagram */}
          <div className="lg:col-span-5">
            <div className="relative aspect-square glass rounded-3xl p-6 overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <div className="absolute inset-6 rounded-full border border-[var(--neon-blue)]/30 animate-pulse" />
              <div className="absolute inset-12 rounded-full border border-[var(--neon-green)]/30" />
              <div className="absolute inset-20 rounded-full border border-[var(--neon-orange)]/30" />
              <div className="relative h-full grid grid-cols-3 grid-rows-3 items-center justify-items-center">
                <NodeIcon Icon={Brain} color="neon-blue" pos="" />
                <div />
                <NodeIcon Icon={HeartPulse} color="neon-red" pos="" />
                <NodeIcon Icon={Activity} color="neon-orange" pos="" />
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Twin</div>
                  <div className="font-display text-2xl neon-text-green">Alex M.</div>
                  <div className="text-[10px] text-muted-foreground">Age 48</div>
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

      {/* Problem */}
      <Section title="The Problem" eyebrow="01 / Why">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { t: "Healthspan is opaque", d: "People live longer but spend their last decade in chronic illness. There is no operating system for healthspan." },
            { t: "Labs feel like noise", d: "Patients get PDFs with red flags but no integrated picture across metabolic, cardiovascular, cognitive, and recovery systems." },
            { t: "Interventions feel guess-based", d: "There is no way to simulate what changing sleep, lipids, or training would actually do to your trajectory." },
          ].map((x) => (
            <div key={x.t} className="glass rounded-2xl p-6">
              <div className="text-lg font-display font-semibold mb-2">{x.t}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Solution */}
      <Section title="The Solution" eyebrow="02 / What">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-8 lg:col-span-1">
            <Atom className="h-8 w-8 text-[var(--neon-green)] mb-4" />
            <h3 className="text-2xl font-display font-semibold mb-2">A digital medicine twin</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              MediTwin ingests labs, intake, and wearable signals and builds a six-system model of
              your healthspan. Each system has a score, drivers, and physician-discussion items.
            </p>
          </div>
          <div className="glass rounded-2xl p-8">
            <ShieldCheck className="h-8 w-8 text-[var(--neon-blue)] mb-4" />
            <h3 className="text-2xl font-display font-semibold mb-2">A what-if simulator</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Toggle Zone 2, sleep, fiber, ApoB strategy — and watch projected healthspan and
              biological age update live. Then export a personalized 90-day plan and clinician brief.
            </p>
          </div>
        </div>
      </Section>

      {/* How */}
      <Section title="How It Works" eyebrow="03 / Flow">
        <div className="grid md:grid-cols-4 gap-4">
          {["Healthspan intake", "Upload lab PDF", "Build digital twin", "Simulate & plan"].map((s, i) => (
            <div key={s} className="glass rounded-2xl p-6">
              <div className="text-xs font-mono text-[var(--neon-blue)]">STEP {String(i + 1).padStart(2, "0")}</div>
              <div className="mt-2 font-display text-lg font-semibold">{s}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Why now */}
      <Section title="Why Now" eyebrow="04 / Timing">
        <div className="glass rounded-2xl p-8">
          <p className="text-base text-muted-foreground leading-relaxed max-w-4xl">
            The convergence of consumer lab access, wearables generating continuous physiology
            data, foundation models capable of structured reasoning over biomarkers, and a cultural
            shift toward longevity makes the digital medicine twin inevitable. The question is
            who builds the trusted operating system first.
          </p>
        </div>
      </Section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="glass rounded-3xl p-10 text-center neon-border-blue">
          <h3 className="text-3xl font-display font-semibold">Ready to meet your twin?</h3>
          <p className="text-sm text-muted-foreground mt-2">Demo runs in under 2 minutes with sample data.</p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Link to="/intake" className="px-6 py-3 rounded-xl btn-hero text-sm font-semibold">
              Start Healthspan Scan
            </Link>
            <Link to="/upload" className="px-6 py-3 rounded-xl glass-soft text-sm font-semibold">
              Try Sample Demo
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

function NodeIcon({ Icon, color }: { Icon: React.ComponentType<{ className?: string }>; color: string; pos?: string }) {
  return (
    <div className={`relative h-14 w-14 rounded-2xl glass flex items-center justify-center float`}>
      <Icon className={`h-6 w-6 text-[var(--${color})]`} />
      <span className={`absolute inset-0 rounded-2xl neon-border-${color === "neon-red" ? "red" : color.split("-")[1]} opacity-50`} />
    </div>
  );
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-8">
        <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">{eyebrow}</div>
        <h2 className="text-3xl sm:text-4xl font-display font-semibold mt-2">{title}</h2>
      </div>
      {children}
    </section>
  );
}
