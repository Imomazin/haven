import Link from "next/link";
import { cookies } from "next/headers";
import { getPortfolioStats, getRiskQueue, getRecentAudit, getPlaces, getInterventionsList } from "@/db/queries";
import { getRole, ROLE_COOKIE, roleLinks } from "@/lib/roles";
import { agencyForType } from "@/lib/places";
import { Card, SectionTitle, SegmentBar } from "@/components/ui";
import { PlaceMap } from "@/components/place-map";
import { RiskBadge, UrgencyBadge, StatusPill, EscalationNote } from "@/components/severity";
import { label, formatDate } from "@/lib/format";
import { ecosystemSummary, CONNECTORS } from "@/integrations/registry";
import { HealthDot } from "@/components/integration";

export const dynamic = "force-dynamic";

const DOT: Record<string, string> = { Critical: "bg-risk-critical-500", High: "bg-risk-high-500", Moderate: "bg-risk-moderate-500", Low: "bg-risk-low-500" };

export default async function PortfolioPage() {
  const [stats, queue, audit, places, activeInts, jar] = await Promise.all([
    getPortfolioStats(), getRiskQueue({}), getRecentAudit(6), getPlaces(), getInterventionsList({ status: "in_progress" }), cookies(),
  ]);
  const role = getRole(jar.get(ROLE_COOKIE)?.value);
  const links = roleLinks(role);
  const bc = stats.bandCounts;
  const urgent = queue.filter((r) => r.urgency === "Immediate").length;
  const priority = queue.slice(0, 7);
  const top = queue[0];
  const eco = ecosystemSummary();
  const liveFeeds = CONNECTORS.filter((c) => c.state !== "not_configured").sort((a, b) => b.sync.recordsProcessed - a.sync.recordsProcessed).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Situation band */}
      <section className="overflow-hidden rounded-xl bg-ink-900 text-white">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr] lg:p-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta-300">Portfolio · Inverclyde</p>
            <h1 className="mt-2 font-display text-[28px] font-semibold leading-tight">Housing situation room</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-100">
              {stats.householdsRepresented} households across {places.length} neighbourhoods. {bc.Critical} critical and {bc.High} high‑risk
              need attention now; {stats.overdueActions} action{stats.overdueActions === 1 ? "" : "s"} overdue.
            </p>
            {top && (
              <div className="mt-4 inline-flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-200">Current priority</span>
                <Link href={top.caseRef ? `/cases/${top.caseRef}` : `/households/${top.householdRef}`} className="text-sm font-medium text-white hover:underline">
                  {top.propertyRef} · {top.locality}
                </Link>
                <RiskBadge band={top.band} score={top.overallScore} />
                <UrgencyBadge urgency={top.urgency} escalated={top.urgencyEscalated} />
                {top.urgencyEscalated && top.urgencyReason && (
                  <span className="w-full text-xs text-terracotta-200 sm:w-auto">Why now: {top.urgencyReason}</span>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 self-start">
            {[["Urgent", urgent, "needs action now"], ["Open cases", stats.casesOpen, `${stats.openInterventions} interventions`], ["Overdue", stats.overdueActions, "past response window"], ["Improving", stats.casesImproving, "risk reduced"]].map(([k, v, h]) => (
              <div key={k as string} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-wider text-ink-200">{k}</div>
                <div className="mt-1 font-display text-2xl font-semibold tabular-nums">{v as number}</div>
                <div className="text-[11px] text-ink-300">{h}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-ink-950/40 px-6 py-2.5 lg:px-8">
          <span className="text-[11px] text-ink-300">For {role.label}:</span>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded border border-white/15 px-2 py-0.5 text-xs text-ink-100 hover:bg-white/10">{l.label}</Link>
          ))}
        </div>
      </section>

      {/* Place + concentration */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <SectionTitle sub="Risk by neighbourhood — select an area to triage" action={<Link href="/place" className="text-xs font-medium text-ink-700 hover:underline">All neighbourhoods →</Link>}>Where risk concentrates</SectionTitle>
          <PlaceMap places={places} />
        </Card>
        <Card>
          <SectionTitle sub="Worst-affected first">Neighbourhood priority</SectionTitle>
          <ul className="divide-y divide-graphite-100">
            {places.slice(0, 7).map((p) => (
              <li key={p.locality} className="flex items-center gap-3 py-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[p.topBand]}`} aria-hidden />
                <Link href={`/risk-queue?locality=${encodeURIComponent(p.locality)}`} className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900 hover:underline">{p.locality}</Link>
                <span className="text-xs text-graphite-500">{label(p.dominantRisk)}</span>
                <span className="w-16 text-right text-xs tabular-nums text-graphite-600">{p.highCritical} H/C · {p.openCases} open</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Priority households + active programme */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <SectionTitle sub="Highest urgency across the portfolio" action={<Link href="/risk-queue" className="text-xs font-medium text-ink-700 hover:underline">Open queue →</Link>}>Households needing intervention</SectionTitle>
          <ul className="divide-y divide-graphite-100">
            {priority.map((r) => (
              <li key={r.householdRef} className="flex items-start gap-3 py-2.5">
                <RiskBadge band={r.band} score={r.overallScore} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink-900"><Link href={`/properties/${r.propertyRef}`} className="hover:underline">{r.propertyRef}</Link> <span className="font-normal text-graphite-500">· {r.locality}</span></div>
                  <div className="truncate text-xs text-graphite-500">{label(r.primaryRisk)} · {r.ownerName ?? "unassigned"}</div>
                  {r.urgencyEscalated && r.urgencyReason && <EscalationNote reason={r.urgencyReason} className="mt-0.5" />}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <UrgencyBadge urgency={r.urgency} escalated={r.urgencyEscalated} />
                  {r.caseRef && <Link href={`/cases/${r.caseRef}`} className="hidden text-xs font-medium text-ink-700 hover:underline sm:inline">{r.caseRef}</Link>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-5">
          <Card>
            <SectionTitle sub="Risk band distribution">Risk movement</SectionTitle>
            <SegmentBar segments={[{ label: "Critical", value: bc.Critical, className: "bg-risk-critical-500" }, { label: "High", value: bc.High, className: "bg-risk-high-500" }, { label: "Moderate", value: bc.Moderate, className: "bg-risk-moderate-500" }, { label: "Low", value: bc.Low, className: "bg-risk-low-500" }]} />
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-graphite-500">Improving</div><div className="font-semibold text-risk-low-700">{stats.casesImproving}</div></div>
              <div><div className="text-xs text-graphite-500">Worsening</div><div className={`font-semibold ${stats.casesWorsening > 0 ? "text-risk-high-700" : "text-graphite-500"}`}>{stats.casesWorsening}</div></div>
              <div><div className="text-xs text-graphite-500">Safeguarding</div><div className="font-semibold text-ink-900">{stats.vulnerabilityCount}</div></div>
              <div><div className="text-xs text-graphite-500">Avg resolution</div><div className="font-semibold text-ink-900">{stats.avgResolutionDays ?? "—"}d</div></div>
            </div>
          </Card>
          <Card>
            <SectionTitle sub="In delivery now" action={<Link href="/interventions?status=in_progress" className="text-xs font-medium text-ink-700 hover:underline">All →</Link>}>Active programme</SectionTitle>
            {activeInts.length ? (
              <ul className="space-y-2 text-sm">
                {activeInts.slice(0, 5).map(({ i, caseRef }) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 border-b border-graphite-100 pb-1.5 last:border-0">
                    <div className="min-w-0"><Link href={`/cases/${caseRef}`} className="font-medium text-ink-900 hover:underline">{i.label}</Link><div className="truncate text-xs text-graphite-500">{agencyForType(i.type)}</div></div>
                    <StatusPill status={i.status} />
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-graphite-400">No interventions in delivery.</p>}
          </Card>
        </div>
      </div>

      {/* Ecosystem coverage */}
      <Card>
        <SectionTitle sub="Signals flowing in from connected systems" action={<Link href="/ecosystem" className="text-xs font-medium text-ink-700 hover:underline">Integration centre →</Link>}>Live data feeds</SectionTitle>
        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <div className="grid grid-cols-2 gap-3 self-start sm:grid-cols-4 lg:grid-cols-2">
            {[["Connected systems", `${eco.total - eco.notConfigured}/${eco.total}`, `${eco.categories} categories`], ["Records processed", eco.recordsProcessed.toLocaleString(), `${eco.recordsFailed} failed`], ["Avg uptime", `${eco.avgUptime}%`, `${eco.webhooksActive} webhooks`], ["Ready to configure", eco.notConfigured, "adapters available"]].map(([k, v, h]) => (
              <div key={k as string} className="rounded-lg border border-graphite-200/70 bg-limestone-50 p-3">
                <p className="field-label">{k}</p>
                <p className="mt-0.5 font-display text-xl font-semibold text-ink-900">{v}</p>
                <p className="text-[11px] text-graphite-500">{h}</p>
              </div>
            ))}
          </div>
          <ul className="divide-y divide-graphite-100">
            {liveFeeds.map((c) => (
              <li key={c.slug} className="flex items-center gap-3 py-2">
                <HealthDot health={c.sync.health} label={false} />
                <Link href={`/ecosystem/${c.slug}`} className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900 hover:underline">{c.name}</Link>
                <span className="hidden text-xs text-graphite-500 sm:inline">{c.provenanceLabel}</span>
                <span className="tabular-nums text-sm text-ink-800">{c.sync.recordsProcessed.toLocaleString()}</span>
                <span className="text-xs text-graphite-400">records</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Recent activity */}
      <Card>
        <SectionTitle sub="Across all cases" action={<Link href="/governance" className="text-xs font-medium text-ink-700 hover:underline">Audit trail →</Link>}>Recent case activity</SectionTitle>
        <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {audit.map((e) => (
            <li key={e.id} className="flex gap-2.5 text-sm">
              <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta-500" />
              <div className="min-w-0"><div className="truncate text-ink-900">{label(e.action)} <span className="text-graphite-400">· {e.entityRef}</span></div><div className="text-xs text-graphite-500">{formatDate(e.createdAt)} · {e.actor}</div></div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
