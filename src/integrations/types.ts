// Haven integration framework — typed adapter contract.
//
// Haven is an intelligence and intervention LAYER over a landlord's existing
// systems. It does not replace a Housing Management System; it reconciles
// records from many systems through a shared property identity (UPRN) and a
// canonical, HACT-aligned data model.
//
// TRUTHFULNESS: a connector only claims "live" when real credentials are
// configured. In this demonstrator every connector runs in DEMO mode against
// deterministic synthetic fixtures. States are explicit and never overstated.

export type IntegrationCategory =
  | "housing_management"
  | "connected_home"
  | "repairs_assets"
  | "public_data"
  | "communications"
  | "documents"
  | "analytics";

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  housing_management: "Housing Management",
  connected_home: "Connected Home",
  repairs_assets: "Repairs & Assets",
  public_data: "Public & Reference Data",
  communications: "Resident Communications",
  documents: "Documents & Productivity",
  analytics: "Analytics & BI",
};

// Connection lifecycle. DEMO = realistic adapter running on synthetic fixtures.
// A connector is only ever LIVE when a customer has authorised real credentials.
export type ConnectionState = "live" | "sandbox" | "demo" | "not_configured";

export const STATE_LABELS: Record<ConnectionState, string> = {
  live: "Connected",
  sandbox: "Sandbox",
  demo: "Demo connector",
  not_configured: "Ready to configure",
};

export type AuthType = "oauth2" | "api_key" | "mutual_tls" | "webhook_hmac" | "sftp" | "none";

export const AUTH_LABELS: Record<AuthType, string> = {
  oauth2: "OAuth 2.0",
  api_key: "API key",
  mutual_tls: "Mutual TLS",
  webhook_hmac: "Signed webhook",
  sftp: "Secure file transfer",
  none: "No authentication",
};

// Capabilities a connector declares. The UI and orchestration layer read these
// rather than assuming every adapter implements every method.
export type Capability =
  | "getProperties"
  | "getHouseholds"
  | "getTenancies"
  | "getRepairs"
  | "createRepair"
  | "getSensorReadings"
  | "getEpc"
  | "getDeprivation"
  | "getWeather"
  | "getDocuments"
  | "sendMessage"
  | "createCase"
  | "pushAnalytics"
  | "getAuditEvents";

export const CAPABILITY_LABELS: Record<Capability, string> = {
  getProperties: "Properties",
  getHouseholds: "Households",
  getTenancies: "Tenancies",
  getRepairs: "Repairs",
  createRepair: "Raise repair",
  getSensorReadings: "Sensor readings",
  getEpc: "EPC",
  getDeprivation: "Deprivation (SIMD)",
  getWeather: "Weather",
  getDocuments: "Documents",
  sendMessage: "Send message",
  createCase: "Create case",
  pushAnalytics: "Push analytics",
  getAuditEvents: "Audit events",
};

export type DataDirection = "inbound" | "outbound" | "bidirectional";

export const DIRECTION_LABELS: Record<DataDirection, string> = {
  inbound: "Inbound to Haven",
  outbound: "Outbound from Haven",
  bidirectional: "Bi-directional",
};

// Health of the most recent sync / connection probe.
export type HealthStatus = "healthy" | "degraded" | "down" | "idle";

export interface SyncStats {
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  latencyMs: number;
  health: HealthStatus;
  webhookActive: boolean;
  uptimePct: number;
}

export interface SyncLogEntry {
  at: string;
  job: string;
  outcome: "success" | "partial" | "failed";
  processed: number;
  created: number;
  updated: number;
  failed: number;
  durationMs: number;
  note: string;
}

// Static description of a connector in the registry.
export interface ConnectorMeta {
  slug: string;
  name: string;
  vendor: string;
  category: IntegrationCategory;
  blurb: string;
  state: ConnectionState;
  auth: AuthType;
  direction: DataDirection;
  capabilities: Capability[];
  dataObjects: string[];
  owner: string;
  environment: string;
  // The canonical source system name used for data provenance badges.
  provenanceLabel: string;
}

export interface Connector extends ConnectorMeta {
  sync: SyncStats;
  log: SyncLogEntry[];
}

// The adapter contract. Concrete adapters implement only the methods their
// declared capabilities cover; callers check `capabilities` before invoking.
export interface IntegrationAdapter {
  readonly meta: ConnectorMeta;
  healthCheck(): Promise<{ status: HealthStatus; latencyMs: number; checkedAt: string }>;
  supports(capability: Capability): boolean;
}
