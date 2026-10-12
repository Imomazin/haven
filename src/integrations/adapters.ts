// Concrete demonstration adapters implementing Haven's integration contract.
//
// Every configured connector can execute deterministic, capability-aware demo
// operations without customer credentials. This lets the product demonstrate
// real integration behaviour while remaining explicit that no production
// tenant is connected. Not-configured connectors stay credential-ready only.

import type { Capability, ConnectorMeta, HealthStatus, IntegrationAdapter } from "./types";
import { getConnector } from "./registry";
import {
  sensorFeed,
  repairsForProperty,
  tenancyFor,
  simdDecile,
  uprnFor,
  type SensorFeed,
  type RepairRecord,
} from "./fixtures";

export type DemoOperationResult = {
  connector: string;
  capability: Capability;
  mode: "demo" | "sandbox";
  at: string;
  input: Record<string, unknown>;
  output: unknown;
};

const DEMO_NOW = "2026-09-18T09:00:00.000Z";

class DemoAdapter implements IntegrationAdapter {
  constructor(readonly meta: ConnectorMeta) {}

  supports(capability: Capability): boolean {
    return this.meta.capabilities.includes(capability);
  }

  async healthCheck() {
    const c = getConnector(this.meta.slug);
    const status: HealthStatus = c?.sync.health ?? "idle";
    return { status, latencyMs: c?.sync.latencyMs ?? 0, checkedAt: DEMO_NOW };
  }

  protected ensure(capability: Capability) {
    if (!this.supports(capability)) {
      throw new Error(`${this.meta.name} does not support ${capability}`);
    }
  }
}

// Connected-home adapter: exposes sensor time-series backed by deterministic
// property fixtures. The newest point reconciles to the property record.
export class ConnectedHomeAdapter extends DemoAdapter {
  async getSensorReadings(
    propertyId: number,
    winterTempC: number | null,
    humidityPct: number | null,
    co2Ppm: number | null,
  ): Promise<SensorFeed | null> {
    this.ensure("getSensorReadings");
    return sensorFeed(propertyId, winterTempC, humidityPct, co2Ppm);
  }
}

// Repairs adapter: read and create operations use the same deterministic
// fixture family as Property 360 and the case workspace.
export class RepairsAdapter extends DemoAdapter {
  async getRepairs(
    propertyId: number,
    dampCount: number,
    mouldCount: number,
    openRepairs: number,
  ): Promise<RepairRecord[]> {
    this.ensure("getRepairs");
    return repairsForProperty(propertyId, dampCount, mouldCount, openRepairs);
  }

  async createRepair(input: {
    propertyRef: string;
    category: string;
    description: string;
  }): Promise<{ workOrderRef: string; status: "scheduled"; demo: true }> {
    this.ensure("createRepair");
    const seed = input.propertyRef.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
    return {
      workOrderRef: `WO-${String(100000 + (seed * 37) % 900000)}`,
      status: "scheduled",
      demo: true,
    };
  }
}

// General adapter used by every other configured connector. It executes a
// truthful demonstration payload for each declared capability, which means the
// integration centre is not merely a registry of logos and schemas.
export class EnterpriseDemoAdapter extends DemoAdapter {
  async execute(
    capability: Capability,
    input: Record<string, unknown> = {},
  ): Promise<DemoOperationResult> {
    this.ensure(capability);

    const propertyId = Number(input.propertyId ?? 1);
    const householdId = Number(input.householdId ?? 1);
    const propertyRef = String(input.propertyRef ?? "HAV-P-0001");
    const householdRef = String(input.householdRef ?? "HAV-H-0001");
    const locality = String(input.locality ?? "Greenock Central");

    let output: unknown;
    switch (capability) {
      case "getProperties":
        output = {
          propertyRef,
          uprn: uprnFor(propertyId),
          addressMatch: "UPRN reconciled",
          sourceRecordId: `${this.meta.slug.toUpperCase()}-${propertyId}`,
        };
        break;
      case "getHouseholds":
        output = {
          householdRef,
          propertyRef,
          residentCount: 3,
          sourceRecordId: `${this.meta.slug.toUpperCase()}-HH-${householdId}`,
        };
        break;
      case "getTenancies":
        output = tenancyFor(householdId, String(input.propertyType ?? "flat"));
        break;
      case "getRepairs":
        output = repairsForProperty(propertyId, 2, 1, 1).slice(0, 3);
        break;
      case "createRepair":
        output = {
          workOrderRef: `WO-${82000 + propertyId}`,
          status: "scheduled",
          appointmentWindow: "20 Sep 2026 · 09:00–13:00",
          demo: true,
        };
        break;
      case "getSensorReadings":
        output = sensorFeed(propertyId, 15.8, 72, 1280);
        break;
      case "getEpc":
        output = {
          uprn: uprnFor(propertyId),
          rating: "E",
          score: 46,
          lodgedAt: "2025-11-04",
          matched: true,
        };
        break;
      case "getDeprivation":
        output = {
          locality,
          simdDecile: simdDecile(locality),
          geography: "Data zone",
          sourceVersion: "2020v2",
        };
        break;
      case "getWeather":
        output = {
          locality,
          observedTempC: 6.4,
          feelsLikeC: 3.1,
          overnightLowC: 2.0,
          coldWeatherContext: "Elevated",
        };
        break;
      case "getDocuments":
        output = [
          { name: "Damp inspection report.pdf", type: "Inspection", modifiedAt: "2026-09-16T14:22:00Z" },
          { name: "Resident consent record.pdf", type: "Consent", modifiedAt: "2026-09-14T10:05:00Z" },
        ];
        break;
      case "sendMessage":
        output = {
          notificationRef: `NTF-${64000 + householdId}`,
          channel: String(input.channel ?? "SMS"),
          status: "delivered",
          deliveredAt: DEMO_NOW,
          demo: true,
        };
        break;
      case "createCase":
        output = {
          caseRef: `HAV-C-${String(900 + householdId).padStart(4, "0")}`,
          status: "identified",
          ownerQueue: "Housing Support",
          demo: true,
        };
        break;
      case "pushAnalytics":
        output = {
          dataset: "HAVEN Portfolio Outcomes",
          rows: 164,
          status: "accepted",
          refreshRef: `PBI-${3200 + propertyId}`,
          demo: true,
        };
        break;
      case "getAuditEvents":
        output = [
          { at: DEMO_NOW, event: "connector.read", actor: "HAVEN integration service", outcome: "success" },
          { at: "2026-09-18T08:58:00.000Z", event: "schema.map", actor: "Canonical mapper", outcome: "success" },
        ];
        break;
      default: {
        const exhaustive: never = capability;
        output = exhaustive;
      }
    }

    return {
      connector: this.meta.name,
      capability,
      mode: this.meta.state === "sandbox" ? "sandbox" : "demo",
      at: DEMO_NOW,
      input,
      output,
    };
  }
}

export function connectedHomeAdapter(slug = "switchee"): ConnectedHomeAdapter | null {
  const c = getConnector(slug);
  return c && c.state !== "not_configured" ? new ConnectedHomeAdapter(c) : null;
}

export function repairsAdapter(slug = "plentific"): RepairsAdapter | null {
  const c = getConnector(slug);
  return c && c.state !== "not_configured" ? new RepairsAdapter(c) : null;
}

// Returns an executable adapter for every configured registry connector.
// Credential-ready connectors intentionally return null until authorised.
export function enterpriseAdapter(slug: string): EnterpriseDemoAdapter | null {
  const c = getConnector(slug);
  return c && c.state !== "not_configured" ? new EnterpriseDemoAdapter(c) : null;
}
