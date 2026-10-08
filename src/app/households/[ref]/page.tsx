import Link from "next/link";
import { notFound } from "next/navigation";
import { getHouseholdByRef, toRiskInput } from "@/db/queries";
import { recommendInterventions } from "@/lib/intervention-engine";
import { openCaseForHousehold } from "@/app/actions";
import { compositionSummary, safeguardingFlags } from "@/lib/places";
import { Card, SectionTitle, Definition } from "@/components/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RiskExplanation } from "@/components/risk-explanation";
import { RiskBadge, StatusPill, UrgencyBadge, ConfidenceBadge } from "@/components/severity";
import { label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HouseholdDetail({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const rec = await getHouseholdByRef(ref);
  if (!rec) notFound();
  const { household: h, property: p, assessment: a, cases } = rec;
  const recs = recommendInterventions(toRiskInput(p, h), a);
  const nextStep = recs[0];
  const openCase = cases.find((c) => c.status !== "closed") ?? cases[0];
  const composition = compositionSummary(h);
  const flags = safeguardingFlags(h, a.band);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Households", href: "/households" }, { label: h.ref }]} />

      {/* Dossier header */}
      <div className="mb-5 overflow-hidden rounded-xl border border-graphite-200/70 bg-white shadow-subtle">
        <div className="flex flex-col gap-4 border-b border-graphite-100 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow mb-1">Household dossier</p>
            <h1 className="font-display text-2xl font-semibold text-ink-900">{h.ref}</h1>
            <p className="mt-1 text-sm text-graphite-600">
              {composition} at <Link href={`/properties/${p.ref}`} className="text-ink-700 underline">{p.ref}</Link> · <Link href={`/risk-queue?locality=${encodeURIComponent(p.locality)}`} className="text-ink-700 underline">{p.locality}</Link> · {label(p.propertyType)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RiskBadge band={a.band} score={a.overallScore} />
              <UrgencyBadge urgency={a.urgency} />
              <ConfidenceBadge confidence={a.confidence} />
            </div>
          </div>
          <div className="w-full max-w-xs rounded-lg bg-limestone-100 p-4">
            <p className="field-label">Recommended next step</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{nextStep ? nextStep.label : "Monitor — no action indicated"}</p>
            {nextStep && <p className="mt-0.5 text-xs text-graphite-600">{nextStep.reason} · {nextStep.team}</p>}
            <div className="mt-3">
              {openCase ? (
                <Link href={`/cases/${openCase.ref}`} className="btn-primary w-full">View case {openCase.ref}</Link>
              ) : (
                <form action={openCaseForHousehold}>
                  <input type="hidden" name="householdRef" value={h.ref} />
                  <button className="btn-accent w-full">Open a case</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {flags.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border-l-4 border-terracotta-500 bg-terracotta-50 px-4 py-3">
          <span className="field-label text-terracotta-700">Safeguarding signals</span>
          {flags.map((f) => (
            <span key={f} className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-ink-800 shadow-subtle">{f}</span>
          ))}
          <span className="ml-auto text-[11px] text-graphite-500">Non-clinical indicators for review — not a determination.</span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle sub="Combines household and property signals — recomputed from source by the transparent engine">Why this risk</SectionTitle>
          <RiskExplanation a={a} />
        </Card>

        <div className="space-y-5">
          <Card>
            <SectionTitle>Composition</SectionTitle>
            <dl>
              <Definition term="Household size">{h.householdSize}</Definition>
              <Definition term="Adults 65+">{h.adultsOver65}</Definition>
              <Definition term="Children under 5">{h.childrenUnder5}</Definition>
              <Definition term="Children present">{h.childrenPresent ? "Yes" : "No"}</Definition>
              <Definition term="Recent change">{h.recentHouseholdChange ? "Yes" : "No"}</Definition>
            </dl>
          </Card>
          <Card>
            <SectionTitle>Support &amp; affordability</SectionTitle>
            <dl>
              <Definition term="Fuel poverty">{label(h.fuelPovertyIndicator)}</Definition>
              <Definition term="Income risk">{label(h.incomeRiskIndicator)}</Definition>
              <Definition term="Energy use">{label(h.energyUsePattern)}</Definition>
              <Definition term="Mobility support">{h.mobilitySupport ? "Flagged" : "No"}</Definition>
              <Definition term="Support need">{label(h.healthVulnerability)}</Definition>
            </dl>
            <p className="mt-2 text-[11px] text-graphite-400">Support need is a non-clinical, self-declared indicator — not a diagnosis.</p>
          </Card>
          <Card>
            <SectionTitle>Cases</SectionTitle>
            {cases.length ? (
              <ul className="space-y-1.5 text-sm">
                {cases.map((c) => (
                  <li key={c.ref} className="flex items-center justify-between gap-2"><Link href={`/cases/${c.ref}`} className="text-ink-700 underline">{c.ref}</Link><StatusPill status={c.status} /></li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-graphite-400">No cases opened.</p>
            )}
          </Card>
          <Card>
            <SectionTitle>Neighbourhood</SectionTitle>
            <p className="text-sm text-graphite-600">
              This household sits within <span className="font-medium text-ink-900">{p.locality}</span>. Compare it against the wider area to see whether risk here is isolated or part of a local cluster.
            </p>
            <div className="mt-3 flex flex-col gap-1.5 text-sm">
              <Link href={`/risk-queue?locality=${encodeURIComponent(p.locality)}`} className="text-ink-700 underline">Triage {p.locality} →</Link>
              <Link href="/place" className="text-ink-700 underline">View all neighbourhoods →</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
