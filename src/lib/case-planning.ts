// Pure planning helper: turn a risk assessment + intervention recommendations
// into the shape of a new case (title, owning team, schedule, intervention
// drafts and opening timeline). No database or framework dependencies, so it is
// unit-testable and shared by the "open case" server action.

import type { RiskAssessment, Team } from "./types";
import type { InterventionRecommendation } from "./intervention-engine";
import { computeResponseSchedule, addDays } from "./response-rules";
import { label } from "./format";

export function teamForAssessment(a: RiskAssessment): Team {
  switch (a.primaryRisk) {
    case "fuelPoverty":
      return "Fuel Poverty Support";
    case "environmental":
    case "propertyCondition":
      return "Asset Management";
    case "supportNeed":
    case "householdVulnerability":
      return "Tenancy Support";
    default:
      return "Housing Officers";
  }
}

export interface PlannedIntervention {
  type: string;
  label: string;
  reason: string;
  team: Team;
  urgency: string;
  targetDate: Date;
  expectedOutcome: string;
}

export interface PlannedCase {
  title: string;
  ownerTeam: Team;
  priorityBand: string;
  openingRiskScore: number;
  openingBand: string;
  responseDueAt: Date;
  followUpDueAt: Date;
  interventions: PlannedIntervention[];
  notes: { kind: string; body: string; author: string }[];
}

export function planNewCase(
  opts: { locality: string; assessment: RiskAssessment; recommendations: InterventionRecommendation[]; now?: Date; maxInterventions?: number },
): PlannedCase {
  const { locality, assessment: a, recommendations } = opts;
  const now = opts.now ?? new Date();
  const max = opts.maxInterventions ?? 4;
  const schedule = computeResponseSchedule(a.urgency, a.band);

  const interventions: PlannedIntervention[] = recommendations.slice(0, max).map((r) => ({
    type: r.type,
    label: r.label,
    reason: r.reason,
    team: r.team,
    urgency: r.urgency,
    targetDate: addDays(now, r.targetLeadDays),
    expectedOutcome: r.expectedOutcome,
  }));

  const notes = [
    { kind: "assessment", author: "System", body: `Risk assessment generated: overall ${a.overallScore} (${a.band}). Primary driver: ${label(a.primaryRisk)}. Confidence ${a.confidence}.` },
    { kind: "status_change", author: "System", body: `Case opened (${a.band} priority).` },
  ];

  return {
    title: `${locality} — ${label(a.primaryRisk)} risk (${a.band})`,
    ownerTeam: teamForAssessment(a),
    priorityBand: a.band,
    openingRiskScore: a.overallScore,
    openingBand: a.band,
    responseDueAt: addDays(now, schedule.responseDueDays),
    followUpDueAt: addDays(now, schedule.followUpDueDays),
    interventions,
    notes,
  };
}
