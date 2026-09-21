// Zod schemas validating risk-engine inputs. Used to guard any data entering
// the engine (e.g. from adapters or forms) before scoring.

import { z } from "zod";
import {
  CONSTRUCTION_ERAS, EPC_RATINGS, HEATING_TYPES, INSULATION_LEVELS, GLAZING_TYPES,
  VENTILATION_LEVELS, PROPERTY_TYPES, RISK_LEVELS, INCOME_RISK, FUEL_POVERTY, ENERGY_USE_PATTERNS,
  CASE_STATUSES,
} from "./types";
import type { CaseStatus } from "./types";

export const propertySignalsSchema = z.object({
  propertyType: z.enum(PROPERTY_TYPES),
  constructionEra: z.enum(CONSTRUCTION_ERAS),
  epcRating: z.enum(EPC_RATINGS),
  heatingType: z.enum(HEATING_TYPES),
  wallInsulation: z.enum(INSULATION_LEVELS),
  loftInsulation: z.enum(INSULATION_LEVELS),
  glazing: z.enum(GLAZING_TYPES),
  ventilation: z.enum(VENTILATION_LEVELS),
  dampHistoryCount: z.number().int().min(0).max(50),
  mouldHistoryCount: z.number().int().min(0).max(50),
  openRepairs: z.number().int().min(0).max(50),
  lastRepairDaysAgo: z.number().int().min(0).nullable(),
  indoorHumidityPct: z.number().min(0).max(100).nullable(),
  indoorWinterTempC: z.number().min(-10).max(40).nullable(),
  co2Ppm: z.number().min(0).max(10000).nullable(),
  readingsAgeDays: z.number().int().min(0).nullable(),
});

export const householdSignalsSchema = z.object({
  householdSize: z.number().int().min(1).max(20),
  adultsOver65: z.number().int().min(0).max(20),
  childrenUnder5: z.number().int().min(0).max(20),
  childrenPresent: z.boolean(),
  incomeRiskIndicator: z.enum(INCOME_RISK),
  fuelPovertyIndicator: z.enum(FUEL_POVERTY),
  mobilitySupport: z.boolean(),
  healthVulnerability: z.enum(RISK_LEVELS),
  recentHouseholdChange: z.boolean(),
  energyUsePattern: z.enum(ENERGY_USE_PATTERNS),
});

export const riskInputSchema = z.object({
  property: propertySignalsSchema,
  household: householdSignalsSchema,
});

export const caseNoteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty").max(2000),
});

// Allowed case status transitions (used to validate case-management actions).
export const CASE_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  open: ["assigned", "in_progress", "escalated", "closed"],
  assigned: ["in_progress", "escalated", "closed"],
  in_progress: ["monitoring", "escalated", "closed"],
  escalated: ["in_progress", "monitoring", "closed"],
  monitoring: ["in_progress", "escalated", "closed"],
  closed: ["monitoring"], // reopen
};

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  if (from === to) return true;
  return CASE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertCaseStatus(v: string): CaseStatus {
  if (!(CASE_STATUSES as readonly string[]).includes(v)) throw new Error(`Invalid case status: ${v}`);
  return v as CaseStatus;
}
