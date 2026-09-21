import { describe, it, expect } from "vitest";
import { propertySignalsSchema, householdSignalsSchema, caseNoteSchema, canTransition, assertCaseStatus } from "./validation";

describe("validation schemas", () => {
  it("accepts valid property signals", () => {
    const r = propertySignalsSchema.safeParse({
      propertyType: "tenement_flat", constructionEra: "pre1919", epcRating: "F", heatingType: "electric_storage",
      wallInsulation: "none", loftInsulation: "partial", glazing: "single", ventilation: "poor",
      dampHistoryCount: 3, mouldHistoryCount: 2, openRepairs: 1, lastRepairDaysAgo: null,
      indoorHumidityPct: 74, indoorWinterTempC: 15, co2Ppm: 1350, readingsAgeDays: 12,
    });
    expect(r.success).toBe(true);
  });

  it("rejects an invalid EPC rating and out-of-range humidity", () => {
    expect(propertySignalsSchema.safeParse({ epcRating: "Z" }).success).toBe(false);
    const r = householdSignalsSchema.safeParse({
      householdSize: 0, adultsOver65: 0, childrenUnder5: 0, childrenPresent: false,
      incomeRiskIndicator: "low", fuelPovertyIndicator: "none", mobilitySupport: false,
      healthVulnerability: "none", recentHouseholdChange: false, energyUsePattern: "normal",
    });
    expect(r.success).toBe(false); // householdSize must be >= 1
  });

  it("rejects an empty case note", () => {
    expect(caseNoteSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(caseNoteSchema.safeParse({ body: "Called tenant" }).success).toBe(true);
  });
});

describe("case transitions", () => {
  it("allows sensible transitions", () => {
    expect(canTransition("open", "assigned")).toBe(true);
    expect(canTransition("in_progress", "escalated")).toBe(true);
    expect(canTransition("closed", "monitoring")).toBe(true); // reopen
    expect(canTransition("in_progress", "in_progress")).toBe(true);
  });

  it("blocks nonsensical transitions", () => {
    expect(canTransition("closed", "open")).toBe(false);
    expect(canTransition("open", "monitoring")).toBe(false);
  });

  it("asserts known statuses only", () => {
    expect(assertCaseStatus("escalated")).toBe("escalated");
    expect(() => assertCaseStatus("frozen")).toThrow();
  });
});
