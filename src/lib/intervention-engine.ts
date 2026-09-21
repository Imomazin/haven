// Haven intervention engine — maps risk profiles to SUGGESTED interventions.
//
// These are recommendations for a human professional to review, accept, adapt or
// reject. Haven never auto-executes an intervention. See docs/intervention-model.md.

import type { RiskAssessment, RiskInput, Team } from "./types";

export const INTERVENTION_CATALOGUE = [
  "energy_advice",
  "heating_support",
  "heating_inspection",
  "ventilation_support",
  "damp_investigation",
  "mould_investigation",
  "repair_inspection",
  "building_fabric_improvement",
  "welfare_support",
  "tenant_contact",
  "income_maximisation_referral",
  "partner_referral",
  "follow_up_assessment",
] as const;
export type InterventionType = (typeof INTERVENTION_CATALOGUE)[number];

export const INTERVENTION_META: Record<
  InterventionType,
  { label: string; team: Team; defaultLeadDays: number; expectedOutcome: string }
> = {
  energy_advice: { label: "Energy advice visit", team: "Energy Advice", defaultLeadDays: 14, expectedOutcome: "Household understands tariff and efficient heating; reduced under-heating" },
  heating_support: { label: "Heating cost / bill support", team: "Fuel Poverty Support", defaultLeadDays: 10, expectedOutcome: "Immediate heating affordability improved" },
  heating_inspection: { label: "Heating system inspection", team: "Repairs", defaultLeadDays: 14, expectedOutcome: "Heating confirmed safe and efficient, or repaired" },
  ventilation_support: { label: "Ventilation improvement", team: "Asset Management", defaultLeadDays: 21, expectedOutcome: "Improved air exchange; lower humidity" },
  damp_investigation: { label: "Damp investigation", team: "Repairs", defaultLeadDays: 7, expectedOutcome: "Damp source identified and remediation scoped" },
  mould_investigation: { label: "Mould investigation & treatment", team: "Repairs", defaultLeadDays: 7, expectedOutcome: "Mould treated and cause addressed" },
  repair_inspection: { label: "Repair inspection", team: "Repairs", defaultLeadDays: 14, expectedOutcome: "Outstanding repairs assessed and scheduled" },
  building_fabric_improvement: { label: "Building-fabric improvement", team: "Asset Management", defaultLeadDays: 60, expectedOutcome: "Insulation / fabric upgraded; improved EPC" },
  welfare_support: { label: "Welfare / wellbeing support", team: "Tenancy Support", defaultLeadDays: 10, expectedOutcome: "Household supported; needs connected to services" },
  tenant_contact: { label: "Proactive tenant contact", team: "Housing Officers", defaultLeadDays: 5, expectedOutcome: "Contact made; situation understood and consent captured" },
  income_maximisation_referral: { label: "Income maximisation referral", team: "Fuel Poverty Support", defaultLeadDays: 14, expectedOutcome: "Benefits / income checked and maximised" },
  partner_referral: { label: "Partner organisation referral", team: "Tenancy Support", defaultLeadDays: 14, expectedOutcome: "Specialist partner engaged" },
  follow_up_assessment: { label: "Follow-up risk assessment", team: "Housing Officers", defaultLeadDays: 30, expectedOutcome: "Risk re-measured to confirm reduction" },
};

export interface InterventionRecommendation {
  type: InterventionType;
  label: string;
  reason: string;
  urgency: "Immediate" | "Soon" | "Scheduled" | "Routine";
  team: Team;
  targetLeadDays: number;
  expectedOutcome: string;
  priority: number; // higher = more important
}

