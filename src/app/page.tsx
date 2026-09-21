import Link from "next/link";
import { getPortfolioStats, getRiskQueue } from "@/db/queries";
import { PageHeader, StatTile, Card, SectionTitle, LinkButton, Table } from "@/components/ui";
import { RiskBadge, UrgencyBadge } from "@/components/severity";
import { label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const stats = await getPortfolioStats();
  const queue = await getRiskQueue({});
  const top = queue.slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Portfolio overview"
        description="Which households and properties need attention now, why, and what should happen next. Signals across property condition, fuel poverty, environment and household circumstances are combined into a single prioritised view."
        actions={<LinkButton href="/risk-queue" variant="primary">Open risk queue →</LinkButton>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Properties monitored" value={stats.propertiesMonitored} />
        <StatTile label="Households represented" value={stats.householdsRepresented} />
        <StatTile label="Critical risk" value={stats.bandCounts.Critical} tone="critical" hint="Act now" />
        <StatTile label="High risk" value={stats.bandCounts.High} tone="high" hint="Act soon" />
        <StatTile label="Moderate risk" value={stats.bandCounts.Moderate} tone="moderate" hint="Plan action" />
        <StatTile label="Low risk" value={stats.bandCounts.Low} tone="low" hint="Monitor" />
        <StatTile label="Cases open" value={stats.casesOpen} tone="teal" />
        <StatTile label="Open interventions" value={stats.openInterventions} tone="teal" />
        <StatTile label="Overdue actions" value={stats.overdueActions} tone={stats.overdueActions > 0 ? "high" : "low"} hint="Past prototype response window" />
        <StatTile label="Cases improving" value={stats.casesImproving} tone="low" hint="Follow-up risk lower" />
        <StatTile label="Cases worsening" value={stats.casesWorsening} tone={stats.casesWorsening > 0 ? "high" : "low"} />
        <StatTile label="Avg resolution" value={stats.avgResolutionDays != null ? `${stats.avgResolutionDays}d` : "—"} hint="Closed cases" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <SectionTitle sub="Households flagged on each risk theme">Risk themes</SectionTitle>
          <ul className="space-y-2 text-sm">
            {[
              ["Fuel-poverty risk", stats.fuelPovertyCount],
              ["Damp risk", stats.dampRiskCount],
              ["Mould risk", stats.mouldRiskCount],
              ["Cold-home risk", stats.coldHomeCount],
              ["Building-fabric risk", stats.fabricRiskCount],
              ["Vulnerability indicators", stats.vulnerabilityCount],
            ].map(([name, n]) => (
              <li key={name as string} className="flex items-center justify-between border-b border-navy-50 pb-1.5">
                <span className="text-navy-700">{name}</span>
                <span className="font-semibold tabular-nums text-navy-900">{n}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <SectionTitle sub="Highest urgency across the portfolio right now">Top of the risk queue</SectionTitle>
            <Link href="/risk-queue" className="text-sm font-medium text-teal-700 underline">
              View all
            </Link>
          </div>
          <Table>
            <thead>
              <tr>
                <th className="th">Property</th>
                <th className="th">Overall</th>
                <th className="th">Primary risk</th>
                <th className="th">Urgency</th>
                <th className="th">Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {top.map((r) => (
                <tr key={r.householdRef} className="hover:bg-navy-50">
                  <td className="td">
                    <Link href={`/properties/${r.propertyRef}`} className="font-medium text-navy-800 underline">
                      {r.propertyRef}
                    </Link>
                    <div className="text-xs text-navy-500">{r.locality} · {r.householdRef}</div>
                  </td>
                  <td className="td"><RiskBadge band={r.band} score={r.overallScore} /></td>
                  <td className="td">{label(r.primaryRisk)}</td>
                  <td className="td"><UrgencyBadge urgency={r.urgency} /></td>
                  <td className="td">
                    {r.caseRef ? (
                      <Link href={`/cases/${r.caseRef}`} className="text-teal-700 underline">{r.caseRef}</Link>
                    ) : (
                      <span className="text-navy-400">No case</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <SectionTitle>Guided demo</SectionTitle>
          <p className="text-sm text-navy-600">Walk a case from risk to intervention to measured risk reduction in 6–8 minutes.</p>
          <div className="mt-3"><LinkButton href="/demo" variant="teal">Open demo script</LinkButton></div>
        </Card>
        <Card>
          <SectionTitle>How risk is scored</SectionTitle>
          <p className="text-sm text-navy-600">Transparent, rule-based scoring across six dimensions. No black box.</p>
          <div className="mt-3"><LinkButton href="/methodology">View methodology</LinkButton></div>
        </Card>
        <Card>
          <SectionTitle>Governance</SectionTitle>
          <p className="text-sm text-navy-600">Data sources, provenance, lawful-basis placeholders and audit trail.</p>
          <div className="mt-3"><LinkButton href="/governance">View governance</LinkButton></div>
        </Card>
      </div>
    </div>
  );
}
