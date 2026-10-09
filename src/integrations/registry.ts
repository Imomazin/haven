import type {
  Capability,
  Connector,
  ConnectorMeta,
  ConnectionState,
  HealthStatus,
  SyncLogEntry,
  SyncStats,
} from "./types";

// Deterministic per-connector pseudo-random so telemetry is stable across
// renders and between the demo and database paths.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rand(seed: number) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const NOW = Date.UTC(2026, 8, 18, 9, 0, 0); // aligns with seed NOW
const iso = (ms: number) => new Date(ms).toISOString();

const JOBS = ["Scheduled delta sync", "Webhook batch", "Backfill reconcile", "Health probe"];

function buildSync(meta: ConnectorMeta): { sync: SyncStats; log: SyncLogEntry[] } {
  const r = rand(hash(meta.slug));
  if (meta.state === "not_configured") {
    return {
      sync: { lastSyncAt: null, nextSyncAt: null, recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0, recordsFailed: 0, latencyMs: 0, health: "idle", webhookActive: false, uptimePct: 0 },
      log: [],
    };
  }
  const scale = meta.category === "connected_home" ? 1800 : meta.category === "repairs_assets" ? 420 : meta.category === "housing_management" ? 900 : meta.category === "communications" ? 160 : 90;
  const processed = Math.round(scale * (0.6 + r() * 0.9));
  const created = Math.round(processed * (0.02 + r() * 0.06));
  const failed = r() < 0.55 ? 0 : Math.round(processed * (0.001 + r() * 0.01));
  const updated = Math.round(processed * (0.15 + r() * 0.25));
  const health: HealthStatus = failed > processed * 0.02 ? "degraded" : meta.state === "sandbox" ? "healthy" : "healthy";
  const intervalMin = meta.category === "connected_home" ? 15 : meta.category === "communications" ? 5 : 60;
  const lastAgoMin = Math.round(r() * intervalMin);
  const lastSync = NOW - lastAgoMin * 60000;
  const latencyMs = Math.round(60 + r() * (meta.category === "public_data" ? 900 : 340));
  const sync: SyncStats = {
    lastSyncAt: iso(lastSync),
    nextSyncAt: iso(lastSync + intervalMin * 60000),
    recordsProcessed: processed,
    recordsCreated: created,
    recordsUpdated: updated,
    recordsFailed: failed,
    latencyMs,
    health,
    webhookActive: meta.auth === "webhook_hmac" || r() < 0.5,
    uptimePct: Math.round((99 + r() * 0.98) * 100) / 100,
  };
  const log: SyncLogEntry[] = Array.from({ length: 5 }, (_, i) => {
    const at = lastSync - i * intervalMin * 60000;
    const p = Math.round(processed / 5 * (0.6 + r() * 0.9));
    const f = i === 2 && failed > 0 ? Math.max(1, Math.round(failed / 2)) : r() < 0.15 ? 1 : 0;
    return {
      at: iso(at),
      job: JOBS[i % JOBS.length],
      outcome: f > 0 ? (f > 2 ? "failed" : "partial") : "success",
      processed: p,
      created: Math.round(p * 0.03),
      updated: Math.round(p * 0.2),
      failed: f,
      durationMs: Math.round(latencyMs * (3 + r() * 6)),
      note: f > 0 ? `${f} record(s) deferred to dead-letter queue` : "Completed within SLA",
    };
  });
  return { sync, log };
}

