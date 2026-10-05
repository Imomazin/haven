import "server-only";
import { and, asc, desc, eq, ilike, inArray, or, sql, count } from "drizzle-orm";
import { getDb } from "./client";
import {
  properties,
  households,
  riskAssessments,
  cases,
  caseNotes,
  interventions,
  auditEvents,
  dataSources,
  type Property,
  type Household,
  type CaseRow as DbCase,
  type CaseNote,
  type Intervention,
  type AuditEvent,
  type DataSource,
} from "./schema";
import { assessRisk } from "@/lib/risk-engine";
import type { RiskInput, RiskAssessment } from "@/lib/types";
import { buildDataset } from "@/seed/generate";
import { getDemoOverviewData } from "@/lib/demo-data";

const demoMode = () => !process.env.DATABASE_URL;
const DEMO_DATE = new Date("2026-09-18T09:00:00.000Z");

function demoProperty(p: ReturnType<typeof buildDataset>["properties"][number]): Property {
  return { ...p, createdAt: DEMO_DATE };
}

function demoHousehold(h: ReturnType<typeof buildDataset>["households"][number]): Household {
  return { ...h, createdAt: DEMO_DATE };
}

function demoCase(c: ReturnType<typeof buildDataset>["cases"][number]): DbCase {
  return {
    ...c,
    openedAt: new Date(c.openedAt),
    responseDueAt: c.responseDueAt ? new Date(c.responseDueAt) : null,
    followUpDueAt: c.followUpDueAt ? new Date(c.followUpDueAt) : null,
    closedAt: c.closedAt ? new Date(c.closedAt) : null,
    createdAt: new Date(c.openedAt),
  };
}

function demoNote(n: ReturnType<typeof buildDataset>["notes"][number]): CaseNote {
  return { ...n, createdAt: new Date(n.createdAt) };
}

function demoIntervention(i: ReturnType<typeof buildDataset>["interventions"][number]): Intervention {
  return {
    ...i,
    targetDate: i.targetDate ? new Date(i.targetDate) : null,
    completedAt: i.completedAt ? new Date(i.completedAt) : null,
    followUpDate: i.followUpDate ? new Date(i.followUpDate) : null,
    createdAt: new Date(i.createdAt),
  };
}

function demoAudit(a: ReturnType<typeof buildDataset>["audit"][number]): AuditEvent {
  return { ...a, createdAt: new Date(a.createdAt) };
}

function demoDataSource(s: ReturnType<typeof buildDataset>["dataSources"][number]): DataSource {
  return { ...s, lastUpdate: s.lastUpdate ? new Date(s.lastUpdate) : null };
}

export function toRiskInput(p: Property, h: Household): RiskInput {
  return {
    property: {
      propertyType: p.propertyType as RiskInput["property"]["propertyType"],
      constructionEra: p.constructionEra as RiskInput["property"]["constructionEra"],
      epcRating: p.epcRating as RiskInput["property"]["epcRating"],
      heatingType: p.heatingType as RiskInput["property"]["heatingType"],
      wallInsulation: p.wallInsulation as RiskInput["property"]["wallInsulation"],
      loftInsulation: p.loftInsulation as RiskInput["property"]["loftInsulation"],
      glazing: p.glazing as RiskInput["property"]["glazing"],
      ventilation: p.ventilation as RiskInput["property"]["ventilation"],
      dampHistoryCount: p.dampHistoryCount,
      mouldHistoryCount: p.mouldHistoryCount,
      openRepairs: p.openRepairs,
      lastRepairDaysAgo: p.lastRepairDaysAgo,
      indoorHumidityPct: p.indoorHumidityPct,
      indoorWinterTempC: p.indoorWinterTempC,
      co2Ppm: p.co2Ppm,
      readingsAgeDays: p.readingsAgeDays,
    },
    household: {
      householdSize: h.householdSize,
      adultsOver65: h.adultsOver65,
      childrenUnder5: h.childrenUnder5,
      childrenPresent: h.childrenPresent,
      incomeRiskIndicator: h.incomeRiskIndicator as RiskInput["household"]["incomeRiskIndicator"],
      fuelPovertyIndicator: h.fuelPovertyIndicator as RiskInput["household"]["fuelPovertyIndicator"],
      mobilitySupport: h.mobilitySupport,
      healthVulnerability: h.healthVulnerability as RiskInput["household"]["healthVulnerability"],
      recentHouseholdChange: h.recentHouseholdChange,
      energyUsePattern: h.energyUsePattern as RiskInput["household"]["energyUsePattern"],
    },
  };
}

