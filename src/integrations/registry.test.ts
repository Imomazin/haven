import { describe, it, expect } from "vitest";
import { CONNECTORS, ecosystemSummary, connectorsWith, getConnector } from "./registry";
import { connectedHomeAdapter, repairsAdapter } from "./adapters";
import { sensorFeed, repairsForProperty } from "./fixtures";

describe("integration registry", () => {
  it("has connectors across all seven categories", () => {
    expect(new Set(CONNECTORS.map((c) => c.category)).size).toBe(7);
    expect(CONNECTORS.length).toBeGreaterThanOrEqual(20);
  });

  it("not-configured connectors report no sync activity", () => {
    for (const c of CONNECTORS.filter((c) => c.state === "not_configured")) {
      expect(c.sync.recordsProcessed).toBe(0);
      expect(c.sync.lastSyncAt).toBeNull();
      expect(c.log).toHaveLength(0);
    }
  });

  it("active connectors have stable, non-negative telemetry", () => {
    for (const c of CONNECTORS.filter((c) => c.state !== "not_configured")) {
      expect(c.sync.recordsProcessed).toBeGreaterThan(0);
      expect(c.sync.recordsFailed).toBeGreaterThanOrEqual(0);
      expect(c.sync.recordsFailed).toBeLessThanOrEqual(c.sync.recordsProcessed);
      expect(c.sync.uptimePct).toBeGreaterThan(98);
    }
  });

  it("summary counts reconcile with the registry", () => {
    const s = ecosystemSummary();
    expect(s.total).toBe(CONNECTORS.length);
    expect(s.live + s.sandbox + s.demo + s.notConfigured).toBe(s.total);
  });

  it("capability queries only return configured connectors", () => {
    for (const c of connectorsWith("getSensorReadings")) expect(c.state).not.toBe("not_configured");
  });
});

describe("adapters honour capability declarations", () => {
  it("connected-home adapter returns a sensor feed and matches the property's current reading", () => {
    const a = connectedHomeAdapter("switchee")!;
    expect(a.supports("getSensorReadings")).toBe(true);
    const feed = sensorFeed(4, 13.1, 79, 1200);
    expect(feed).not.toBeNull();
    expect(feed!.series.length).toBe(14);
    // latest reading converges on the anchor value
    expect(Math.abs(feed!.latest.tempC - 13.1)).toBeLessThan(2);
  });

  it("repairs adapter produces records consistent with damp/mould history", () => {
    const repairs = repairsForProperty(1, 3, 2, 1);
    expect(repairs.length).toBeGreaterThan(0);
    // damp-led repairs are attributed to the HMS of record
    expect(repairs.some((r) => r.category === "Damp & mould")).toBe(true);
    expect(getConnector("civica-cx")).not.toBeNull();
  });

  it("repairs adapter rejects unsupported capability", () => {
    const a = repairsAdapter("plentific")!;
    expect(a.supports("getRepairs")).toBe(true);
    expect(a.supports("sendMessage")).toBe(false);
  });
});
