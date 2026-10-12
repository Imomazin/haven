import { CONNECTORS } from "./registry";
import type { Connector, IntegrationCategory } from "./types";

export type ImplementationLevel = "executable_demo" | "credential_ready";

export interface ImplementationInfo {
  level: ImplementationLevel;
  label: string;
  detail: string;
}

export function implementationFor(c: Connector): ImplementationInfo {
  if (c.state === "not_configured") {
    return {
      level: "credential_ready",
      label: "Credential-ready adapter",
      detail: "Typed schema, capability contract and mapping are present. Customer-authorised credentials are required before data can flow.",
    };
  }
  return {
    level: "executable_demo",
    label: "Executable demo adapter",
    detail: "Capability-aware adapter executes against deterministic synthetic fixtures and produces auditable request/response behaviour.",
  };
}

export function implementationSummary() {
  const executable = CONNECTORS.filter((c) => implementationFor(c).level === "executable_demo").length;
  const credentialReady = CONNECTORS.length - executable;
  const categories = new Set(CONNECTORS.map((c) => c.category)).size;
  const bidirectional = CONNECTORS.filter((c) => c.direction === "bidirectional").length;
  const outbound = CONNECTORS.filter((c) => c.direction === "outbound").length;
  const inbound = CONNECTORS.filter((c) => c.direction === "inbound").length;
  return { executable, credentialReady, categories, bidirectional, outbound, inbound };
}

export interface DataLane {
  title: string;
  purpose: string;
  categories: IntegrationCategory[];
  outputs: string[];
}

export const DATA_LANES: DataLane[] = [
  {
    title: "Resident & tenancy spine",
    purpose: "Reconcile household, tenancy, contact and case identities into one operational view.",
    categories: ["housing_management"],
    outputs: ["Household 360", "Tenancy", "Case", "Contact history"],
  },
  {
    title: "Home condition & sensor lane",
    purpose: "Blend environmental telemetry with property and asset context to detect acute conditions early.",
    categories: ["connected_home", "repairs_assets"],
    outputs: ["Temperature", "Humidity", "CO₂", "Repair history", "Asset condition"],
  },
  {
    title: "Place & reference enrichment",
    purpose: "Add UPRN, deprivation, weather, EPC and geographic context without changing the landlord system of record.",
    categories: ["public_data"],
    outputs: ["UPRN match", "SIMD", "EPC", "Weather", "Neighbourhood context"],
  },
  {
    title: "Action & resident engagement",
    purpose: "Turn insight into coordinated repairs, resident contact, officer escalation and traceable intervention.",
    categories: ["communications", "repairs_assets"],
    outputs: ["Work order", "Appointment", "Resident message", "Escalation", "Audit event"],
  },
  {
    title: "Evidence & management intelligence",
    purpose: "Keep case evidence accessible and publish curated portfolio intelligence to management tools.",
    categories: ["documents", "analytics"],
    outputs: ["Case evidence", "Documents", "Outcome dataset", "Executive reporting"],
  },
];

export interface OperationalFlow {
  name: string;
  trigger: string;
  systems: string[];
  decision: string;
  action: string;
  outcome: string;
}

export const OPERATIONAL_FLOWS: OperationalFlow[] = [
  {
    name: "Cold-home intervention",
    trigger: "Internal temperature drops below threshold while vulnerability is present.",
    systems: ["Switchee", "Civica Cx", "EPC Register", "Met Office", "GOV.UK Notify"],
    decision: "Acute environmental signal increases response urgency beyond the structural risk band.",
    action: "Create case, notify officer, contact resident and schedule intervention.",
    outcome: "Follow-up telemetry and case outcome are measured against the opening risk state.",
  },
  {
    name: "Repeat damp & mould",
    trigger: "A new environmental signal coincides with repeat repair history.",
    systems: ["Aico HomeLINK", "Plentific", "MRI Asset", "Civica Cx", "SharePoint"],
    decision: "Recurrence score rises and the property is promoted for coordinated review.",
    action: "Raise inspection, assemble evidence, assign owner and track delivery partner.",
    outcome: "Repair completion, inspection evidence and resident follow-up close the loop.",
  },
  {
    name: "Fuel-poverty support",
    trigger: "Under-heating, poor EPC and household affordability indicators converge.",
    systems: ["Civica Cx", "Switchee", "EPC Register", "SIMD", "Microsoft Teams"],
    decision: "HAVEN separates overall risk from immediate support urgency and explains both.",
    action: "Refer to energy support, notify responsible team and track acceptance.",
    outcome: "Support intervention, heating behaviour and risk movement are recorded together.",
  },
  {
    name: "No-access escalation",
    trigger: "A high-priority repair appointment records no access.",
    systems: ["Totalmobile", "Plentific", "Twilio", "Civica Cx", "Microsoft Teams"],
    decision: "Missed access is evaluated against household vulnerability and case urgency.",
    action: "Rebook, contact resident and escalate where safeguarding rules require it.",
    outcome: "Every contact and reschedule is preserved on the chronology and audit trail.",
  },
  {
    name: "Portfolio outcome reporting",
    trigger: "Intervention or case outcome is recorded.",
    systems: ["HAVEN", "SharePoint", "Power BI", "Microsoft 365"],
    decision: "Outcome metrics are recalculated using the same canonical property and household identities.",
    action: "Publish a curated management dataset and retain supporting evidence.",
    outcome: "Leaders see intervention throughput, improvement, recurrence and unresolved risk.",
  },
];

export function connectorsForLane(lane: DataLane): Connector[] {
  return CONNECTORS.filter((c) => lane.categories.includes(c.category));
}

export interface FabricEvent {
  time: string;
  connector: string;
  event: string;
  object: string;
  outcome: string;
}

export const FABRIC_EVENTS: FabricEvent[] = [
  { time: "09:42", connector: "Switchee", event: "Telemetry received", object: "HAV-P-0001", outcome: "15.8°C · 72% RH" },
  { time: "09:41", connector: "Civica Cx", event: "Property delta sync", object: "HAV-P-0001", outcome: "UPRN reconciled" },
  { time: "09:39", connector: "Plentific", event: "Work order update", object: "REP-80013", outcome: "Inspection scheduled" },
  { time: "09:36", connector: "GOV.UK Notify", event: "Resident message", object: "HAV-H-0001", outcome: "Delivered" },
  { time: "09:31", connector: "EPC Register", event: "Reference enrichment", object: "906700000037", outcome: "EPC E matched" },
  { time: "09:28", connector: "SIMD", event: "Place enrichment", object: "Greenock Central", outcome: "Decile 1" },
  { time: "09:24", connector: "SharePoint", event: "Evidence indexed", object: "HAV-C-0001", outcome: "2 documents" },
  { time: "09:18", connector: "Power BI", event: "Outcome dataset refresh", object: "Portfolio", outcome: "164 rows accepted" },
];
