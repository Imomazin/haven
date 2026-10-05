import Link from "next/link";
import { getInterventionsList } from "@/db/queries";
import { PageHeader, Table, EmptyState, Prototype } from "@/components/ui";
import { StatusPill, UrgencyBadge } from "@/components/severity";
import { label, formatDate } from "@/lib/format";
import { INTERVENTION_CATALOGUE } from "@/lib/intervention-engine";
import { INTERVENTION_STATUSES, TEAMS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InterventionsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const rows = await getInterventionsList({ status: sp.status, team: sp.team, type: sp.type });
  const overdueCount = rows.filter((r) => r.i.targetDate && new Date(r.i.targetDate) < new Date() && !["completed", "cancelled"].includes(r.i.status)).length;

  return (
    <div>
      <PageHeader
        eyebrow="Operate"
        title="Interventions"
        description="Every recommended, scheduled and completed action across the portfolio. Target dates use prototype response rules."
        actions={<span className="self-center text-sm text-graphite-500"><Prototype /> {overdueCount} past target</span>}
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-graphite-200 bg-white p-3">
        <label className="flex flex-col text-xs font-medium text-graphite-500">Status
          <select name="status" defaultValue={sp.status ?? ""} className="input mt-1"><option value="">All</option>{INTERVENTION_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
        </label>
        <label className="flex flex-col text-xs font-medium text-graphite-500">Team
          <select name="team" defaultValue={sp.team ?? ""} className="input mt-1"><option value="">All</option>{TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        </label>
        <label className="flex flex-col text-xs font-medium text-graphite-500">Type
          <select name="type" defaultValue={sp.type ?? ""} className="input mt-1"><option value="">All</option>{INTERVENTION_CATALOGUE.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select>
        </label>
        <button className="btn-primary">Apply</button>
        <Link href="/interventions" className="btn-secondary">Reset</Link>
        <span className="ml-auto self-center text-sm text-graphite-500">{rows.length} interventions</span>
      </form>

      {rows.length === 0 ? (
        <EmptyState>No interventions match these filters.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <th className="th">Ref</th><th className="th">Intervention</th><th className="th">Case</th><th className="th">Team</th><th className="th">Urgency</th><th className="th">Status</th><th className="th">Target</th><th className="th">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-limestone-100">
            {rows.map(({ i, caseRef, locality }) => {
              const late = i.targetDate && new Date(i.targetDate) < new Date() && !["completed", "cancelled"].includes(i.status);
              return (
                <tr key={i.id} className="hover:bg-limestone-100">
                  <td className="td text-xs text-graphite-500">{i.ref}</td>
                  <td className="td"><span className="font-medium text-ink-900">{i.label}</span><div className="text-xs text-graphite-500">{locality}</div></td>
                  <td className="td"><Link href={`/cases/${caseRef}`} className="text-ink-700 underline">{caseRef}</Link></td>
                  <td className="td">{i.team}</td>
                  <td className="td"><UrgencyBadge urgency={i.urgency} /></td>
                  <td className="td"><StatusPill status={i.status} /></td>
                  <td className="td"><span className={late ? "font-medium text-risk-critical-700" : ""}>{formatDate(i.targetDate)}{late ? " (late)" : ""}</span></td>
                  <td className="td text-xs text-graphite-600">{i.actualOutcome ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
