import { describe, it, expect } from "vitest";
import { assessRisk } from "./risk-engine";
import { recommendInterventions } from "./intervention-engine";
import type { RiskInput } from "./types";

const input = (over: Partial<RiskInput["property"]> = {}, hh: Partial<RiskInput["household"]> = {}): RiskInput => ({
  property: {
    propertyType: "tenement_flat",
    constructionEra: "pre1919",
    epcRating: "F",
    heatingType: "electric_storage",
    wallInsulation: "none",
    loftInsulation: "partial",
    glazing: "single",
    ventilation: "poor",
    dampHistoryCount: 3,
    mouldHistoryCount: 2,
    openRepairs: 1,
    lastRepairDaysAgo: null,
    indoorHumidityPct: 74,
    indoorWinterTempC: 15,
    co2Ppm: 1350,
    readingsAgeDays: 12,
    ...over,
  },
  household: {
    householdSize: 2,
    adultsOver65: 1,
    childrenUnder5: 0,
    childrenPresent: false,
    incomeRiskIndicator: "high",
    fuelPovertyIndicator: "in_fuel_poverty",
    mobilitySupport: true,
    healthVulnerability: "significant",
    recentHouseholdChange: false,
    energyUsePattern: "under_heating",
    ...hh,
  },
});

describe("recommendInterventions", () => {
  it("recommends damp/mould, heating and support for a bad home", () => {
    const i = input();
    const recs = recommendInterventions(i, assessRisk(i));
    const types = recs.map((r) => r.type);
    expect(types).toContain("mould_investigation");
    expect(types).toContain("heating_support");
    expect(types).toContain("follow_up_assessment");
  });

  it("does not duplicate an intervention type", () => {
    const i = input();
    const recs = recommendInterventions(i, assessRisk(i));
    const types = recs.map((r) => r.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("recommends energy + income support for fuel poverty without fabric issues", () => {
    const i = input(
      { constructionEra: "post2002", epcRating: "B", heatingType: "heat_pump", wallInsulation: "full", loftInsulation: "full", glazing: "double", ventilation: "good", dampHistoryCount: 0, mouldHistoryCount: 0, openRepairs: 0, indoorHumidityPct: 45, indoorWinterTempC: 20, co2Ppm: 600 },
      { adultsOver65: 0, mobilitySupport: false, healthVulnerability: "none" },
    );
    const recs = recommendInterventions(i, assessRisk(i));
    const types = recs.map((r) => r.type);
    expect(types).toContain("heating_support");
    expect(types).toContain("income_maximisation_referral");
    expect(types).not.toContain("mould_investigation");
  });

  it("orders recommendations by descending priority", () => {
    const i = input();
    const recs = recommendInterventions(i, assessRisk(i));
    for (let k = 1; k < recs.length; k++) {
      expect(recs[k - 1].priority).toBeGreaterThanOrEqual(recs[k].priority);
    }
  });

  it("returns no interventions above follow-up for a low-risk home", () => {
    const i = input(
      { constructionEra: "post2002", epcRating: "A", heatingType: "heat_pump", wallInsulation: "full", loftInsulation: "full", glazing: "triple", ventilation: "good", dampHistoryCount: 0, mouldHistoryCount: 0, openRepairs: 0, indoorHumidityPct: 42, indoorWinterTempC: 21, co2Ppm: 550 },
      { adultsOver65: 0, incomeRiskIndicator: "low", fuelPovertyIndicator: "none", mobilitySupport: false, healthVulnerability: "none", energyUsePattern: "normal" },
    );
    const a = assessRisk(i);
    const recs = recommendInterventions(i, a);
    expect(a.band).toBe("Low");
    expect(recs.every((r) => r.type === "follow_up_assessment" || r.priority < 70)).toBe(true);
  });
});