const META: ConnectorMeta[] = [
  // A. Housing Management
  { slug: "civica-cx", name: "Civica Cx Housing", vendor: "Civica", category: "housing_management", blurb: "System of record for tenancies, customers, properties and cases.", state: "demo", auth: "oauth2", direction: "bidirectional", capabilities: ["getProperties", "getHouseholds", "getTenancies", "getRepairs", "createCase", "getAuditEvents"], dataObjects: ["Property", "Customer", "Tenancy", "Case", "Repair", "Contact"], owner: "Housing Systems team", environment: "Demonstration", provenanceLabel: "Civica Cx" },
  { slug: "nec-housing", name: "NEC Housing", vendor: "NEC Software Solutions", category: "housing_management", blurb: "Housing management records, rent accounts and tenancy history.", state: "demo", auth: "api_key", direction: "inbound", capabilities: ["getProperties", "getHouseholds", "getTenancies"], dataObjects: ["Property", "Tenancy", "RentAccount"], owner: "Housing Systems team", environment: "Demonstration", provenanceLabel: "NEC Housing" },
  { slug: "mri-housing", name: "MRI Housing Management Enterprise", vendor: "MRI Software", category: "housing_management", blurb: "Enterprise housing management: tenancy, allocations and income.", state: "demo", auth: "oauth2", direction: "bidirectional", capabilities: ["getProperties", "getHouseholds", "getTenancies", "getRepairs"], dataObjects: ["Property", "Tenancy", "Household", "Repair"], owner: "Housing Systems team", environment: "Demonstration", provenanceLabel: "MRI Housing" },
  { slug: "salesforce", name: "Salesforce", vendor: "Salesforce", category: "housing_management", blurb: "Customer relationship and contact management for resident engagement.", state: "sandbox", auth: "oauth2", direction: "bidirectional", capabilities: ["getHouseholds", "getAuditEvents", "createCase"], dataObjects: ["Contact", "Case", "Interaction"], owner: "Customer Experience team", environment: "Sandbox", provenanceLabel: "Salesforce" },
  { slug: "dynamics-365", name: "Microsoft Dynamics 365 / Dataverse", vendor: "Microsoft", category: "housing_management", blurb: "Dataverse-backed CRM and case management.", state: "not_configured", auth: "oauth2", direction: "bidirectional", capabilities: ["getHouseholds", "createCase"], dataObjects: ["Contact", "Case"], owner: "—", environment: "—", provenanceLabel: "Dynamics 365" },

  // B. Connected Home
  { slug: "switchee", name: "Switchee", vendor: "Switchee", category: "connected_home", blurb: "Smart thermostat telemetry: temperature, humidity and heating behaviour.", state: "demo", auth: "api_key", direction: "inbound", capabilities: ["getSensorReadings", "getProperties"], dataObjects: ["Device", "Reading", "HeatingBehaviour"], owner: "Asset Management team", environment: "Demonstration", provenanceLabel: "Switchee" },
  { slug: "aico-homelink", name: "Aico HomeLINK", vendor: "Aico", category: "connected_home", blurb: "Environmental sensors and alarms: CO₂, damp/mould risk, device health.", state: "demo", auth: "webhook_hmac", direction: "inbound", capabilities: ["getSensorReadings"], dataObjects: ["Device", "Reading", "Alarm", "DeviceHealth"], owner: "Asset Management team", environment: "Demonstration", provenanceLabel: "Aico HomeLINK" },

  // C. Repairs & Assets
  { slug: "plentific", name: "Plentific", vendor: "Plentific", category: "repairs_assets", blurb: "Repairs marketplace: work orders, contractors and appointments.", state: "demo", auth: "oauth2", direction: "bidirectional", capabilities: ["getRepairs", "createRepair", "getAuditEvents"], dataObjects: ["WorkOrder", "Contractor", "Appointment"], owner: "Repairs team", environment: "Demonstration", provenanceLabel: "Plentific" },
  { slug: "totalmobile", name: "Totalmobile", vendor: "Totalmobile", category: "repairs_assets", blurb: "Mobile workforce scheduling and field service management.", state: "sandbox", auth: "api_key", direction: "bidirectional", capabilities: ["getRepairs", "createRepair"], dataObjects: ["Job", "Appointment", "Operative"], owner: "Repairs team", environment: "Sandbox", provenanceLabel: "Totalmobile" },
  { slug: "mri-asset", name: "MRI Housing Asset Management", vendor: "MRI Software", category: "repairs_assets", blurb: "Stock condition, component lifecycle and planned maintenance.", state: "demo", auth: "oauth2", direction: "inbound", capabilities: ["getRepairs", "getProperties"], dataObjects: ["Component", "StockCondition", "PlannedWorks"], owner: "Asset Management team", environment: "Demonstration", provenanceLabel: "MRI Asset" },
  { slug: "mri-accuserv", name: "MRI AccuServ", vendor: "MRI Software", category: "repairs_assets", blurb: "Responsive repairs and contractor management.", state: "not_configured", auth: "api_key", direction: "inbound", capabilities: ["getRepairs"], dataObjects: ["WorkOrder", "Contractor"], owner: "—", environment: "—", provenanceLabel: "MRI AccuServ" },
  { slug: "cotality", name: "Cotality", vendor: "Cotality", category: "repairs_assets", blurb: "Property and asset intelligence, valuations and risk data.", state: "not_configured", auth: "api_key", direction: "inbound", capabilities: ["getProperties"], dataObjects: ["AssetProfile", "Valuation"], owner: "—", environment: "—", provenanceLabel: "Cotality" },

  // D. Public & Reference Data
  { slug: "simd", name: "Scottish Index of Multiple Deprivation", vendor: "Scottish Government", category: "public_data", blurb: "Area-level deprivation deciles enriching place and household context.", state: "demo", auth: "none", direction: "inbound", capabilities: ["getDeprivation"], dataObjects: ["DataZone", "SIMD rank/decile"], owner: "Insight team", environment: "Open data", provenanceLabel: "SIMD" },
  { slug: "sg-opendata", name: "Scottish Government Open Data", vendor: "Scottish Government", category: "public_data", blurb: "statistics.gov.scot reference datasets.", state: "demo", auth: "none", direction: "inbound", capabilities: ["getDeprivation"], dataObjects: ["Statistics", "Reference"], owner: "Insight team", environment: "Open data", provenanceLabel: "statistics.gov.scot" },
  { slug: "nrs", name: "National Records of Scotland", vendor: "NRS", category: "public_data", blurb: "Census and small-area population estimates.", state: "not_configured", auth: "none", direction: "inbound", capabilities: ["getDeprivation"], dataObjects: ["Census", "Population"], owner: "—", environment: "—", provenanceLabel: "NRS Census" },
  { slug: "epc-register", name: "Scottish EPC Register", vendor: "Energy Saving Trust", category: "public_data", blurb: "Energy-performance certificates matched by UPRN.", state: "demo", auth: "api_key", direction: "inbound", capabilities: ["getEpc"], dataObjects: ["EPC", "SAP rating"], owner: "Asset Management team", environment: "Demonstration", provenanceLabel: "EPC Register" },
  { slug: "os-places", name: "Ordnance Survey Places", vendor: "Ordnance Survey", category: "public_data", blurb: "Authoritative addressing and UPRN reconciliation.", state: "sandbox", auth: "api_key", direction: "inbound", capabilities: ["getProperties"], dataObjects: ["Address", "UPRN"], owner: "Data team", environment: "Sandbox", provenanceLabel: "OS Places" },
  { slug: "openstreetmap", name: "OpenStreetMap", vendor: "OpenStreetMap", category: "public_data", blurb: "Open geographic context for the neighbourhood map.", state: "demo", auth: "none", direction: "inbound", capabilities: [], dataObjects: ["Geometry", "Place"], owner: "Data team", environment: "Open data", provenanceLabel: "OpenStreetMap" },
  { slug: "met-office", name: "Met Office DataHub", vendor: "Met Office", category: "public_data", blurb: "Local weather and cold-weather alerts for environmental context.", state: "demo", auth: "api_key", direction: "inbound", capabilities: ["getWeather"], dataObjects: ["Forecast", "ColdWeatherAlert"], owner: "Insight team", environment: "Demonstration", provenanceLabel: "Met Office" },

  // E. Resident Communications
  { slug: "govuk-notify", name: "GOV.UK Notify", vendor: "GDS", category: "communications", blurb: "Transactional SMS, email and letters to residents.", state: "demo", auth: "api_key", direction: "outbound", capabilities: ["sendMessage", "getAuditEvents"], dataObjects: ["Notification", "DeliveryReceipt"], owner: "Customer Experience team", environment: "Demonstration", provenanceLabel: "GOV.UK Notify" },
  { slug: "twilio", name: "Twilio SMS", vendor: "Twilio", category: "communications", blurb: "Programmable SMS for reminders and two-way messaging.", state: "sandbox", auth: "api_key", direction: "outbound", capabilities: ["sendMessage"], dataObjects: ["Message", "DeliveryStatus"], owner: "Customer Experience team", environment: "Sandbox", provenanceLabel: "Twilio" },
  { slug: "ms-teams", name: "Microsoft Teams", vendor: "Microsoft", category: "communications", blurb: "Officer and escalation-team notifications.", state: "demo", auth: "oauth2", direction: "outbound", capabilities: ["sendMessage"], dataObjects: ["Message", "Channel"], owner: "Operations team", environment: "Demonstration", provenanceLabel: "Microsoft Teams" },

  // F. Documents & Productivity
  { slug: "sharepoint", name: "Microsoft SharePoint", vendor: "Microsoft", category: "documents", blurb: "Case documents and property evidence from document libraries.", state: "demo", auth: "oauth2", direction: "bidirectional", capabilities: ["getDocuments"], dataObjects: ["Document", "Library", "Metadata"], owner: "Operations team", environment: "Demonstration", provenanceLabel: "SharePoint" },
  { slug: "microsoft-365", name: "Microsoft 365", vendor: "Microsoft", category: "documents", blurb: "Identity, Outlook and Office document productivity.", state: "not_configured", auth: "oauth2", direction: "bidirectional", capabilities: ["getDocuments"], dataObjects: ["User", "Document", "Calendar"], owner: "—", environment: "—", provenanceLabel: "Microsoft 365" },

  // G. Analytics & BI
  { slug: "power-bi", name: "Microsoft Power BI", vendor: "Microsoft", category: "analytics", blurb: "Push curated management datasets to executive dashboards.", state: "demo", auth: "oauth2", direction: "outbound", capabilities: ["pushAnalytics"], dataObjects: ["Dataset", "Dashboard"], owner: "Insight team", environment: "Demonstration", provenanceLabel: "Power BI" },
];

