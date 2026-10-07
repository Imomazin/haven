import { getAnalytics, getPortfolioStats, getOperational } from "@/db/queries";
import { PageHeader, Card, SectionTitle, Table, EmptyState, StatTile } from "@/components/ui";
import { StackedBandBar, SimpleBar, RiskReductionBar, TrendLines } from "@/components/charts";
import { label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [a, stats, ops] = await Promise.all([getAnalytics(), getPortfolioStats(), getOperational()]);
  const workloadData = ops.workload.map((w) => ({ name: w.team, value: w.open }));

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
  const completed = a.interventionOutcomes.find((o) => o.status === "completed")?.n ?? 0;
  const totalInt = a.interventionOutcomes.reduce((s, o) => s + Number(o.n), 0) || 1;

  return (
    <div>
      <PageHeader eyebrow="Insight" title="Analytics" description="Where risk concentrates, which interventions move the needle, and where problems recur." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Avg resolution" value={stats.avgResolutionDays != null ? `${stats.avgResolutionDays}d` : "—"} hint="Closed cases" tone="ink" />
        <StatTile label="Cases improving" value={stats.casesImproving} hint="Risk reduced at follow-up" tone="low" />
        <StatTile label="Interventions completed" value={completed} hint={`${Math.round((Number(completed) / totalInt) * 100)}% of all actions`} tone="ink" />
        <StatTile label="Overdue actions" value={stats.overdueActions} tone={stats.overdueActions > 0 ? "high" : "low"} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card><SectionTitle sub="Cases opened vs closed per month — throughput and resolution">Case throughput</SectionTitle><TrendLines data={ops.trend} /></Card>
        <Card><SectionTitle sub="Open cases per owning team — where the load sits">Workload by team</SectionTitle><SimpleBar data={workloadData} horizontal color="#2c4063" height={220} /></Card>
        <Card><SectionTitle sub="Households by band, worst-affected areas first">Risk by geography</SectionTitle><StackedBandBar data={localityData} /></Card>
        <Card><SectionTitle sub="Average overall risk score (0–100)">Risk by property type</SectionTitle><SimpleBar data={typeData} horizontal color="#213250" /></Card>
        <Card><SectionTitle sub="Highest-weighted risk theme per household">Primary risk driver</SectionTitle><SimpleBar data={primaryData} horizontal color="#bb5a32" /></Card>
        <Card><SectionTitle sub="Volume of each recommended action">Interventions by type</SectionTitle><SimpleBar data={intTypeData} horizontal color="#5c8868" /></Card>
        <Card className="lg:col-span-2">
          <SectionTitle sub="Opening vs follow-up risk — does intervention reduce risk?">Intervention effectiveness</SectionTitle>
          {reductionData.length ? <RiskReductionBar data={reductionData} /> : <EmptyState title="No follow-ups yet">Complete interventions and run a follow-up assessment to populate this.</EmptyState>}
        </Card>
      </div>

      <Card className="mt-5">
        <SectionTitle sub="Properties with 3+ interventions — candidates for a deeper fabric review">Recurring issues</SectionTitle>
        {a.repeatedIssues.length ? (
          <Table>
            <thead><tr><th className="th">Property</th><th className="th">Locality</th><th className="th">Interventions</th></tr></thead>
            <tbody>
              {a.repeatedIssues.map((r) => (
                <tr key={r.ref} className="border-t border-graphite-100 hover:bg-limestone-50"><td className="td font-medium">{r.ref}</td><td className="td">{r.locality}</td><td className="td tabular-nums">{Number(r.n)}</td></tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="No recurrence">No properties with three or more interventions.</EmptyState>
        )}
      </Card>
    </div>
  );
}
