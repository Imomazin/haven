// Concrete demo adapters implementing the IntegrationAdapter contract.
// Each adapter advertises capabilities; callers check support before invoking.
// In this demonstrator adapters resolve against deterministic fixtures and
// never open a real connection — the connection state says so honestly.

import type { Capability, ConnectorMeta, HealthStatus, IntegrationAdapter } from "./types";
import { getConnector } from "./registry";
import { sensorFeed, repairsForProperty, type SensorFeed, type RepairRecord } from "./fixtures";

class DemoAdapter implements IntegrationAdapter {
  constructor(readonly meta: ConnectorMeta) {}
  supports(capability: Capability): boolean {
    return this.meta.capabilities.includes(capability);
  }
  async healthCheck() {
    const c = getConnector(this.meta.slug);
    const status: HealthStatus = c?.sync.health ?? "idle";
    return { status, latencyMs: c?.sync.latencyMs ?? 0, checkedAt: new Date().toISOString() };
  }
}

// Connected-home adapter: exposes getSensorReadings backed by the time-series.
export class ConnectedHomeAdapter extends DemoAdapter {
  async getSensorReadings(propertyId: number, winterTempC: number | null, humidityPct: number | null, co2Ppm: number | null): Promise<SensorFeed | null> {
    if (!this.supports("getSensorReadings")) throw new Error(`${this.meta.name} does not support getSensorReadings`);
    return sensorFeed(propertyId, winterTempC, humidityPct, co2Ppm);
  }
}

// Repairs adapter: exposes getRepairs / createRepair.
export class RepairsAdapter extends DemoAdapter {
  async getRepairs(propertyId: number, dampCount: number, mouldCount: number, openRepairs: number): Promise<RepairRecord[]> {
    if (!this.supports("getRepairs")) throw new Error(`${this.meta.name} does not support getRepairs`);
    return repairsForProperty(propertyId, dampCount, mouldCount, openRepairs);
  }
  // In demo mode a created repair returns a synthetic work-order reference and
  // is recorded as an audit event by the caller — nothing leaves the system.
  async createRepair(input: { propertyRef: string; category: string; description: string }): Promise<{ workOrderRef: string; status: "scheduled"; demo: true }> {
    if (!this.supports("createRepair")) throw new Error(`${this.meta.name} does not support createRepair`);
    return { workOrderRef: `WO-${Math.floor(100000 + (input.propertyRef.length * 37) % 900000)}`, status: "scheduled", demo: true };
  }
}

export function connectedHomeAdapter(slug = "switchee"): ConnectedHomeAdapter | null {
  const c = getConnector(slug);
  return c ? new ConnectedHomeAdapter(c) : null;
}
export function repairsAdapter(slug = "plentific"): RepairsAdapter | null {
  const c = getConnector(slug);
  return c ? new RepairsAdapter(c) : null;
}
