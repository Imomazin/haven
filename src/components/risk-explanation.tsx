import type { RiskAssessment } from "@/lib/types";
import { DIMENSION_LABELS, DIMENSION_WEIGHTS, RISK_MODEL_VERSION } from "@/lib/constants";
import { Meter } from "./ui";
import { RiskBadge, UrgencyBadge, ConfidenceBadge } from "./severity";
import { label } from "@/lib/format";
import type { RiskDimension } from "@/lib/types";

export function RiskExplanation({ a }: { a: RiskAssessment }) {
  const dims = Object.keys(DIMENSION_LABELS) as RiskDimension[];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <RiskBadge band={a.band} score={a.overallScore} />
        <UrgencyBadge urgency={a.urgency} />
        <ConfidenceBadge confidence={a.confidence} />
        <span className="text-xs text-graphite-500">
          Primary: <span className="font-medium text-ink-800">{label(a.primaryRisk)}</span>
          {a.secondaryRisk && <> · Secondary: <span className="font-medium text-ink-800">{label(a.secondaryRisk)}</span></>}
        </span>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink-800">Component scores</h3>
        <div className="space-y-2">
          {dims.map((d) => (
            <div key={d} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3">
              <span className="text-sm text-ink-800">{DIMENSION_LABELS[d]}</span>
              <Meter value={a.dimensions[d]} ariaLabel={`${DIMENSION_LABELS[d]} score ${a.dimensions[d]} of 100`} />
              <span className="text-sm tabular-nums text-ink-900">
                {a.dimensions[d]}
                <span className="ml-1 text-xs text-graphite-400">×{DIMENSION_WEIGHTS[d]}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink-800">Top risk drivers</h3>
          <ul className="space-y-1.5">
            {a.topDrivers.map((f, i) => (
              <li key={i} className="rounded border border-graphite-200 bg-limestone-100/40 px-2 py-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink-900">{f.label}</span>
                  <span className="text-xs tabular-nums text-graphite-500">+{f.points}</span>
                </div>
                <div className="text-xs text-graphite-500">{f.evidence} · {DIMENSION_LABELS[f.dimension]}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink-800">Protective factors</h3>
            {a.protectiveFactors.length ? (
              <ul className="list-inside list-disc space-y-1 text-sm text-ink-800">
                {a.protectiveFactors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-graphite-400">None recorded.</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink-800">Missing / weak evidence</h3>
            {a.missingEvidence.length ? (
              <ul className="list-inside list-disc space-y-1 text-sm text-risk-moderate-700">
                {a.missingEvidence.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-graphite-400">Evidence complete.</p>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-graphite-400">
        Scoring model {RISK_MODEL_VERSION}. Prototype decision-support — not clinically validated. A human reviewer confirms every
        assessment before action.
      </p>
    </div>
  );
}
