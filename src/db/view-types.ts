// Shapes returned by the data layer, shared by the Neon-backed queries and the
// in-memory demo store so pages are agnostic to which backend is active.
import type { RiskAssessment } from "@/lib/types";
import type { Property, Household } from "./schema";

export interface PortfolioStats {
  propertiesMonitored: number;
  householdsRepresented: number;
  bandCounts: { Critical: number; High: number; Moderate: number; Low: number };
  casesOpen: number;
  casesByStatus: Record<string, number>;
  openInterventions: number;
  overdueActions: number;
  fuelPovertyCount: number;
  dampRiskCount: number;
  mouldRiskCount: number;
  coldHomeCount: number;
  fabricRiskCount: number;
  vulnerabilityCount: number;
  casesImproving: number;
  casesWorsening: number;
  avgResolutionDays: number | null;
}

export interface QueueRow {
  householdRef: string;
  propertyRef: string;
  locality: string;
  propertyType: string;
  overallScore: number;
  band: string;
  primaryRisk: string;
  secondaryRisk: string | null;
  confidence: string;
  urgency: string;
  urgencyReason: string | null;
  urgencyEscalated: boolean;
  reviewStatus: string;
  caseRef: string | null;
  caseStatus: string | null;
  ownerTeam: string | null;
  ownerName: string | null;
  responseDueAt: Date | null;
  daysOpen: number | null;
}

export interface PropertyRecord {
  property: Property;
  household: Household | null;
  assessment: RiskAssessment | null;
  cases: { ref: string; status: string; title: string }[];
}

export function hasDb(): boolean {
  return !!process.env.DATABASE_URL;
}
