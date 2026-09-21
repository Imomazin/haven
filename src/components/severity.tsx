// Severity presentation. Risk is NEVER communicated by colour alone: every
// badge pairs colour with a distinct shape icon AND a text label (and score
// where relevant). Meets the "don't rely on colour" accessibility principle.

import { BAND_PRESENTATION } from "@/lib/constants";
import type { RiskBand } from "@/lib/types";
import { label } from "@/lib/format";

function BandIcon({ band, className = "" }: { band: RiskBand; className?: string }) {
  const common = { width: 14, height: 14, viewBox: "0 0 16 16", "aria-hidden": true, className };
  switch (band) {
    case "Critical":
      // Filled octagon (stop-like) — most distinct shape.
      return (
        <svg {...common}>
          <path fill="currentColor" d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" />
          <path stroke="#fff" strokeWidth="1.5" d="M8 4.5v4.5" />
          <circle cx="8" cy="11.5" r="0.9" fill="#fff" />
        </svg>
      );
    case "High":
      // Triangle warning.
      return (
        <svg {...common}>
          <path fill="currentColor" d="M8 1.5 15 14H1z" />
          <path stroke="#fff" strokeWidth="1.5" d="M8 6v4" />
          <circle cx="8" cy="12" r="0.8" fill="#fff" />
        </svg>
      );
    case "Moderate":
      // Diamond.
      return (
        <svg {...common}>
          <path fill="currentColor" d="M8 1l7 7-7 7-7-7z" />
        </svg>
      );
    default:
      // Circle (low).
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.5" fill="currentColor" />
        </svg>
      );
  }
}

export function RiskBadge({ band, score }: { band: string; score?: number }) {
  const b = (band as RiskBand) in BAND_PRESENTATION ? (band as RiskBand) : "Low";
  const p = BAND_PRESENTATION[b];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${p.textClass} ${p.bgClass} ${p.borderClass}`}
      title={`${p.label} risk — ${p.short}`}
    >
      <span className={p.textClass}>
        <BandIcon band={b} />
      </span>
      <span>{p.label}</span>
      {score != null && <span className="tabular-nums font-bold">· {score}</span>}
    </span>
  );
}

const PILL_TONES: Record<string, string> = {
  open: "bg-navy-50 text-navy-700 border-navy-200",
  assigned: "bg-navy-50 text-navy-700 border-navy-200",
  in_progress: "bg-teal-50 text-teal-800 border-teal-300",
  monitoring: "bg-teal-50 text-teal-800 border-teal-300",
  escalated: "bg-orange-50 text-orange-900 border-orange-300",
  closed: "bg-navy-100 text-navy-600 border-navy-200",
  recommended: "bg-navy-50 text-navy-700 border-navy-200",
  scheduled: "bg-navy-50 text-navy-700 border-navy-200",
  completed: "bg-teal-50 text-teal-800 border-teal-300",
  cancelled: "bg-navy-100 text-navy-500 border-navy-200",
};

export function StatusPill({ status }: { status: string }) {
  const tone = PILL_TONES[status] ?? "bg-navy-50 text-navy-700 border-navy-200";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}>{label(status)}</span>;
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const tones: Record<string, string> = {
    Immediate: "bg-red-50 text-red-900 border-red-300",
    Soon: "bg-orange-50 text-orange-900 border-orange-300",
    Scheduled: "bg-amber-50 text-amber-800 border-amber-300",
    Routine: "bg-teal-50 text-teal-800 border-teal-300",
  };
  const marks: Record<string, string> = { Immediate: "●●●", Soon: "●●", Scheduled: "●", Routine: "○" };
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium ${tones[urgency] ?? tones.Routine}`}>
      <span aria-hidden className="tracking-tighter">{marks[urgency] ?? "○"}</span>
      {urgency}
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  const tones: Record<string, string> = {
    High: "text-teal-800 border-teal-300",
    Moderate: "text-amber-800 border-amber-300",
    Low: "text-navy-600 border-navy-300",
  };
  const bars = confidence === "High" ? 3 : confidence === "Moderate" ? 2 : 1;
  return (
    <span className={`inline-flex items-center gap-1 rounded border bg-white px-1.5 py-0.5 text-xs font-medium ${tones[confidence] ?? tones.Low}`} title={`Evidence confidence: ${confidence}`}>
      <span aria-hidden className="flex items-end gap-px">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`inline-block w-0.5 ${i < bars ? "bg-current" : "bg-navy-200"}`} style={{ height: `${(i + 1) * 3 + 2}px` }} />
        ))}
      </span>
      {confidence} confidence
    </span>
  );
}

export function ReviewBadge({ status }: { status: string }) {
  const map: Record<string, { text: string; cls: string }> = {
    reviewed: { text: "Human-reviewed", cls: "text-teal-800 border-teal-300 bg-teal-50" },
    unreviewed: { text: "Awaiting review", cls: "text-amber-800 border-amber-300 bg-amber-50" },
    overridden: { text: "Manually overridden", cls: "text-navy-700 border-navy-300 bg-navy-50" },
  };
  const m = map[status] ?? map.unreviewed;
  return <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${m.cls}`}>{m.text}</span>;
}
