import { describe, it, expect } from "vitest";
import { assessRisk } from "./risk-engine";
import { bandForScore, DIMENSION_WEIGHTS } from "./constants";
import type { RiskInput } from "./types";

const baseInput = (over: Partial<RiskInput["property"]> = {}, hh: Partial<RiskInput["household"]> = {}): RiskInput => ({
  property: {
    propertyType: "semi_detached",
    constructionEra: "post2002",
    epcRating: "B",
    heatingType: "gas_central",
    wallInsulation: "full",
    loftInsulation: "full",
    glazing: "double",
    ventilation: "good",
    dampHistoryCount: 0,
    mouldHistoryCount: 0,
    openRepairs: 0,
    lastRepairDaysAgo: 300,
    indoorHumidityPct: 45,
    indoorWinterTempC: 21,
    co2Ppm: 600,
    readingsAgeDays: 5,
    ...over,
  },
  household: {
    householdSize: 2,
    adultsOver65: 0,
    childrenUnder5: 0,
    childrenPresent: false,
    incomeRiskIndicator: "low",
    fuelPovertyIndicator: "none",
    mobilitySupport: false,
    healthVulnerability: "none",
    recentHouseholdChange: false,
    energyUsePattern: "normal",
    ...hh,
  },
});

describe("assessRisk", () => {
  it("scores a good modern property as Low", () => {
    const a = assessRisk(baseInput());
    expect(a.band).toBe("Low");
    expect(a.overallScore).toBeLessThan(25);
  });

  it("scores an old damp fuel-poor vulnerable home as Critical", () => {
    const a = assessRisk(
      baseInput(
        {
          constructionEra: "pre1919",
          epcRating: "F",
          heatingType: "electric_storage",
          wallInsulation: "none",
          glazing: "single",
          ventilation: "poor",
          dampHistoryCount: 3,
          mouldHistoryCount: 2,
          indoorHumidityPct: 74,
          indoorWinterTempC: 15,
          co2Ppm: 1350,
        },
        { adultsOver65: 1, incomeRiskIndicator: "high", fuelPovertyIndicator: "in_fuel_poverty", mobilitySupport: true, healthVulnerability: "significant", energyUsePattern: "under_heating" },
      ),
    );
    expect(a.band).toBe("Critical");
    expect(a.overallScore).toBeGreaterThanOrEqual(75);
  });

  it("keeps every score within 0..100", () => {
    const a = assessRisk(baseInput({ dampHistoryCount: 20, mouldHistoryCount: 20, openRepairs: 20 }));
    for (const v of Object.values(a.dimensions)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(a.overallScore).toBeLessThanOrEqual(100);
  });

  it("weights sum to 1", () => {
    const sum = Object.values(DIMENSION_WEIGHTS).reduce((s, w) => s + w, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it("bandForScore maps thresholds correctly", () => {
    expect(bandForScore(0)).toBe("Low");
    expect(bandForScore(24)).toBe("Low");
    expect(bandForScore(25)).toBe("Moderate");
    expect(bandForScore(49)).toBe("Moderate");
    expect(bandForScore(50)).toBe("High");
    expect(bandForScore(74)).toBe("High");
    expect(bandForScore(75)).toBe("Critical");
    expect(bandForScore(100)).toBe("Critical");
  });

  it("lowers confidence when environmental readings are missing", () => {
    const withReadings = assessRisk(baseInput());
    const without = assessRisk(baseInput({ indoorHumidityPct: null, indoorWinterTempC: null, co2Ppm: null, readingsAgeDays: null }));
    expect(without.confidenceScore).toBeLessThan(withReadings.confidenceScore);
    expect(without.missingEvidence.length).toBeGreaterThan(0);
  });

  it("escalates urgency for a cold home with a vulnerable occupant", () => {
    const a = assessRisk(baseInput({ indoorWinterTempC: 14 }, { adultsOver65: 1 }));
    expect(a.urgencyScore).toBeGreaterThanOrEqual(85);
    expect(a.urgency).toBe("Immediate");
  });

  it("is deterministic for the same input", () => {
    const i = baseInput({ dampHistoryCount: 2 }, { fuelPovertyIndicator: "at_risk" });
    expect(assessRisk(i)).toEqual(assessRisk(i));
  });

  it("identifies fuel poverty as primary risk when dominant", () => {
    const a = assessRisk(baseInput({}, { fuelPovertyIndicator: "in_fuel_poverty", incomeRiskIndicator: "high", energyUsePattern: "under_heating" }));
    expect(a.primaryRisk).toBe("fuelPoverty");
  });
});