export interface PortfolioStats {
  propertiesMonitored: number;
  householdsRepresented: number;
  bandCounts: { Critical: number; High: number; Moderate: number; Low: number };
  casesOpen: number;
  casesByStatus: Record<string, number>;
  openInterventions: number;
  overdueActions: number;
  fuelPovertyCount: number;
  dampRiskCount: number;
  mouldRiskCount: number;
  coldHomeCount: number;
  fabricRiskCount: number;
  vulnerabilityCount: number;
  casesImproving: number;
  casesWorsening: number;
  avgResolutionDays: number | null;
}

export async function getPortfolioStats(): Promise<PortfolioStats> {
  if (demoMode()) return getDemoOverviewData().stats;
  const db = getDb();
  const now = new Date();
  const [propCount] = await db.select({ n: count() }).from(properties);
  const [hhCount] = await db.select({ n: count() }).from(households);
  const bandRows = await db.select({ band: riskAssessments.band, n: count() }).from(riskAssessments)
    .where(eq(riskAssessments.isCurrent, true)).groupBy(riskAssessments.band);
  const bandCounts = { Critical: 0, High: 0, Moderate: 0, Low: 0 } as PortfolioStats["bandCounts"];
  for (const r of bandRows) if (r.band in bandCounts) bandCounts[r.band as keyof typeof bandCounts] = Number(r.n);
  const statusRows = await db.select({ status: cases.status, n: count() }).from(cases).groupBy(cases.status);
  const casesByStatus: Record<string, number> = {};
  for (const r of statusRows) casesByStatus[r.status] = Number(r.n);
  const casesOpen = Object.entries(casesByStatus).filter(([s]) => s !== "closed").reduce((sum, [, n]) => sum + n, 0);
  const [openInt] = await db.select({ n: count() }).from(interventions).where(inArray(interventions.status, ["recommended", "scheduled", "in_progress"]));
  const [overdue] = await db.select({ n: count() }).from(cases).where(and(sql`${cases.responseDueAt} is not null`, sql`${cases.responseDueAt} < ${now}`, sql`${cases.status} <> 'closed'`));
  const [fuel] = await db.select({ n: count() }).from(households).where(inArray(households.fuelPovertyIndicator, ["at_risk", "in_fuel_poverty"]));
  const [damp] = await db.select({ n: count() }).from(properties).where(sql`${properties.dampHistoryCount} > 0`);
  const [mould] = await db.select({ n: count() }).from(properties).where(sql`${properties.mouldHistoryCount} > 0`);
  const [cold] = await db.select({ n: count() }).from(properties).where(and(sql`${properties.indoorWinterTempC} is not null`, sql`${properties.indoorWinterTempC} < 18`));
  const [fabric] = await db.select({ n: count() }).from(properties).where(or(eq(properties.wallInsulation, "none"), inArray(properties.epcRating, ["E", "F", "G"])));
  const [vuln] = await db.select({ n: count() }).from(households).where(or(inArray(households.healthVulnerability, ["some", "significant"]), eq(households.mobilitySupport, true), sql`${households.adultsOver65} > 0`));
  const [improving] = await db.select({ n: count() }).from(cases).where(and(sql`${cases.followupRiskScore} is not null`, sql`${cases.followupRiskScore} < ${cases.openingRiskScore}`));
  const [worsening] = await db.select({ n: count() }).from(cases).where(and(sql`${cases.followupRiskScore} is not null`, sql`${cases.followupRiskScore} > ${cases.openingRiskScore}`));
  const [avg] = await db.select({ v: sql<number>`avg(extract(epoch from (${cases.closedAt} - ${cases.openedAt})) / 86400.0)` }).from(cases).where(sql`${cases.closedAt} is not null`);
  return {
    propertiesMonitored: Number(propCount.n), householdsRepresented: Number(hhCount.n), bandCounts, casesOpen, casesByStatus,
    openInterventions: Number(openInt.n), overdueActions: Number(overdue.n), fuelPovertyCount: Number(fuel.n),
    dampRiskCount: Number(damp.n), mouldRiskCount: Number(mould.n), coldHomeCount: Number(cold.n), fabricRiskCount: Number(fabric.n),
    vulnerabilityCount: Number(vuln.n), casesImproving: Number(improving.n), casesWorsening: Number(worsening.n),
    avgResolutionDays: avg.v != null ? Math.round(Number(avg.v) * 10) / 10 : null,
  };
}

