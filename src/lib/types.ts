// Haven domain types. Synthetic data only — no real tenant identities.

export const CONSTRUCTION_ERAS = [
  "pre1919",
  "1919-1944",
  "1945-1964",
  "1965-1982",
  "1983-2002",
  "post2002",
] as const;
export type ConstructionEra = (typeof CONSTRUCTION_ERAS)[number];

export const EPC_RATINGS = ["A", "B", "C", "D", "E", "F", "G"] as const;
export type EpcRating = (typeof EPC_RATINGS)[number];

export const HEATING_TYPES = [
  "gas_central",
  "electric_storage",
  "electric_panel",
  "heat_pump",
  "communal",
  "solid_fuel",
  "none",
] as const;
export type HeatingType = (typeof HEATING_TYPES)[number];

export const INSULATION_LEVELS = ["none", "partial", "full"] as const;
export type InsulationLevel = (typeof INSULATION_LEVELS)[number];

export const GLAZING_TYPES = ["single", "double", "triple"] as const;
export type GlazingType = (typeof GLAZING_TYPES)[number];

export const VENTILATION_LEVELS = ["poor", "adequate", "good"] as const;
export type VentilationLevel = (typeof VENTILATION_LEVELS)[number];

export const PROPERTY_TYPES = [
  "tenement_flat",
  "four_in_a_block",
  "mid_terrace",
  "end_terrace",
  "semi_detached",
  "high_rise_flat",
  "cottage_flat",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const RISK_LEVELS = ["none", "some", "significant"] as const;
export type RiskLevel3 = (typeof RISK_LEVELS)[number];

export const INCOME_RISK = ["low", "medium", "high"] as const;
export type IncomeRisk = (typeof INCOME_RISK)[number];

export const FUEL_POVERTY = ["none", "at_risk", "in_fuel_poverty"] as const;
export type FuelPovertyIndicator = (typeof FUEL_POVERTY)[number];

export const ENERGY_USE_PATTERNS = [
  "normal",
  "under_heating",
  "over_reliance_on_backup",
] as const;
export type EnergyUsePattern = (typeof ENERGY_USE_PATTERNS)[number];

// Risk bands (overall).
export const RISK_BANDS = ["Low", "Moderate", "High", "Critical"] as const;
export type RiskBand = (typeof RISK_BANDS)[number];

// Urgency categories.
export const URGENCY_CATEGORIES = ["Routine", "Scheduled", "Soon", "Immediate"] as const;
export type UrgencyCategory = (typeof URGENCY_CATEGORIES)[number];

// Confidence categories.
export const CONFIDENCE_CATEGORIES = ["Low", "Moderate", "High"] as const;
export type ConfidenceCategory = (typeof CONFIDENCE_CATEGORIES)[number];

// Risk dimensions.
export const RISK_DIMENSIONS = [
  "propertyCondition",
  "fuelPoverty",
  "environmental",
  "householdVulnerability",
  "recurrence",
  "supportNeed",
] as const;
export type RiskDimension = (typeof RISK_DIMENSIONS)[number];

// Teams that can own a case / intervention.
export const TEAMS = [
  "Housing Officers",
  "Asset Management",
  "Repairs",
  "Energy Advice",
  "Fuel Poverty Support",
  "Tenancy Support",
] as const;
export type Team = (typeof TEAMS)[number];

export const CASE_STATUSES = [
  "open",
  "assigned",
  "in_progress",
  "escalated",
  "monitoring",
  "closed",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const INTERVENTION_STATUSES = [
  "recommended",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type InterventionStatus = (typeof INTERVENTION_STATUSES)[number];

// ---- Risk engine input ----

export interface PropertySignals {
  propertyType: PropertyType;
  constructionEra: ConstructionEra;
  epcRating: EpcRating;
  heatingType: HeatingType;
  wallInsulation: InsulationLevel;
  loftInsulation: InsulationLevel;
  glazing: GlazingType;
  ventilation: VentilationLevel;
  dampHistoryCount: number; // events in last 24 months
  mouldHistoryCount: number; // events in last 24 months
  openRepairs: number;
  lastRepairDaysAgo: number | null;
  // Environmental readings (may be absent -> lowers confidence).
  indoorHumidityPct: number | null;
  indoorWinterTempC: number | null;
  co2Ppm: number | null;
  readingsAgeDays: number | null;
}

export interface HouseholdSignals {
  householdSize: number;
  adultsOver65: number;
  childrenUnder5: number;
  childrenPresent: boolean;
  incomeRiskIndicator: IncomeRisk;
  fuelPovertyIndicator: FuelPovertyIndicator;
  mobilitySupport: boolean;
  // NON-clinical, self-declared support flag. Not a diagnosis.
  healthVulnerability: RiskLevel3;
  recentHouseholdChange: boolean;
  energyUsePattern: EnergyUsePattern;
}

export interface RiskInput {
  property: PropertySignals;
  household: HouseholdSignals;
}

// ---- Risk engine output ----

export interface RiskFactor {
  dimension: RiskDimension;
  label: string;
  points: number; // contribution to the dimension score
  evidence: string;
}

export interface DimensionResult {
  dimension: RiskDimension;
  score: number; // 0-100
  factors: RiskFactor[];
}

export interface RiskAssessment {
  overallScore: number; // 0-100
  band: RiskBand;
  dimensions: Record<RiskDimension, number>;
  dimensionResults: DimensionResult[];
  topDrivers: RiskFactor[];
  protectiveFactors: string[];
  missingEvidence: string[];
  confidenceScore: number; // 0-100
  confidence: ConfidenceCategory;
  urgencyScore: number; // 0-100
  urgency: UrgencyCategory;
  primaryRisk: RiskDimension;
  secondaryRisk: RiskDimension | null;
  responseDueDays: number;
  version: string;
}
