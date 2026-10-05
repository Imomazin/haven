import Link from "next/link";
import { notFound } from "next/navigation";
import { getPropertyByRef } from "@/db/queries";
import { PageHeader, Card, SectionTitle, Definition } from "@/components/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RiskExplanation } from "@/components/risk-explanation";
import { StatusPill } from "@/components/severity";
import { label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PropertyDetail({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const rec = await getPropertyByRef(ref);
  if (!rec) notFound();
  const p = rec.property;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Properties", href: "/properties" }, { label: p.ref }]} />
      <PageHeader
        title={`Property ${p.ref}`}
        description={`${label(p.propertyType)} · ${p.locality} · built ${label(p.constructionEra)}`}
        actions={<Link href="/properties" className="btn-secondary">← All properties</Link>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <SectionTitle>Fabric &amp; energy</SectionTitle>
          <dl>
            <Definition term="EPC rating">{p.epcRating}</Definition>
            <Definition term="Heating">{label(p.heatingType)}</Definition>
            <Definition term="Wall insulation">{label(p.wallInsulation)}</Definition>
            <Definition term="Loft insulation">{label(p.loftInsulation)}</Definition>
            <Definition term="Glazing">{label(p.glazing)}</Definition>
            <Definition term="Ventilation">{label(p.ventilation)}</Definition>
          </dl>
        </Card>
        <Card>
          <SectionTitle>Repairs &amp; history</SectionTitle>
          <dl>
            <Definition term="Open repairs">{p.openRepairs}</Definition>
            <Definition term="Damp events (24m)">{p.dampHistoryCount}</Definition>
            <Definition term="Mould events (24m)">{p.mouldHistoryCount}</Definition>
            <Definition term="Last repair">{p.lastRepairDaysAgo != null ? `${p.lastRepairDaysAgo} days ago` : "None on record"}</Definition>
          </dl>
        </Card>
        <Card>
          <SectionTitle sub="From environmental sensors (demo adapter)">Environmental readings</SectionTitle>
          <dl>
            <Definition term="Indoor humidity">{p.indoorHumidityPct != null ? `${p.indoorHumidityPct}%` : "No reading"}</Definition>
            <Definition term="Winter temperature">{p.indoorWinterTempC != null ? `${p.indoorWinterTempC}°C` : "No reading"}</Definition>
            <Definition term="CO₂">{p.co2Ppm != null ? `${p.co2Ppm} ppm` : "No reading"}</Definition>
            <Definition term="Readings age">{p.readingsAgeDays != null ? `${p.readingsAgeDays} days` : "—"}</Definition>
          </dl>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle sub="Recomputed live from stored signals by the transparent risk engine">Risk assessment</SectionTitle>
          {rec.assessment ? <RiskExplanation a={rec.assessment} /> : <p className="text-sm text-navy-500">No household is currently linked to this property, so no household-level risk is assessed.</p>}
        </Card>
        <div className="space-y-4">
          <Card>
            <SectionTitle>Household</SectionTitle>
            {rec.household ? (
              <p className="text-sm">
                <Link href={`/households/${rec.household.ref}`} className="font-medium text-teal-700 underline">{rec.household.ref}</Link>
                <span className="text-navy-500"> · {rec.household.householdSize}-person household</span>
              </p>
            ) : (
              <p className="text-sm text-navy-400">No linked household (void / monitored).</p>
            )}
          </Card>
          <Card>
            <SectionTitle>Related cases</SectionTitle>
            {rec.cases.length ? (
              <ul className="space-y-2 text-sm">
                {rec.cases.map((c) => (
                  <li key={c.ref} className="flex items-center justify-between gap-2">
                    <Link href={`/cases/${c.ref}`} className="text-teal-700 underline">{c.ref}</Link>
                    <StatusPill status={c.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-navy-400">No cases opened.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
