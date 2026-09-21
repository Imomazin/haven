// Haven risk engine — transparent, rule-based, deterministic scoring.
//
// IMPORTANT: This is prototype decision-SUPPORT. It is NOT clinically validated
// and does not diagnose medical conditions. Every score is intended to be
// reviewed by a housing or support professional. Scoring rules are documented
// in docs/methodology.md and versioned via RISK_MODEL_VERSION.

import {
  DIMENSION_WEIGHTS,
  RISK_MODEL_VERSION,
  bandForScore,
  urgencyForScore,
  confidenceForScore,
} from "./constants";
import type {
  DimensionResult,
  HouseholdSignals,
  PropertySignals,
  RiskAssessment,
  RiskDimension,
  RiskFactor,
  RiskInput,
} from "./types";

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

type Acc = { total: number; factors: RiskFactor[] };

function add(acc: Acc, dimension: RiskDimension, label: string, points: number, evidence: string) {
  if (points === 0) return;
  acc.total += points;
  acc.factors.push({ dimension, label, points, evidence });
}

// --- Dimension: Property Condition ---
function propertyCondition(p: PropertySignals): DimensionResult {
  const acc: Acc = { total: 0, factors: [] };
  const eraPoints: Record<string, number> = {
    pre1919: 25,
    "1919-1944": 20,
    "1945-1964": 15,
    "1965-1982": 12,
    "1983-2002": 5,
    post2002: 0,
  };
  add(acc, "propertyCondition", "Older construction era", eraPoints[p.constructionEra], `Built ${p.constructionEra}`);
  add(acc, "propertyCondition", "Wall insulation gap", p.wallInsulation === "none" ? 18 : p.wallInsulation === "partial" ? 9 : 0, `Wall insulation: ${p.wallInsulation}`);
  add(acc, "propertyCondition", "Loft insulation gap", p.loftInsulation === "none" ? 10 : p.loftInsulation === "partial" ? 5 : 0, `Loft insulation: ${p.loftInsulation}`);
  add(acc, "propertyCondition", "Single/older glazing", p.glazing === "single" ? 10 : p.glazing === "double" ? 3 : 0, `Glazing: ${p.glazing}`);
  add(acc, "propertyCondition", "Open repairs outstanding", Math.min(p.openRepairs * 6, 18), `${p.openRepairs} open repair(s)`);
  add(acc, "propertyCondition", "Recent damp history", Math.min(p.dampHistoryCount * 7, 21), `${p.dampHistoryCount} damp event(s) in 24 months`);
  add(acc, "propertyCondition", "Recent mould history", Math.min(p.mouldHistoryCount * 8, 24), `${p.mouldHistoryCount} mould event(s) in 24 months`);
  return { dimension: "propertyCondition", score: clamp(acc.total), factors: acc.factors };
}

// --- Dimension: Fuel Poverty ---
function fuelPoverty(p: PropertySignals, h: HouseholdSignals): DimensionResult {
  const acc: Acc = { total: 0, factors: [] };
  add(acc, "fuelPoverty", "Fuel poverty indicator", h.fuelPovertyIndicator === "in_fuel_poverty" ? 45 : h.fuelPovertyIndicator === "at_risk" ? 25 : 0, `Fuel poverty: ${h.fuelPovertyIndicator}`);
  add(acc, "fuelPoverty", "Income risk", h.incomeRiskIndicator === "high" ? 20 : h.incomeRiskIndicator === "medium" ? 10 : 0, `Income risk: ${h.incomeRiskIndicator}`);
  const epcPoints: Record<string, number> = { A: 0, B: 0, C: 3, D: 8, E: 14, F: 20, G: 20 };
  add(acc, "fuelPoverty", "Low energy efficiency (EPC)", epcPoints[p.epcRating], `EPC ${p.epcRating}`);
  const heatPoints: Record<string, number> = { electric_panel: 12, none: 15, solid_fuel: 10, electric_storage: 8, gas_central: 0, heat_pump: 0, communal: 2 };
  add(acc, "fuelPoverty", "Expensive/limited heating", heatPoints[p.heatingType] ?? 0, `Heating: ${p.heatingType}`);
  add(acc, "fuelPoverty", "Under-heating pattern (rationing signal)", h.energyUsePattern === "under_heating" ? 15 : h.energyUsePattern === "over_reliance_on_backup" ? 8 : 0, `Energy use: ${h.energyUsePattern}`);
  return { dimension: "fuelPoverty", score: clamp(acc.total), factors: acc.factors };
}

