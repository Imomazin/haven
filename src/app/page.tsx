import Link from "next/link";
import { cookies } from "next/headers";
import { getPortfolioStats, getRiskQueue, getRecentAudit } from "@/db/queries";
import { getRole, ROLE_COOKIE, roleLinks } from "@/lib/roles";
import { StatTile, Card, SectionTitle, SegmentBar, LinkButton } from "@/components/ui";
import { RiskBadge, UrgencyBadge } from "@/components/severity";
import { label, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [stats, queue, audit, jar] = await Promise.all([getPortfolioStats(), getRiskQueue({}), getRecentAudit(7), cookies()]);
  const role = getRole(jar.get(ROLE_COOKIE)?.value);
  const links = roleLinks(role);

  const urgent = queue.filter((r) => r.urgency === "Immediate").length;
  const priority = queue.slice(0, 6);

  // Geographic concentration: High+Critical households per locality.
  const geo = new Map<string, number>();
  for (const r of queue) if (r.band === "High" || r.band === "Critical") geo.set(r.locality, (geo.get(r.locality) ?? 0) + 1);
  const geoTop = [...geo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const geoMax = Math.max(1, ...geoTop.map(([, n]) => n));

  const bc = stats.bandCounts;
  const totalBands = bc.Critical + bc.High + bc.Moderate + bc.Low || 1;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 border-b border-graphite-200/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1.5">Operational overview</p>
          <h1 className="font-display text-[26px] font-semibold leading-tight text-ink-900">
            The housing risk landscape, at a glance
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-graphite-600">
            Who needs attention now, why, and what should happen next — across {stats.propertiesMonitored} properties and {stats.householdsRepresented} households.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/risk-queue" variant="primary">Open risk queue</LinkButton>
          <LinkButton href="/demo">Guided demo</LinkButton>
        </div>
      </div>

      {/* Headline metrics — four, not twelve */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Households monitored" value={stats.householdsRepresented} hint={`${stats.propertiesMonitored} properties`} tone="ink" />
        <StatTile label="Requiring urgent attention" value={urgent} hint="Immediate response window" tone={urgent > 0 ? "critical" : "low"} />
        <StatTile label="Open cases" value={stats.casesOpen} hint={`${stats.openInterventions} live interventions`} tone="ink" />
        <StatTile label="Overdue actions" value={stats.overdueActions} hint="Past prototype response window" tone={stats.overdueActions > 0 ? "high" : "low"} />
      </div>

      {/* Role-tailored quick actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-graphite-200/70 bg-white px-4 py-3 shadow-subtle">
        <span className="text-xs font-medium text-graphite-500">For {role.label}:</span>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-md border border-graphite-300 px-2.5 py-1 text-xs font-medium text-ink-800 hover:bg-limestone-100">
            {l.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Priority list — the main column */}
        <Card className="lg:col-span-2">
          <SectionTitle sub="Highest urgency across the portfolio" action={<Link href="/risk-queue" className="text-xs font-medium text-ink-700 hover:underline">View queue →</Link>}>
            Needs attention now
          </SectionTitle>
          <ul className="divide-y divide-graphite-100">
            {priority.map((r) => (
              <li key={r.householdRef} className="flex items-center gap-3 py-2.5">
                <RiskBadge band={r.band} score={r.overallScore} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink-900">
                    <Link href={`/properties/${r.propertyRef}`} className="hover:underline">{r.propertyRef}</Link>
                    <span className="font-normal text-graphite-500"> · {r.locality}</span>
                  </div>
                  <div className="truncate text-xs text-graphite-500">{label(r.primaryRisk)}{r.secondaryRisk ? ` · ${label(r.secondaryRisk)}` : ""} · {r.ownerName ?? "unassigned"}</div>
                </div>
                <UrgencyBadge urgency={r.urgency} />
                {r.caseRef ? (
                  <Link href={`/cases/${r.caseRef}`} className="hidden text-xs font-medium text-ink-700 hover:underline sm:inline">{r.caseRef}</Link>
                ) : (
                  <span className="hidden text-xs text-graphite-400 sm:inline">no case</span>
                )}
              </li>
            ))}
          </ul>
        </Card>

        {/* Risk landscape */}
        <Card>
          <SectionTitle sub="Current band distribution">Risk landscape</SectionTitle>
          <SegmentBar
            segments={[
              { label: "Critical", value: bc.Critical, className: "bg-risk-critical-500" },
              { label: "High", value: bc.High, className: "bg-risk-high-500" },
              { label: "Moderate", value: bc.Moderate, className: "bg-risk-moderate-500" },
              { label: "Low", value: bc.Low, className: "bg-risk-low-500" },
            ]}
          />
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {([["Critical", bc.Critical, "bg-risk-critical-500"], ["High", bc.High, "bg-risk-high-500"], ["Moderate", bc.Moderate, "bg-risk-moderate-500"], ["Low", bc.Low, "bg-risk-low-500"]] as const).map(([k, v, dot]) => (
              <div key={k} className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-graphite-600"><span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />{k}</dt>
                <dd className="tabular-nums font-medium text-ink-900">{v} <span className="text-xs text-graphite-400">· {Math.round((v / totalBands) * 100)}%</span></dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-graphite-100 pt-3 text-sm">
            <div><div className="text-xs text-graphite-500">Improving</div><div className="font-semibold text-risk-low-700">{stats.casesImproving} cases</div></div>
            <div><div className="text-xs text-graphite-500">Worsening</div><div className={`font-semibold ${stats.casesWorsening > 0 ? "text-risk-high-700" : "text-graphite-500"}`}>{stats.casesWorsening} cases</div></div>
            <div><div className="text-xs text-graphite-500">Safeguarding indicators</div><div className="font-semibold text-ink-900">{stats.vulnerabilityCount}</div></div>
            <div><div className="text-xs text-graphite-500">Avg resolution</div><div className="font-semibold text-ink-900">{stats.avgResolutionDays ?? "—"}d</div></div>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Geographic concentration */}
        <Card>
          <SectionTitle sub="High & critical households by area">Geographic concentration</SectionTitle>
          <ul className="space-y-2.5">
            {geoTop.map(([loc, n]) => (
              <li key={loc}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-ink-900">{loc}</span>
                  <span className="tabular-nums text-graphite-500">{n}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-graphite-100">
                  <div className="h-full rounded-full bg-ink-700" style={{ width: `${(n / geoMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Risk themes */}
        <Card>
          <SectionTitle sub="Households flagged per theme">Risk themes</SectionTitle>
          <ul className="space-y-2 text-sm">
            {([["Fuel poverty", stats.fuelPovertyCount], ["Cold home", stats.coldHomeCount], ["Damp", stats.dampRiskCount], ["Mould", stats.mouldRiskCount], ["Building fabric", stats.fabricRiskCount]] as const).map(([name, v]) => (
              <li key={name} className="flex items-center justify-between border-b border-graphite-100 pb-1.5 last:border-0">
                <span className="text-graphite-700">{name}</span>
                <span className="tabular-nums font-medium text-ink-900">{v}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Recent activity */}
        <Card>
          <SectionTitle sub="Across all cases" action={<Link href="/governance" className="text-xs font-medium text-ink-700 hover:underline">Audit →</Link>}>Recent activity</SectionTitle>
          <ul className="space-y-2.5">
            {audit.map((e) => (
              <li key={e.id} className="flex gap-2.5 text-sm">
                <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta-500" />
                <div className="min-w-0">
                  <div className="text-ink-900">{label(e.action)} <span className="text-graphite-400">· {e.entityRef}</span></div>
                  <div className="truncate text-xs text-graphite-500">{formatDate(e.createdAt)} · {e.actor}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
