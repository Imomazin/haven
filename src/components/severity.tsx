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
  open: "bg-graphite-100 text-graphite-700 border-graphite-200",
  assigned: "bg-ink-50 text-ink-700 border-ink-200",
  in_progress: "bg-ink-50 text-ink-700 border-ink-200",
  monitoring: "bg-sage-50 text-sage-700 border-sage-200",
  escalated: "bg-risk-high-50 text-risk-high-700 border-risk-high-200",
  closed: "bg-sage-50 text-sage-700 border-sage-200",
  recommended: "bg-graphite-100 text-graphite-700 border-graphite-200",
  scheduled: "bg-ink-50 text-ink-700 border-ink-200",
  completed: "bg-sage-50 text-sage-700 border-sage-200",
  cancelled: "bg-graphite-100 text-graphite-500 border-graphite-200",
};

export function StatusPill({ status }: { status: string }) {
  const tone = PILL_TONES[status] ?? "bg-graphite-100 text-graphite-700 border-graphite-200";
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{label(status)}</span>;
}

export function UrgencyBadge({ urgency, escalated = false }: { urgency: string; escalated?: boolean }) {
  const tones: Record<string, string> = {
    Immediate: "bg-risk-critical-50 text-risk-critical-700 border-risk-critical-200",
    Soon: "bg-risk-high-50 text-risk-high-700 border-risk-high-200",
    Scheduled: "bg-risk-moderate-50 text-risk-moderate-700 border-risk-moderate-200",
    Routine: "bg-sage-50 text-sage-700 border-sage-200",
  };
  const marks: Record<string, string> = { Immediate: "●●●", Soon: "●●", Scheduled: "●", Routine: "○" };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium ${tones[urgency] ?? tones.Routine}`}
      title={escalated ? "Response urgency escalated above the risk band by an acute signal" : undefined}
    >
      <span aria-hidden className="text-[8px] leading-none tracking-tighter">{marks[urgency] ?? "○"}</span>
      {urgency}
      {escalated && <span aria-hidden title="Escalated above band" className="ml-0.5 font-bold">↑</span>}
    </span>
  );
}

/**
 * One-line explanation shown when response urgency outranks the overall band
 * because of an acute signal. Makes "Low risk · Immediate" read as intentional
 * rather than contradictory.
 */
export function EscalationNote({ reason, className = "" }: { reason: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs text-terracotta-700 ${className}`}>
      <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden className="shrink-0">
        <path fill="currentColor" d="M8 1.5 15 14H1z" />
        <path stroke="#fff" strokeWidth="1.6" d="M8 6v4" />
        <circle cx="8" cy="12" r="0.8" fill="#fff" />
      </svg>
      <span>{reason}</span>
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  const tones: Record<string, string> = {
    High: "text-sage-700 border-sage-200",
    Moderate: "text-risk-moderate-700 border-risk-moderate-200",
    Low: "text-graphite-600 border-graphite-300",
  };
  const bars = confidence === "High" ? 3 : confidence === "Moderate" ? 2 : 1;
  return (
    <span className={`inline-flex items-center gap-1 rounded border bg-white px-1.5 py-0.5 text-xs font-medium ${tones[confidence] ?? tones.Low}`} title={`Evidence confidence: ${confidence}`}>
      <span aria-hidden className="flex items-end gap-px">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`inline-block w-0.5 ${i < bars ? "bg-current" : "bg-graphite-200"}`} style={{ height: `${(i + 1) * 3 + 2}px` }} />
        ))}
      </span>
      {confidence} confidence
    </span>
  );
}

export function ReviewBadge({ status }: { status: string }) {
  const map: Record<string, { text: string; cls: string }> = {
    reviewed: { text: "Human-reviewed", cls: "text-sage-700 border-sage-200 bg-sage-50" },
    unreviewed: { text: "Awaiting review", cls: "text-risk-moderate-700 border-risk-moderate-200 bg-risk-moderate-50" },
    overridden: { text: "Manually overridden", cls: "text-ink-700 border-ink-200 bg-ink-50" },
  };
  const m = map[status] ?? map.unreviewed;
  return <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${m.cls}`}>{m.text}</span>;
}
