// Deterministic synthetic dataset generator for Haven.
//
// SYNTHETIC DATA ONLY. No real tenants, no real addresses tied to individuals.
// Localities are real Inverclyde place names (Cloch Housing operates in
// Greenock) used only as area labels — never linked to a real person.
//
// The same seed always produces the same dataset (used by Reset Demo Data).

import { Rng } from "@/lib/rng";
import { assessRisk } from "@/lib/risk-engine";
import { recommendInterventions } from "@/lib/intervention-engine";
import { bandForScore } from "@/lib/constants";
import { computeResponseSchedule, addDays } from "@/lib/response-rules";
import type {
  PropertySignals,
  HouseholdSignals,
  ConstructionEra,
  PropertyType,
  HeatingType,
  EpcRating,
  CaseStatus,
} from "@/lib/types";

export const SEED_VERSION = "haven-seed-0.1.0";
const NOW = new Date("2026-09-18T09:00:00Z");

const LOCALITIES = [
  "Greenock Central",
  "Greenock East",
  "Greenock West",
  "Gourock",
  "Port Glasgow",
  "Kilmacolm",
  "Wemyss Bay",
  "Inverkip",
  "Larkfield",
  "Branchton",
];

const PROPERTY_TYPES: PropertyType[] = [
  "tenement_flat",
  "four_in_a_block",
  "mid_terrace",
  "end_terrace",
  "semi_detached",
  "high_rise_flat",
  "cottage_flat",
];

const OFFICERS = ["A. Baird", "S. Kerr", "M. Nkomo", "R. Docherty", "P. Ahmed", "L. Grant"];

export interface PropertyRow extends PropertySignals {
  id: number;
  ref: string;
  locality: string;
}
export interface HouseholdRow extends HouseholdSignals {
  id: number;
  ref: string;
  propertyId: number;
}
export interface AssessmentRow {
  id: number;
  propertyId: number;
  householdId: number;
  overallScore: number;
  band: string;
  confidenceScore: number;
  confidence: string;
  urgencyScore: number;
  urgency: string;
  primaryRisk: string;
  secondaryRisk: string | null;
  responseDueDays: number;
  dimensions: unknown;
  detail: unknown;
  modelVersion: string;
  reviewStatus: string;
  reviewedBy: string | null;
  isCurrent: boolean;
  assessedAt: string;
}
export interface CaseRow {
  id: number;
  ref: string;
  propertyId: number;
  householdId: number;
  title: string;
  status: CaseStatus;
  ownerTeam: string;
  ownerName: string | null;
  priorityBand: string;
  openingRiskScore: number;
  openingBand: string;
  currentRiskScore: number;
  currentBand: string;
  followupRiskScore: number | null;
  followupBand: string | null;
  outcome: string | null;
  openedAt: string;
  responseDueAt: string | null;
  followUpDueAt: string | null;
  closedAt: string | null;
}
export interface NoteRow {
  id: number;
  caseId: number;
  author: string;
  kind: string;
  body: string;
  createdAt: string;
}
export interface InterventionRow {
  id: number;
  ref: string;
  caseId: number;
  type: string;
  label: string;
  reason: string;
  status: string;
  team: string;
  ownerName: string | null;
  urgency: string;
  targetDate: string | null;
  completedAt: string | null;
  expectedOutcome: string | null;
  actualOutcome: string | null;
  followUpDate: string | null;
  createdAt: string;
}
export interface AuditRow {
  id: number;
  entityType: string;
  entityRef: string;
  caseId: number | null;
  action: string;
  actor: string;
  detail: string | null;
  createdAt: string;
}
export interface DataSourceRow {
  id: number;
  name: string;
  category: string;
  purpose: string;
  confidence: string;
  adapterStatus: string;
  lawfulBasisPlaceholder: string;
  accessConcept: string;
  retentionConcept: string;
  lastUpdate: string | null;
}

export interface Dataset {
  properties: PropertyRow[];
  households: HouseholdRow[];
  assessments: AssessmentRow[];
  cases: CaseRow[];
  notes: NoteRow[];
  interventions: InterventionRow[];
  audit: AuditRow[];
  dataSources: DataSourceRow[];
}