export interface QueueRow {
  householdRef: string;
  propertyRef: string;
  locality: string;
  propertyType: string;
  overallScore: number;
  band: string;
  primaryRisk: string;
  secondaryRisk: string | null;
  confidence: string;
  urgency: string;
  reviewStatus: string;
  caseRef: string | null;
  caseStatus: string | null;
  ownerTeam: string | null;
  ownerName: string | null;
  responseDueAt: Date | null;
  daysOpen: number | null;
}

export async function getRiskQueue(filters: { band?: string; locality?: string; propertyType?: string; caseStatus?: string; q?: string; sort?: string }): Promise<QueueRow[]> {
  if (demoMode()) {
    let rows = [...getDemoOverviewData().queue];
    if (filters.band) rows = rows.filter((r) => r.band === filters.band);
    if (filters.locality) rows = rows.filter((r) => r.locality === filters.locality);
    if (filters.propertyType) rows = rows.filter((r) => r.propertyType === filters.propertyType);
    if (filters.caseStatus) rows = rows.filter((r) => r.caseStatus === filters.caseStatus);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      rows = rows.filter((r) => r.propertyRef.toLowerCase().includes(q) || r.householdRef.toLowerCase().includes(q) || r.locality.toLowerCase().includes(q));
    }
    if (filters.sort === "locality") rows.sort((a, b) => a.locality.localeCompare(b.locality));
    else rows.sort((a, b) => b.overallScore - a.overallScore);
    return rows;
  }
  const db = getDb();
  const rows = await db.select({
    householdRef: households.ref, propertyRef: properties.ref, locality: properties.locality, propertyType: properties.propertyType,
    overallScore: riskAssessments.overallScore, band: riskAssessments.band, primaryRisk: riskAssessments.primaryRisk,
    secondaryRisk: riskAssessments.secondaryRisk, confidence: riskAssessments.confidence, urgency: riskAssessments.urgency,
    reviewStatus: riskAssessments.reviewStatus, caseRef: cases.ref, caseStatus: cases.status, ownerTeam: cases.ownerTeam,
    ownerName: cases.ownerName, responseDueAt: cases.responseDueAt, openedAt: cases.openedAt,
  }).from(riskAssessments)
    .innerJoin(households, eq(riskAssessments.householdId, households.id))
    .innerJoin(properties, eq(riskAssessments.propertyId, properties.id))
    .leftJoin(cases, and(eq(cases.householdId, households.id), sql`${cases.status} <> 'closed'`))
    .where(and(eq(riskAssessments.isCurrent, true), filters.band ? eq(riskAssessments.band, filters.band) : undefined,
      filters.locality ? eq(properties.locality, filters.locality) : undefined,
      filters.propertyType ? eq(properties.propertyType, filters.propertyType) : undefined,
      filters.caseStatus ? eq(cases.status, filters.caseStatus) : undefined,
      filters.q ? or(ilike(properties.ref, `%${filters.q}%`), ilike(households.ref, `%${filters.q}%`), ilike(properties.locality, `%${filters.q}%`)) : undefined))
    .orderBy(desc(riskAssessments.urgencyScore), desc(riskAssessments.overallScore));
  const now = Date.now();
  let mapped: QueueRow[] = rows.map((r) => ({
    householdRef: r.householdRef, propertyRef: r.propertyRef, locality: r.locality, propertyType: r.propertyType,
    overallScore: r.overallScore, band: r.band, primaryRisk: r.primaryRisk, secondaryRisk: r.secondaryRisk,
    confidence: r.confidence, urgency: r.urgency, reviewStatus: r.reviewStatus, caseRef: r.caseRef, caseStatus: r.caseStatus,
    ownerTeam: r.ownerTeam, ownerName: r.ownerName, responseDueAt: r.responseDueAt,
    daysOpen: r.openedAt ? Math.floor((now - new Date(r.openedAt).getTime()) / 86400000) : null,
  }));
  if (filters.sort === "score") mapped = mapped.sort((a, b) => b.overallScore - a.overallScore);
  else if (filters.sort === "locality") mapped = mapped.sort((a, b) => a.locality.localeCompare(b.locality));
  return mapped;
}

