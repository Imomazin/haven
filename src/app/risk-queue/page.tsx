import Link from "next/link";
import { getRiskQueue, getFilterOptions } from "@/db/queries";
import { PageHeader, Table, EmptyState } from "@/components/ui";
import { RiskBadge, UrgencyBadge, ConfidenceBadge, ReviewBadge } from "@/components/severity";
import { label, formatDate } from "@/lib/format";
import { RISK_BANDS } from "@/lib/types";
import { openCaseForHousehold } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function RiskQueuePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const filters = { band: sp.band, locality: sp.locality, propertyType: sp.propertyType, caseStatus: sp.caseStatus, q: sp.q, sort: sp.sort };
  const [rows, options] = await Promise.all([getRiskQueue(filters), getFilterOptions()]);
  const exportQs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v)).toString();

  return (
    <div>
      <PageHeader
        title="Risk triage queue"
        description="A serious work queue: every monitored household ranked by urgency then overall risk. Search, filter, and open a case to act."
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-navy-100 bg-white p-3">
        <label className="flex flex-col text-xs font-medium text-navy-500">
          Search
          <input name="q" defaultValue={sp.q} placeholder="Ref or locality" className="input mt-1 w-44" />
        </label>
        <label className="flex flex-col text-xs font-medium text-navy-500">
          Risk band
          <select name="band" defaultValue={sp.band ?? ""} className="input mt-1">
            <option value="">All</option>
            {RISK_BANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium text-navy-500">
          Locality
          <select name="locality" defaultValue={sp.locality ?? ""} className="input mt-1">
            <option value="">All</option>
            {options.localities.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium text-navy-500">
          Property type
          <select name="propertyType" defaultValue={sp.propertyType ?? ""} className="input mt-1">
            <option value="">All</option>
            {options.propertyTypes.map((t) => (
              <option key={t} value={t}>{label(t)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium text-navy-500">
          Sort
          <select name="sort" defaultValue={sp.sort ?? ""} className="input mt-1">
            <option value="">Urgency</option>
            <option value="score">Overall score</option>
            <option value="locality">Locality</option>
          </select>
        </label>
        <button type="submit" className="btn-primary">Apply</button>
        <Link href="/risk-queue" className="btn-secondary">Reset</Link>
        <a href={`/risk-queue/export${exportQs ? `?${exportQs}` : ""}`} className="btn-secondary">Export CSV</a>
        <span className="ml-auto self-center text-sm text-navy-500">{rows.length} household{rows.length === 1 ? "" : "s"}</span>
      </form>

      {rows.length === 0 ? (
        <EmptyState>No households match these filters.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <th className="th">Property / household</th>
              <th className="th">Overall risk</th>
              <th className="th">Primary / secondary</th>
              <th className="th">Confidence</th>
              <th className="th">Urgency</th>
              <th className="th">Team / owner</th>
              <th className="th">Days open</th>
              <th className="th">Response due</th>
              <th className="th">Case</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50">
            {rows.map((r) => (
              <tr key={r.householdRef} className="hover:bg-navy-50">
                <td className="td">
                  <Link href={`/properties/${r.propertyRef}`} className="font-medium text-navy-800 underline">{r.propertyRef}</Link>
                  <div className="text-xs text-navy-500">{r.locality} · {label(r.propertyType)}</div>
                  <div className="text-xs text-navy-400">{r.householdRef}</div>
                </td>
                <td className="td">
                  <RiskBadge band={r.band} score={r.overallScore} />
                  <div className="mt-1"><ReviewBadge status={r.reviewStatus} /></div>
                </td>
                <td className="td">
                  <div>{label(r.primaryRisk)}</div>
                  {r.secondaryRisk && <div className="text-xs text-navy-500">then {label(r.secondaryRisk)}</div>}
                </td>
                <td className="td"><ConfidenceBadge confidence={r.confidence} /></td>
                <td className="td"><UrgencyBadge urgency={r.urgency} /></td>
                <td className="td">
                  {r.ownerTeam ? (
                    <>
                      <div>{r.ownerTeam}</div>
                      <div className="text-xs text-navy-500">{r.ownerName ?? "Unassigned"}</div>
                    </>
                  ) : (
                    <span className="text-navy-400">—</span>
                  )}
                </td>
                <td className="td tabular-nums">{r.daysOpen ?? "—"}</td>
                <td className="td">
                  {r.responseDueAt ? (
                    <span className={new Date(r.responseDueAt) < new Date() ? "font-medium text-red-700" : ""}>
                      {formatDate(r.responseDueAt)}
                      {new Date(r.responseDueAt) < new Date() && <span className="ml-1 text-xs">(overdue)</span>}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="td">
                  {r.caseRef ? (
                    <Link href={`/cases/${r.caseRef}`} className="text-teal-700 underline">{r.caseRef}</Link>
                  ) : (
                    <form action={openCaseForHousehold}>
                      <input type="hidden" name="householdRef" value={r.householdRef} />
                      <button className="btn-teal py-1 text-xs">Open case</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