// --- Dimension: Environmental (damp / mould / cold / air quality) ---
function environmental(p: PropertySignals): DimensionResult {
  const acc: Acc = { total: 0, factors: [] };
  if (p.indoorHumidityPct != null) {
    add(acc, "environmental", "High indoor humidity", p.indoorHumidityPct > 70 ? 30 : p.indoorHumidityPct >= 60 ? 18 : p.indoorHumidityPct >= 55 ? 8 : 0, `Humidity ${p.indoorHumidityPct}%`);
  }
  if (p.indoorWinterTempC != null) {
    add(acc, "environmental", "Cold internal temperature", p.indoorWinterTempC < 16 ? 25 : p.indoorWinterTempC < 18 ? 14 : p.indoorWinterTempC < 21 ? 4 : 0, `Winter temp ${p.indoorWinterTempC}°C`);
  }
  if (p.co2Ppm != null) {
    add(acc, "environmental", "Poor air exchange (CO₂)", p.co2Ppm > 1400 ? 18 : p.co2Ppm >= 1000 ? 9 : 0, `CO₂ ${p.co2Ppm} ppm`);
  }
  add(acc, "environmental", "Poor ventilation", p.ventilation === "poor" ? 15 : p.ventilation === "adequate" ? 5 : 0, `Ventilation: ${p.ventilation}`);
  add(acc, "environmental", "Existing mould presence", p.mouldHistoryCount > 0 ? 12 : 0, `${p.mouldHistoryCount} mould event(s)`);
  return { dimension: "environmental", score: clamp(acc.total), factors: acc.factors };
}

// --- Dimension: Household Vulnerability (non-clinical support flags) ---
function householdVulnerability(h: HouseholdSignals): DimensionResult {
  const acc: Acc = { total: 0, factors: [] };
  add(acc, "householdVulnerability", "Older adults in household", h.adultsOver65 > 0 ? Math.min(18 + (h.adultsOver65 - 1) * 6, 30) : 0, `${h.adultsOver65} adult(s) 65+`);
  add(acc, "householdVulnerability", "Young children (under 5)", h.childrenUnder5 > 0 ? 16 : 0, `${h.childrenUnder5} child(ren) under 5`);
  add(acc, "householdVulnerability", "Mobility support need", h.mobilitySupport ? 14 : 0, "Mobility support flagged");
  add(acc, "householdVulnerability", "Declared health-related support need", h.healthVulnerability === "significant" ? 25 : h.healthVulnerability === "some" ? 12 : 0, `Support need: ${h.healthVulnerability} (self-declared, non-clinical)`);
  add(acc, "householdVulnerability", "Recent household change", h.recentHouseholdChange ? 8 : 0, "Recent change reported");
  return { dimension: "householdVulnerability", score: clamp(acc.total), factors: acc.factors };
}

// --- Dimension: Recurrence (likelihood the problem returns) ---
function recurrence(p: PropertySignals): DimensionResult {
  const acc: Acc = { total: 0, factors: [] };
  const histTotal = p.dampHistoryCount + p.mouldHistoryCount;
  add(acc, "recurrence", "Repeated damp/mould events", Math.min(histTotal * 10, 40), `${histTotal} combined event(s)`);
  if (p.lastRepairDaysAgo != null && p.lastRepairDaysAgo <= 180 && histTotal > 0) {
    add(acc, "recurrence", "Problem persists after recent repair", 25, `Repair ${p.lastRepairDaysAgo} days ago, issue recurring`);
  } else if (p.openRepairs > 0 && histTotal > 0) {
    add(acc, "recurrence", "Unresolved repair with active issue", 15, `${p.openRepairs} open repair(s) with history`);
  }
  add(acc, "recurrence", "Poor ventilation sustains damp", p.ventilation === "poor" ? 10 : 0, `Ventilation: ${p.ventilation}`);
  add(acc, "recurrence", "No wall insulation (cold-bridging)", p.wallInsulation === "none" ? 8 : 0, `Wall insulation: ${p.wallInsulation}`);
  return { dimension: "recurrence", score: clamp(acc.total), factors: acc.factors };
}

// --- Dimension: Support Need (proactive engagement need) ---
function supportNeed(h: HouseholdSignals): DimensionResult {
  const acc: Acc = { total: 0, factors: [] };
  add(acc, "supportNeed", "Fuel poverty pressure", h.fuelPovertyIndicator === "in_fuel_poverty" ? 25 : h.fuelPovertyIndicator === "at_risk" ? 12 : 0, `Fuel poverty: ${h.fuelPovertyIndicator}`);
  add(acc, "supportNeed", "Health-related support need", h.healthVulnerability === "significant" ? 20 : h.healthVulnerability === "some" ? 8 : 0, `Support need: ${h.healthVulnerability}`);
  add(acc, "supportNeed", "Mobility support need", h.mobilitySupport ? 12 : 0, "Mobility support flagged");
  add(acc, "supportNeed", "Recent household change", h.recentHouseholdChange ? 12 : 0, "Recent change reported");
  add(acc, "supportNeed", "Income risk", h.incomeRiskIndicator === "high" ? 15 : h.incomeRiskIndicator === "medium" ? 7 : 0, `Income risk: ${h.incomeRiskIndicator}`);
  add(acc, "supportNeed", "Under-heating pattern", h.energyUsePattern === "under_heating" ? 10 : 0, `Energy use: ${h.energyUsePattern}`);
  return { dimension: "supportNeed", score: clamp(acc.total), factors: acc.factors };
}

