import Link from "next/link";
import { getProperties, getFilterOptions } from "@/db/queries";
import { PageHeader, Table, EmptyState } from "@/components/ui";
import { RiskBadge } from "@/components/severity";
import { label } from "@/lib/format";
import { RISK_BANDS } from "@/lib/types";

export const dynamic = "force-dynamic";

const RAIL: Record<string, string> = { Critical: "border-risk-critical-500", High: "border-risk-high-500", Moderate: "border-risk-moderate-500", Low: "border-risk-low-500" };

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const [rows, options] = await Promise.all([
    getProperties({ locality: sp.locality, propertyType: sp.propertyType, band: sp.band, q: sp.q }),
    getFilterOptions(),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Portfolio" title="Properties" description="The monitored stock — fabric, energy, environmental and repair signals behind every risk score." />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-graphite-200/70 bg-white p-3 shadow-subtle">
        <label className="flex flex-col gap-1"><span className="field-label">Search</span><input name="q" defaultValue={sp.q} placeholder="Ref or locality" className="input w-44" /></label>
        <label className="flex flex-col gap-1"><span className="field-label">Locality</span>
          <select name="locality" defaultValue={sp.locality ?? ""} className="input"><option value="">All</option>{options.localities.map((l) => <option key={l} value={l}>{l}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1"><span className="field-label">Type</span>
          <select name="propertyType" defaultValue={sp.propertyType ?? ""} className="input"><option value="">All</option>{options.propertyTypes.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1"><span className="field-label">Band</span>
          <select name="band" defaultValue={sp.band ?? ""} className="input"><option value="">All</option>{RISK_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}</select>
        </label>
        <button className="btn-primary">Apply</button>
        <Link href="/properties" className="btn-ghost">Reset</Link>
        <span className="ml-auto self-center text-sm text-graphite-500">{rows.length} properties</span>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Nothing matches">Adjust the filters or reset.</EmptyState>
      ) : (
        <Table>
          <thead><tr>
            <th className="th">Reference</th><th className="th">Locality</th><th className="th">Type / era</th><th className="th">EPC</th><th className="th">Heating</th><th className="th">Damp / mould</th><th className="th">Repairs</th><th className="th">Risk</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.property.id} className="border-t border-graphite-100 hover:bg-limestone-50">
                <td className={`td rail ${r.band ? RAIL[r.band] : "border-graphite-200"}`}><Link href={`/properties/${r.property.ref}`} className="font-medium text-ink-900 hover:underline">{r.property.ref}</Link></td>
                <td className="td">{r.property.locality}</td>
                <td className="td">{label(r.property.propertyType)}<div className="text-xs text-graphite-500">{label(r.property.constructionEra)}</div></td>
                <td className="td font-semibold tabular-nums">{r.property.epcRating}</td>
                <td className="td">{label(r.property.heatingType)}</td>
                <td className="td tabular-nums">{r.property.dampHistoryCount} / {r.property.mouldHistoryCount}</td>
                <td className="td tabular-nums">{r.property.openRepairs}</td>
                <td className="td">{r.band ? <RiskBadge band={r.band} score={r.score ?? undefined} /> : <span className="text-xs text-graphite-400">No household</span>}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