export async function getFilterOptions() {
  if (demoMode()) {
    const d = buildDataset();
    return {
      localities: [...new Set(d.properties.map((p) => p.locality))].sort(),
      propertyTypes: [...new Set(d.properties.map((p) => p.propertyType))].sort(),
    };
  }
  const db = getDb();
  const locs = await db.selectDistinct({ v: properties.locality }).from(properties).orderBy(asc(properties.locality));
  const types = await db.selectDistinct({ v: properties.propertyType }).from(properties).orderBy(asc(properties.propertyType));
  return { localities: locs.map((r) => r.v), propertyTypes: types.map((r) => r.v) };
}

export interface PropertyRecord {
  property: Property;
  household: Household | null;
  assessment: RiskAssessment | null;
  cases: { ref: string; status: string; title: string }[];
}

export async function getProperties(filters: { locality?: string; propertyType?: string; band?: string; q?: string }) {
  if (demoMode()) {
    const d = buildDataset();
    let rows = d.properties.map((raw) => {
      const property = demoProperty(raw);
      const hhRaw = d.households.find((h) => h.propertyId === raw.id);
      const household = hhRaw ? demoHousehold(hhRaw) : null;
      const a = d.assessments.find((x) => x.propertyId === raw.id && x.isCurrent);
      return { property, household, band: a?.band ?? null, score: a?.overallScore ?? null };
    });
    if (filters.locality) rows = rows.filter((r) => r.property.locality === filters.locality);
    if (filters.propertyType) rows = rows.filter((r) => r.property.propertyType === filters.propertyType);
    if (filters.band) rows = rows.filter((r) => r.band === filters.band);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      rows = rows.filter((r) => r.property.ref.toLowerCase().includes(q) || r.property.locality.toLowerCase().includes(q));
    }
    return rows.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
  const db = getDb();
  return db.select({ property: properties, household: households, band: riskAssessments.band, score: riskAssessments.overallScore })
    .from(properties).leftJoin(households, eq(households.propertyId, properties.id))
    .leftJoin(riskAssessments, and(eq(riskAssessments.propertyId, properties.id), eq(riskAssessments.isCurrent, true)))
    .where(and(filters.locality ? eq(properties.locality, filters.locality) : undefined,
      filters.propertyType ? eq(properties.propertyType, filters.propertyType) : undefined,
      filters.band ? eq(riskAssessments.band, filters.band) : undefined,
      filters.q ? or(ilike(properties.ref, `%${filters.q}%`), ilike(properties.locality, `%${filters.q}%`)) : undefined))
    .orderBy(desc(riskAssessments.overallScore));
}

export async function getPropertyByRef(ref: string): Promise<PropertyRecord | null> {
  if (demoMode()) {
    const d = buildDataset();
    const raw = d.properties.find((p) => p.ref === ref);
    if (!raw) return null;
    const property = demoProperty(raw);
    const hhRaw = d.households.find((h) => h.propertyId === raw.id);
    const household = hhRaw ? demoHousehold(hhRaw) : null;
    const assessment = household ? assessRisk(toRiskInput(property, household)) : null;
    const relatedCases = d.cases.filter((c) => c.propertyId === raw.id).map((c) => ({ ref: c.ref, status: c.status, title: c.title }));
    return { property, household, assessment, cases: relatedCases };
  }
  const db = getDb();
  const [p] = await db.select().from(properties).where(eq(properties.ref, ref)).limit(1);
  if (!p) return null;
  const [h] = await db.select().from(households).where(eq(households.propertyId, p.id)).limit(1);
  const assessment = h ? assessRisk(toRiskInput(p, h)) : null;
  const relatedCases = await db.select({ ref: cases.ref, status: cases.status, title: cases.title }).from(cases).where(eq(cases.propertyId, p.id));
  return { property: p, household: h ?? null, assessment, cases: relatedCases };
}

