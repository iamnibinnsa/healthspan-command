import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/investor")({
  component: Investor,
});

const SLIDES: { eyebrow: string; title: string; body: string; bullets?: string[] }[] = [
  {
    eyebrow: "01 · Problem",
    title: "Healthspan is the next trillion-dollar gap",
    body: "People live longer but spend their last 10–15 years in chronic disease. Patients have access to labs, wearables, and supplements — but no operating system that turns signal into action.",
  },
  {
    eyebrow: "02 · Solution",
    title: "A digital medicine twin for longevity",
    body: "MediTwin ingests labs, intake, and wearable health signals to build a six-system body model. It exposes a health insights snapshot, a try-small-changes playground, a personalized 90-day guide, and a clinician visit brief.",
  },
  {
    eyebrow: "03 · Market",
    title: "$600B+ longevity adjacent stack",
    body: "Concierge & longevity medicine, wearables, supplements, diagnostics, and corporate wellness are converging. The wedge is the missing decision layer between consumer data and clinical action.",
    bullets: ["Functional medicine: $94B", "Wearables: $116B by 2028", "Longevity clinics: 35% YoY", "Corporate health: $66B"],
  },
  {
    eyebrow: "04 · Business model",
    title: "Consumer subscription + clinic + employer",
    body: "$29/mo consumer subscription, $99/mo with quarterly labs. White-label license to longevity clinics and concierge groups. Per-employee-per-month enterprise tier with anonymized cohort insights.",
  },
  {
    eyebrow: "05 · Beachhead",
    title: "High-intent healthspan early adopters",
    body: "Affluent 35–55 year olds already buying labs and wearables, plus boutique longevity clinics looking for a digital intake + planning layer they don't have to build.",
  },
  {
    eyebrow: "06 · Why now",
    title: "Three curves crossed simultaneously",
    body: "Consumer lab access (Function, Quest direct), continuous physiology data (Whoop, Oura, Apple Watch), and foundation models capable of structured reasoning over biomarkers. The trust layer is the moat.",
  },
  {
    eyebrow: "07 · Data moat",
    title: "Longitudinal twin graph",
    body: "Every user creates a longitudinal multi-modal record: labs, wearables, interventions, outcomes. Over time MediTwin learns intervention → outcome priors that no point-solution can replicate.",
  },
  {
    eyebrow: "08 · Long-term vision",
    title: "The operating system for healthspan",
    body: "From digital twin → continuous clinical co-pilot → physician dashboard → payor-grade risk model. MediTwin becomes the durable consumer interface to your own biology.",
  },
];

function Investor() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-xs font-mono text-[var(--neon-blue)] uppercase tracking-[0.3em]">Investor Mode</div>
      <h1 className="text-4xl font-display font-semibold mt-1 mb-10">MediTwin — Pitch deck</h1>

      <div className="grid md:grid-cols-2 gap-5">
        {SLIDES.map((s) => (
          <div key={s.eyebrow} className="glass rounded-2xl p-7 hover:neon-border-blue transition">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--neon-green)]">{s.eyebrow}</div>
            <h2 className="font-display text-2xl font-semibold mt-2">{s.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">{s.body}</p>
            {s.bullets && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {s.bullets.map((b) => (
                  <div key={b} className="glass-soft rounded-lg px-3 py-2 text-xs">{b}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="glass rounded-3xl p-10 mt-10 text-center neon-border-green">
        <h3 className="font-display text-2xl font-semibold">The ask</h3>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-2">
          Hackathon prototype today · seed-ready architecture · founding clinical advisors and
          design partners in conversation. We're building the trust layer for longevity.
        </p>
      </div>
    </div>
  );
}
