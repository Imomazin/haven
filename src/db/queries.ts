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
} from "./schema";
import { assessRisk } from "@/lib/risk-engine";
import type { RiskInput } from "@/lib/types";
import { demo } from "./demo-store";
import { hasDb } from "./view-types";
import { computeOperational } from "@/lib/operational";
import { computePlaces } from "@/lib/places";
export type { PortfolioStats, QueueRow, PropertyRecord } from "./view-types";

// Map DB rows into the risk-engine input shape.
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

import type { PortfolioStats, QueueRow, PropertyRecord } from "./view-types";

export async function getPortfolioStats(): Promise<PortfolioStats> {
  if (!hasDb()) return demo.getPortfolioStats();
  const db = getDb();
  const now = new Date();

  const [propCount] = await db.select({ n: count() }).from(properties);
  const [hhCount] = await db.select({ n: count() }).from(households);

  const bandRows = await db
    .select({ band: riskAssessments.band, n: count() })
    .from(riskAssessments)
    .where(eq(riskAssessments.isCurrent, true))
    .groupBy(riskAssessments.band);
  const bandCounts = { Critical: 0, High: 0, Moderate: 0, Low: 0 } as PortfolioStats["bandCounts"];
  for (const r of bandRows) {
    if (r.band in bandCounts) bandCounts[r.band as keyof typeof bandCounts] = Number(r.n);
  }

  const statusRows = await db
    .select({ status: cases.status, n: count() })
    .from(cases)
    .groupBy(cases.status);
  const casesByStatus: Record<string, number> = {};
  for (const r of statusRows) casesByStatus[r.status] = Number(r.n);
  const casesOpen = Object.entries(casesByStatus)
    .filter(([s]) => s !== "closed")
    .reduce((sum, [, n]) => sum + n, 0);

  const [openInt] = await db
    .select({ n: count() })
    .from(interventions)
    .where(inArray(interventions.status, ["recommended", "scheduled", "in_progress"]));

  const [overdue] = await db
    .select({ n: count() })
    .from(cases)
    .where(
      and(
        sql`${cases.responseDueAt} is not null`,
        sql`${cases.responseDueAt} < ${now}`,
        sql`${cases.status} <> 'closed'`,
      ),
    );

  // Signal counts from properties/households (synthetic thresholds).
  const [fuel] = await db
    .select({ n: count() })
    .from(households)
    .where(inArray(households.fuelPovertyIndicator, ["at_risk", "in_fuel_poverty"]));
  const [damp] = await db.select({ n: count() }).from(properties).where(sql`${properties.dampHistoryCount} > 0`);
  const [mould] = await db.select({ n: count() }).from(properties).where(sql`${properties.mouldHistoryCount} > 0`);
  const [cold] = await db
    .select({ n: count() })
    .from(properties)
    .where(and(sql`${properties.indoorWinterTempC} is not null`, sql`${properties.indoorWinterTempC} < 18`));
  const [fabric] = await db
    .select({ n: count() })
    .from(properties)
    .where(or(eq(properties.wallInsulation, "none"), inArray(properties.epcRating, ["E", "F", "G"])));
  const [vuln] = await db
    .select({ n: count() })
    .from(households)
    .where(
      or(
        inArray(households.healthVulnerability, ["some", "significant"]),
        eq(households.mobilitySupport, true),
        sql`${households.adultsOver65} > 0`,
      ),
    );

  // Improving / worsening from follow-up vs opening.
  const [improving] = await db
    .select({ n: count() })
    .from(cases)
    .where(and(sql`${cases.followupRiskScore} is not null`, sql`${cases.followupRiskScore} < ${cases.openingRiskScore}`));
  const [worsening] = await db
    .select({ n: count() })
    .from(cases)
    .where(and(sql`${cases.followupRiskScore} is not null`, sql`${cases.followupRiskScore} > ${cases.openingRiskScore}`));

  const [avg] = await db
    .select({ v: sql<number>`avg(extract(epoch from (${cases.closedAt} - ${cases.openedAt})) / 86400.0)` })
    .from(cases)
    .where(sql`${cases.closedAt} is not null`);

  return {
    propertiesMonitored: Number(propCount.n),
    householdsRepresented: Number(hhCount.n),
    bandCounts,
    casesOpen,
    casesByStatus,
    openInterventions: Number(openInt.n),
    overdueActions: Number(overdue.n),
    fuelPovertyCount: Number(fuel.n),
    dampRiskCount: Number(damp.n),
    mouldRiskCount: Number(mould.n),
    coldHomeCount: Number(cold.n),
    fabricRiskCount: Number(fabric.n),
    vulnerabilityCount: Number(vuln.n),
    casesImproving: Number(improving.n),
    casesWorsening: Number(worsening.n),
    avgResolutionDays: avg.v != null ? Math.round(Number(avg.v) * 10) / 10 : null,
  };
}

