import Link from "next/link";
import type { Connector, ConnectionState, HealthStatus } from "@/integrations/types";
import { STATE_LABELS, DIRECTION_LABELS, AUTH_LABELS } from "@/integrations/types";

const STATE_TONE: Record<ConnectionState, string> = {
  live: "bg-sage-50 text-sage-700 border-sage-200",
  sandbox: "bg-ink-50 text-ink-700 border-ink-200",
  demo: "bg-terracotta-50 text-terracotta-700 border-terracotta-200",
  not_configured: "bg-graphite-100 text-graphite-500 border-graphite-200",
};

export function StateBadge({ state }: { state: ConnectionState }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${STATE_TONE[state]}`}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${state === "not_configured" ? "bg-graphite-300" : "bg-current"}`} />
      {STATE_LABELS[state]}
    </span>
  );
}

const HEALTH_TONE: Record<HealthStatus, string> = {
  healthy: "text-sage-600",
  degraded: "text-risk-moderate-600",
  down: "text-risk-critical-600",
  idle: "text-graphite-400",
};
export function HealthDot({ health, label = true }: { health: HealthStatus; label?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${HEALTH_TONE[health]}`}>
      <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
      {label && <span className="capitalize">{health}</span>}
    </span>
  );
}

function ago(iso: string | null): string {
  if (!iso) return "—";
  const mins = Math.max(0, Math.round((Date.UTC(2026, 8, 18, 9, 0, 0) - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function ConnectorCard({ c }: { c: Connector }) {
  const configured = c.state !== "not_configured";
  return (
    <Link
      href={`/ecosystem/${c.slug}`}
      className="group flex flex-col rounded-xl border border-graphite-200/70 bg-white p-4 shadow-subtle transition-colors hover:border-ink-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold text-ink-900">{c.name}</h3>
          <p className="text-xs text-graphite-500">{c.vendor} · {DIRECTION_LABELS[c.direction]}</p>
        </div>
        <StateBadge state={c.state} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-graphite-600">{c.blurb}</p>

      {configured ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-graphite-100 pt-3 text-xs">
          <div className="flex justify-between"><dt className="text-graphite-500">Last sync</dt><dd className="font-medium text-ink-800">{ago(c.sync.lastSyncAt)}</dd></div>
          <div className="flex justify-between"><dt className="text-graphite-500">Health</dt><dd><HealthDot health={c.sync.health} /></dd></div>
          <div className="flex justify-between"><dt className="text-graphite-500">Processed</dt><dd className="font-medium tabular-nums text-ink-800">{c.sync.recordsProcessed.toLocaleString()}</dd></div>
          <div className="flex justify-between"><dt className="text-graphite-500">Failed</dt><dd className={`font-medium tabular-nums ${c.sync.recordsFailed > 0 ? "text-risk-moderate-700" : "text-ink-800"}`}>{c.sync.recordsFailed}</dd></div>
          <div className="flex justify-between"><dt className="text-graphite-500">Latency</dt><dd className="font-medium tabular-nums text-ink-800">{c.sync.latencyMs} ms</dd></div>
          <div className="flex justify-between"><dt className="text-graphite-500">Uptime</dt><dd className="font-medium tabular-nums text-ink-800">{c.sync.uptimePct}%</dd></div>
        </dl>
      ) : (
        <div className="mt-3 border-t border-graphite-100 pt-3 text-xs text-graphite-500">
          Adapter available · {AUTH_LABELS[c.auth]} · requires customer credentials
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {c.dataObjects.slice(0, 4).map((o) => (
          <span key={o} className="rounded border border-graphite-200 bg-limestone-50 px-1.5 py-0.5 text-[10px] font-medium text-graphite-600">{o}</span>
        ))}
      </div>
    </Link>
  );
}

export { ago as agoLabel };
