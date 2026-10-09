import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, SectionTitle, Definition, Table, EmptyState } from "@/components/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { StateBadge, HealthDot, agoLabel } from "@/components/integration";
import { getConnector } from "@/integrations/registry";
import { CATEGORY_LABELS, AUTH_LABELS, DIRECTION_LABELS, CAPABILITY_LABELS } from "@/integrations/types";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const OUTCOME_TONE: Record<string, string> = {
  success: "text-sage-700",
  partial: "text-risk-moderate-700",
  failed: "text-risk-critical-700",
};

export default async function ConnectorDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getConnector(slug);
  if (!c) notFound();
  const configured = c.state !== "not_configured";

  return (
    <div>
      <Breadcrumbs items={[{ label: "Ecosystem", href: "/ecosystem" }, { label: c.name }]} />

      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-graphite-200/70 bg-white p-5 shadow-subtle sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow mb-1">{CATEGORY_LABELS[c.category]} connector</p>
          <h1 className="font-display text-2xl font-semibold text-ink-900">{c.name}</h1>
          <p className="mt-1 text-sm text-graphite-600">{c.vendor} · {DIRECTION_LABELS[c.direction]}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StateBadge state={c.state} />
            {configured && <HealthDot health={c.sync.health} />}
            <span className="text-xs text-graphite-500">{AUTH_LABELS[c.auth]}</span>
          </div>
        </div>
        <div className="w-full max-w-xs rounded-lg bg-limestone-100 p-4 text-sm">
          <p className="field-label">Provenance label</p>
          <p className="mt-1 font-semibold text-ink-900">{c.provenanceLabel}</p>
          <p className="mt-2 text-xs text-graphite-600">Data from this connector is tagged with this source on every record it contributes.</p>
        </div>
      </div>

      <p className="mb-5 max-w-3xl text-sm text-graphite-700">{c.blurb}</p>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <SectionTitle>Configuration</SectionTitle>
          <dl>
            <Definition term="Category">{CATEGORY_LABELS[c.category]}</Definition>
            <Definition term="Authentication">{AUTH_LABELS[c.auth]}</Definition>
            <Definition term="Direction">{DIRECTION_LABELS[c.direction]}</Definition>
            <Definition term="Environment">{c.environment}</Definition>
            <Definition term="Owner">{c.owner}</Definition>
            <Definition term="Webhook">{configured ? (c.sync.webhookActive ? "Active" : "Inactive") : "—"}</Definition>
          </dl>
        </Card>

        <Card>
          <SectionTitle>Sync health</SectionTitle>
          {configured ? (
            <dl>
              <Definition term="Last sync">{agoLabel(c.sync.lastSyncAt)}</Definition>
              <Definition term="Next sync">{agoLabel(c.sync.nextSyncAt).replace("ago", "from schedule")}</Definition>
              <Definition term="Processed">{c.sync.recordsProcessed.toLocaleString()}</Definition>
              <Definition term="Created / Updated">{c.sync.recordsCreated} / {c.sync.recordsUpdated}</Definition>
              <Definition term="Failed">{c.sync.recordsFailed}</Definition>
              <Definition term="Latency">{c.sync.latencyMs} ms</Definition>
              <Definition term="Uptime (30d)">{c.sync.uptimePct}%</Definition>
            </dl>
          ) : (
            <p className="text-sm text-graphite-500">This connector is not configured. The adapter is implemented and ready; connecting it requires customer-authorised credentials. No data flows until then.</p>
          )}
        </Card>

        <Card>
          <SectionTitle>Capabilities &amp; objects</SectionTitle>
          <p className="field-label">Capabilities</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {c.capabilities.length ? c.capabilities.map((cap) => (
              <span key={cap} className="rounded border border-ink-200 bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-700">{CAPABILITY_LABELS[cap]}</span>
            )) : <span className="text-sm text-graphite-400">Context only — no data methods.</span>}
          </div>
          <p className="field-label mt-4">Data objects</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {c.dataObjects.map((o) => (
              <span key={o} className="rounded border border-graphite-200 bg-limestone-50 px-2 py-0.5 text-xs font-medium text-graphite-700">{o}</span>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <SectionTitle sub="Most recent synchronisation jobs (synthetic, deterministic)">Recent activity</SectionTitle>
        {configured && c.log.length ? (
          <Table>
            <thead><tr>
              <th className="th">When</th><th className="th">Job</th><th className="th">Outcome</th><th className="th">Processed</th><th className="th">Created</th><th className="th">Updated</th><th className="th">Failed</th><th className="th">Duration</th><th className="th">Note</th>
            </tr></thead>
            <tbody>
              {c.log.map((e, i) => (
                <tr key={i} className="border-t border-graphite-100">
                  <td className="td whitespace-nowrap text-graphite-600">{formatDateTime(e.at)}</td>
                  <td className="td">{e.job}</td>
                  <td className={`td font-medium capitalize ${OUTCOME_TONE[e.outcome]}`}>{e.outcome}</td>
                  <td className="td tabular-nums">{e.processed}</td>
                  <td className="td tabular-nums">{e.created}</td>
                  <td className="td tabular-nums">{e.updated}</td>
                  <td className={`td tabular-nums ${e.failed > 0 ? "text-risk-moderate-700" : ""}`}>{e.failed}</td>
                  <td className="td tabular-nums text-graphite-600">{(e.durationMs / 1000).toFixed(1)}s</td>
                  <td className="td max-w-[16rem] text-xs text-graphite-500">{e.note}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="No activity">This connector has not run — it is awaiting configuration.</EmptyState>
        )}
      </Card>

      <p className="mt-6 text-xs text-graphite-400">
        <Link href="/ecosystem" className="underline">← All connectors</Link> · Demonstration connector. No live customer credentials are configured; telemetry is synthetic and deterministic.
      </p>
    </div>
  );
}