export async function getHouseholds(filters: { fuelPoverty?: string; band?: string; q?: string }) {
  if (demoMode()) {
    const d = buildDataset();
    let rows = d.households.map((raw) => {
      const household = demoHousehold(raw);
      const propRaw = d.properties.find((p) => p.id === raw.propertyId)!;
      const property = demoProperty(propRaw);
      const a = d.assessments.find((x) => x.householdId === raw.id && x.isCurrent);
      return { household, property, band: a?.band ?? null, score: a?.overallScore ?? null };
    });
    if (filters.fuelPoverty) rows = rows.filter((r) => r.household.fuelPovertyIndicator === filters.fuelPoverty);
    if (filters.band) rows = rows.filter((r) => r.band === filters.band);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      rows = rows.filter((r) => r.household.ref.toLowerCase().includes(q) || r.property.locality.toLowerCase().includes(q));
    }
    return rows.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
  const db = getDb();
  return db.select({ household: households, property: properties, band: riskAssessments.band, score: riskAssessments.overallScore })
    .from(households).innerJoin(properties, eq(households.propertyId, properties.id))
    .leftJoin(riskAssessments, and(eq(riskAssessments.householdId, households.id), eq(riskAssessments.isCurrent, true)))
    .where(and(filters.fuelPoverty ? eq(households.fuelPovertyIndicator, filters.fuelPoverty) : undefined,
      filters.band ? eq(riskAssessments.band, filters.band) : undefined,
      filters.q ? or(ilike(households.ref, `%${filters.q}%`), ilike(properties.locality, `%${filters.q}%`)) : undefined))
    .orderBy(desc(riskAssessments.overallScore));
}

export async function getHouseholdByRef(ref: string) {
  if (demoMode()) {
    const d = buildDataset();
    const hhRaw = d.households.find((h) => h.ref === ref);
    if (!hhRaw) return null;
    const household = demoHousehold(hhRaw);
    const property = demoProperty(d.properties.find((p) => p.id === hhRaw.propertyId)!);
    const assessment = assessRisk(toRiskInput(property, household));
    const relatedCases = d.cases.filter((c) => c.householdId === hhRaw.id).map((c) => ({ ref: c.ref, status: c.status, title: c.title }));
    return { household, property, assessment, cases: relatedCases };
  }
  const db = getDb();
  const [h] = await db.select().from(households).where(eq(households.ref, ref)).limit(1);
  if (!h) return null;
  const [p] = await db.select().from(properties).where(eq(properties.id, h.propertyId)).limit(1);
  const assessment = assessRisk(toRiskInput(p, h));
  const relatedCases = await db.select({ ref: cases.ref, status: cases.status, title: cases.title }).from(cases).where(eq(cases.householdId, h.id));
  return { household: h, property: p, assessment, cases: relatedCases };
}

export async function getCases(filters: { status?: string; team?: string; band?: string; q?: string }) {
  if (demoMode()) {
    const d = buildDataset();
    let rows = d.cases.map((raw) => {
      const c = demoCase(raw);
      const p = d.properties.find((x) => x.id === raw.propertyId)!;
      return { c, locality: p.locality, propertyRef: p.ref };
    });
    if (filters.status) rows = rows.filter((r) => r.c.status === filters.status);
    if (filters.team) rows = rows.filter((r) => r.c.ownerTeam === filters.team);
    if (filters.band) rows = rows.filter((r) => r.c.priorityBand === filters.band);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      rows = rows.filter((r) => r.c.ref.toLowerCase().includes(q) || r.c.title.toLowerCase().includes(q));
    }
    return rows.sort((a, b) => (b.c.currentRiskScore ?? 0) - (a.c.currentRiskScore ?? 0));
  }
  const db = getDb();
  return db.select({ c: cases, locality: properties.locality, propertyRef: properties.ref }).from(cases)
    .innerJoin(properties, eq(cases.propertyId, properties.id))
    .where(and(filters.status ? eq(cases.status, filters.status) : undefined,
      filters.team ? eq(cases.ownerTeam, filters.team) : undefined,
      filters.band ? eq(cases.priorityBand, filters.band) : undefined,
      filters.q ? or(ilike(cases.ref, `%${filters.q}%`), ilike(cases.title, `%${filters.q}%`)) : undefined))
    .orderBy(desc(cases.currentRiskScore));
}