export async function getRiskQueue(filters: {
  band?: string;
  locality?: string;
  propertyType?: string;
  caseStatus?: string;
  q?: string;
  sort?: string;
}): Promise<QueueRow[]> {
  if (!hasDb()) return demo.getRiskQueue(filters);
  const db = getDb();
  const rows = await db
    .select({
      householdRef: households.ref,
      propertyRef: properties.ref,
      locality: properties.locality,
      propertyType: properties.propertyType,
      overallScore: riskAssessments.overallScore,
      band: riskAssessments.band,
      primaryRisk: riskAssessments.primaryRisk,
      secondaryRisk: riskAssessments.secondaryRisk,
      confidence: riskAssessments.confidence,
      urgency: riskAssessments.urgency,
      reviewStatus: riskAssessments.reviewStatus,
      caseRef: cases.ref,
      caseStatus: cases.status,
      ownerTeam: cases.ownerTeam,
      ownerName: cases.ownerName,
      responseDueAt: cases.responseDueAt,
      openedAt: cases.openedAt,
    })
    .from(riskAssessments)
    .innerJoin(households, eq(riskAssessments.householdId, households.id))
    .innerJoin(properties, eq(riskAssessments.propertyId, properties.id))
    .leftJoin(cases, and(eq(cases.householdId, households.id), sql`${cases.status} <> 'closed'`))
    .where(
      and(
        eq(riskAssessments.isCurrent, true),
        filters.band ? eq(riskAssessments.band, filters.band) : undefined,
        filters.locality ? eq(properties.locality, filters.locality) : undefined,
        filters.propertyType ? eq(properties.propertyType, filters.propertyType) : undefined,
        filters.caseStatus ? eq(cases.status, filters.caseStatus) : undefined,
        filters.q
          ? or(
              ilike(properties.ref, `%${filters.q}%`),
              ilike(households.ref, `%${filters.q}%`),
              ilike(properties.locality, `%${filters.q}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(riskAssessments.urgencyScore), desc(riskAssessments.overallScore));

  const now = Date.now();
  let mapped: QueueRow[] = rows.map((r) => ({
    householdRef: r.householdRef,
    propertyRef: r.propertyRef,
    locality: r.locality,
    propertyType: r.propertyType,
    overallScore: r.overallScore,
    band: r.band,
    primaryRisk: r.primaryRisk,
    secondaryRisk: r.secondaryRisk,
    confidence: r.confidence,
    urgency: r.urgency,
    reviewStatus: r.reviewStatus,
    caseRef: r.caseRef,
    caseStatus: r.caseStatus,
    ownerTeam: r.ownerTeam,
    ownerName: r.ownerName,
    responseDueAt: r.responseDueAt,
    daysOpen: r.openedAt ? Math.floor((now - new Date(r.openedAt).getTime()) / 86400000) : null,
  }));

  if (filters.sort === "score") mapped = mapped.sort((a, b) => b.overallScore - a.overallScore);
  else if (filters.sort === "locality") mapped = mapped.sort((a, b) => a.locality.localeCompare(b.locality));
  return mapped;
}

export async function getFilterOptions() {
  if (!hasDb()) return demo.getFilterOptions();
  const db = getDb();
  const locs = await db.selectDistinct({ v: properties.locality }).from(properties).orderBy(asc(properties.locality));
  const types = await db.selectDistinct({ v: properties.propertyType }).from(properties).orderBy(asc(properties.propertyType));
  return {
    localities: locs.map((r) => r.v),
    propertyTypes: types.map((r) => r.v),
  };
}

export async function getProperties(filters: { locality?: string; propertyType?: string; band?: string; q?: string }) {
  if (!hasDb()) return demo.getProperties(filters);
  const db = getDb();
  const rows = await db
    .select({ property: properties, household: households, band: riskAssessments.band, score: riskAssessments.overallScore })
    .from(properties)
    .leftJoin(households, eq(households.propertyId, properties.id))
    .leftJoin(riskAssessments, and(eq(riskAssessments.propertyId, properties.id), eq(riskAssessments.isCurrent, true)))
    .where(
      and(
        filters.locality ? eq(properties.locality, filters.locality) : undefined,
        filters.propertyType ? eq(properties.propertyType, filters.propertyType) : undefined,
        filters.band ? eq(riskAssessments.band, filters.band) : undefined,
        filters.q ? or(ilike(properties.ref, `%${filters.q}%`), ilike(properties.locality, `%${filters.q}%`)) : undefined,
      ),
    )
    .orderBy(desc(riskAssessments.overallScore));
  return rows;
}

export async function getPropertyByRef(ref: string): Promise<PropertyRecord | null> {
  if (!hasDb()) return demo.getPropertyByRef(ref) as unknown as PropertyRecord | null;
  const db = getDb();
  const [p] = await db.select().from(properties).where(eq(properties.ref, ref)).limit(1);
  if (!p) return null;
  const [h] = await db.select().from(households).where(eq(households.propertyId, p.id)).limit(1);
  const assessment = h ? assessRisk(toRiskInput(p, h)) : null;
  const relatedCases = await db
    .select({ ref: cases.ref, status: cases.status, title: cases.title })
    .from(cases)
    .where(eq(cases.propertyId, p.id));
  return { property: p, household: h ?? null, assessment, cases: relatedCases };
}

export async function getHouseholds(filters: { fuelPoverty?: string; band?: string; q?: string }) {
  if (!hasDb()) return demo.getHouseholds(filters);
  const db = getDb();
  const rows = await db
    .select({ household: households, property: properties, band: riskAssessments.band, score: riskAssessments.overallScore })
    .from(households)
    .innerJoin(properties, eq(households.propertyId, properties.id))
    .leftJoin(riskAssessments, and(eq(riskAssessments.householdId, households.id), eq(riskAssessments.isCurrent, true)))
    .where(
      and(
        filters.fuelPoverty ? eq(households.fuelPovertyIndicator, filters.fuelPoverty) : undefined,
        filters.band ? eq(riskAssessments.band, filters.band) : undefined,
        filters.q ? or(ilike(households.ref, `%${filters.q}%`), ilike(properties.locality, `%${filters.q}%`)) : undefined,
      ),
    )
    .orderBy(desc(riskAssessments.overallScore));
  return rows;
}

export async function getHouseholdByRef(ref: string) {
  if (!hasDb()) return demo.getHouseholdByRef(ref);
  const db = getDb();
  const [h] = await db.select().from(households).where(eq(households.ref, ref)).limit(1);
  if (!h) return null;
  const [p] = await db.select().from(properties).where(eq(properties.id, h.propertyId)).limit(1);
  const assessment = assessRisk(toRiskInput(p, h));
  const relatedCases = await db.select({ ref: cases.ref, status: cases.status, title: cases.title }).from(cases).where(eq(cases.householdId, h.id));
  return { household: h, property: p, assessment, cases: relatedCases };
}

export async function getCases(filters: { status?: string; team?: string; band?: string; q?: string }) {
  if (!hasDb()) return demo.getCases(filters);
  const db = getDb();
  return db
    .select({ c: cases, locality: properties.locality, propertyRef: properties.ref })
    .from(cases)
    .innerJoin(properties, eq(cases.propertyId, properties.id))
    .where(
      and(
        filters.status ? eq(cases.status, filters.status) : undefined,
        filters.team ? eq(cases.ownerTeam, filters.team) : undefined,
        filters.band ? eq(cases.priorityBand, filters.band) : undefined,
        filters.q ? or(ilike(cases.ref, `%${filters.q}%`), ilike(cases.title, `%${filters.q}%`)) : undefined,
      ),
    )
    .orderBy(desc(cases.currentRiskScore));
}

export async function getCaseByRef(ref: string) {
  if (!hasDb()) return demo.getCaseByRef(ref);
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
  if (!hasDb()) return demo.getInterventionsList(filters);
  const db = getDb();
  return db
    .select({ i: interventions, caseRef: cases.ref, locality: properties.locality })
    .from(interventions)
    .innerJoin(cases, eq(interventions.caseId, cases.id))
    .innerJoin(properties, eq(cases.propertyId, properties.id))
    .where(
      and(
        filters.status ? eq(interventions.status, filters.status) : undefined,
        filters.team ? eq(interventions.team, filters.team) : undefined,
        filters.type ? eq(interventions.type, filters.type) : undefined,
      ),
    )
    .orderBy(asc(interventions.targetDate));
}

export async function getDataSources() {
  if (!hasDb()) return demo.getDataSources();
  const db = getDb();
  return db.select().from(dataSources).orderBy(asc(dataSources.id));
}

export async function getRecentAudit(limit = 40) {
  if (!hasDb()) return demo.getRecentAudit(limit);
  const db = getDb();
  return db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(limit);
}

// Analytics aggregates.
export async function getAnalytics() {
  if (!hasDb()) return demo.getAnalytics();
  const db = getDb();
  const byLocality = await db
    .select({ locality: properties.locality, band: riskAssessments.band, n: count() })
    .from(riskAssessments)
    .innerJoin(properties, eq(riskAssessments.propertyId, properties.id))
    .where(eq(riskAssessments.isCurrent, true))
    .groupBy(properties.locality, riskAssessments.band);

  const byType = await db
    .select({ type: properties.propertyType, avgScore: sql<number>`avg(${riskAssessments.overallScore})`, n: count() })
    .from(riskAssessments)
    .innerJoin(properties, eq(riskAssessments.propertyId, properties.id))
    .where(eq(riskAssessments.isCurrent, true))
    .groupBy(properties.propertyType);

  const byPrimary = await db
    .select({ primary: riskAssessments.primaryRisk, n: count() })
    .from(riskAssessments)
    .where(eq(riskAssessments.isCurrent, true))
    .groupBy(riskAssessments.primaryRisk);

  const interventionsByType = await db
    .select({ type: interventions.type, n: count() })
    .from(interventions)
    .groupBy(interventions.type);

  const interventionOutcomes = await db
    .select({ status: interventions.status, n: count() })
    .from(interventions)
    .groupBy(interventions.status);

  const riskReduction = await db
    .select({ ref: cases.ref, opening: cases.openingRiskScore, followup: cases.followupRiskScore, title: cases.title })
    .from(cases)
    .where(sql`${cases.followupRiskScore} is not null`)
    .orderBy(desc(sql`${cases.openingRiskScore} - ${cases.followupRiskScore}`));

  const repeatedIssues = await db
    .select({ ref: properties.ref, locality: properties.locality, n: count() })
    .from(interventions)
    .innerJoin(cases, eq(interventions.caseId, cases.id))
    .innerJoin(properties, eq(cases.propertyId, properties.id))
    .groupBy(properties.ref, properties.locality)
    .having(sql`count(*) >= 3`)
    .orderBy(desc(count()));

  return { byLocality, byType, byPrimary, interventionsByType, interventionOutcomes, riskReduction, repeatedIssues };
}

export async function getOperational() {
  if (!hasDb()) return demo.getOperational();
  const db = getDb();
  const rows = await db
    .select({ openedAt: cases.openedAt, closedAt: cases.closedAt, ownerTeam: cases.ownerTeam, status: cases.status })
    .from(cases);
  return computeOperational(rows);
}

export async function getPlaces() {
  if (!hasDb()) return demo.getPlaces();
  const db = getDb();
  const openCaseHouseholds = await db
    .select({ householdId: cases.householdId })
    .from(cases)
    .where(sql`${cases.status} <> 'closed'`);
  const openSet = new Set(openCaseHouseholds.map((r) => r.householdId));
  const rows = await db
    .select({ locality: properties.locality, band: riskAssessments.band, primaryRisk: riskAssessments.primaryRisk, householdId: riskAssessments.householdId })
    .from(riskAssessments)
    .innerJoin(properties, eq(riskAssessments.propertyId, properties.id))
    .where(eq(riskAssessments.isCurrent, true));
  return computePlaces(rows.map((r) => ({ locality: r.locality, band: r.band, primaryRisk: r.primaryRisk, hasOpenCase: openSet.has(r.householdId) })));
}
