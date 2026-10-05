import { describe, it, expect } from "vitest";
import { assessRisk } from "./risk-engine";
import { recommendInterventions } from "./intervention-engine";
import { planNewCase, teamForAssessment } from "./case-planning";
import type { RiskInput } from "./types";

const badHome: RiskInput = {
  property: { propertyType: "tenement_flat", constructionEra: "pre1919", epcRating: "F", heatingType: "electric_storage", wallInsulation: "none", loftInsulation: "partial", glazing: "single", ventilation: "poor", dampHistoryCount: 3, mouldHistoryCount: 2, openRepairs: 1, lastRepairDaysAgo: null, indoorHumidityPct: 74, indoorWinterTempC: 15, co2Ppm: 1350, readingsAgeDays: 12 },
  household: { householdSize: 2, adultsOver65: 1, childrenUnder5: 0, childrenPresent: false, incomeRiskIndicator: "high", fuelPovertyIndicator: "in_fuel_poverty", mobilitySupport: true, healthVulnerability: "significant", recentHouseholdChange: false, energyUsePattern: "under_heating" },
};

describe("planNewCase", () => {
  const a = assessRisk(badHome);
  const recs = recommendInterventions(badHome, a);
  const now = new Date("2026-06-01T00:00:00Z");
  const plan = planNewCase({ locality: "Greenock Central", assessment: a, recommendations: recs, now });

  it("sets opening risk and priority from the assessment", () => {
    expect(plan.openingRiskScore).toBe(a.overallScore);
    expect(plan.openingBand).toBe(a.band);
    expect(plan.priorityBand).toBe(a.band);
  });

  it("titles the case with locality, primary risk and band", () => {
    expect(plan.title).toContain("Greenock Central");
    expect(plan.title).toContain(a.band);
  });

  it("routes a fuel-poverty-led case to Fuel Poverty Support", () => {
    expect(a.primaryRisk).toBe("fuelPoverty");
    expect(plan.ownerTeam).toBe("Fuel Poverty Support");
  });

  it("caps interventions and sets target dates relative to now", () => {
    expect(plan.interventions.length).toBeLessThanOrEqual(4);
    expect(plan.interventions.length).toBeGreaterThan(0);
    for (const it of plan.interventions) {
      expect(it.targetDate.getTime()).toBeGreaterThan(now.getTime());
    }
  });

  it("opens the timeline with an assessment and a status-change note", () => {
    const kinds = plan.notes.map((n) => n.kind);
    expect(kinds).toContain("assessment");
    expect(kinds).toContain("status_change");
  });

  it("schedules response sooner than follow-up", () => {
    expect(plan.responseDueAt.getTime()).toBeLessThan(plan.followUpDueAt.getTime());
  });
});

describe("teamForAssessment", () => {
  it("maps each primary risk to a sensible team", () => {
    expect(teamForAssessment({ primaryRisk: "fuelPoverty" } as never)).toBe("Fuel Poverty Support");
    expect(teamForAssessment({ primaryRisk: "environmental" } as never)).toBe("Asset Management");
    expect(teamForAssessment({ primaryRisk: "householdVulnerability" } as never)).toBe("Tenancy Support");
    expect(teamForAssessment({ primaryRisk: "recurrence" } as never)).toBe("Housing Officers");
  });
});
