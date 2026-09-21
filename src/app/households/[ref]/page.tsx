import Link from "next/link";
import { notFound } from "next/navigation";
import { getHouseholdByRef } from "@/db/queries";
import { PageHeader, Card, SectionTitle, Definition } from "@/components/ui";
import { RiskExplanation } from "@/components/risk-explanation";
import { StatusPill } from "@/components/severity";
import { label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HouseholdDetail({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const rec = await getHouseholdByRef(ref);
  if (!rec) notFound();
  const h = rec.household;

  return (
    <div>
      <PageHeader
        title={`Household ${h.ref}`}
        description={`At ${rec.property.ref} · ${rec.property.locality}`}
        actions={<Link href="/households" className="btn-secondary">← All households</Link>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <SectionTitle sub="Non-clinical support indicators only">Circumstances</SectionTitle>
          <dl>
            <Definition term="Household size">{h.householdSize}</Definition>
            <Definition term="Adults 65+">{h.adultsOver65}</Definition>
            <Definition term="Children under 5">{h.childrenUnder5}</Definition>
            <Definition term="Children present">{h.childrenPresent ? "Yes" : "No"}</Definition>
            <Definition term="Recent household change">{h.recentHouseholdChange ? "Yes" : "No"}</Definition>
          </dl>
        </Card>
        <Card>
          <SectionTitle>Support &amp; affordability</SectionTitle>
          <dl>
            <Definition term="Fuel poverty">{label(h.fuelPovertyIndicator)}</Definition>
            <Definition term="Income risk">{label(h.incomeRiskIndicator)}</Definition>
            <Definition term="Energy-use pattern">{label(h.energyUsePattern)}</Definition>
            <Definition term="Mobility support">{h.mobilitySupport ? "Flagged" : "No"}</Definition>
            <Definition term="Health-related support need">{label(h.healthVulnerability)} <span className="text-xs text-navy-400">(self-declared, non-clinical)</span></Definition>
          </dl>
        </Card>
        <Card>
          <SectionTitle>Property</SectionTitle>
          <dl>
            <Definition term="Reference"><Link href={`/properties/${rec.property.ref}`} className="text-teal-700 underline">{rec.property.ref}</Link></Definition>
            <Definition term="Type">{label(rec.property.propertyType)}</Definition>
            <Definition term="EPC">{rec.property.epcRating}</Definition>
            <Definition term="Heating">{label(rec.property.heatingType)}</Definition>
          </dl>
          <div className="mt-3">
            <SectionTitle>Cases</SectionTitle>
            {rec.cases.length ? (
              <ul className="space-y-1 text-sm">
                {rec.cases.map((c) => (
                  <li key={c.ref} className="flex items-center justify-between"><Link href={`/cases/${c.ref}`} className="text-teal-700 underline">{c.ref}</Link><StatusPill status={c.status} /></li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-navy-400">No cases opened.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <SectionTitle sub="Combines this household with its property signals">Risk assessment</SectionTitle>
        <RiskExplanation a={rec.assessment} />
      </Card>
    </div>
  );
}
