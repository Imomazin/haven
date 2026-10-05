import Link from "next/link";
import { getHouseholds } from "@/db/queries";
import { PageHeader, Table, EmptyState } from "@/components/ui";
import { RiskBadge } from "@/components/severity";
import { label } from "@/lib/format";
import { FUEL_POVERTY, RISK_BANDS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HouseholdsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const rows = await getHouseholds({ fuelPoverty: sp.fuelPoverty, band: sp.band, q: sp.q });

  return (
    <div>
      <PageHeader eyebrow="Portfolio" title="Households" description="Only the indicators needed for housing support — no medical histories, no unnecessary sensitive data." />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-graphite-200 bg-white p-3">
        <label className="flex flex-col text-xs font-medium text-graphite-500">Search<input name="q" defaultValue={sp.q} placeholder="Ref or locality" className="input mt-1 w-44" /></label>
        <label className="flex flex-col text-xs font-medium text-graphite-500">Fuel poverty
          <select name="fuelPoverty" defaultValue={sp.fuelPoverty ?? ""} className="input mt-1"><option value="">All</option>{FUEL_POVERTY.map((f) => <option key={f} value={f}>{label(f)}</option>)}</select>
        </label>
        <label className="flex flex-col text-xs font-medium text-graphite-500">Band
          <select name="band" defaultValue={sp.band ?? ""} className="input mt-1"><option value="">All</option>{RISK_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}</select>
        </label>
        <button className="btn-primary">Apply</button>
        <Link href="/households" className="btn-secondary">Reset</Link>
        <span className="ml-auto self-center text-sm text-graphite-500">{rows.length} households</span>
      </form>

      {rows.length === 0 ? (
        <EmptyState>No households match these filters.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <th className="th">Ref</th><th className="th">Property</th><th className="th">Size</th><th className="th">Fuel poverty</th><th className="th">Income risk</th><th className="th">Support need</th><th className="th">Energy use</th><th className="th">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-limestone-100">
            {rows.map((r) => (
              <tr key={r.household.id} className="hover:bg-limestone-100">
                <td className="td"><Link href={`/households/${r.household.ref}`} className="font-medium text-ink-900 underline">{r.household.ref}</Link></td>
                <td className="td"><Link href={`/properties/${r.property.ref}`} className="text-ink-700 underline">{r.property.ref}</Link><div className="text-xs text-graphite-500">{r.property.locality}</div></td>
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