const pad = (n: number, w = 4) => n.toString().padStart(w, "0");
const iso = (d: Date) => d.toISOString();

function epcFrom(era: ConstructionEra, wall: string, glazing: string, rng: Rng): EpcRating {
  // Coherent-ish EPC: newer + insulated = better.
  let score = 4; // D baseline (1=A..7=G)
  if (era === "post2002") score -= 2;
  else if (era === "1983-2002") score -= 1;
  else if (era === "pre1919") score += 2;
  else if (era === "1919-1944") score += 1;
  if (wall === "full") score -= 1;
  if (wall === "none") score += 1;
  if (glazing === "single") score += 1;
  score += rng.int(-1, 1);
  score = Math.max(1, Math.min(7, score));
  return (["A", "B", "C", "D", "E", "F", "G"] as EpcRating[])[score - 1];
}

function buildProperty(i: number, rng: Rng): PropertyRow {
  const era = rng.weighted<ConstructionEra>([
    ["pre1919", 4],
    ["1919-1944", 3],
    ["1945-1964", 3],
    ["1965-1982", 3],
    ["1983-2002", 2],
    ["post2002", 1],
  ]);
  const olderish = ["pre1919", "1919-1944", "1945-1964"].includes(era);
  const wallInsulation = rng.weighted(olderish ? [["none", 4], ["partial", 3], ["full", 1]] : [["none", 1], ["partial", 2], ["full", 3]]) as PropertySignals["wallInsulation"];
  const loftInsulation = rng.weighted(olderish ? [["none", 3], ["partial", 3], ["full", 2]] : [["none", 1], ["partial", 2], ["full", 4]]) as PropertySignals["loftInsulation"];
  const glazing = rng.weighted(olderish ? [["single", 3], ["double", 4], ["triple", 1]] : [["single", 1], ["double", 4], ["triple", 2]]) as PropertySignals["glazing"];
  const ventilation = rng.weighted([["poor", 3], ["adequate", 4], ["good", 3]]) as PropertySignals["ventilation"];
  const heatingType = rng.weighted<HeatingType>([
    ["gas_central", 5],
    ["electric_storage", 3],
    ["electric_panel", 2],
    ["heat_pump", 1],
    ["communal", 1],
    ["solid_fuel", 1],
  ]);
  const epcRating = epcFrom(era, wallInsulation, glazing, rng);
  const dampProne = (olderish ? 0.35 : 0.12) + (ventilation === "poor" ? 0.25 : 0);
  const dampHistoryCount = rng.chance(dampProne) ? rng.int(1, 4) : 0;
  const mouldHistoryCount = dampHistoryCount > 0 && rng.chance(0.6) ? rng.int(1, 3) : rng.chance(0.08) ? 1 : 0;
  const openRepairs = rng.weighted([[0, 5], [1, 3], [2, 2], [3, 1]]) as number;
  const lastRepairDaysAgo = rng.chance(0.7) ? rng.int(10, 500) : null;
  const hasReadings = rng.chance(0.85);
  const indoorHumidityPct = hasReadings ? rng.int(40, 82) : null;
  const indoorWinterTempC = hasReadings ? Math.round((rng.int(120, 220) / 10) * 10) / 10 : null;
  const co2Ppm = hasReadings && rng.chance(0.85) ? rng.int(500, 1800) : null;
  const readingsAgeDays = hasReadings ? rng.int(1, 200) : null;

  return {
    id: i + 1,
    ref: `HAV-P-${pad(i + 1)}`,
    locality: rng.pick(LOCALITIES),
    propertyType: rng.pick(PROPERTY_TYPES),
    constructionEra: era,
    epcRating,
    heatingType,
    wallInsulation,
    loftInsulation,
    glazing,
    ventilation,
    dampHistoryCount,
    mouldHistoryCount,
    openRepairs,
    lastRepairDaysAgo,
    indoorHumidityPct,
    indoorWinterTempC,
    co2Ppm,
    readingsAgeDays,
  };
}

