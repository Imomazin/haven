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
  { label: string; textClass: string; bgClass: string; borderClass: string; short: string }
> = {
  Low: {
    label: "Low",
    short: "Monitor",
    textClass: "text-teal-800",
    bgClass: "bg-teal-50",
    borderClass: "border-teal-300",
  },
  Moderate: {
    label: "Moderate",
    short: "Plan action",
    textClass: "text-amber-800",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-300",
  },
  High: {
    label: "High",
    short: "Act soon",
    textClass: "text-orange-900",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-300",
  },
  Critical: {
    label: "Critical",
    short: "Act now",
    textClass: "text-red-900",
    bgClass: "bg-red-50",
    borderClass: "border-red-300",
  },
};
