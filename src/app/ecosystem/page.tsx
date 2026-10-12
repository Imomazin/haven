import Link from "next/link";
import { PageHeader, Card, SectionTitle, StatTile } from "@/components/ui";
import { SystemMap } from "@/components/system-map";
import { ConnectorCard, HealthDot, StateBadge } from "@/components/integration";
import { CONNECTORS, ecosystemSummary, connectorsByCategory } from "@/integrations/registry";
import { CATEGORY_LABELS, type IntegrationCategory } from "@/integrations/types";
import {
  DATA_LANES,
  FABRIC_EVENTS,
  OPERATIONAL_FLOWS,
  connectorsForLane,
  implementationFor,
  implementationSummary,
} from "@/integrations/enterprise";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER: IntegrationCategory[] = [
  "housing_management",
  "connected_home",
  "repairs_assets",
  "public_data",
  "communications",
  "documents",
  "analytics",
];

export default function EcosystemPage() {
  const s = ecosystemSummary();
  const impl = implementationSummary();
  const groups = connectorsByCategory();

  return (
    <div>
      <PageHeader
        eyebrow="Enterprise integration fabric"
        title="HAVEN across the landlord technology estate"
        description="Housing records, connected-home telemetry, repairs, public reference data, resident communications, documents and executive analytics are reconciled through one canonical property and household layer. The point is not to replace existing systems. It is to make them work together around risk, intervention and measurable outcomes."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Connectors" value={s.total} hint={`${s.categories} ecosystem categories`} />
        <StatTile label="Executable adapters" value={impl.executable} hint="demo / sandbox operations" tone="accent" />
        <StatTile label="Credential-ready" value={impl.credentialReady} hint="customer authorisation required" />
        <StatTile label="Bi-directional" value={impl.bidirectional} hint="read + action pathways" />
        <StatTile label="Records processed" value={s.recordsProcessed.toLocaleString()} hint={`${s.recordsFailed} failed`} />
        <StatTile label="Avg uptime" value={`${s.avgUptime}%`} hint={`${s.webhooksActive} webhooks active`} tone="good" />
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div>
            <SectionTitle sub="Systems of record flow into HAVEN's canonical layer; connected-home, repairs and public data enrich it; the engine turns signals into coordinated action and measured outcomes">
              HAVEN connected housing ecosystem
            </SectionTitle>
            <div className="rounded-lg border border-graphite-200/60 bg-[#f7f9fa] p-3">
              <SystemMap />
            </div>
          </div>

          <div className="border-t border-graphite-200/70 pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
            <p className="eyebrow mb-2">Why the fabric matters</p>
            <h3 className="font-display text-xl font-semibold leading-tight text-ink-900">One home. Many systems. One operational narrative.</h3>
            <p className="mt-3 text-sm leading-relaxed text-graphite-600">
              A property can exist in the housing system, repairs platform, sensor estate, EPC dataset, document library and analytics environment at the same time. HAVEN resolves those records by UPRN and preserves the source of every signal.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="border-l-2 border-ink-800 pl-3">
                <div className="text-xs uppercase tracking-wider text-graphite-500">Inbound</div>
                <div className="mt-1 font-semibold text-ink-900">{impl.inbound} connectors</div>
              </div>
              <div className="border-l-2 border-terracotta-500 pl-3">
                <div className="text-xs uppercase tracking-wider text-graphite-500">Outbound</div>
                <div className="mt-1 font-semibold text-ink-900">{impl.outbound} connectors</div>
              </div>
              <div className="border-l-2 border-sage-600 pl-3">
                <div className="text-xs uppercase tracking-wider text-graphite-500">Bi-directional</div>
                <div className="mt-1 font-semibold text-ink-900">{impl.bidirectional} connectors</div>
              </div>
              <div className="border-l-2 border-graphite-400 pl-3">
                <div className="text-xs uppercase tracking-wider text-graphite-500">Identity key</div>
                <div className="mt-1 font-semibold text-ink-900">UPRN + canonical household</div>
              </div>
            </div>
            <Link href="/ecosystem-demo" className="btn-primary mt-5 inline-flex">Run the ecosystem story →</Link>
          </div>
        </div>
        <p className="mt-3 text-xs text-graphite-500">
          Canonical model aligned to the <span className="font-medium text-ink-800">HACT UK Housing Data Standards</span>. No live customer credentials are configured in this demonstrator. Demo and sandbox connectors execute against deterministic fixtures; credential-ready connectors remain inactive until authorised.
        </p>
      </Card>

      <section className="mb-8">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Integration fabric</p>
            <h2 className="font-display text-xl font-semibold text-ink-900">Five data lanes that turn fragmented systems into action</h2>
          </div>
          <span className="text-xs text-graphite-500">Every lane retains source provenance</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-graphite-200/70 bg-white shadow-subtle">
          {DATA_LANES.map((lane, idx) => {
            const laneConnectors = connectorsForLane(lane);
            return (
              <div key={lane.title} className={`grid gap-4 p-5 lg:grid-cols-[0.8fr_1.1fr_1fr] ${idx ? "border-t border-graphite-100" : ""}`}>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-terracotta-700">Lane {idx + 1}</div>
                  <h3 className="mt-1 font-display text-base font-semibold text-ink-900">{lane.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-graphite-600">{lane.purpose}</p>
                </div>
                <div>
                  <div className="field-label mb-2">Systems participating</div>
                  <div className="flex flex-wrap gap-1.5">
                    {laneConnectors.map((c) => (
                      <Link key={c.slug} href={`/ecosystem/${c.slug}`} className="inline-flex items-center gap-1.5 rounded-md border border-graphite-200 bg-limestone-50 px-2 py-1 text-xs font-medium text-ink-800 hover:border-ink-300">
                        <span className={`h-1.5 w-1.5 rounded-full ${c.state === "not_configured" ? "bg-graphite-300" : "bg-sage-600"}`} />
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="field-label mb-2">What HAVEN produces</div>
                  <div className="flex flex-wrap gap-1.5">
                    {lane.outputs.map((o) => <span key={o} className="rounded border border-ink-100 bg-ink-50 px-2 py-1 text-xs font-medium text-ink-800">{o}</span>)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <SectionTitle sub="Deterministic demo traffic showing how records move across the estate">Integration activity tape</SectionTitle>
          <div className="divide-y divide-graphite-100">
            {FABRIC_EVENTS.map((e) => (
              <div key={`${e.time}-${e.connector}`} className="grid grid-cols-[3.25rem_1fr] gap-3 py-3 sm:grid-cols-[3.25rem_9rem_1fr_auto] sm:items-center">
                <div className="font-mono text-xs font-semibold text-ink-800">{e.time}</div>
                <div className="text-xs font-semibold text-ink-900">{e.connector}</div>
                <div className="min-w-0">
                  <div className="text-sm text-graphite-700">{e.event}</div>
                  <div className="truncate text-xs text-graphite-400">{e.object}</div>
                </div>
                <div className="col-start-2 text-xs font-medium text-sage-700 sm:col-start-auto sm:text-right">{e.outcome}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle sub="Cross-system journeys HAVEN can coordinate without pretending the underlying platforms disappear">Operational orchestration</SectionTitle>
          <div className="space-y-4">
            {OPERATIONAL_FLOWS.map((flow, idx) => (
              <div key={flow.name} className="border-l-2 border-ink-800 pl-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-sm font-semibold text-ink-900">{flow.name}</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-graphite-400">Flow {idx + 1}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-graphite-600">{flow.trigger}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {flow.systems.map((s) => <span key={s} className="rounded bg-limestone-100 px-1.5 py-0.5 text-[10px] font-medium text-graphite-700">{s}</span>)}
                </div>
                <p className="mt-2 text-xs text-ink-800"><span className="font-semibold">Action:</span> {flow.action}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mb-8">
        <div className="mb-3">
          <p className="eyebrow">Implementation coverage</p>
          <h2 className="font-display text-xl font-semibold text-ink-900">Every configured connector is executable in the demonstrator</h2>
          <p className="mt-1 max-w-3xl text-sm text-graphite-600">The integration layer now exposes capability-aware demo operations across all configured connectors. Credential-ready adapters remain deliberately dormant until a customer authorises access.</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-graphite-200/70 bg-white shadow-subtle">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-limestone-100 text-graphite-500">
              <tr>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Connector</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">State</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Implementation</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Direction</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Health</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Objects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-100">
              {CONNECTORS.map((c) => {
                const implementation = implementationFor(c);
                return (
                  <tr key={c.slug} className="hover:bg-limestone-50/70">
                    <td className="px-4 py-3"><Link href={`/ecosystem/${c.slug}`} className="font-semibold text-ink-900 hover:underline">{c.name}</Link><div className="text-[10px] text-graphite-400">{CATEGORY_LABELS[c.category]}</div></td>
                    <td className="px-4 py-3"><StateBadge state={c.state} /></td>
                    <td className="px-4 py-3"><span className={implementation.level === "executable_demo" ? "font-semibold text-sage-700" : "font-medium text-graphite-500"}>{implementation.label}</span></td>
                    <td className="px-4 py-3 capitalize text-graphite-600">{c.direction.replace("bidirectional", "bi-directional")}</td>
                    <td className="px-4 py-3">{c.state === "not_configured" ? <span className="text-graphite-400">Idle</span> : <HealthDot health={c.sync.health} />}</td>
                    <td className="px-4 py-3 text-graphite-600">{c.dataObjects.slice(0, 3).join(" · ")}{c.dataObjects.length > 3 ? " …" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

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
        {CONNECTORS.length} adapters across {s.categories} categories. Connector telemetry is synthetic and deterministic. Labels — Connected, Sandbox, Demo connector, Ready to configure — reflect real configuration state and are never overstated. <Link href="/governance" className="underline">Governance &amp; data ethics →</Link>
      </p>
    </div>
  );
}
