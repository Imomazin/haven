import Link from "next/link";
import { notFound } from "next/navigation";
import { getPropertyByRef } from "@/db/queries";
import { Card, SectionTitle, Definition } from "@/components/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PropertyCondition } from "@/components/property-condition";
import { RiskBadge, StatusPill } from "@/components/severity";
import { SensorTelemetry, RepairHistory } from "@/components/telemetry";
import { SourceBadge } from "@/components/source-badge";
import { sensorFeed, repairsForProperty, uprnFor, simdDecile } from "@/integrations/fixtures";
import { label } from "@/lib/format";

export const dynamic = "force-dynamic";

function epcTone(epc: string) {
  if (["A", "B", "C"].includes(epc)) return "bg-risk-low-50 text-risk-low-700 border-risk-low-200";
  if (["D"].includes(epc)) return "bg-risk-moderate-50 text-risk-moderate-700 border-risk-moderate-200";
  return "bg-risk-high-50 text-risk-high-700 border-risk-high-200";
}

export default async function PropertyDetail({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const rec = await getPropertyByRef(ref);
  if (!rec) notFound();
  const p = rec.property;
  const feed = sensorFeed(p.id, p.indoorWinterTempC, p.indoorHumidityPct, p.co2Ppm);
  const repairs = repairsForProperty(p.id, p.dampHistoryCount, p.mouldHistoryCount, p.openRepairs);
  const uprn = uprnFor(p.id);
  const simd = simdDecile(p.locality);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Properties", href: "/properties" }, { label: p.ref }]} />

      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-graphite-200/70 bg-white p-5 shadow-subtle sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Property dossier</p>
          <h1 className="font-display text-2xl font-semibold text-ink-900">{p.ref}</h1>
          <p className="mt-1 text-sm text-graphite-600">{label(p.propertyType)} · built {label(p.constructionEra)} · {p.locality}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-graphite-500">
            <span className="font-medium text-graphite-600">UPRN {uprn}</span>
            <SourceBadge source="OS Places" />
            <span>· reconciled across systems</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${epcTone(p.epcRating)}`}>EPC {p.epcRating}</span>
            {rec.assessment && <RiskBadge band={rec.assessment.band} score={rec.assessment.overallScore} />}
            {(p.dampHistoryCount > 0 || p.mouldHistoryCount > 0) && (
              <span className="inline-flex items-center rounded-md border border-risk-high-200 bg-risk-high-50 px-2 py-0.5 text-xs font-medium text-risk-high-700">Damp/mould history</span>
            )}
          </div>
        </div>
        <div className="w-full max-w-xs rounded-lg bg-limestone-100 p-4 text-sm">
          <p className="field-label">Household</p>
          {rec.household ? (
            <p className="mt-1"><Link href={`/households/${rec.household.ref}`} className="font-semibold text-ink-900 underline">{rec.household.ref}</Link><span className="text-graphite-600"> · {rec.household.householdSize}-person</span></p>
          ) : (
            <p className="mt-1 text-graphite-500">Void / monitored — no linked household.</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card><SectionTitle sub="Fabric & energy sourced from the HMS and EPC register">Fabric &amp; energy</SectionTitle>
          <dl>
            <Definition term="EPC rating">{p.epcRating} <SourceBadge source="EPC Register" /></Definition>
            <Definition term="Heating">{label(p.heatingType)}</Definition>
            <Definition term="Wall insulation">{label(p.wallInsulation)}</Definition>
            <Definition term="Loft insulation">{label(p.loftInsulation)}</Definition>
            <Definition term="Glazing">{label(p.glazing)}</Definition>
            <Definition term="Ventilation">{label(p.ventilation)}</Definition>
          </dl>
        </Card>
        <Card><SectionTitle sub="Aggregated from connected repairs systems">Repairs &amp; history</SectionTitle>
          <dl>
            <Definition term="Open repairs">{p.openRepairs}</Definition>
            <Definition term="Damp events (24m)">{p.dampHistoryCount}</Definition>
            <Definition term="Mould events (24m)">{p.mouldHistoryCount}</Definition>
            <Definition term="Records on file">{repairs.length}</Definition>
            <Definition term="Last repair">{p.lastRepairDaysAgo != null ? `${p.lastRepairDaysAgo} days ago` : "None on record"}</Definition>
          </dl>
          <p className="mt-2"><SourceBadge source="Civica Cx" /> <SourceBadge source="Plentific" /></p>
        </Card>
        <Card><SectionTitle sub="One property identity reconciled across systems">Asset identity</SectionTitle>
          <dl>
            <Definition term="UPRN">{uprn}</Definition>
            <Definition term="Property type">{label(p.propertyType)}</Definition>
            <Definition term="Construction">{label(p.constructionEra)}</Definition>
            <Definition term="SIMD decile">{simd} <span className="text-xs text-graphite-400">of 10{simd <= 3 ? " · most deprived" : simd >= 8 ? " · least deprived" : ""}</span></Definition>
            <Definition term="System of record">Civica Cx</Definition>
          </dl>
          <p className="mt-2"><SourceBadge source="OS Places" /> <SourceBadge source="SIMD" /></p>
        </Card>
      </div>

      {feed && (
        <Card className="mt-5">
          <SectionTitle sub="Live-style telemetry from the connected-home platform — anchored to the property's current readings">Connected-home telemetry</SectionTitle>
          <SensorTelemetry feed={feed} />
        </Card>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle sub="Fabric, environment and recurrence — recomputed live from stored signals">Condition &amp; hazard assessment</SectionTitle>
          {rec.assessment ? <PropertyCondition a={rec.assessment} p={p} householdRef={rec.household?.ref ?? null} /> : <p className="text-sm text-graphite-500">No household is currently linked to this property, so no live assessment is computed.</p>}
        </Card>
        <Card>
          <SectionTitle>Related cases</SectionTitle>
          {rec.cases.length ? (
            <ul className="space-y-1.5 text-sm">
              {rec.cases.map((c) => (
                <li key={c.ref} className="flex items-center justify-between gap-2"><Link href={`/cases/${c.ref}`} className="text-ink-700 underline">{c.ref}</Link><StatusPill status={c.status} /></li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-graphite-400">No cases opened.</p>
          )}
          <div className="mt-4 border-t border-graphite-100 pt-3 text-sm">
            <p className="field-label">Neighbourhood</p>
            <p className="mt-1 text-graphite-600">Part of <span className="font-medium text-ink-900">{p.locality}</span> · SIMD decile {simd}/10.</p>
            <Link href={`/risk-queue?locality=${encodeURIComponent(p.locality)}`} className="mt-1 inline-block text-ink-700 underline">See local risk →</Link>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <SectionTitle sub="Work orders and history aggregated from Civica Cx, Plentific and MRI Asset">Repairs — connected systems</SectionTitle>
        <RepairHistory repairs={repairs} />
      </Card>
    </div>
  );
}