function buildHousehold(i: number, propertyId: number, rng: Rng): HouseholdRow {
  const adultsOver65 = rng.weighted([[0, 5], [1, 3], [2, 2]]) as number;
  const childrenUnder5 = rng.weighted([[0, 6], [1, 2], [2, 1]]) as number;
  const childrenPresent = childrenUnder5 > 0 || rng.chance(0.25);
  const householdSize = Math.max(1, adultsOver65 + rng.int(0, 2) + (childrenPresent ? rng.int(1, 3) : 0)) || 1;
  return {
    id: i + 1,
    ref: `HAV-H-${pad(i + 1)}`,
    propertyId,
    householdSize,
    adultsOver65,
    childrenUnder5,
    childrenPresent,
    incomeRiskIndicator: rng.weighted([["low", 3], ["medium", 3], ["high", 2]]) as HouseholdSignals["incomeRiskIndicator"],
    fuelPovertyIndicator: rng.weighted([["none", 4], ["at_risk", 3], ["in_fuel_poverty", 2]]) as HouseholdSignals["fuelPovertyIndicator"],
    mobilitySupport: rng.chance(0.22),
    healthVulnerability: rng.weighted([["none", 5], ["some", 3], ["significant", 2]]) as HouseholdSignals["healthVulnerability"],
    recentHouseholdChange: rng.chance(0.28),
    energyUsePattern: rng.weighted([["normal", 5], ["under_heating", 3], ["over_reliance_on_backup", 2]]) as HouseholdSignals["energyUsePattern"],
  };
}

// Hand-crafted story records (indices are 0-based property/household slots).
function applyStories(props: PropertyRow[], hhs: HouseholdRow[]) {
  // Story 1: older tenement, low EPC, recurring damp, expensive heating,
  // vulnerability indicator, no current repair -> combined high/critical risk.
  Object.assign(props[0], {
    locality: "Greenock Central",
    propertyType: "tenement_flat",
    constructionEra: "pre1919",
    epcRating: "F",
    heatingType: "electric_storage",
    wallInsulation: "none",
    loftInsulation: "partial",
    glazing: "single",
    ventilation: "poor",
    dampHistoryCount: 3,
    mouldHistoryCount: 2,
    openRepairs: 0,
    lastRepairDaysAgo: null,
    indoorHumidityPct: 74,
    indoorWinterTempC: 15.2,
    co2Ppm: 1350,
    readingsAgeDays: 12,
  } satisfies Partial<PropertyRow>);
  Object.assign(hhs[0], {
    householdSize: 2,
    adultsOver65: 1,
    childrenUnder5: 0,
    childrenPresent: false,
    incomeRiskIndicator: "high",
    fuelPovertyIndicator: "in_fuel_poverty",
    mobilitySupport: true,
    healthVulnerability: "significant",
    recentHouseholdChange: false,
    energyUsePattern: "under_heating",
  } satisfies Partial<HouseholdRow>);

  // Story 2: modern property, no fabric issue, strong fuel-poverty indicator,
  // very low usage suggests under-heating.
  Object.assign(props[1], {
    locality: "Gourock",
    propertyType: "semi_detached",
    constructionEra: "post2002",
    epcRating: "B",
    heatingType: "heat_pump",
    wallInsulation: "full",
    loftInsulation: "full",
    glazing: "double",
    ventilation: "good",
    dampHistoryCount: 0,
    mouldHistoryCount: 0,
    openRepairs: 0,
    lastRepairDaysAgo: 300,
    indoorHumidityPct: 48,
    indoorWinterTempC: 16.5,
    co2Ppm: 700,
    readingsAgeDays: 8,
  } satisfies Partial<PropertyRow>);
  Object.assign(hhs[1], {
    householdSize: 3,
    adultsOver65: 0,
    childrenUnder5: 1,
    childrenPresent: true,
    incomeRiskIndicator: "high",
    fuelPovertyIndicator: "in_fuel_poverty",
    mobilitySupport: false,
    healthVulnerability: "some",
    recentHouseholdChange: true,
    energyUsePattern: "under_heating",
  } satisfies Partial<HouseholdRow>);

  // Story 3: prior repair completed, risk remains elevated, follow-up reveals a
  // ventilation problem -> case escalated.
  Object.assign(props[2], {
    locality: "Port Glasgow",
    propertyType: "four_in_a_block",
    constructionEra: "1945-1964",
    epcRating: "E",
    heatingType: "gas_central",
    wallInsulation: "partial",
    loftInsulation: "partial",
    glazing: "double",
    ventilation: "poor",
    dampHistoryCount: 2,
    mouldHistoryCount: 2,
    openRepairs: 1,
    lastRepairDaysAgo: 95,
    indoorHumidityPct: 72,
    indoorWinterTempC: 17.4,
    co2Ppm: 1500,
    readingsAgeDays: 20,
  } satisfies Partial<PropertyRow>);
  Object.assign(hhs[2], {
    householdSize: 4,
    adultsOver65: 0,
    childrenUnder5: 2,
    childrenPresent: true,
    incomeRiskIndicator: "medium",
    fuelPovertyIndicator: "at_risk",
    mobilitySupport: false,
    healthVulnerability: "some",
    recentHouseholdChange: false,
    energyUsePattern: "over_reliance_on_backup",
  } satisfies Partial<HouseholdRow>);
}

