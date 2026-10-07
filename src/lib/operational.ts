// Operational aggregates derived from case lifecycle dates. Pure and shared by
// the Neon-backed query and the in-memory demo store.

export interface CaseLifecycleRow {
  openedAt: Date | string;
  closedAt: Date | string | null;
  ownerTeam: string;
  status: string;
}

export interface OperationalInsight {
  trend: { key: string; label: string; opened: number; closed: number; net: number }[];
  workload: { team: string; open: number }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
const monthLabel = (d: Date) => MONTHS[d.getUTCMonth()];

export function computeOperational(rows: CaseLifecycleRow[]): OperationalInsight {
  const buckets = new Map<string, { label: string; opened: number; closed: number }>();
  const bump = (d: Date, field: "opened" | "closed") => {
    const key = monthKey(d);
    const b = buckets.get(key) ?? { label: monthLabel(d), opened: 0, closed: 0 };
    b[field]++;
    buckets.set(key, b);
  };
  const workloadMap = new Map<string, number>();

  for (const r of rows) {
    bump(new Date(r.openedAt), "opened");
    if (r.closedAt) bump(new Date(r.closedAt), "closed");
    if (r.status !== "closed") workloadMap.set(r.ownerTeam, (workloadMap.get(r.ownerTeam) ?? 0) + 1);
  }

  const trend = [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({ key, label: v.label, opened: v.opened, closed: v.closed, net: v.opened - v.closed }));

  const workload = [...workloadMap.entries()].map(([team, open]) => ({ team, open })).sort((a, b) => b.open - a.open);

  return { trend, workload };
}
