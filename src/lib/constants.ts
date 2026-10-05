import type {
  RiskBand,
  RiskDimension,
  UrgencyCategory,
  ConfidenceCategory,
} from "./types";

// Version tag for the scoring model. Bump when scoring rules change so that
// stored assessments remain traceable to the rules that produced them.
export const RISK_MODEL_VERSION = "haven-risk-0.1.0";

// Weighting of each dimension in the overall score. Must sum to 1.0.
// Documented in docs/methodology.md.
export const DIMENSION_WEIGHTS: Record<RiskDimension, number> = {
  propertyCondition: 0.22,
  fuelPoverty: 0.24,
  environmental: 0.2,
  householdVulnerability: 0.16,
  recurrence: 0.1,
  supportNeed: 0.08,
};

export const DIMENSION_LABELS: Record<RiskDimension, string> = {
  propertyCondition: "Property Condition",
  fuelPoverty: "Fuel Poverty",
  environmental: "Environmental",
  householdVulnerability: "Household Vulnerability",
  recurrence: "Recurrence",
  supportNeed: "Support Need",
};

// Overall band thresholds (inclusive lower bound).
export const BAND_THRESHOLDS: { band: RiskBand; min: number }[] = [
  { band: "Critical", min: 75 },
  { band: "High", min: 50 },
  { band: "Moderate", min: 25 },
  { band: "Low", min: 0 },
];

export function bandForScore(score: number): RiskBand {
  for (const t of BAND_THRESHOLDS) {
    if (score >= t.min) return t.band;
  }
  return "Low";
}

// Urgency thresholds and the prototype response-due window each implies.
// These are PROTOTYPE RESPONSE RULES, not statutory deadlines.
export const URGENCY_THRESHOLDS: {
  category: UrgencyCategory;
  min: number;
  responseDueDays: number;
}[] = [
  { category: "Immediate", min: 80, responseDueDays: 2 },
  { category: "Soon", min: 60, responseDueDays: 7 },
  { category: "Scheduled", min: 40, responseDueDays: 21 },
  { category: "Routine", min: 0, responseDueDays: 60 },
];

export function urgencyForScore(score: number): {
  category: UrgencyCategory;
  responseDueDays: number;
} {
  for (const t of URGENCY_THRESHOLDS) {
    if (score >= t.min) return { category: t.category, responseDueDays: t.responseDueDays };
  }
  return { category: "Routine", responseDueDays: 60 };
}

export const CONFIDENCE_THRESHOLDS: { category: ConfidenceCategory; min: number }[] = [
  { category: "High", min: 80 },
  { category: "Moderate", min: 60 },
  { category: "Low", min: 0 },
];

export function confidenceForScore(score: number): ConfidenceCategory {
  for (const t of CONFIDENCE_THRESHOLDS) {
    if (score >= t.min) return t.category;
  }
  return "Low";
}

// Severity presentation. Colour is ALWAYS paired with a label and short text —
// never communicated by colour alone (see docs/methodology.md, accessibility).
export const BAND_PRESENTATION: Record<
  RiskBand,
  { label: string; textClass: string; bgClass: string; borderClass: string; dotClass: string; short: string }
> = {
  Low: { label: "Low", short: "Monitor", textClass: "text-risk-low-700", bgClass: "bg-risk-low-50", borderClass: "border-risk-low-200", dotClass: "bg-risk-low-500" },
  Moderate: { label: "Moderate", short: "Plan action", textClass: "text-risk-moderate-700", bgClass: "bg-risk-moderate-50", borderClass: "border-risk-moderate-200", dotClass: "bg-risk-moderate-500" },
  High: { label: "High", short: "Act soon", textClass: "text-risk-high-700", bgClass: "bg-risk-high-50", borderClass: "border-risk-high-200", dotClass: "bg-risk-high-500" },
  Critical: { label: "Critical", short: "Act now", textClass: "text-risk-critical-700", bgClass: "bg-risk-critical-50", borderClass: "border-risk-critical-200", dotClass: "bg-risk-critical-500" },
};

// Hex values for charts and inline SVG (keep in step with the risk palette).
export const BAND_HEX: Record<RiskBand, string> = {
  Critical: "#a1332a",
  High: "#bf5a2c",
  Moderate: "#8f6410",
  Low: "#3f6b4e",
};
