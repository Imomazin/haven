import Link from "next/link";
import { getPlaces } from "@/db/queries";
import { PageHeader, Card, SectionTitle, SegmentBar } from "@/components/ui";
import { PlaceMap } from "@/components/place-map";
import { label } from "@/lib/format";

export const dynamic = "force-dynamic";

const BAND_CHIP: Record<string, string> = {
  Critical: "bg-risk-critical-50 text-risk-critical-700 border-risk-critical-200",
  High: "bg-risk-high-50 text-risk-high-700 border-risk-high-200",
  Moderate: "bg-risk-moderate-50 text-risk-moderate-700 border-risk-moderate-200",
  Low: "bg-risk-low-50 text-risk-low-700 border-risk-low-200",
};

export default async function PlacePage() {
  const places = await getPlaces();
  const totalHigh = places.reduce((s, p) => s + p.highCritical, 0);
  const totalOpen = places.reduce((s, p) => s + p.openCases, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Place"
        title="Neighbourhoods"
        description={`Place-based risk across ${places.length} Inverclyde areas — ${totalHigh} high or critical households and ${totalOpen} open cases.`}
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card><SectionTitle sub="Select an area to triage its households">Risk map</SectionTitle><PlaceMap places={places} /></Card>
        <Card>
          <SectionTitle sub="Ranked by high & critical households">League table</SectionTitle>
          <ol className="divide-y divide-graphite-100">
            {places.map((p, i) => (
              <li key={p.locality} className="flex items-center gap-3 py-2">
                <span className="w-4 text-right text-xs tabular-nums text-graphite-400">{i + 1}</span>
                <Link href={`/risk-queue?locality=${encodeURIComponent(p.locality)}`} className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900 hover:underline">{p.locality}</Link>
                <span className="tabular-nums text-xs text-graphite-600">{p.highCritical}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {places.map((p) => (
          <div key={p.locality} className="panel p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink-900">{p.locality}</h3>
                <p className="text-xs text-graphite-500">{p.households} households monitored</p>
              </div>
              <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${BAND_CHIP[p.topBand]}`}>{p.topBand}</span>
            </div>
            <div className="mt-3">
              <SegmentBar segments={[{ label: "Critical", value: p.bands.Critical, className: "bg-risk-critical-500" }, { label: "High", value: p.bands.High, className: "bg-risk-high-500" }, { label: "Moderate", value: p.bands.Moderate, className: "bg-risk-moderate-500" }, { label: "Low", value: p.bands.Low, className: "bg-risk-low-500" }]} />
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div><dt className="text-[11px] text-graphite-500">High/Critical</dt><dd className="font-semibold tabular-nums text-ink-900">{p.highCritical}</dd></div>
              <div><dt className="text-[11px] text-graphite-500">Open cases</dt><dd className="font-semibold tabular-nums text-ink-900">{p.openCases}</dd></div>
              <div><dt className="text-[11px] text-graphite-500">Lead theme</dt><dd className="truncate text-sm font-medium text-ink-900">{label(p.dominantRisk)}</dd></div>
            </dl>
            <Link href={`/risk-queue?locality=${encodeURIComponent(p.locality)}`} className="mt-4 inline-block text-sm font-medium text-ink-700 hover:underline">Triage {p.locality} →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