// Rule set: each rule inspects the assessment + inputs and may emit a recommendation.
// Rules are intentionally explicit and readable so professionals can audit them.
export function recommendInterventions(
  input: RiskInput,
  assessment: RiskAssessment,
): InterventionRecommendation[] {
  const { property: p, household: h } = input;
  const recs: InterventionRecommendation[] = [];
  const urg = (min: number): InterventionRecommendation["urgency"] =>
    assessment.urgencyScore >= 80 && min <= 80 ? "Immediate" : assessment.urgencyScore >= 60 ? "Soon" : assessment.urgencyScore >= 40 ? "Scheduled" : "Routine";

  const push = (type: InterventionType, reason: string, priority: number) => {
    const meta = INTERVENTION_META[type];
    recs.push({
      type,
      label: meta.label,
      reason,
      urgency: urg(priority),
      team: meta.team,
      targetLeadDays: meta.defaultLeadDays,
      expectedOutcome: meta.expectedOutcome,
      priority,
    });
  };

  // Environmental / damp & mould.
  if (p.mouldHistoryCount > 0 || (p.indoorHumidityPct != null && p.indoorHumidityPct > 65)) {
    push("mould_investigation", "Mould history or high humidity detected", 82);
  }
  if (p.dampHistoryCount > 0 && p.openRepairs > 0) {
    push("damp_investigation", "Damp history with outstanding repairs", 80);
  } else if (p.dampHistoryCount > 0) {
    push("damp_investigation", "Recorded damp events in the last 24 months", 70);
  }
  if (p.ventilation === "poor" || (p.co2Ppm != null && p.co2Ppm > 1200)) {
    push("ventilation_support", "Poor ventilation / low air exchange", 60);
  }

  // Cold home / heating.
  if (p.indoorWinterTempC != null && p.indoorWinterTempC < 16) {
    push("heating_inspection", "Internal temperature below 16°C in winter", 84);
  }
  if (h.energyUsePattern === "under_heating" || assessment.dimensions.fuelPoverty >= 45) {
    push("energy_advice", "Under-heating pattern or high fuel-poverty risk", 66);
  }

  // Fuel poverty / income.
  if (h.fuelPovertyIndicator === "in_fuel_poverty") {
    push("heating_support", "Household indicated to be in fuel poverty", 78);
    push("income_maximisation_referral", "Fuel poverty — check benefit and income entitlement", 64);
  } else if (h.fuelPovertyIndicator === "at_risk") {
    push("income_maximisation_referral", "At risk of fuel poverty", 50);
  }

  // Building fabric.
  const olderEra = ["pre1919", "1919-1944", "1945-1964", "1965-1982"].includes(p.constructionEra);
  const lowEpc = ["E", "F", "G"].includes(p.epcRating);
  if (p.wallInsulation === "none" || (lowEpc && olderEra)) {
    push("building_fabric_improvement", "Poor fabric / low EPC in older property", 48);
  }

  // Repairs.
  if (p.openRepairs >= 2) {
    push("repair_inspection", "Multiple outstanding repairs", 58);
  }

  // Household support.
  if (assessment.dimensions.householdVulnerability >= 40 || assessment.dimensions.supportNeed >= 40) {
    push("welfare_support", "Elevated household vulnerability / support need", 62);
  }
  if (h.recentHouseholdChange) {
    push("tenant_contact", "Recent household change — make contact and reassess", 55);
  }
  if (h.healthVulnerability === "significant" && (assessment.dimensions.environmental >= 40 || assessment.dimensions.fuelPoverty >= 40)) {
    push("partner_referral", "Significant support need alongside housing risk", 60);
  }

  // Always contact for high/critical if nothing else made contact.
  if ((assessment.band === "High" || assessment.band === "Critical") && !recs.some((r) => r.type === "tenant_contact")) {
    push("tenant_contact", "High overall risk — establish contact and consent", 68);
  }

  // Follow-up assessment closes the loop for anything above Low.
  if (assessment.band !== "Low") {
    push("follow_up_assessment", "Re-measure risk after interventions to confirm reduction", 30);
  }

  // De-duplicate (keep highest priority) and sort.
  const byType = new Map<InterventionType, InterventionRecommendation>();
  for (const r of recs) {
    const existing = byType.get(r.type);
    if (!existing || r.priority > existing.priority) byType.set(r.type, r);
  }
  return [...byType.values()].sort((a, b) => b.priority - a.priority);
}
