import Link from "next/link";
import { getCases } from "@/db/queries";
import { PageHeader, Table, EmptyState } from "@/components/ui";
import { RiskBadge, StatusPill } from "@/components/severity";
import { formatDate, daysBetween } from "@/lib/format";
import { CASE_STATUSES, TEAMS, RISK_BANDS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CasesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const rows = await getCases({ status: sp.status, team: sp.team, band: sp.band, q: sp.q });

  return (
    <div>
      <PageHeader title="Cases" description="Case management with real persistence: assign, act, escalate, record outcomes and close. Every change is written to the database and the audit trail." />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-navy-100 bg-white p-3">
        <label className="flex flex-col text-xs font-medium text-navy-500">Search<input name="q" defaultValue={sp.q} placeholder="Ref or title" className="input mt-1 w-44" /></label>
        <label className="flex flex-col text-xs font-medium text-navy-500">Status
          <select name="status" defaultValue={sp.status ?? ""} className="input mt-1"><option value="">All</option>{CASE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </label>
        <label className="flex flex-col text-xs font-medium text-navy-500">Team
          <select name="team" defaultValue={sp.team ?? ""} className="input mt-1"><option value="">All</option>{TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        </label>
        <label className="flex flex-col text-xs font-medium text-navy-500">Priority
          <select name="band" defaultValue={sp.band ?? ""} className="input mt-1"><option value="">All</option>{RISK_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}</select>
        </label>
        <button className="btn-primary">Apply</button>
        <Link href="/cases" className="btn-secondary">Reset</Link>
        <span className="ml-auto self-center text-sm text-navy-500">{rows.length} cases</span>
      </form>

      {rows.length === 0 ? (
        <EmptyState>No cases match these filters.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <th className="th">Case</th><th className="th">Title</th><th className="th">Status</th><th className="th">Team / owner</th><th className="th">Opening → current</th><th className="th">Opened</th><th className="th">Days open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50">
            {rows.map(({ c }) => (
              <tr key={c.id} className="hover:bg-navy-50">
                <td className="td"><Link href={`/cases/${c.ref}`} className="font-medium text-navy-800 underline">{c.ref}</Link></td>
                <td className="td max-w-xs">{c.title}</td>
                <td className="td"><StatusPill status={c.status} /></td>
                <td className="td">{c.ownerTeam}<div className="text-xs text-navy-500">{c.ownerName ?? "Unassigned"}</div></td>
                <td className="td">
                  <div className="flex items-center gap-1">
                    <RiskBadge band={c.openingBand ?? "Low"} score={c.openingRiskScore ?? undefined} />
                    <span aria-hidden className="text-navy-400">→</span>
                    <RiskBadge band={c.currentBand ?? "Low"} score={c.currentRiskScore ?? undefined} />
                  </div>
                </td>
                <td className="td">{formatDate(c.openedAt)}</td>
                <td className="td tabular-nums">{c.closedAt ? `${daysBetween(c.openedAt, c.closedAt)} (closed)` : daysBetween(c.openedAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
