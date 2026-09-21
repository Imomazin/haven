import { describe, it, expect } from "vitest";
import { buildDataset } from "./generate";

describe("seed dataset", () => {
  const ds = buildDataset();

  it("meets minimum volumes required by the brief", () => {
    expect(ds.properties.length).toBeGreaterThanOrEqual(50);
    expect(ds.households.length).toBeGreaterThanOrEqual(40);
    expect(ds.cases.length).toBeGreaterThanOrEqual(20);
  });

  it("is deterministic across builds", () => {
    const other = buildDataset();
    expect(other.properties).toEqual(ds.properties);
    expect(other.cases.map((c) => c.ref)).toEqual(ds.cases.map((c) => c.ref));
  });

  it("has multiple case states and multiple intervention types", () => {
    const states = new Set(ds.cases.map((c) => c.status));
    expect(states.size).toBeGreaterThanOrEqual(4);
    const types = new Set(ds.interventions.map((i) => i.type));
    expect(types.size).toBeGreaterThanOrEqual(5);
  });

  it("spans multiple risk bands including at least one Critical", () => {
    const bands = new Set(ds.assessments.map((a) => a.band));
    expect(bands.size).toBeGreaterThanOrEqual(3);
    expect([...bands]).toContain("Critical");
  });

  it("demonstrates risk reduction on some cases", () => {
    const reduced = ds.cases.filter((c) => c.followupRiskScore != null && c.followupRiskScore < (c.openingRiskScore ?? 0));
    expect(reduced.length).toBeGreaterThan(0);
  });

  it("has valid foreign-key references", () => {
    const propIds = new Set(ds.properties.map((p) => p.id));
    const hhIds = new Set(ds.households.map((h) => h.id));
    const caseIds = new Set(ds.cases.map((c) => c.id));
    expect(ds.households.every((h) => propIds.has(h.propertyId))).toBe(true);
    expect(ds.cases.every((c) => propIds.has(c.propertyId) && hhIds.has(c.householdId))).toBe(true);
    expect(ds.interventions.every((i) => caseIds.has(i.caseId))).toBe(true);
    expect(ds.notes.every((n) => caseIds.has(n.caseId))).toBe(true);
  });

  it("includes the three narrative story cases", () => {
    const titles = ds.cases.map((c) => c.title);
    expect(titles).toContain("Older tenement — recurring damp with vulnerability");
    expect(titles).toContain("Modern home — fuel-poverty & under-heating");
    expect(titles).toContain("Persistent risk after repair — ventilation escalation");
  });
});
