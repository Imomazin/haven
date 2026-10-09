import Link from "next/link";
import { getRiskQueue, getFilterOptions, getPortfolioStats } from "@/db/queries";
import { PageHeader, Table, EmptyState } from "@/components/ui";
import { RiskBadge, UrgencyBadge, ConfidenceBadge, ReviewBadge, EscalationNote } from "@/components/severity";
import { label, formatDate } from "@/lib/format";
import { RISK_BANDS } from "@/lib/types";
import { openCaseForHousehold } from "@/app/actions";

export const dynamic = "force-dynamic";

const RAIL: Record<string, string> = {
  Critical: "border-risk-critical-500",
  High: "border-risk-high-500",
  Moderate: "border-risk-moderate-500",
  Low: "border-risk-low-500",
};

export default async function RiskQueuePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const filters = { band: sp.band, locality: sp.locality, propertyType: sp.propertyType, caseStatus: sp.caseStatus, q: sp.q, sort: sp.sort };
  const [rows, options, stats] = await Promise.all([getRiskQueue(filters), getFilterOptions(), getPortfolioStats()]);
  const exportQs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v)).toString();
  const bc = stats.bandCounts;

  const qsFor = (band?: string) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "band"));
    if (band) p.set("band", band);
    const s = p.toString();
    return `/risk-queue${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        eyebrow="Triage"
        title="Risk queue"
        description="Every monitored household, ranked by urgency then overall risk. Triage, assign and open a case from one place."
        actions={<a href={`/risk-queue/export${exportQs ? `?${exportQs}` : ""}`} className="btn-secondary">Export CSV</a>}
      />

      {/* Band quick-filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={qsFor()} className={`rounded-md border px-3 py-1.5 text-sm ${!sp.band ? "border-ink-700 bg-ink-800 text-white" : "border-graphite-300 bg-white text-ink-800 hover:bg-limestone-100"}`}>
          All <span className="tabular-nums opacity-70">{bc.Critical + bc.High + bc.Moderate + bc.Low}</span>
        </Link>
        {RISK_BANDS.slice().reverse().map((b) => {
          const active = sp.band === b;
          const dot = { Critical: "bg-risk-critical-500", High: "bg-risk-high-500", Moderate: "bg-risk-moderate-500", Low: "bg-risk-low-500" }[b];
          return (
            <Link key={b} href={qsFor(b)} className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${active ? "border-ink-700 bg-ink-800 text-white" : "border-graphite-300 bg-white text-ink-800 hover:bg-limestone-100"}`}>
              <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />{b} <span className="tabular-nums opacity-70">{bc[b]}</span>
            </Link>
          );
        })}
      </div>

      {/* Filters */}
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-graphite-200/70 bg-white p-3 shadow-subtle">
        {sp.band && <input type="hidden" name="band" value={sp.band} />}
        <label className="flex flex-col gap-1"><span className="field-label">Search</span><input name="q" defaultValue={sp.q} placeholder="Ref or locality" className="input w-44" /></label>
        <label className="flex flex-col gap-1"><span className="field-label">Locality</span>
          <select name="locality" defaultValue={sp.locality ?? ""} className="input"><option value="">All</option>{options.localities.map((l) => <option key={l} value={l}>{l}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1"><span className="field-label">Property type</span>
          <select name="propertyType" defaultValue={sp.propertyType ?? ""} className="input"><option value="">All</option>{options.propertyTypes.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1"><span className="field-label">Sort</span>
          <select name="sort" defaultValue={sp.sort ?? ""} className="input"><option value="">Urgency</option><option value="score">Overall score</option><option value="locality">Locality</option></select>
        </label>
        <button type="submit" className="btn-primary">Apply</button>
        <Link href="/risk-queue" className="btn-ghost">Reset</Link>
        <span className="ml-auto self-center text-sm text-graphite-500">{rows.length} household{rows.length === 1 ? "" : "s"}</span>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Nothing matches">Adjust the filters, or reset to see the full queue.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <th className="th">Property / household</th>
              <th className="th">Risk</th>
              <th className="th">Why</th>
              <th className="th">Confidence</th>
              <th className="th">Urgency</th>
              <th className="th">Owner</th>
              <th className="th">Response due</th>
              <th className="th">Case</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const overdue = r.responseDueAt && new Date(r.responseDueAt) < new Date();
              return (
                <tr key={r.householdRef} className="border-t border-graphite-100 hover:bg-limestone-50">
                  <td className={`td rail ${RAIL[r.band] ?? "border-graphite-300"}`}>
                    <Link href={`/properties/${r.propertyRef}`} className="font-medium text-ink-900 hover:underline">{r.propertyRef}</Link>
                    <div className="text-xs text-graphite-500">{r.locality} · {label(r.propertyType)}</div>
                    <div className="text-xs text-graphite-400">{r.householdRef}</div>
                  </td>
                  <td className="td"><RiskBadge band={r.band} score={r.overallScore} /><div className="mt-1"><ReviewBadge status={r.reviewStatus} /></div></td>
                  <td className="td"><div className="text-ink-900">{label(r.primaryRisk)}</div>{r.secondaryRisk && <div className="text-xs text-graphite-500">then {label(r.secondaryRisk)}</div>}</td>
                  <td className="td"><ConfidenceBadge confidence={r.confidence} /></td>
                  <td className="td"><UrgencyBadge urgency={r.urgency} escalated={r.urgencyEscalated} />{r.urgencyEscalated && r.urgencyReason && <div className="mt-1 max-w-[12rem]"><EscalationNote reason={r.urgencyReason} /></div>}</td>
                  <td className="td">{r.ownerTeam ? (<><div className="text-sm">{r.ownerTeam}</div><div className="text-xs text-graphite-500">{r.ownerName ?? "Unassigned"}</div></>) : <span className="text-graphite-400">—</span>}</td>
                  <td className="td">{r.responseDueAt ? (<span className={overdue ? "font-medium text-risk-critical-700" : "text-graphite-700"}>{formatDate(r.responseDueAt)}{overdue && <span className="block text-xs">overdue</span>}</span>) : "—"}</td>
                  <td className="td">
                    {r.caseRef ? (
                      <Link href={`/cases/${r.caseRef}`} className="font-medium text-ink-700 hover:underline">{r.caseRef}</Link>
                    ) : (
                      <form action={openCaseForHousehold}>
                        <input type="hidden" name="householdRef" value={r.householdRef} />
                        <button className="btn-accent px-2.5 py-1 text-xs">Open case</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
