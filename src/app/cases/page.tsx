import Link from "next/link";
import { getCases } from "@/db/queries";
import { PageHeader, Table, EmptyState } from "@/components/ui";
import { RiskBadge, StatusPill } from "@/components/severity";
import { formatDate, daysBetween } from "@/lib/format";
import { CASE_STATUSES, TEAMS, RISK_BANDS } from "@/lib/types";
import { label } from "@/lib/format";

export const dynamic = "force-dynamic";

const RAIL: Record<string, string> = { Critical: "border-risk-critical-500", High: "border-risk-high-500", Moderate: "border-risk-moderate-500", Low: "border-risk-low-500" };

export default async function CasesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const rows = await getCases({ status: sp.status, team: sp.team, band: sp.band, q: sp.q });

  return (
    <div>
      <PageHeader eyebrow="Operate" title="Cases" description="From identification to resolution: assign, act, escalate, record outcomes and close. Every change is written to the audit trail." />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-graphite-200/70 bg-white p-3 shadow-subtle">
        <label className="flex flex-col gap-1"><span className="field-label">Search</span><input name="q" defaultValue={sp.q} placeholder="Ref or title" className="input w-44" /></label>
        <label className="flex flex-col gap-1"><span className="field-label">Status</span>
          <select name="status" defaultValue={sp.status ?? ""} className="input"><option value="">All</option>{CASE_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1"><span className="field-label">Team</span>
          <select name="team" defaultValue={sp.team ?? ""} className="input"><option value="">All</option>{TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1"><span className="field-label">Priority</span>
          <select name="band" defaultValue={sp.band ?? ""} className="input"><option value="">All</option>{RISK_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}</select>
        </label>
        <button className="btn-primary">Apply</button>
        <Link href="/cases" className="btn-ghost">Reset</Link>
        <span className="ml-auto self-center text-sm text-graphite-500">{rows.length} cases</span>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Nothing matches">Adjust the filters or reset.</EmptyState>
      ) : (
        <Table>
          <thead><tr>
            <th className="th">Case</th><th className="th">Title</th><th className="th">Status</th><th className="th">Team / owner</th><th className="th">Opening → current</th><th className="th">Opened</th><th className="th">Days</th>
          </tr></thead>
          <tbody>
            {rows.map(({ c }) => (
              <tr key={c.id} className="border-t border-graphite-100 hover:bg-limestone-50">
                <td className={`td rail ${RAIL[c.priorityBand] ?? "border-graphite-200"}`}><Link href={`/cases/${c.ref}`} className="font-medium text-ink-900 hover:underline">{c.ref}</Link></td>
                <td className="td max-w-xs text-graphite-700">{c.title}</td>
                <td className="td"><StatusPill status={c.status} /></td>
                <td className="td">{c.ownerTeam}<div className="text-xs text-graphite-500">{c.ownerName ?? "Unassigned"}</div></td>
                <td className="td"><div className="flex items-center gap-1.5"><RiskBadge band={c.openingBand ?? "Low"} score={c.openingRiskScore ?? undefined} /><span aria-hidden className="text-graphite-400">→</span><RiskBadge band={c.currentBand ?? "Low"} score={c.currentRiskScore ?? undefined} /></div></td>
                <td className="td text-graphite-700">{formatDate(c.openedAt)}</td>
                <td className="td tabular-nums">{c.closedAt ? `${daysBetween(c.openedAt, c.closedAt)}` : daysBetween(c.openedAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
