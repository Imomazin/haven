import type { SensorFeed, RepairRecord } from "@/integrations/fixtures";
import { SourceBadge } from "./source-badge";
import { formatDate } from "@/lib/format";

// Compact 14-day sparkline.
function Spark({ values, threshold, invert = false, color = "#b4703f" }: { values: number[]; threshold?: number; invert?: boolean; color?: string }) {
  const w = 120, h = 30, pad = 2;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = values[values.length - 1];
  const breach = threshold != null && (invert ? last > threshold : last < threshold);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none" aria-hidden>
      {threshold != null && (
        <line x1={pad} x2={w - pad} y1={pad + (1 - (threshold - min) / span) * (h - pad * 2)} y2={pad + (1 - (threshold - min) / span) * (h - pad * 2)} stroke="#cbd3da" strokeWidth="0.8" strokeDasharray="2 2" />
      )}
      <polyline points={pts.join(" ")} fill="none" stroke={breach ? "#c2410c" : color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r="1.8" fill={breach ? "#c2410c" : color} />
    </svg>
  );
}

function Trend({ delta, unit, goodDown = false }: { delta: number; unit: string; goodDown?: boolean }) {
  if (delta === 0) return <span className="text-graphite-400">no change</span>;
  const up = delta > 0;
  const bad = goodDown ? up : !up;
  return <span className={bad ? "text-risk-moderate-700" : "text-sage-700"}>{up ? "▲" : "▼"} {Math.abs(delta)}{unit} / 14d</span>;
}

export function SensorTelemetry({ feed }: { feed: SensorFeed }) {
  const temps = feed.series.map((s) => s.tempC);
  const hums = feed.series.map((s) => s.humidityPct);
  const co2s = feed.series.map((s) => s.co2Ppm);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SourceBadge source={feed.source} reference={feed.deviceId} />
        <span className="text-xs text-graphite-500">
          Device {feed.deviceHealth === "online" ? <span className="text-sage-700">online</span> : <span className="text-risk-moderate-700">{feed.deviceHealth}</span>} · last seen {formatDate(feed.lastSeen)}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { k: "Temperature", v: `${feed.latest.tempC}°C`, series: temps, threshold: 18, invert: false, trend: <Trend delta={feed.trend.temp} unit="°C" goodDown={false} /> },
          { k: "Humidity", v: `${feed.latest.humidityPct}%`, series: hums, threshold: 70, invert: true, trend: <Trend delta={feed.trend.humidity} unit="%" goodDown /> },
          { k: "CO₂", v: `${feed.latest.co2Ppm} ppm`, series: co2s, threshold: 1400, invert: true, trend: <Trend delta={feed.trend.co2} unit="ppm" goodDown /> },
        ].map((m) => (
          <div key={m.k} className="rounded-lg border border-graphite-200/70 bg-white p-3">
            <div className="flex items-baseline justify-between">
              <span className="field-label">{m.k}</span>
              <span className="font-display text-lg font-semibold text-ink-900">{m.v}</span>
            </div>
            <div className="mt-1"><Spark values={m.series} threshold={m.threshold} invert={m.invert} /></div>
            <div className="mt-1 text-[11px]">{m.trend}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-graphite-400">14-day daily readings from the connected-home platform. Dashed line marks the comfort/safety threshold.</p>
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  open: "text-risk-moderate-700", scheduled: "text-ink-700", in_progress: "text-ink-700",
  completed: "text-sage-700", no_access: "text-risk-moderate-700",
};

export function RepairHistory({ repairs }: { repairs: RepairRecord[] }) {
  if (!repairs.length) return <p className="text-sm text-graphite-400">No repair records returned from connected repairs systems.</p>;
  return (
    <ul className="space-y-2.5">
      {repairs.map((r) => (
        <li key={r.ref} className="rounded-lg border border-graphite-200/70 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-900">{r.description}{r.repeat && <span className="ml-2 rounded bg-risk-high-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-risk-high-700">Repeat</span>}</p>
              <p className="text-xs text-graphite-500">{r.category} · {r.contractor}</p>
            </div>
            <span className={`shrink-0 text-xs font-medium capitalize ${STATUS_TONE[r.status] ?? "text-graphite-600"}`}>{r.status.replace("_", " ")}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-graphite-500">
            <SourceBadge source={r.source} reference={r.ref} />
            <span>Raised {formatDate(r.raisedAt)}</span>
            {r.appointmentAt && <span>· Appt {formatDate(r.appointmentAt)}</span>}
            {r.completedAt && <span>· Completed {formatDate(r.completedAt)}</span>}
            {r.costGbp != null && <span>· £{r.costGbp}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}
