import Link from "next/link";
import { getDataSources, getRecentAudit } from "@/db/queries";
import { PageHeader, Card, SectionTitle, Table } from "@/components/ui";
import { label, formatDate, formatDateTime } from "@/lib/format";
import { ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

function AdapterBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    demo: "bg-sage-50 text-sage-700 border-sage-200",
    ready: "bg-risk-moderate-50 text-risk-moderate-700 border-risk-moderate-200",
    not_connected: "bg-graphite-100 text-graphite-600 border-graphite-300",
  };
  return <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${map[status] ?? map.not_connected}`}>{label(status)}</span>;
}

export default async function GovernancePage() {
  const [sources, audit] = await Promise.all([getDataSources(), getRecentAudit(30)]);
  const connected = sources.filter((s) => s.adapterStatus === "demo").length;

  return (
    <div>
      <PageHeader eyebrow="Assurance" title="Governance" description="Data provenance, connector status, lawful-basis placeholders, role-based access and the audit trail — built to be inspected." />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card><SectionTitle>Human oversight</SectionTitle><p className="text-sm text-graphite-600">Every assessment carries a review status and can be overridden. Haven supports decisions; it never acts autonomously.</p></Card>
        <Card><SectionTitle>Provenance</SectionTitle><p className="text-sm text-graphite-600">Each score records its model version and recomputes transparently from source signals — no black box.</p></Card>
        <Card><SectionTitle>Minimisation</SectionTitle><p className="text-sm text-graphite-600">Only the indicators needed for housing support are held. Synthetic data; no DPIA completed for this demonstrator.</p></Card>
      </div>

      <Card className="mb-5">
        <SectionTitle sub={`${connected} of ${sources.length} adapters active in this demo — others are simulated`}>Data sources &amp; connectors</SectionTitle>
        <Table>
          <thead><tr>
            <th className="th">Source</th><th className="th">Category</th><th className="th">Confidence</th><th className="th">Adapter</th><th className="th">Lawful-basis placeholder</th><th className="th">Access</th><th className="th">Retention</th><th className="th">Updated</th>
          </tr></thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id} className="border-t border-graphite-100 hover:bg-limestone-50">
                <td className="td font-medium text-ink-900">{s.name}<div className="text-xs font-normal text-graphite-500">{s.purpose}</div></td>
                <td className="td text-xs">{s.category}</td>
                <td className="td text-xs">{s.confidence}</td>
                <td className="td"><AdapterBadge status={s.adapterStatus} /></td>
                <td className="td max-w-[14rem] text-xs text-graphite-600">{s.lawfulBasisPlaceholder}</td>
                <td className="td text-xs">{s.accessConcept}</td>
                <td className="td text-xs">{s.retentionConcept}</td>
                <td className="td text-xs">{s.lastUpdate ? formatDate(s.lastUpdate) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-2 text-xs text-graphite-500">Lawful-basis values are placeholders for a real deployment. A DPIA has <strong>not</strong> been completed.</p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <SectionTitle sub="Illustrative RBAC — not enforced in the demonstrator">Roles &amp; access</SectionTitle>
          <ul className="divide-y divide-graphite-100">
            {ROLES.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div><div className="font-medium text-ink-900">{r.label}</div><div className="text-xs text-graphite-500">{r.short}</div></div>
                <span className="shrink-0 rounded border border-graphite-200 px-1.5 py-0.5 text-[11px] text-graphite-600">{r.team ?? "Portfolio"}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-3">
          <SectionTitle sub="Most recent recorded actions" action={<Link href="/" className="text-xs font-medium text-ink-700 hover:underline">Overview →</Link>}>Audit trail</SectionTitle>
          <div className="max-h-[28rem] overflow-y-auto scroll-y">
            <Table>
              <thead><tr><th className="th">When</th><th className="th">Entity</th><th className="th">Action</th><th className="th">Actor</th></tr></thead>
              <tbody>
                {audit.map((e) => (
                  <tr key={e.id} className="border-t border-graphite-100">
                    <td className="td text-xs">{formatDateTime(e.createdAt)}</td>
                    <td className="td text-xs">{e.entityRef}</td>
                    <td className="td text-xs font-medium">{label(e.action)}<div className="font-normal text-graphite-500">{e.detail ?? ""}</div></td>
                    <td className="td text-xs">{e.actor}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