// Confidence: penalise missing evidence. Complete synthetic records score high;
// records missing environmental readings or with stale data score lower.
function computeConfidence(p: PropertySignals): { score: number; missing: string[] } {
  let score = 100;
  const missing: string[] = [];
  if (p.indoorHumidityPct == null) {
    score -= 12;
    missing.push("No indoor humidity reading");
  }
  if (p.indoorWinterTempC == null) {
    score -= 12;
    missing.push("No indoor temperature reading");
  }
  if (p.co2Ppm == null) {
    score -= 8;
    missing.push("No air-quality (CO₂) reading");
  }
  if (p.readingsAgeDays == null) {
    score -= 6;
    missing.push("No sensor data timestamp");
  } else if (p.readingsAgeDays > 120) {
    score -= 14;
    missing.push(`Environmental readings are ${p.readingsAgeDays} days old`);
  } else if (p.readingsAgeDays > 45) {
    score -= 6;
    missing.push(`Environmental readings are ${p.readingsAgeDays} days old`);
  }
  if (p.lastRepairDaysAgo == null) {
    score -= 4;
    missing.push("No repair history on record");
  }
  return { score: clamp(score), missing };
}

function protectiveFactors(p: PropertySignals, h: HouseholdSignals): string[] {
  const out: string[] = [];
  if (p.epcRating === "A" || p.epcRating === "B" || p.epcRating === "C") out.push(`Reasonable energy efficiency (EPC ${p.epcRating})`);
  if (p.wallInsulation === "full") out.push("Full wall insulation");
  if (p.loftInsulation === "full") out.push("Full loft insulation");
  if (p.glazing === "double" || p.glazing === "triple") out.push(`${p.glazing} glazing installed`);
  if (p.ventilation === "good") out.push("Good ventilation");
  if (p.heatingType === "gas_central" || p.heatingType === "heat_pump") out.push("Efficient heating system");
  if (h.fuelPovertyIndicator === "none") out.push("No fuel-poverty indicator");
  if (p.dampHistoryCount === 0 && p.mouldHistoryCount === 0) out.push("No damp/mould history");
  return out;
}

export function assessRisk(input: RiskInput): RiskAssessment {
  const { property: p, household: h } = input;

  const results: DimensionResult[] = [
    propertyCondition(p),
    fuelPoverty(p, h),
    environmental(p),
    householdVulnerability(h),
    recurrence(p),
    supportNeed(h),
  ];

  const dimensions = Object.fromEntries(results.map((r) => [r.dimension, r.score])) as Record<
    RiskDimension,
    number
  >;

  const overallRaw = results.reduce((sum, r) => sum + r.score * DIMENSION_WEIGHTS[r.dimension], 0);
  const overallScore = Math.round(clamp(overallRaw));
  const band = bandForScore(overallScore);

  // Top drivers: the individual factors contributing most, weighted by dimension.
  const allFactors = results.flatMap((r) => r.factors);
  const topDrivers = [...allFactors]
    .sort((a, b) => b.points * DIMENSION_WEIGHTS[b.dimension] - a.points * DIMENSION_WEIGHTS[a.dimension])
    .slice(0, 5);

  // Rank dimensions to name primary/secondary risk (by weighted contribution).
  const rankedDims = [...results].sort(
    (a, b) => b.score * DIMENSION_WEIGHTS[b.dimension] - a.score * DIMENSION_WEIGHTS[a.dimension],
  );
  const primaryRisk = rankedDims[0].dimension;
  const secondaryRisk = rankedDims[1] && rankedDims[1].score > 0 ? rankedDims[1].dimension : null;

  const { score: confidenceScore, missing } = computeConfidence(p);

  // Urgency: overall score, escalated by acute vulnerability + environmental combos.
  let urgencyScore = overallScore;
  if (p.indoorWinterTempC != null && p.indoorWinterTempC < 16 && (h.childrenUnder5 > 0 || h.adultsOver65 > 0 || h.healthVulnerability !== "none")) {
    urgencyScore = Math.max(urgencyScore, 85);
  }
  if (p.indoorHumidityPct != null && p.indoorHumidityPct > 70 && h.childrenPresent) {
    urgencyScore = Math.max(urgencyScore, 80);
  }
  if (h.fuelPovertyIndicator === "in_fuel_poverty" && h.energyUsePattern === "under_heating") {
    urgencyScore = Math.max(urgencyScore, 75);
  }
  urgencyScore = clamp(urgencyScore);
  const { category: urgency, responseDueDays } = urgencyForScore(urgencyScore);

  return {
    overallScore,
    band,
    dimensions,
    dimensionResults: results,
    topDrivers,
    protectiveFactors: protectiveFactors(p, h),
    missingEvidence: missing,
    confidenceScore,
    confidence: confidenceForScore(confidenceScore),
    urgencyScore,
    urgency,
    primaryRisk,
    secondaryRisk,
    responseDueDays,
    version: RISK_MODEL_VERSION,
  };
}