export const CONNECTORS: Connector[] = META.map((m) => ({ ...m, ...buildSync(m) }));

const BY_SLUG = new Map(CONNECTORS.map((c) => [c.slug, c]));
export function getConnector(slug: string): Connector | null {
  return BY_SLUG.get(slug) ?? null;
}
const BY_PROV = new Map(CONNECTORS.map((c) => [c.provenanceLabel, c]));
export function connectorByProvenance(label: string): Connector | null {
  return BY_PROV.get(label) ?? null;
}

export function connectorsByCategory() {
  const groups = new Map<string, Connector[]>();
  for (const c of CONNECTORS) {
    const arr = groups.get(c.category) ?? [];
    arr.push(c);
    groups.set(c.category, arr);
  }
  return groups;
}

export interface EcosystemSummary {
  total: number;
  live: number;
  sandbox: number;
  demo: number;
  notConfigured: number;
  recordsProcessed: number;
  recordsFailed: number;
  avgUptime: number;
  categories: number;
  webhooksActive: number;
}

export function ecosystemSummary(): EcosystemSummary {
  const active = CONNECTORS.filter((c) => c.state !== "not_configured");
  const by = (s: ConnectionState) => CONNECTORS.filter((c) => c.state === s).length;
  return {
    total: CONNECTORS.length,
    live: by("live"),
    sandbox: by("sandbox"),
    demo: by("demo"),
    notConfigured: by("not_configured"),
    recordsProcessed: CONNECTORS.reduce((s, c) => s + c.sync.recordsProcessed, 0),
    recordsFailed: CONNECTORS.reduce((s, c) => s + c.sync.recordsFailed, 0),
    avgUptime: active.length ? Math.round((active.reduce((s, c) => s + c.sync.uptimePct, 0) / active.length) * 100) / 100 : 0,
    categories: new Set(CONNECTORS.map((c) => c.category)).size,
    webhooksActive: CONNECTORS.filter((c) => c.sync.webhookActive).length,
  };
}

// Capability check used by the orchestration layer before invoking a method.
export function connectorsWith(capability: Capability): Connector[] {
  return CONNECTORS.filter((c) => c.capabilities.includes(capability) && c.state !== "not_configured");
}
