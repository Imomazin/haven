import type { RiskAssessment, RiskDimension } from "@/lib/types";
import type { Property } from "@/db/schema";
import { DIMENSION_LABELS, DIMENSION_WEIGHTS, RISK_MODEL_VERSION } from "@/lib/constants";
import { Meter } from "./ui";

// Asset-side risk view for Property 360. Unlike the household dossier's full
// six-dimension breakdown, this frames the building itself: fabric, environment
// and recurrence. People-side drivers live on the linked household record.
const ASSET_DIMS: RiskDimension[] = ["propertyCondition", "environmental", "recurrence"];

function conditionGrade(score: number): { grade: string; tone: string } {
  if (score >= 70) return { grade: "Poor", tone: "text-risk-critical-700 border-risk-critical-200 bg-risk-critical-50" };
  if (score >= 45) return { grade: "Fair", tone: "text-risk-high-700 border-risk-high-200 bg-risk-high-50" };
  if (score >= 25) return { grade: "Adequate", tone: "text-risk-moderate-700 border-risk-moderate-200 bg-risk-moderate-50" };
  return { grade: "Sound", tone: "text-sage-700 border-sage-200 bg-sage-50" };
}

export function PropertyCondition({ a, p, householdRef }: { a: RiskAssessment; p: Property; householdRef: string | null }) {
  const assetResults = a.dimensionResults.filter((r) => ASSET_DIMS.includes(r.dimension));
  // Condition index: asset dimensions, renormalised to their own weight share.
  const wSum = ASSET_DIMS.reduce((s, d) => s + DIMENSION_WEIGHTS[d], 0);
  const conditionIndex = Math.round(assetResults.reduce((s, r) => s + r.score * DIMENSION_WEIGHTS[r.dimension], 0) / wSum);
  const { grade, tone } = conditionGrade(conditionIndex);

  const hazards: string[] = [];
  if (p.indoorWinterTempC != null && p.indoorWinterTempC < 16) hazards.push(`Cold home · ${p.indoorWinterTempC}°C`);
  if (p.indoorHumidityPct != null && p.indoorHumidityPct > 70) hazards.push(`Excess damp risk · ${p.indoorHumidityPct}% RH`);
  if (p.mouldHistoryCount > 0) hazards.push(`Mould history · ${p.mouldHistoryCount} event${p.mouldHistoryCount === 1 ? "" : "s"}`);
  if (p.dampHistoryCount > 0) hazards.push(`Damp history · ${p.dampHistoryCount} event${p.dampHistoryCount === 1 ? "" : "s"}`);
  if (p.ventilation === "poor") hazards.push("Poor ventilation");

  const conditionDrivers = assetResults.flatMap((r) => r.factors).filter((f) => f.points > 0).sort((a, b) => b.points - a.points).slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-baseline gap-2 rounded-md border px-3 py-1 ${tone}`}>
          <span className="text-xs font-semibold uppercase tracking-wide">Condition</span>
          <span className="font-display text-xl font-semibold">{grade}</span>
          <span className="text-xs tabular-nums opacity-70">index {conditionIndex}</span>
        </span>
        <span className="text-xs text-graphite-500">
          Asset-side risk only · household factors on the <span className="font-medium text-ink-800">linked record</span>
        </span>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink-800">Condition dimensions</h3>
        <div className="space-y-2">
          {assetResults.map((r) => (
            <div key={r.dimension} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3">
              <span className="text-sm text-ink-800">{DIMENSION_LABELS[r.dimension]}</span>
              <Meter value={r.score} ariaLabel={`${DIMENSION_LABELS[r.dimension]} score ${r.score} of 100`} />
              <span className="text-sm tabular-nums text-ink-900">{r.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink-800">Hazard flags</h3>
          {hazards.length ? (
            <ul className="space-y-1.5">
              {hazards.map((hz) => (
                <li key={hz} className="flex items-center gap-2 rounded border border-risk-high-200/60 bg-risk-high-50/40 px-2 py-1.5 text-sm text-ink-900">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-risk-high-500" />{hz}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-graphite-400">No active hazards flagged.</p>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink-800">Why the condition rating</h3>
          {conditionDrivers.length ? (
            <ul className="space-y-1.5">
              {conditionDrivers.map((f, i) => (
                <li key={i} className="flex items-start justify-between gap-2 text-sm">
                  <span className="text-ink-800">{f.label}<span className="block text-xs text-graphite-500">{f.evidence}</span></span>
                  <span className="shrink-0 text-xs tabular-nums text-graphite-500">+{f.points}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-graphite-400">No condition drivers above threshold.</p>
          )}
        </div>
      </div>

      <p className="text-xs text-graphite-400">
        Condition index is the asset-side share of scoring model {RISK_MODEL_VERSION}
        {householdRef ? <> · people-side risk is assessed on household {householdRef}</> : null}. Prototype decision-support, human-reviewed before action.
      </p>
    </div>
  );
}
