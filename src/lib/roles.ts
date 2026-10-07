// Operational personas. In this demonstrator a role tailors which work is
// emphasised — it is NOT enforced access control. Real deployment needs
// authentication + server-enforced RBAC (see docs/privacy-and-governance.md).

import type { Team } from "./types";

export interface Role {
  id: string;
  label: string;
  short: string;
  focus: "team" | "portfolio";
  team?: Team; // cases/interventions this role primarily works
}

export const ROLES: Role[] = [
  { id: "housing_officer", label: "Housing Officer", short: "Frontline tenancy & contact", focus: "team", team: "Housing Officers" },
  { id: "asset_manager", label: "Asset Manager", short: "Stock condition & fabric", focus: "team", team: "Asset Management" },
  { id: "repairs", label: "Repairs Team", short: "Inspections & repairs", focus: "team", team: "Repairs" },
  { id: "energy_adviser", label: "Energy Adviser", short: "Efficiency & heating advice", focus: "team", team: "Energy Advice" },
  { id: "fuel_poverty_adviser", label: "Fuel-Poverty Adviser", short: "Affordability & income", focus: "team", team: "Fuel Poverty Support" },
  { id: "support_officer", label: "Support Officer", short: "Household wellbeing", focus: "team", team: "Tenancy Support" },
  { id: "team_manager", label: "Team Manager", short: "Oversight & escalation", focus: "portfolio" },
  { id: "executive", label: "Executive", short: "Portfolio outcomes", focus: "portfolio" },
  { id: "programme_analyst", label: "Programme Analyst", short: "Trends & effectiveness", focus: "portfolio" },
];

export const DEFAULT_ROLE_ID = "team_manager";
export const ROLE_COOKIE = "haven_role";

export function getRole(id: string | undefined | null): Role {
  return ROLES.find((r) => r.id === id) ?? ROLES.find((r) => r.id === DEFAULT_ROLE_ID)!;
}

/** Quick links tailored to a role, used on the Overview. */
export function roleLinks(role: Role): { href: string; label: string }[] {
  if (role.focus === "team" && role.team) {
    const t = encodeURIComponent(role.team);
    return [
      { href: `/cases?team=${t}`, label: `My team's cases (${role.team})` },
      { href: `/interventions?team=${t}`, label: `My team's interventions` },
      { href: `/risk-queue`, label: `Full risk queue` },
    ];
  }
  if (role.id === "programme_analyst") {
    return [
      { href: `/analytics`, label: "Analytics & effectiveness" },
      { href: `/risk-queue`, label: "Risk queue" },
      { href: `/governance`, label: "Data & provenance" },
    ];
  }
  return [
    { href: `/analytics`, label: "Portfolio analytics" },
    { href: `/risk-queue`, label: "Risk queue" },
    { href: `/cases`, label: "All cases" },
  ];
}