export async function getCaseByRef(ref: string) {
  if (demoMode()) {
    const d = buildDataset();
    const raw = d.cases.find((c) => c.ref === ref);
    if (!raw) return null;
    const c = demoCase(raw);
    const property = demoProperty(d.properties.find((p) => p.id === raw.propertyId)!);
    const household = demoHousehold(d.households.find((h) => h.id === raw.householdId)!);
    const assessment = assessRisk(toRiskInput(property, household));
    const notes = d.notes.filter((n) => n.caseId === raw.id).map(demoNote).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const ints = d.interventions.filter((i) => i.caseId === raw.id).map(demoIntervention).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const audit = d.audit.filter((a) => a.caseId === raw.id).map(demoAudit).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return { case: c, property, household, assessment, notes, interventions: ints, audit };
  }
  const db = getDb();
  const [c] = await db.select().from(cases).where(eq(cases.ref, ref)).limit(1);
  if (!c) return null;
  const [p] = await db.select().from(properties).where(eq(properties.id, c.propertyId)).limit(1);
  const [h] = await db.select().from(households).where(eq(households.id, c.householdId)).limit(1);
  const assessment = assessRisk(toRiskInput(p, h));
  const notes = await db.select().from(caseNotes).where(eq(caseNotes.caseId, c.id)).orderBy(asc(caseNotes.createdAt));
  const ints = await db.select().from(interventions).where(eq(interventions.caseId, c.id)).orderBy(asc(interventions.createdAt));
  const audit = await db.select().from(auditEvents).where(eq(auditEvents.caseId, c.id)).orderBy(asc(auditEvents.createdAt));
  return { case: c, property: p, household: h, assessment, notes, interventions: ints, audit };
}

export async function getInterventionsList(filters: { status?: string; team?: string; type?: string }) {
  if (demoMode()) {
    const d = buildDataset();
    let rows = d.interventions.map((raw) => {
      const i = demoIntervention(raw);
      const c = d.cases.find((x) => x.id === raw.caseId)!;
      const p = d.properties.find((x) => x.id === c.propertyId)!;
      return { i, caseRef: c.ref, locality: p.locality };
    });
    if (filters.status) rows = rows.filter((r) => r.i.status === filters.status);
    if (filters.team) rows = rows.filter((r) => r.i.team === filters.team);
    if (filters.type) rows = rows.filter((r) => r.i.type === filters.type);
    return rows.sort((a, b) => (a.i.targetDate?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.i.targetDate?.getTime() ?? Number.MAX_SAFE_INTEGER));
  }
  const db = getDb();
  return db.select({ i: interventions, caseRef: cases.ref, locality: properties.locality }).from(interventions)
    .innerJoin(cases, eq(interventions.caseId, cases.id)).innerJoin(properties, eq(cases.propertyId, properties.id))
    .where(and(filters.status ? eq(interventions.status, filters.status) : undefined,
      filters.team ? eq(interventions.team, filters.team) : undefined,
      filters.type ? eq(interventions.type, filters.type) : undefined))
    .orderBy(asc(interventions.targetDate));
}

export async function getDataSources() {
  if (demoMode()) return buildDataset().dataSources.map(demoDataSource).sort((a, b) => a.id - b.id);
  const db = getDb();
  return db.select().from(dataSources).orderBy(asc(dataSources.id));
}

export async function getRecentAudit(limit = 40) {
  if (demoMode()) return buildDataset().audit.map(demoAudit).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  const db = getDb();
  return db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(limit);
}

