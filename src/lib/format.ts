// Human-readable labels for enum-like values, and small formatting helpers.

export const LABELS: Record<string, string> = {
  // property types
  tenement_flat: "Tenement flat",
  four_in_a_block: "Four-in-a-block",
  mid_terrace: "Mid-terrace",
  end_terrace: "End-terrace",
  semi_detached: "Semi-detached",
  high_rise_flat: "High-rise flat",
  cottage_flat: "Cottage flat",
  // heating
  gas_central: "Gas central heating",
  electric_storage: "Electric storage heaters",
  electric_panel: "Electric panel heaters",
  heat_pump: "Heat pump",
  communal: "Communal heating",
  solid_fuel: "Solid fuel",
  none: "None",
  // eras
  pre1919: "Pre-1919",
  "1919-1944": "1919–1944",
  "1945-1964": "1945–1964",
  "1965-1982": "1965–1982",
  "1983-2002": "1983–2002",
  post2002: "Post-2002",
  // insulation / glazing / ventilation
  partial: "Partial",
  full: "Full",
  single: "Single glazing",
  double: "Double glazing",
  triple: "Triple glazing",
  poor: "Poor",
  adequate: "Adequate",
  good: "Good",
  // household indicators
  low: "Low",
  medium: "Medium",
  high: "High",
  at_risk: "At risk",
  in_fuel_poverty: "In fuel poverty",
  some: "Some",
  significant: "Significant",
  under_heating: "Under-heating",
  over_reliance_on_backup: "Backup-reliant",
  normal: "Normal",
  // risk dimensions
  propertyCondition: "Property condition",
  fuelPoverty: "Fuel poverty",
  environmental: "Environmental",
  householdVulnerability: "Household vulnerability",
  recurrence: "Recurrence",
  supportNeed: "Support need",
  // case status
  open: "Open",
  assigned: "Assigned",
  in_progress: "In progress",
  escalated: "Escalated",
  monitoring: "Monitoring",
  closed: "Closed",
  // intervention status
  recommended: "Recommended",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  // adapter status
  demo: "Demo adapter",
  not_connected: "Not connected",
  ready: "Ready for configuration",
  // review status
  unreviewed: "Unreviewed",
  reviewed: "Reviewed",
  overridden: "Overridden",
};

export function label(v: string | null | undefined): string {
  if (!v) return "—";
  return LABELS[v] ?? v;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function daysBetween(a: Date | string, b: Date | string = new Date()): number {
  const da = typeof a === "string" ? new Date(a) : a;
  const db = typeof b === "string" ? new Date(b) : b;
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}
