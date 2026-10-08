// Place model for Haven's neighbourhood/place-based experience.
// Stylised (not survey-accurate) coordinates position Inverclyde localities
// along the Firth of Clyde for a local SVG map — no external mapping API.

export interface PlacePoint { x: number; y: number }

// Normalised 0–100 coordinates. Water sits toward the top (low y) along the Clyde.
export const LOCALITY_GEO: Record<string, PlacePoint> = {
  "Port Glasgow": { x: 84, y: 30 },
  "Greenock East": { x: 67, y: 31 },
  "Greenock Central": { x: 54, y: 29 },
  "Greenock West": { x: 44, y: 33 },
  Gourock: { x: 29, y: 37 },
  Branchton: { x: 52, y: 53 },
  Larkfield: { x: 41, y: 51 },
  Kilmacolm: { x: 80, y: 72 },
  Inverkip: { x: 23, y: 63 },
  "Wemyss Bay": { x: 15, y: 77 },
};

export function localityPoint(locality: string): PlacePoint {
  return LOCALITY_GEO[locality] ?? { x: 50, y: 50 };
}

// Synthetic delivery partners / agencies (plausible Scottish housing ecosystem).
export const AGENCY_FOR_TYPE: Record<string, string> = {
  energy_advice: "Home Energy Scotland",
  heating_support: "Home Energy Scotland",
  income_maximisation_referral: "Financial Inclusion Partnership",
  welfare_support: "Inverclyde HSCP",
  partner_referral: "Inverclyde HSCP",
  heating_inspection: "Cloch Repairs Service",
  repair_inspection: "Cloch Repairs Service",
  damp_investigation: "Cloch Repairs Service",
  mould_investigation: "Cloch Repairs Service",
  ventilation_support: "Cloch Repairs Service",
  building_fabric_improvement: "Warmer Homes Scotland",
  tenant_contact: "Housing team (in-house)",
  follow_up_assessment: "Housing team (in-house)",
};

export function agencyForType(type: string): string {
  return AGENCY_FOR_TYPE[type] ?? "Housing team (in-house)";
}

export interface HouseholdLike {
  adultsOver65: number;
  childrenUnder5: number;
  childrenPresent: boolean;
  householdSize: number;
  mobilitySupport: boolean;
  healthVulnerability: string;
}

/** Human-readable household composition, e.g. "Family · 2 adults, 2 children (1 under 5)". */
export function compositionSummary(h: HouseholdLike): string {
  const children = h.childrenPresent || h.childrenUnder5 > 0;
  const adults = Math.max(1, h.householdSize - (children ? Math.max(1, h.childrenUnder5) : 0));
  const kind = children ? "Family" : h.adultsOver65 > 0 && h.householdSize <= 2 ? "Older household" : h.householdSize === 1 ? "Single occupant" : "Adults";
  const parts: string[] = [`${adults} adult${adults === 1 ? "" : "s"}`];
  if (h.adultsOver65 > 0) parts.push(`${h.adultsOver65} aged 65+`);
  if (h.childrenUnder5 > 0) parts.push(`${h.childrenUnder5} under 5`);
  else if (children) parts.push("children present");
  return `${kind} · ${parts.join(", ")}`;
}

/** Non-clinical safeguarding signals surfaced for review. */
export function safeguardingFlags(h: HouseholdLike, band: string): string[] {
  const flags: string[] = [];
  if (h.healthVulnerability === "significant") flags.push("Significant support need");
  if (h.adultsOver65 > 0 && (band === "High" || band === "Critical")) flags.push("Older resident at risk");
  if (h.childrenUnder5 > 0 && (band === "High" || band === "Critical")) flags.push("Young children at risk");
  if (h.mobilitySupport) flags.push("Mobility support");
  return flags;
}

// Case workflow stages (housing-intervention lifecycle).
export const CASE_WORKFLOW = [
  "Identified", "Reviewed", "Triaged", "Assigned", "Assessment",
  "Intervention planned", "Intervention active", "Monitoring", "Resolved", "Closed",
] as const;

export interface PlaceRow {
  locality: string;
  band: string;
  primaryRisk: string;
  hasOpenCase: boolean;
}

export interface PlaceAggregate {
  locality: string;
  point: PlacePoint;
  households: number;
  bands: { Critical: number; High: number; Moderate: number; Low: number };
  highCritical: number;
  openCases: number;
  dominantRisk: string;
  topBand: "Critical" | "High" | "Moderate" | "Low";
}

export function computePlaces(rows: PlaceRow[]): PlaceAggregate[] {
  const map = new Map<string, PlaceAggregate>();
  const riskTally = new Map<string, Map<string, number>>();
  for (const r of rows) {
    let p = map.get(r.locality);
    if (!p) {
      p = { locality: r.locality, point: localityPoint(r.locality), households: 0, bands: { Critical: 0, High: 0, Moderate: 0, Low: 0 }, highCritical: 0, openCases: 0, dominantRisk: "", topBand: "Low" };
      map.set(r.locality, p);
      riskTally.set(r.locality, new Map());
    }
    p.households++;
    if (r.band in p.bands) p.bands[r.band as keyof typeof p.bands]++;
    if (r.band === "High" || r.band === "Critical") p.highCritical++;
    if (r.hasOpenCase) p.openCases++;
    const rt = riskTally.get(r.locality)!;
    rt.set(r.primaryRisk, (rt.get(r.primaryRisk) ?? 0) + 1);
  }
  for (const [locality, p] of map) {
    const rt = riskTally.get(locality)!;
    p.dominantRisk = [...rt.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    p.topBand = p.bands.Critical > 0 ? "Critical" : p.bands.High > 0 ? "High" : p.bands.Moderate > 0 ? "Moderate" : "Low";
  }
  return [...map.values()].sort((a, b) => b.highCritical - a.highCritical || b.households - a.households);
}

export function stageForStatus(status: string, outcome?: string | null): number {
  switch (status) {
    case "open": return 2; // triaged into the queue
    case "assigned": return 3;
    case "escalated": return 4; // deeper assessment / senior review
    case "in_progress": return 6; // intervention active
    case "monitoring": return 7;
    case "closed": return outcome && /resolv/i.test(outcome) ? 9 : 9;
    default: return 2;
  }
}
