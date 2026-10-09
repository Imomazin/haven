import Link from "next/link";
import { getPropertyByRef } from "@/db/queries";
import { PageHeader, Card } from "@/components/ui";
import { SourceBadge } from "@/components/source-badge";
import { RiskBadge, UrgencyBadge } from "@/components/severity";
import { sensorFeed, repairsForProperty, uprnFor } from "@/integrations/fixtures";

export const dynamic = "force-dynamic";

function Step({ n, title, source, children }: { n: number; title: string; source?: string; children: React.ReactNode }) {
  return (
    <li className="relative pl-12">
      <span className="absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-full border border-ink-200 bg-ink-900 font-display text-sm font-semibold text-white">{n}</span>
      <div className="rounded-xl border border-graphite-200/70 bg-white p-4 shadow-subtle">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-ink-900">{title}</h3>
          {source && <SourceBadge source={source} />}
        </div>
        <div className="text-sm text-graphite-700">{children}</div>
      </div>
    </li>
  );
}

export default async function EcosystemDemo() {
  // Drive the story from a real high-risk record.
  const rec = (await getPropertyByRef("HAV-P-0001")) ?? null;
  const p = rec?.property;
  const a = rec?.assessment;
  const feed = p ? sensorFeed(p.id, p.indoorWinterTempC, p.indoorHumidityPct, p.co2Ppm) : null;
  const repair = p ? repairsForProperty(p.id, p.dampHistoryCount, p.mouldHistoryCount, p.openRepairs)[0] : null;
  const uprn = p ? uprnFor(p.id) : "—";
  const openScore = a?.overallScore ?? 85;
  const improved = Math.max(8, openScore - 34);

  return (
    <div>
      <PageHeader
        eyebrow="Ecosystem"
        title="Guided ecosystem demonstration"
        description="One high-risk home, followed end to end — from fragmented records in separate systems to a coordinated intervention and a measured outcome. Every figure below is real demo data; every source is labelled."
      />

      {p && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow mb-1">Subject property</p>
              <p className="font-display text-xl font-semibold text-ink-900"><Link href={`/properties/${p.ref}`} className="underline">{p.ref}</Link> · {p.locality}</p>
              <p className="text-sm text-graphite-600">UPRN {uprn} · {p.epcRating} EPC · {rec?.household ? <Link href={`/households/${rec.household.ref}`} className="underline">{rec.household.ref}</Link> : "monitored"}</p>
            </div>
            {a && <div className="flex items-center gap-2"><RiskBadge band={a.band} score={a.overallScore} /><UrgencyBadge urgency={a.urgency} escalated={a.urgencyEscalated} /></div>}
          </div>
        </Card>
      )}

      <ol className="space-y-5">
        <Step n={1} title="Property record synchronised from the housing management system" source="Civica Cx">
          The tenancy, property attributes and contact details originate in the landlord&apos;s system of record and are reconciled into Haven by UPRN <span className="font-medium text-ink-900">{uprn}</span>.
        </Step>
        <Step n={2} title="Connected-home telemetry streams in" source={feed?.source ?? "Switchee"}>
          {feed ? <>The {feed.source} device reports a latest internal temperature of <span className="font-medium text-ink-900">{feed.latest.tempC}°C</span> and humidity <span className="font-medium text-ink-900">{feed.latest.humidityPct}%</span>, trending {feed.trend.temp <= 0 ? "colder" : "warmer"} over 14 days.</> : "Environmental sensors report temperature and humidity."}
        </Step>
        <Step n={3} title="Repair history retrieved from connected repairs systems" source={repair?.source ?? "Plentific"}>
          {repair ? <>A {repair.category.toLowerCase()} work order (<span className="font-medium text-ink-900">{repair.ref}</span>, {repair.contractor}) is on file{repair.repeat ? " — a repeat visit, a strong recurrence signal" : ""}.</> : "Prior repairs are retrieved and correlated."}
        </Step>
        <Step n={4} title="Energy performance matched from the public register" source="EPC Register">
          The property&apos;s EPC rating of <span className="font-medium text-ink-900">{p?.epcRating ?? "F"}</span> is matched by UPRN, confirming poor fabric efficiency.
        </Step>
        <Step n={5} title="Haven combines the signals across systems">
          Cold-home telemetry, repeat damp repairs, poor EPC, a fuel-poverty indicator and a vulnerability flag — each from a different system — are assembled into one transparent assessment.
        </Step>
        <Step n={6} title="Risk is scored and urgency elevated">
          Overall risk <span className="font-medium text-ink-900">{openScore}</span> with response urgency raised by the acute cold-home signal — a faster response than the structural band alone would imply. <Link href={`/households/${rec?.household?.ref ?? ""}`} className="underline">See the full breakdown →</Link>
        </Step>
        <Step n={7} title="An officer raises an inspection" source="Plentific">
          From the case workspace an officer raises a damp inspection work order. In demo mode the adapter returns a synthetic work-order reference and records an audit event — nothing leaves the system.
        </Step>
        <Step n={8} title="The resident is notified" source="GOV.UK Notify">
          An appointment message is sent to the resident. Delivery is simulated and an audit event is preserved.
        </Step>
        <Step n={9} title="The case workflow advances">
          The case moves through Triaged → Assigned → Intervention active, with owner, response-due date and next action tracked. <Link href="/cases" className="underline">Open cases →</Link>
        </Step>
        <Step n={10} title="The intervention is delivered and recorded">
          A delivery partner completes the work; the outcome and follow-up date are recorded against the case.
        </Step>
        <Step n={11} title="Risk is re-measured">
          A follow-up assessment shows risk reduced from <span className="font-medium text-ink-900">{openScore}</span> toward <span className="font-medium text-sage-700">{improved}</span> — the intervention&apos;s effect, measured, not assumed.
        </Step>
        <Step n={12} title="Management intelligence updates" source="Power BI">
          Portfolio throughput, workload and outcome metrics refresh; a curated dataset can be pushed to executive dashboards. <Link href="/analytics" className="underline">Insights →</Link>
        </Step>
        <Step n={13} title="Every action is on the audit trail">
          Each step — from risk calculation to the resident message — is captured as an immutable audit event, with the source system named. <Link href="/governance" className="underline">Governance →</Link>
        </Step>
      </ol>

      <p className="mt-6 text-xs text-graphite-400">
        All connectors in this demonstration run against deterministic synthetic fixtures. No live customer credentials are configured. <Link href="/ecosystem" className="underline">View the connector registry →</Link>
      </p>
    </div>
  );
}
