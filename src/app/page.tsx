import Link from "next/link";
import { getPortfolioStats } from "@/db/queries";
import { ecosystemSummary, CONNECTORS } from "@/integrations/registry";
import { Reveal } from "@/components/reveal";
import { Skyline, PurposeMotif } from "@/components/landing-visuals";
import { SystemMap } from "@/components/system-map";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Haven — Housing intelligence for earlier intervention",
  description: "See housing risk earlier. Understand people and place. Coordinate intervention before crisis. A housing intelligence and intervention layer across a landlord's existing systems.",
};

const PURPOSE = [
  { kind: "see" as const, title: "See", line: "Where risk is emerging — across every home, household and neighbourhood." },
  { kind: "understand" as const, title: "Understand", line: "What is driving it — fabric, environment, finances and vulnerability, assembled from your systems." },
  { kind: "act" as const, title: "Act", line: "Coordinate the right intervention with the right partner, before crisis." },
  { kind: "track" as const, title: "Track", line: "Whether conditions actually improve — outcomes measured, not assumed." },
];

const SCENARIOS = [
  {
    tag: "Cold home", tone: "#cc7249",
    steps: [
      ["Signal", "Switchee reports 12.8°C internal temperature"],
      ["Context", "Elderly resident, under-heating despite adequate fabric"],
      ["Risk", "Low structural band, but urgency escalated to Immediate"],
      ["Intervention", "Heating support + energy advice referral"],
      ["Partner", "Home Energy Scotland engaged via Notify"],
      ["Outcome", "Temperature recovered; risk reduced at follow-up"],
    ],
  },
  {
    tag: "Damp & mould", tone: "#6a8f87",
    steps: [
      ["Signal", "Aico HomeLINK flags 81% humidity with children present"],
      ["Context", "Repeat damp repairs on file from Civica Cx"],
      ["Risk", "High environmental and recurrence scores"],
      ["Intervention", "Damp investigation + ventilation works"],
      ["Partner", "Cloch Repairs Service work order via Plentific"],
      ["Outcome", "Mould treated; monitoring confirms improvement"],
    ],
  },
  {
    tag: "Fuel poverty", tone: "#b4703f",
    steps: [
      ["Signal", "Household flagged in fuel poverty, under-heating"],
      ["Context", "High income risk, EPC F from the energy register"],
      ["Risk", "Fuel poverty primary driver, elevated overall"],
      ["Intervention", "Income maximisation + fabric improvement"],
      ["Partner", "Financial Inclusion Partnership referral"],
      ["Outcome", "Benefit uptake secured; affordability improved"],
    ],
  },
];

const PLATFORM = [
  { href: "/portfolio", name: "Portfolio", blurb: "Situation room across the whole estate" },
  { href: "/place", name: "Place", blurb: "Neighbourhood risk concentration" },
  { href: "/households", name: "Household 360", blurb: "Human-centred case dossier" },
  { href: "/properties", name: "Property 360", blurb: "Asset & condition intelligence" },
  { href: "/risk-queue", name: "Risk triage", blurb: "Prioritised, explainable queue" },
  { href: "/cases", name: "Cases", blurb: "Coordinated intervention workflow" },
  { href: "/interventions", name: "Interventions", blurb: "Programme & outcomes" },
  { href: "/ecosystem", name: "Ecosystem", blurb: "The connected systems fabric" },
  { href: "/analytics", name: "Insights", blurb: "Executive intelligence" },
];

