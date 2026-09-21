import Link from "next/link";
import { getDataSources, getRecentAudit } from "@/db/queries";
import { PageHeader, Card, SectionTitle, Table } from "@/components/ui";
import { label, formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function AdapterBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    demo: "bg-teal-50 text-teal-800 border-teal-300",
    ready: "bg-amber-50 text-amber-800 border-amber-300",
    not_connected: "bg-navy-100 text-navy-600 border-navy-300",
  };
  return <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${map[status] ?? map.not_connected}`}>{label(status)}</span>;
}

export default async function GovernancePage() {
  const [sources, audit] = await Promise.all([getDataSources(), getRecentAudit(30)]);

  return (
    <div>
      <PageHeader title="Governance" description="Data provenance, connector status, lawful-basis placeholders, retention concepts, human review and the audit trail. Designed to make the system inspectable." />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <SectionTitle>Human review</SectionTitle>
          <p className="text-sm text-navy-600">Every risk assessment carries a review status and can be manually overridden. Haven supports decisions; it never makes them autonomously.</p>
        </Card>
        <Card>
          <SectionTitle>Provenance</SectionTitle>
          <p className="text-sm text-navy-600">Each score records the scoring model version and the signals that produced it, and is recomputed transparently from source data.</p>
        </Card>
        <Card>
          <SectionTitle>Access &amp; retention</SectionTitle>
          <p className="text-sm text-navy-600">Role-based access and retention are shown here as future architecture concepts. See <Link href="/about" className="underline">privacy &amp; governance</Link>.</p>
        </Card>
      </div>

      <Card className="mb-4">
        <SectionTitle sub="Data adapters are modular. Displayed connectors are simulated unless stated otherwise.">Data sources &amp; connector status</SectionTitle>
        <Table>
          <thead>
            <tr>
              <th className="th">Source</th><th className="th">Category</th><th className="th">Purpose</th><th className="th">Confidence</th><th className="th">Adapter</th><th className="th">Lawful-basis placeholder</th><th className="th">Access</th><th className="th">Retention</th><th className="th">Last update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50">
            {sources.map((s) => (
              <tr key={s.id} className="hover:bg-navy-50">
                <td className="td font-medium text-navy-800">{s.name}</td>
                <td className="td">{s.category}</td>
                <td className="td max-w-xs text-xs text-navy-600">{s.purpose}</td>
                <td className="td">{s.confidence}</td>
                <td className="td"><AdapterBadge status={s.adapterStatus} /></td>
                <td className="td max-w-xs text-xs text-navy-600">{s.lawfulBasisPlaceholder}</td>
                <td className="td text-xs">{s.accessConcept}</td>
                <td className="td text-xs">{s.retentionConcept}</td>
                <td className="td text-xs">{s.lastUpdate ? formatDate(s.lastUpdate) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-2 text-xs text-navy-500">
          Consent / lawful-processing values are placeholders for a real deployment. A Data Protection Impact Assessment (DPIA) has
          <strong> not </strong> been completed for this demonstrator.
        </p>
      </Card>

      <Card>
        <SectionTitle sub="Most recent recorded actions across all cases">Audit trail</SectionTitle>
        <Table>
          <thead><tr><th className="th">When</th><th className="th">Entity</th><th className="th">Action</th><th className="th">Actor</th><th className="th">Detail</th></tr></thead>
          <tbody className="divide-y divide-navy-50">
            {audit.map((e) => (
              <tr key={e.id}>
                <td className="td text-xs">{formatDateTime(e.createdAt)}</td>
                <td className="td text-xs">{e.entityRef}</td>
                <td className="td text-xs font-medium">{label(e.action)}</td>
                <td className="td text-xs">{e.actor}</td>
                <td className="td text-xs text-navy-500">{e.detail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