const toSignals = (p: PropertyRow): PropertySignals => ({
  propertyType: p.propertyType,
  constructionEra: p.constructionEra,
  epcRating: p.epcRating,
  heatingType: p.heatingType,
  wallInsulation: p.wallInsulation,
  loftInsulation: p.loftInsulation,
  glazing: p.glazing,
  ventilation: p.ventilation,
  dampHistoryCount: p.dampHistoryCount,
  mouldHistoryCount: p.mouldHistoryCount,
  openRepairs: p.openRepairs,
  lastRepairDaysAgo: p.lastRepairDaysAgo,
  indoorHumidityPct: p.indoorHumidityPct,
  indoorWinterTempC: p.indoorWinterTempC,
  co2Ppm: p.co2Ppm,
  readingsAgeDays: p.readingsAgeDays,
});

const hhSignals = (h: HouseholdRow): HouseholdSignals => ({
  householdSize: h.householdSize,
  adultsOver65: h.adultsOver65,
  childrenUnder5: h.childrenUnder5,
  childrenPresent: h.childrenPresent,
  incomeRiskIndicator: h.incomeRiskIndicator,
  fuelPovertyIndicator: h.fuelPovertyIndicator,
  mobilitySupport: h.mobilitySupport,
  healthVulnerability: h.healthVulnerability,
  recentHouseholdChange: h.recentHouseholdChange,
  energyUsePattern: h.energyUsePattern,
});

const STORY_TITLES = [
  "Older tenement — recurring damp with vulnerability",
  "Modern home — fuel-poverty & under-heating",
  "Persistent risk after repair — ventilation escalation",
];

