import Link from "next/link";
import { getHouseholds } from "@/db/queries";
import { PageHeader, Table, EmptyState } from "@/components/ui";
import { RiskBadge } from "@/components/severity";
import { label } from "@/lib/format";
import { FUEL_POVERTY, RISK_BANDS } from "@/lib/types";

export const dynamic = "force-dynamic";

const RAIL: Record<string, string> = { Critical: "border-risk-critical-500", High: "border-risk-high-500", Moderate: "border-risk-moderate-500", Low: "border-risk-low-500" };

export default async function HouseholdsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const rows = await getHouseholds({ fuelPoverty: sp.fuelPoverty, band: sp.band, q: sp.q });

  return (
    <div>
      <PageHeader eyebrow="Portfolio" title="Households" description="Only the indicators needed for housing support — no medical histories, no unnecessary sensitive data." />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-graphite-200/70 bg-white p-3 shadow-subtle">
        <label className="flex flex-col gap-1"><span className="field-label">Search</span><input name="q" defaultValue={sp.q} placeholder="Ref or locality" className="input w-44" /></label>
        <label className="flex flex-col gap-1"><span className="field-label">Fuel poverty</span>
          <select name="fuelPoverty" defaultValue={sp.fuelPoverty ?? ""} className="input"><option value="">All</option>{FUEL_POVERTY.map((f) => <option key={f} value={f}>{label(f)}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1"><span className="field-label">Band</span>
          <select name="band" defaultValue={sp.band ?? ""} className="input"><option value="">All</option>{RISK_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}</select>
        </label>
        <button className="btn-primary">Apply</button>
        <Link href="/households" className="btn-ghost">Reset</Link>
        <span className="ml-auto self-center text-sm text-graphite-500">{rows.length} households</span>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Nothing matches">Adjust the filters or reset.</EmptyState>
      ) : (
        <Table>
          <thead><tr>
            <th className="th">Reference</th><th className="th">Property</th><th className="th">Size</th><th className="th">Fuel poverty</th><th className="th">Income</th><th className="th">Support need</th><th className="th">Energy use</th><th className="th">Risk</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.household.id} className="border-t border-graphite-100 hover:bg-limestone-50">
                <td className={`td rail ${r.band ? RAIL[r.band] : "border-graphite-200"}`}><Link href={`/households/${r.household.ref}`} className="font-medium text-ink-900 hover:underline">{r.household.ref}</Link></td>
                <td className="td"><Link href={`/properties/${r.property.ref}`} className="text-ink-700 hover:underline">{r.property.ref}</Link><div className="text-xs text-graphite-500">{r.property.locality}</div></td>
                <td className="td tabular-nums">{r.household.householdSize}</td>
                <td className="td">{label(r.household.fuelPovertyIndicator)}</td>
                <td className="td">{label(r.household.incomeRiskIndicator)}</td>
                <td className="td">{label(r.household.healthVulnerability)}{r.household.mobilitySupport ? " · mobility" : ""}</td>
                <td className="td">{label(r.household.energyUsePattern)}</td>
                <td className="td">{r.band ? <RiskBadge band={r.band} score={r.score ?? undefined} /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