export default async function Landing() {
  const stats = await getPortfolioStats();
  const eco = ecosystemSummary();
  const bc = stats.bandCounts;
  const attention = bc.Critical + bc.High;
  const connected = eco.total - eco.notConfigured;

  const ribbon = [
    { v: stats.propertiesMonitored, label: "homes monitored" },
    { v: attention, label: "households need attention" },
    { v: stats.openInterventions, label: "active interventions" },
    { v: stats.casesWorsening, label: "worsening risk signals" },
    { v: connected, label: "partner systems connected" },
  ];

  const ecoNames = CONNECTORS.filter((c) => c.state !== "not_configured").map((c) => c.name);

  return (
    <div className="bg-ink-950 text-white">
      {/* Landing header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-md border border-terracotta-400/40 bg-terracotta-500 font-display text-lg font-semibold text-white">H</span>
            <span className="font-display text-lg font-semibold tracking-tight">Haven</span>
          </div>
          <nav className="flex items-center gap-1.5 sm:gap-3">
            <a href="#platform" className="hidden rounded-md px-3 py-1.5 text-sm text-ink-100/80 hover:text-white sm:block">Platform</a>
            <a href="#ecosystem" className="hidden rounded-md px-3 py-1.5 text-sm text-ink-100/80 hover:text-white sm:block">Ecosystem</a>
            <Link href="/portfolio" className="rounded-md bg-terracotta-500 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-600">Enter HAVEN</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <Reveal className="section-eyebrow text-terracotta-300">Housing intelligence platform</Reveal>
            <Reveal delay={1}>
              <h1 className="mt-4 display-hero text-5xl text-white sm:text-6xl lg:text-[76px]">Housing intelligence<br />for earlier<br /><span className="text-terracotta-300">intervention.</span></h1>
            </Reveal>
            <Reveal delay={2}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-100">
                See housing risk earlier. Understand people and place. Coordinate intervention before crisis — across the systems you already run.
              </p>
            </Reveal>
            <Reveal delay={3} className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/portfolio" className="rounded-lg bg-terracotta-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-terracotta-600">Enter HAVEN →</Link>
              <Link href="/ecosystem" className="rounded-lg border border-white/20 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10">Explore the ecosystem</Link>
            </Reveal>
          </div>
          <Reveal delay={2} className="relative">
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
              <Skyline className="h-auto w-full" />
            </div>
          </Reveal>
        </div>

        {/* Live portfolio ribbon */}
        <div className="border-t border-white/10 bg-ink-900/60">
          <div className="mx-auto flex max-w-[1180px] flex-wrap divide-white/10 px-5 sm:px-8 md:divide-x">
            {ribbon.map((r, i) => (
              <div key={i} className="flex min-w-[9rem] flex-1 items-baseline gap-2 py-4 md:px-6 md:first:pl-0">
                <span className="display-xl text-3xl text-terracotta-300 tnum">{r.v}</span>
                <span className="text-sm leading-tight text-ink-100">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Purpose: SEE / UNDERSTAND / ACT / TRACK */}
      <section className="border-b border-white/10 bg-limestone-50 text-graphite-900">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 lg:py-20">
          <Reveal className="section-eyebrow">The Haven method</Reveal>
          <Reveal delay={1}><h2 className="mt-3 display-xl text-3xl text-ink-900 sm:text-4xl">From signal to outcome</h2></Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PURPOSE.map((p, i) => (
              <Reveal key={p.kind} delay={((i % 4) + 1) as 1 | 2 | 3 | 4} className="rounded-xl border border-graphite-200/70 bg-white p-5 hover-lift">
                <span className="text-terracotta-600">
                  <PurposeMotif kind={p.kind} />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-graphite-600">{p.line}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Housing system fabric */}
      <section className="border-b border-white/10 bg-ink-900">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 lg:py-20">
          <Reveal className="section-eyebrow text-terracotta-300">One intelligence fabric</Reveal>
          <Reveal delay={1}><h2 className="mt-3 display-xl text-3xl text-white sm:text-4xl">Homes, households and place — woven together</h2></Reveal>
          <Reveal delay={2}><p className="mt-3 max-w-2xl text-ink-100">Haven brings property condition, repairs, energy, sensors, financial vulnerability, public data, case management and community services into one canonical, HACT-aligned model — reconciled by UPRN.</p></Reveal>
          <Reveal delay={2} className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#f7f9fa] p-4">
            <SystemMap />
          </Reveal>
        </div>
      </section>

      {/* Scenarios */}
      <section className="border-b border-white/10 bg-limestone-50 text-graphite-900">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 lg:py-20">
          <Reveal className="section-eyebrow">What it looks like in practice</Reveal>
          <Reveal delay={1}><h2 className="mt-3 display-xl text-3xl text-ink-900 sm:text-4xl">Three homes, three journeys</h2></Reveal>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {SCENARIOS.map((s, i) => (
              <Reveal key={s.tag} delay={((i % 3) + 1) as 1 | 2 | 3} className="overflow-hidden rounded-xl border border-graphite-200/70 bg-white hover-lift">
                <div className="flex items-center justify-between px-5 py-3" style={{ background: s.tone + "14" }}>
                  <span className="font-display text-lg font-semibold text-ink-900">{s.tag}</span>
                  <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: s.tone }} />
                </div>
                <ol className="relative space-y-3 border-l border-graphite-200 p-5 pl-7">
                  {s.steps.map(([k, v], j) => (
                    <li key={j} className="relative">
                      <span aria-hidden className="absolute -left-[1.42rem] top-1 h-2 w-2 rounded-full border-2 border-white" style={{ background: s.tone }} />
                      <p className="field-label" style={{ color: s.tone }}>{k}</p>
                      <p className="text-sm text-ink-800">{v}</p>
                    </li>
                  ))}
                </ol>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Platform preview */}
      <section id="platform" className="border-b border-white/10 bg-white text-graphite-900">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 lg:py-20">
          <Reveal className="section-eyebrow">Inside Haven</Reveal>
          <Reveal delay={1}><h2 className="mt-3 display-xl text-3xl text-ink-900 sm:text-4xl">A platform, not a dashboard</h2></Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM.map((p, i) => (
              <Reveal key={p.href} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <Link href={p.href} className="group flex h-full flex-col justify-between rounded-xl border border-graphite-200/70 bg-limestone-50 p-5 hover-lift">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink-900">{p.name}</h3>
                    <p className="mt-1 text-sm text-graphite-600">{p.blurb}</p>
                  </div>
                  <span className="mt-4 text-sm font-medium text-terracotta-600">Open {p.name} →</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section id="ecosystem" className="border-b border-white/10 bg-ink-900">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 lg:py-20">
          <Reveal className="section-eyebrow text-terracotta-300">The connected estate</Reveal>
          <Reveal delay={1}><h2 className="mt-3 display-xl text-3xl text-white sm:text-4xl">{eco.total} connectors across {eco.categories} domains</h2></Reveal>
          <Reveal delay={2}><p className="mt-3 max-w-2xl text-ink-100">Housing management, repairs, IoT sensors, energy, public data, communications, documents and analytics — each labelled honestly by its real connection state.</p></Reveal>
          <Reveal delay={2} className="mt-8 flex flex-wrap gap-2">
            {ecoNames.map((n) => (
              <span key={n} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-ink-100">{n}</span>
            ))}
          </Reveal>
          <Reveal delay={3} className="mt-8">
            <Link href="/ecosystem" className="inline-flex rounded-lg border border-white/20 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10">Explore HAVEN ecosystem →</Link>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-ink-950">
        <div className="mx-auto max-w-[1180px] px-5 py-20 text-center sm:px-8 lg:py-28">
          <Reveal>
            <h2 className="display-hero mx-auto max-w-3xl text-4xl text-white sm:text-5xl lg:text-[58px]">From fragmented housing data to coordinated intervention.</h2>
          </Reveal>
          <Reveal delay={1} className="mt-10">
            <Link href="/portfolio" className="inline-flex rounded-lg bg-terracotta-500 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-terracotta-600">Enter HAVEN →</Link>
          </Reveal>
        </div>
        <footer className="border-t border-white/10">
          <div className="mx-auto max-w-[1180px] px-5 py-8 text-xs leading-relaxed text-ink-300 sm:px-8">
            Haven · CivTech 12.6 demonstrator with Cloch Housing Association · Ambidexters Ltd × The DataKirk SCIO. All data is synthetic. Not a clinical decision system. Integrations are simulated and run against synthetic fixtures; no live customer credentials are configured. No endorsement by Cloch or CivTech implied.
          </div>
        </footer>
      </section>
    </div>
  );
}