export function buildDataset(seed = 42): Dataset {
  const rng = new Rng(seed);
  const N_PROPERTIES = 55;
  const N_HOUSEHOLDS = 45;

  const properties: PropertyRow[] = [];
  for (let i = 0; i < N_PROPERTIES; i++) properties.push(buildProperty(i, rng));

  const households: HouseholdRow[] = [];
  for (let i = 0; i < N_HOUSEHOLDS; i++) households.push(buildHousehold(i, properties[i].id, rng));

  applyStories(properties, households);

  // Assess every household (against its property).
  const assessments: AssessmentRow[] = [];
  const scoreByHousehold = new Map<number, ReturnType<typeof assessRisk>>();
  households.forEach((h, idx) => {
    const p = properties[idx];
    const assessment = assessRisk({ property: toSignals(p), household: hhSignals(h) });
    scoreByHousehold.set(h.id, assessment);
    assessments.push({
      id: h.id,
      propertyId: p.id,
      householdId: h.id,
      overallScore: assessment.overallScore,
      band: assessment.band,
      confidenceScore: assessment.confidenceScore,
      confidence: assessment.confidence,
      urgencyScore: assessment.urgencyScore,
      urgency: assessment.urgency,
      primaryRisk: assessment.primaryRisk,
      secondaryRisk: assessment.secondaryRisk,
      responseDueDays: assessment.responseDueDays,
      dimensions: assessment.dimensions,
      // Full explainability (drivers, factors, protective/missing evidence) is
      // recomputed on demand from the stored property+household signals by the
      // risk engine — the engine is the single source of truth. We store only a
      // compact summary here for fast queue sorting/filtering.
      detail: {},
      modelVersion: assessment.version,
      reviewStatus: rng.chance(0.45) ? "reviewed" : "unreviewed",
      reviewedBy: null,
      isCurrent: true,
      assessedAt: iso(addDays(NOW, -rng.int(1, 40))),
    });
  });

  // Choose case households: 3 stories + highest scoring, at least 24 cases.
  const ranked = [...households].sort(
    (a, b) => (scoreByHousehold.get(b.id)!.overallScore) - (scoreByHousehold.get(a.id)!.overallScore),
  );
  const caseHouseholdIds = new Set<number>([1, 2, 3]);
  for (const h of ranked) {
    if (caseHouseholdIds.size >= 26) break;
    caseHouseholdIds.add(h.id);
  }

  const statusCycle: CaseStatus[] = [
    "closed", "in_progress", "assigned", "monitoring", "escalated", "open",
    "closed", "in_progress", "assigned", "open", "monitoring", "in_progress",
    "closed", "assigned", "escalated", "open", "closed", "in_progress",
    "monitoring", "assigned", "open", "closed", "escalated", "in_progress",
    "open", "assigned",
  ];

  const cases: CaseRow[] = [];
  const notes: NoteRow[] = [];
  const interventions: InterventionRow[] = [];
  const audit: AuditRow[] = [];
  let noteId = 1;
  let intvId = 1;
  let auditId = 1;
  let caseId = 1;

  const orderedCaseHouseholds = [1, 2, 3, ...ranked.map((h) => h.id).filter((id) => ![1, 2, 3].includes(id))].filter(
    (id) => caseHouseholdIds.has(id),
  );

  orderedCaseHouseholds.forEach((hid, i) => {
    const h = households[hid - 1];
    const p = properties[hid - 1];
    const assessment = scoreByHousehold.get(hid)!;
    let status: CaseStatus = statusCycle[i % statusCycle.length];
    if (hid === 1) status = "in_progress";
    if (hid === 2) status = "assigned";
    if (hid === 3) status = "escalated";

    const openDays = rng.int(6, 120);
    const openedAt = addDays(NOW, -openDays);
    const schedule = computeResponseSchedule(assessment.urgency, assessment.band);
    const responseDueAt = addDays(openedAt, schedule.responseDueDays);
    const opening = assessment.overallScore;
    const openingBand = assessment.band;

    // Simulate intervention effect for progressed/closed cases.
    let current = opening;
    let followup: number | null = null;
    let followupBand: string | null = null;
    let outcome: string | null = null;
    let closedAt: string | null = null;
    const followUpDueAt: string | null = iso(addDays(openedAt, 30));

    if (status === "closed") {
      followup = Math.max(5, opening - rng.int(22, 42));
      followupBand = bandForScore(followup);
      current = followup;
      outcome = followup <= 24 ? "Resolved — risk reduced to low" : "Improved — risk reduced";
      closedAt = iso(addDays(openedAt, rng.int(20, Math.max(21, openDays))));
    } else if (status === "monitoring") {
      followup = Math.max(8, opening - rng.int(10, 20));
      followupBand = bandForScore(followup);
      current = followup;
      outcome = "Ongoing monitoring after initial actions";
    } else if (status === "escalated") {
      current = Math.min(100, opening + rng.int(0, 6));
      followup = current;
      followupBand = bandForScore(current);
    }

    const owner = rng.pick(OFFICERS);
    const teamForCase =
      assessment.primaryRisk === "fuelPoverty"
        ? "Fuel Poverty Support"
        : assessment.primaryRisk === "environmental" || assessment.primaryRisk === "propertyCondition"
          ? "Asset Management"
          : assessment.primaryRisk === "supportNeed" || assessment.primaryRisk === "householdVulnerability"
            ? "Tenancy Support"
            : "Housing Officers";

    const title = i < 3 ? STORY_TITLES[i] : `${p.locality} — ${assessment.primaryRisk} risk (${openingBand})`;

    const thisCase: CaseRow = {
      id: caseId,
      ref: `HAV-C-${pad(caseId)}`,
      propertyId: p.id,
      householdId: h.id,
      title,
      status,
      ownerTeam: teamForCase,
      ownerName: status === "open" ? null : owner,
      priorityBand: openingBand,
      openingRiskScore: opening,
      openingBand,
      currentRiskScore: current,
      currentBand: bandForScore(current),
      followupRiskScore: followup,
      followupBand,
      outcome,
      openedAt: iso(openedAt),
      responseDueAt: iso(responseDueAt),
      followUpDueAt,
      closedAt,
    };
    cases.push(thisCase);

    // Timeline notes.
    const addNote = (kind: string, body: string, at: Date, author = owner) => {
      notes.push({ id: noteId++, caseId, author, kind, body, createdAt: iso(at) });
    };
    const addAudit = (action: string, at: Date, detail: string | null = null, actor = owner) => {
      audit.push({ id: auditId++, entityType: "case", entityRef: thisCase.ref, caseId, action, actor, detail, createdAt: iso(at) });
    };

    addNote("assessment", `Risk assessment generated: overall ${opening} (${openingBand}). Primary driver: ${assessment.primaryRisk}. Confidence ${assessment.confidence}.`, openedAt, "System");
    addAudit("risk_calculated", openedAt, `overall=${opening} band=${openingBand}`, "System");
    addNote("status_change", `Case opened (${openingBand} priority).`, openedAt, "System");
    addAudit("case_created", openedAt, `ref=${thisCase.ref}`, "System");

    if (status !== "open") {
      const assignAt = addDays(openedAt, 1);
      addNote("assignment", `Assigned to ${owner} (${teamForCase}).`, assignAt);
      addAudit("case_assigned", assignAt, `owner=${owner} team=${teamForCase}`);
    }

    // Interventions from the recommendation engine (top few).
    const recs = recommendInterventions({ property: toSignals(p), household: hhSignals(h) }, assessment).slice(0, i < 3 ? 4 : rng.int(2, 3));
    recs.forEach((rec, ri) => {
      const createdAt = addDays(openedAt, 1 + ri);
      const targetDate = addDays(createdAt, rec.targetLeadDays);
      let intStatus = "recommended";
      let completedAt: string | null = null;
      let actualOutcome: string | null = null;
      let followUpDate: string | null = null;
      if (status === "closed") {
        intStatus = "completed";
        completedAt = iso(addDays(createdAt, Math.min(rec.targetLeadDays, 20)));
        actualOutcome = rec.expectedOutcome;
        followUpDate = iso(addDays(createdAt, rec.targetLeadDays + 21));
      } else if (status === "monitoring") {
        intStatus = ri === 0 ? "completed" : "in_progress";
        if (intStatus === "completed") {
          completedAt = iso(addDays(createdAt, rec.targetLeadDays));
          actualOutcome = rec.expectedOutcome;
        }
      } else if (status === "in_progress" || status === "escalated") {
        intStatus = ri === 0 ? "in_progress" : "scheduled";
      } else if (status === "assigned") {
        intStatus = "scheduled";
      }
      interventions.push({
        id: intvId,
        ref: `HAV-I-${pad(intvId)}`,
        caseId,
        type: rec.type,
        label: rec.label,
        reason: rec.reason,
        status: intStatus,
        team: rec.team,
        ownerName: intStatus === "recommended" ? null : owner,
        urgency: rec.urgency,
        targetDate: iso(targetDate),
        completedAt,
        expectedOutcome: rec.expectedOutcome,
        actualOutcome,
        followUpDate,
        createdAt: iso(createdAt),
      });
      addNote("intervention", `Intervention ${intStatus}: ${rec.label} — ${rec.reason}.`, createdAt);
      addAudit("intervention_created", createdAt, `type=${rec.type} status=${intStatus}`);
      intvId++;
    });

    if (status === "escalated") {
      const escAt = addDays(openedAt, rng.int(5, 20));
      addNote("escalation", i === 2 ? "Follow-up shows persistent damp linked to a ventilation defect. Escalated to Asset Management for building-fabric review." : "Risk not reducing after initial actions — escalated for senior review.", escAt);
      addAudit("case_escalated", escAt, "reason=risk_persisting");
    }
    if (status === "monitoring" || status === "closed") {
      const reAt = addDays(openedAt, rng.int(21, Math.max(22, openDays - 2)));
      addNote("assessment", `Follow-up assessment: risk now ${current} (${bandForScore(current)}), down from ${opening} (${openingBand}).`, reAt, "System");
      addAudit("risk_updated", reAt, `overall=${current} band=${bandForScore(current)}`, "System");
    }
    if (status === "closed") {
      addNote("outcome", `Outcome recorded: ${outcome}.`, new Date(closedAt!));
      addAudit("outcome_recorded", new Date(closedAt!), outcome);
      addNote("status_change", "Case closed.", new Date(closedAt!));
      addAudit("case_closed", new Date(closedAt!), `final_band=${bandForScore(current)}`);
    }

    caseId++;
  });

  const dataSources: DataSourceRow[] = [
    { id: 1, name: "Asset Management System", category: "Property & stock condition", purpose: "Property attributes, stock condition, planned works", confidence: "High", adapterStatus: "demo", lawfulBasisPlaceholder: "Legitimate interests / contract (placeholder — confirm at deployment)", accessConcept: "Asset & repairs teams", retentionConcept: "Life of tenancy + policy retention", lastUpdate: iso(addDays(NOW, -3)) },
    { id: 2, name: "Repairs & Maintenance System", category: "Repairs history", purpose: "Open and historical repair jobs", confidence: "High", adapterStatus: "demo", lawfulBasisPlaceholder: "Contract (placeholder)", accessConcept: "Repairs team", retentionConcept: "Policy retention", lastUpdate: iso(addDays(NOW, -2)) },
    { id: 3, name: "EPC / Energy Performance Register", category: "Energy performance", purpose: "EPC ratings and fabric information", confidence: "Medium", adapterStatus: "ready", lawfulBasisPlaceholder: "Public data / legitimate interests (placeholder)", accessConcept: "Energy & asset teams", retentionConcept: "Until superseded", lastUpdate: iso(addDays(NOW, -30)) },
    { id: 4, name: "Energy Use / Metering Feed", category: "Energy consumption", purpose: "Consumption patterns (under-heating signals)", confidence: "Medium", adapterStatus: "not_connected", lawfulBasisPlaceholder: "Consent required (placeholder)", accessConcept: "Energy advice team", retentionConcept: "Minimised, aggregated", lastUpdate: null },
    { id: 5, name: "Tariff / Supplier Data", category: "Energy tariff", purpose: "Tariff context for affordability", confidence: "Low", adapterStatus: "not_connected", lawfulBasisPlaceholder: "Consent required (placeholder)", accessConcept: "Fuel poverty team", retentionConcept: "Minimised", lastUpdate: null },
    { id: 6, name: "Tenancy Support Records", category: "Household support", purpose: "Non-clinical support needs & consent", confidence: "Medium", adapterStatus: "demo", lawfulBasisPlaceholder: "Consent / vital interests (placeholder — DPIA required)", accessConcept: "Support team (restricted)", retentionConcept: "Strict minimisation", lastUpdate: iso(addDays(NOW, -6)) },
    { id: 7, name: "Environmental Sensors", category: "Environmental readings", purpose: "Humidity, temperature, CO₂", confidence: "Medium", adapterStatus: "demo", lawfulBasisPlaceholder: "Legitimate interests (placeholder)", accessConcept: "Asset & energy teams", retentionConcept: "Rolling window", lastUpdate: iso(addDays(NOW, -1)) },
    { id: 8, name: "Open Data (SIMD, fuel poverty stats)", category: "Open reference data", purpose: "Area-level context", confidence: "High", adapterStatus: "ready", lawfulBasisPlaceholder: "Public data", accessConcept: "All roles", retentionConcept: "Reference only", lastUpdate: iso(addDays(NOW, -60)) },
    { id: 9, name: "Weather / Environmental Risk Feed", category: "Environmental risk", purpose: "Cold-weather context", confidence: "Medium", adapterStatus: "not_connected", lawfulBasisPlaceholder: "Public data", accessConcept: "All roles", retentionConcept: "Reference only", lastUpdate: null },
  ];

  return { properties, households, assessments, cases, notes, interventions, audit, dataSources };
}
