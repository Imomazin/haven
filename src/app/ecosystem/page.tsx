import Link from "next/link";
import { PageHeader, Card, SectionTitle, StatTile } from "@/components/ui";
import { SystemMap } from "@/components/system-map";
import { ConnectorCard } from "@/components/integration";
import { CONNECTORS, ecosystemSummary, connectorsByCategory } from "@/integrations/registry";
import { CATEGORY_LABELS, type IntegrationCategory } from "@/integrations/types";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER: IntegrationCategory[] = [
  "housing_management", "connected_home", "repairs_assets", "public_data", "communications", "documents", "analytics",
];

export default function EcosystemPage() {
  const s = ecosystemSummary();
  const groups = connectorsByCategory();

  return (
    <div>
      <PageHeader
        eyebrow="Ecosystem"
        title="Connected housing ecosystem"
        description="Haven sits across your existing systems — housing management, connected home, repairs, public data, communications and productivity — and reconciles them through one canonical, HACT-aligned property identity. Every connector below is honest about its state."
      />

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Connectors" value={s.total} hint={`${s.categories} categories`} />
        <StatTile label="Demo connectors" value={s.demo} hint="synthetic fixtures" tone="accent" />
        <StatTile label="Sandbox" value={s.sandbox} hint="test credentials" />
        <StatTile label="Ready to configure" value={s.notConfigured} hint="adapter available" />
        <StatTile label="Records processed" value={s.recordsProcessed.toLocaleString()} hint={`${s.recordsFailed} failed`} />
        <StatTile label="Avg uptime" value={`${s.avgUptime}%`} hint={`${s.webhooksActive} webhooks active`} tone="good" />
      </div>

      {/* System map hero */}
      <Card className="mb-6">
        <SectionTitle sub="Systems of record flow into Haven's canonical layer; connected-home, repairs and public data enrich it; the engine turns signals into coordinated action and measured outcomes">
          HAVEN connected housing ecosystem
        </SectionTitle>
        <div className="rounded-lg border border-graphite-200/60 bg-[#f7f9fa] p-3">
          <SystemMap />
        </div>
        <p className="mt-2 text-xs text-graphite-500">
          Canonical model aligned to the <span className="font-medium text-ink-800">HACT UK Housing Data Standards</span>; property identity reconciled by UPRN across systems. No live customer credentials are configured in this demonstrator — connectors run against deterministic synthetic fixtures.
        </p>
      </Card>

      {/* Categories */}
      <div className="space-y-8">
        {CATEGORY_ORDER.filter((cat) => groups.has(cat)).map((cat) => {
          const list = groups.get(cat)!;
          return (
            <section key={cat}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-display text-lg font-semibold text-ink-900">{CATEGORY_LABELS[cat]}</h2>
                <span className="text-xs text-graphite-500">{list.length} connector{list.length === 1 ? "" : "s"}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((c) => <ConnectorCard key={c.slug} c={c} />)}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-graphite-400">
        {CONNECTORS.length} adapters across {s.categories} categories. Connector telemetry is synthetic and deterministic. Labels — Connected, Sandbox, Demo connector, Ready to configure — reflect real configuration state and are never overstated. See a connector for its configuration and recent activity. <Link href="/governance" className="underline">Governance &amp; data ethics →</Link>
      </p>
    </div>
  );
}