export async function getAnalytics() {
  if (demoMode()) {
    const d = buildDataset();
    const current = d.assessments.filter((a) => a.isCurrent);
    const localityMap = new Map<string, number>();
    for (const a of current) {
      const p = d.properties.find((x) => x.id === a.propertyId)!;
      const key = `${p.locality}|||${a.band}`;
      localityMap.set(key, (localityMap.get(key) ?? 0) + 1);
    }
    const byLocality = [...localityMap.entries()].map(([key, n]) => {
      const [locality, band] = key.split("|||");
      return { locality, band, n };
    });

    const typeMap = new Map<string, { sum: number; n: number }>();
    for (const a of current) {
      const p = d.properties.find((x) => x.id === a.propertyId)!;
      const cur = typeMap.get(p.propertyType) ?? { sum: 0, n: 0 };
      cur.sum += a.overallScore;
      cur.n += 1;
      typeMap.set(p.propertyType, cur);
    }
    const byType = [...typeMap.entries()].map(([type, v]) => ({ type, avgScore: v.sum / v.n, n: v.n }));

    const primaryMap = new Map<string, number>();
    for (const a of current) primaryMap.set(a.primaryRisk, (primaryMap.get(a.primaryRisk) ?? 0) + 1);
    const byPrimary = [...primaryMap.entries()].map(([primary, n]) => ({ primary, n }));

    const interventionTypeMap = new Map<string, number>();
    const outcomeMap = new Map<string, number>();
    for (const i of d.interventions) {
      interventionTypeMap.set(i.type, (interventionTypeMap.get(i.type) ?? 0) + 1);
      outcomeMap.set(i.status, (outcomeMap.get(i.status) ?? 0) + 1);
    }
    const interventionsByType = [...interventionTypeMap.entries()].map(([type, n]) => ({ type, n }));
    const interventionOutcomes = [...outcomeMap.entries()].map(([status, n]) => ({ status, n }));

    const riskReduction = d.cases.filter((c) => c.followupRiskScore != null)
      .map((c) => ({ ref: c.ref, opening: c.openingRiskScore, followup: c.followupRiskScore, title: c.title }))
      .sort((a, b) => ((b.opening ?? 0) - (b.followup ?? 0)) - ((a.opening ?? 0) - (a.followup ?? 0)));

    const interventionCountByProperty = new Map<number, number>();
    for (const i of d.interventions) {
      const c = d.cases.find((x) => x.id === i.caseId);
      if (c) interventionCountByProperty.set(c.propertyId, (interventionCountByProperty.get(c.propertyId) ?? 0) + 1);
    }
    const repeatedIssues = [...interventionCountByProperty.entries()]
      .filter(([, n]) => n >= 3)
      .map(([propertyId, n]) => {
        const p = d.properties.find((x) => x.id === propertyId)!;
        return { ref: p.ref, locality: p.locality, n };
      })
      .sort((a, b) => b.n - a.n);

    return { byLocality, byType, byPrimary, interventionsByType, interventionOutcomes, riskReduction, repeatedIssues };
  }
  const db = getDb();
  const byLocality = await db.select({ locality: properties.locality, band: riskAssessments.band, n: count() }).from(riskAssessments)
    .innerJoin(properties, eq(riskAssessments.propertyId, properties.id)).where(eq(riskAssessments.isCurrent, true)).groupBy(properties.locality, riskAssessments.band);
  const byType = await db.select({ type: properties.propertyType, avgScore: sql<number>`avg(${riskAssessments.overallScore})`, n: count() }).from(riskAssessments)
    .innerJoin(properties, eq(riskAssessments.propertyId, properties.id)).where(eq(riskAssessments.isCurrent, true)).groupBy(properties.propertyType);
  const byPrimary = await db.select({ primary: riskAssessments.primaryRisk, n: count() }).from(riskAssessments)
    .where(eq(riskAssessments.isCurrent, true)).groupBy(riskAssessments.primaryRisk);
  const interventionsByType = await db.select({ type: interventions.type, n: count() }).from(interventions).groupBy(interventions.type);
  const interventionOutcomes = await db.select({ status: interventions.status, n: count() }).from(interventions).groupBy(interventions.status);
  const riskReduction = await db.select({ ref: cases.ref, opening: cases.openingRiskScore, followup: cases.followupRiskScore, title: cases.title }).from(cases)
    .where(sql`${cases.followupRiskScore} is not null`).orderBy(desc(sql`${cases.openingRiskScore} - ${cases.followupRiskScore}`));
  const repeatedIssues = await db.select({ ref: properties.ref, locality: properties.locality, n: count() }).from(interventions)
    .innerJoin(cases, eq(interventions.caseId, cases.id)).innerJoin(properties, eq(cases.propertyId, properties.id))
    .groupBy(properties.ref, properties.locality).having(sql`count(*) >= 3`).orderBy(desc(count()));
  return { byLocality, byType, byPrimary, interventionsByType, interventionOutcomes, riskReduction, repeatedIssues };
}
