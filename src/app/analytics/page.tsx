import { getAnalytics } from "@/db/queries";
import { PageHeader, Card, SectionTitle, Table, EmptyState } from "@/components/ui";
import { StackedBandBar, SimpleBar, RiskReductionBar } from "@/components/charts";
import { label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const a = await getAnalytics();

  // Pivot risk-by-locality into stacked band data.
  const locMap = new Map<string, { name: string; Critical: number; High: number; Moderate: number; Low: number }>();
  for (const r of a.byLocality) {
    const row = locMap.get(r.locality) ?? { name: r.locality, Critical: 0, High: 0, Moderate: 0, Low: 0 };
    if (r.band in row) (row as Record<string, number | string>)[r.band] = Number(r.n);
    locMap.set(r.locality, row);
  }
  const localityData = [...locMap.values()].sort((x, y) => y.Critical + y.High - (x.Critical + x.High));

  const typeData = a.byType.map((r) => ({ name: label(r.type), value: Math.round(Number(r.avgScore)) })).sort((x, y) => y.value - x.value);
  const primaryData = a.byPrimary.map((r) => ({ name: label(r.primary), value: Number(r.n) })).sort((x, y) => y.value - x.value);
  const intTypeData = a.interventionsByType.map((r) => ({ name: r.type.replace(/_/g, " "), value: Number(r.n) })).sort((x, y) => y.value - x.value);
  const reductionData = a.riskReduction.slice(0, 8).map((r) => ({ name: r.ref, opening: r.opening ?? 0, followup: r.followup ?? 0 }));

  return (
    <div>
      <PageHeader title="Analytics" description="Operational analytics that answer real questions: where risk concentrates, which interventions move the needle, and where problems recur." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle sub="Households by risk band, worst-affected areas first">Risk by geography</SectionTitle>
          <StackedBandBar data={localityData} />
        </Card>
        <Card>
          <SectionTitle sub="Average overall risk score (0–100)">Risk by property type</SectionTitle>
          <SimpleBar data={typeData} horizontal color="#256962" />
        </Card>
        <Card>
          <SectionTitle sub="Which theme drives the highest-weighted risk">Primary risk driver</SectionTitle>
          <SimpleBar data={primaryData} horizontal color="#2f4c7e" />
        </Card>
        <Card>
          <SectionTitle sub="Volume of each intervention type recommended">Interventions by type</SectionTitle>
          <SimpleBar data={intTypeData} horizontal color="#469f97" />
        </Card>
        <Card className="lg:col-span-2">
          <SectionTitle sub="Opening vs follow-up risk for cases with a measured reassessment — does intervention reduce risk?">Risk reduction (intervention effectiveness)</SectionTitle>
          {reductionData.length ? <RiskReductionBar data={reductionData} /> : <EmptyState>No follow-up assessments recorded yet.</EmptyState>}
        </Card>
      </div>

      <Card className="mt-4">
        <SectionTitle sub="Properties with 3 or more interventions — candidates for a deeper fabric review">Recurring issues</SectionTitle>
        {a.repeatedIssues.length ? (
          <Table>
            <thead><tr><th className="th">Property</th><th className="th">Locality</th><th className="th">Interventions</th></tr></thead>
            <tbody className="divide-y divide-navy-50">
              {a.repeatedIssues.map((r) => (
                <tr key={r.ref}><td className="td font-medium">{r.ref}</td><td className="td">{r.locality}</td><td className="td tabular-nums">{Number(r.n)}</td></tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState>No properties with repeated interventions.</EmptyState>
        )}
      </Card>
    </div>
  );
}
