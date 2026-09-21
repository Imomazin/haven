import { PageHeader, Card, SectionTitle, Table } from "@/components/ui";
import { DIMENSION_LABELS, DIMENSION_WEIGHTS, BAND_THRESHOLDS, URGENCY_THRESHOLDS, CONFIDENCE_THRESHOLDS, RISK_MODEL_VERSION } from "@/lib/constants";
import type { RiskDimension } from "@/lib/types";

export const metadata = { title: "Methodology — Haven" };

export default function MethodologyPage() {
  const dims = Object.keys(DIMENSION_LABELS) as RiskDimension[];
  return (
    <div>
      <PageHeader title="Methodology" description={`How Haven scores risk. Transparent, rule-based, versioned (${RISK_MODEL_VERSION}). Not clinically validated.`} />

      <Card className="mb-4">
        <SectionTitle>Overall score</SectionTitle>
        <p className="text-sm text-navy-600">
          Six risk dimensions are each scored 0–100 from explicit rules, then combined into a single overall score using fixed
          weights (below). The overall score maps to a band. Every value is reproducible and inspectable — there is no black box and
          no external AI call.
        </p>
        <Table>
          <thead><tr><th className="th">Dimension</th><th className="th">Weight</th><th className="th">What it captures</th></tr></thead>
          <tbody className="divide-y divide-navy-50">
            {dims.map((d) => (
              <tr key={d}>
                <td className="td font-medium">{DIMENSION_LABELS[d]}</td>
                <td className="td tabular-nums">{DIMENSION_WEIGHTS[d]}</td>
                <td className="td text-sm text-navy-600">{DESCRIPTIONS[d]}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <SectionTitle>Risk bands</SectionTitle>
          <ul className="space-y-1 text-sm">
            {BAND_THRESHOLDS.map((b) => (
              <li key={b.band} className="flex justify-between border-b border-navy-50 pb-1"><span>{b.band}</span><span className="tabular-nums text-navy-500">≥ {b.min}</span></li>
            ))}
          </ul>
        </Card>
        <Card>
          <SectionTitle>Urgency → response window</SectionTitle>
          <ul className="space-y-1 text-sm">
            {URGENCY_THRESHOLDS.map((u) => (
              <li key={u.category} className="flex justify-between border-b border-navy-50 pb-1"><span>{u.category} (≥{u.min})</span><span className="tabular-nums text-navy-500">{u.responseDueDays}d</span></li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-navy-500">Urgency is escalated for acute combinations (e.g. cold home with a vulnerable occupant). Windows are prototype response rules, not statutory deadlines.</p>
        </Card>
        <Card>
          <SectionTitle>Confidence</SectionTitle>
          <ul className="space-y-1 text-sm">
            {CONFIDENCE_THRESHOLDS.map((c) => (
              <li key={c.category} className="flex justify-between border-b border-navy-50 pb-1"><span>{c.category}</span><span className="tabular-nums text-navy-500">≥ {c.min}</span></li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-navy-500">Confidence starts at 100 and is reduced for missing or stale evidence (e.g. no sensor readings, old data).</p>
        </Card>
      </div>

      <Card className="mt-4">
        <SectionTitle>Limitations &amp; safety</SectionTitle>
        <ul className="list-inside list-disc space-y-1 text-sm text-navy-600">
          <li>Weights and thresholds are illustrative starting points, calibrated for a demonstrator — not validated against outcomes.</li>
          <li>Haven does not diagnose medical conditions and is not a clinical decision system.</li>
          <li>Scores are decision-support: a trained human reviews and decides. The system records who reviewed each assessment.</li>
          <li>All data is synthetic; real deployment requires calibration, a DPIA and information-governance sign-off.</li>
        </ul>
      </Card>
    </div>
  );
}

const DESCRIPTIONS: Record<RiskDimension, string> = {
  propertyCondition: "Construction era, insulation, glazing, open repairs, damp/mould history.",
  fuelPoverty: "Fuel-poverty & income indicators, EPC, heating type, under-heating patterns.",
  environmental: "Indoor humidity, temperature, air quality (CO₂), ventilation, mould presence.",
  householdVulnerability: "Older adults, young children, mobility and self-declared support needs (non-clinical).",
  recurrence: "Repeat damp/mould events, problems persisting after repair, sustaining factors.",
  supportNeed: "Proactive engagement need from affordability, support and recent change.",
};
