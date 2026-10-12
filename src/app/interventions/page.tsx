import Link from "next/link";
import { getInterventionsList } from "@/db/queries";
import { PageHeader, Table, EmptyState, Prototype } from "@/components/ui";
import { StatusPill, UrgencyBadge } from "@/components/severity";
import { label, formatDate } from "@/lib/format";
import { INTERVENTION_CATALOGUE } from "@/lib/intervention-engine";
import { INTERVENTION_STATUSES, TEAMS } from "@/lib/types";
import { agencyForType } from "@/lib/places";

export const dynamic = "force-dynamic";

const RAIL: Record<string, string> = { Immediate: "border-risk-critical-500", Soon: "border-risk-high-500", Scheduled: "border-risk-moderate-500", Routine: "border-risk-low-500" };

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
        actions={<span className="flex items-center gap-2 text-sm text-graphite-500"><Prototype /> {overdueCount} past target</span>}
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-graphite-200/70 bg-white p-3 shadow-subtle">
        <label className="flex flex-col gap-1"><span className="field-label">Status</span>
          <select name="status" defaultValue={sp.status ?? ""} className="input"><option value="">All</option>{INTERVENTION_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1"><span className="field-label">Team</span>
          <select name="team" defaultValue={sp.team ?? ""} className="input"><option value="">All</option>{TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1"><span className="field-label">Type</span>
          <select name="type" defaultValue={sp.type ?? ""} className="input"><option value="">All</option>{INTERVENTION_CATALOGUE.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select>
        </label>
        <button className="btn-primary">Apply</button>
        <Link href="/interventions" className="btn-ghost">Reset</Link>
        <span className="ml-auto self-center text-sm text-graphite-500">{rows.length} interventions</span>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Nothing matches">Adjust the filters or reset.</EmptyState>
      ) : (
        <Table>
          <thead><tr>
            <th className="th">Intervention</th><th className="th">Case</th><th className="th">Delivery partner</th><th className="th">Urgency</th><th className="th">Status</th><th className="th">Target</th><th className="th">Outcome</th>
          </tr></thead>
          <tbody>
            {rows.map(({ i, caseRef, locality }) => {
              const late = i.targetDate && new Date(i.targetDate) < new Date() && !["completed", "cancelled"].includes(i.status);
              return (
                <tr key={i.id} className="border-t border-graphite-100 hover:bg-limestone-50">
                  <td className={`td rail ${RAIL[i.urgency] ?? "border-graphite-200"}`}><span className="font-medium text-ink-900">{i.label}</span><div className="text-xs text-graphite-500">{i.ref} · {locality}</div></td>
                  <td className="td"><Link href={`/cases/${caseRef}`} className="text-ink-700 hover:underline">{caseRef}</Link></td>
                  <td className="td">{agencyForType(i.type)}<div className="text-xs text-graphite-500">{i.team}</div></td>
                  <td className="td"><UrgencyBadge urgency={i.urgency} /></td>
                  <td className="td"><StatusPill status={i.status} /></td>
                  <td className="td"><span className={late ? "font-medium text-risk-critical-700" : "text-graphite-700"}>{formatDate(i.targetDate)}{late && <span className="block text-xs">late</span>}</span></td>
                  <td className="td max-w-[14rem] text-xs text-graphite-600">{i.actualOutcome ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
