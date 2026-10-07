// In-memory demo backend. Used when DATABASE_URL is not set, so every screen
// renders and every action works against deterministic synthetic data with no
// database. State is a module singleton: mutations persist within a running
// server instance and reset on cold start or via resetDemoStore().
//
// It mirrors the shapes returned by src/db/queries.ts (the Neon-backed path).

import { buildDataset, type Dataset, type PropertyRow, type HouseholdRow } from "@/seed/generate";
import { assessRisk } from "@/lib/risk-engine";
import { recommendInterventions } from "@/lib/intervention-engine";
import { planNewCase } from "@/lib/case-planning";
import { computeOperational } from "@/lib/operational";
import type { RiskInput, RiskAssessment } from "@/lib/types";
import type { PortfolioStats, QueueRow } from "./view-types";

let state: Dataset | null = null;
function db(): Dataset {
  if (!state) state = buildDataset();
  return state;
}
export function resetDemoStore() {
  state = buildDataset();
}

const pad4 = (n: number) => String(n).padStart(4, "0");
const toDate = (s: string | null | undefined) => (s ? new Date(s) : null);

function toInput(p: PropertyRow, h: HouseholdRow): RiskInput {
  return {
    property: {
      propertyType: p.propertyType, constructionEra: p.constructionEra, epcRating: p.epcRating,
      heatingType: p.heatingType, wallInsulation: p.wallInsulation, loftInsulation: p.loftInsulation,
      glazing: p.glazing, ventilation: p.ventilation, dampHistoryCount: p.dampHistoryCount,
      mouldHistoryCount: p.mouldHistoryCount, openRepairs: p.openRepairs, lastRepairDaysAgo: p.lastRepairDaysAgo,
      indoorHumidityPct: p.indoorHumidityPct, indoorWinterTempC: p.indoorWinterTempC, co2Ppm: p.co2Ppm,
      readingsAgeDays: p.readingsAgeDays,
    },
    household: {
      householdSize: h.householdSize, adultsOver65: h.adultsOver65, childrenUnder5: h.childrenUnder5,
      childrenPresent: h.childrenPresent, incomeRiskIndicator: h.incomeRiskIndicator,
      fuelPovertyIndicator: h.fuelPovertyIndicator, mobilitySupport: h.mobilitySupport,
      healthVulnerability: h.healthVulnerability, recentHouseholdChange: h.recentHouseholdChange,
      energyUsePattern: h.energyUsePattern,
    },
  };
}
function assessmentFor(propertyId: number, householdId: number): RiskAssessment {
  const d = db();
  const p = d.properties.find((x) => x.id === propertyId)!;
  const h = d.households.find((x) => x.id === householdId)!;
  return assessRisk(toInput(p, h));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const cast = <T>(v: unknown): T => v as T;

export const demo = {
  getPortfolioStats(): PortfolioStats {
    const d = db();
    const now = Date.now();
    const bandCounts = { Critical: 0, High: 0, Moderate: 0, Low: 0 } as PortfolioStats["bandCounts"];
    for (const a of d.assessments) if (a.band in bandCounts) bandCounts[a.band as keyof typeof bandCounts]++;
    const casesByStatus: Record<string, number> = {};
    for (const c of d.cases) casesByStatus[c.status] = (casesByStatus[c.status] ?? 0) + 1;
    const casesOpen = d.cases.filter((c) => c.status !== "closed").length;
    const openInterventions = d.interventions.filter((i) => ["recommended", "scheduled", "in_progress"].includes(i.status)).length;
    const overdueActions = d.cases.filter((c) => c.responseDueAt && new Date(c.responseDueAt).getTime() < now && c.status !== "closed").length;
    const fuelPovertyCount = d.households.filter((h) => h.fuelPovertyIndicator !== "none").length;
    const dampRiskCount = d.properties.filter((p) => p.dampHistoryCount > 0).length;
    const mouldRiskCount = d.properties.filter((p) => p.mouldHistoryCount > 0).length;
    const coldHomeCount = d.properties.filter((p) => p.indoorWinterTempC != null && p.indoorWinterTempC < 18).length;
    const fabricRiskCount = d.properties.filter((p) => p.wallInsulation === "none" || ["E", "F", "G"].includes(p.epcRating)).length;
    const vulnerabilityCount = d.households.filter((h) => h.healthVulnerability !== "none" || h.mobilitySupport || h.adultsOver65 > 0).length;
    const casesImproving = d.cases.filter((c) => c.followupRiskScore != null && c.followupRiskScore < (c.openingRiskScore ?? 0)).length;
    const casesWorsening = d.cases.filter((c) => c.followupRiskScore != null && c.followupRiskScore > (c.openingRiskScore ?? 0)).length;
    const closed = d.cases.filter((c) => c.closedAt);
    const avgResolutionDays = closed.length
      ? Math.round((closed.reduce((s, c) => s + (new Date(c.closedAt!).getTime() - new Date(c.openedAt).getTime()) / 86400000, 0) / closed.length) * 10) / 10
      : null;
    return { propertiesMonitored: d.properties.length, householdsRepresented: d.households.length, bandCounts, casesOpen, casesByStatus, openInterventions, overdueActions, fuelPovertyCount, dampRiskCount, mouldRiskCount, coldHomeCount, fabricRiskCount, vulnerabilityCount, casesImproving, casesWorsening, avgResolutionDays };
  },

  getRiskQueue(f: { band?: string; locality?: string; propertyType?: string; caseStatus?: string; q?: string; sort?: string }): QueueRow[] {
    const d = db();
    const now = Date.now();
    const q = f.q?.toLowerCase();
    let rows = d.assessments.map((a) => {
      const h = d.households.find((x) => x.id === a.householdId)!;
      const p = d.properties.find((x) => x.id === a.propertyId)!;
      const c = d.cases.find((x) => x.householdId === h.id && x.status !== "closed") ?? null;
      return {
        householdRef: h.ref, propertyRef: p.ref, locality: p.locality, propertyType: p.propertyType,
        overallScore: a.overallScore, band: a.band, primaryRisk: a.primaryRisk, secondaryRisk: a.secondaryRisk,
        confidence: a.confidence, urgency: a.urgency, reviewStatus: a.reviewStatus,
        caseRef: c?.ref ?? null, caseStatus: c?.status ?? null, ownerTeam: c?.ownerTeam ?? null, ownerName: c?.ownerName ?? null,
        responseDueAt: toDate(c?.responseDueAt ?? null),
        daysOpen: c ? Math.floor((now - new Date(c.openedAt).getTime()) / 86400000) : null,
        _urg: a.urgencyScore,
      };
    });
    if (f.band) rows = rows.filter((r) => r.band === f.band);
    if (f.locality) rows = rows.filter((r) => r.locality === f.locality);
    if (f.propertyType) rows = rows.filter((r) => r.propertyType === f.propertyType);
    if (f.caseStatus) rows = rows.filter((r) => r.caseStatus === f.caseStatus);
    if (q) rows = rows.filter((r) => r.propertyRef.toLowerCase().includes(q) || r.householdRef.toLowerCase().includes(q) || r.locality.toLowerCase().includes(q));
    rows.sort((a, b) => b._urg - a._urg || b.overallScore - a.overallScore);
    if (f.sort === "score") rows.sort((a, b) => b.overallScore - a.overallScore);
    else if (f.sort === "locality") rows.sort((a, b) => a.locality.localeCompare(b.locality));
    return rows.map(({ _urg, ...r }) => { void _urg; return r; });
  },

  getFilterOptions() {
    const d = db();
    return {
      localities: [...new Set(d.properties.map((p) => p.locality))].sort(),
      propertyTypes: [...new Set(d.properties.map((p) => p.propertyType))].sort(),
    };
  },

  getProperties(f: { locality?: string; propertyType?: string; band?: string; q?: string }) {
    const d = db();
    const q = f.q?.toLowerCase();
    let rows = d.properties.map((property) => {
      const household = d.households.find((h) => h.propertyId === property.id) ?? null;
      const a = d.assessments.find((x) => x.propertyId === property.id);
      return { property: cast<any>(property), household: cast<any>(household), band: a?.band ?? null, score: a?.overallScore ?? null };
    });
    if (f.locality) rows = rows.filter((r) => r.property.locality === f.locality);
    if (f.propertyType) rows = rows.filter((r) => r.property.propertyType === f.propertyType);
    if (f.band) rows = rows.filter((r) => r.band === f.band);
    if (q) rows = rows.filter((r) => r.property.ref.toLowerCase().includes(q) || r.property.locality.toLowerCase().includes(q));
    return rows.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  },

  getPropertyByRef(ref: string) {
    const d = db();
    const property = d.properties.find((p) => p.ref === ref);
    if (!property) return null;
    const household = d.households.find((h) => h.propertyId === property.id) ?? null;
    const assessment = household ? assessmentFor(property.id, household.id) : null;
    const relatedCases = d.cases.filter((c) => c.propertyId === property.id).map((c) => ({ ref: c.ref, status: c.status, title: c.title }));
    return { property: cast<any>(property), household: cast<any>(household), assessment, cases: relatedCases };
  },

  getHouseholds(f: { fuelPoverty?: string; band?: string; q?: string }) {
    const d = db();
    const q = f.q?.toLowerCase();
    let rows = d.households.map((household) => {
      const property = d.properties.find((p) => p.id === household.propertyId)!;
      const a = d.assessments.find((x) => x.householdId === household.id);
      return { household: cast<any>(household), property: cast<any>(property), band: a?.band ?? null, score: a?.overallScore ?? null };
    });
    if (f.fuelPoverty) rows = rows.filter((r) => r.household.fuelPovertyIndicator === f.fuelPoverty);
    if (f.band) rows = rows.filter((r) => r.band === f.band);
    if (q) rows = rows.filter((r) => r.household.ref.toLowerCase().includes(q) || r.property.locality.toLowerCase().includes(q));
    return rows.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  },

  getHouseholdByRef(ref: string) {
    const d = db();
    const household = d.households.find((h) => h.ref === ref);
    if (!household) return null;
    const property = d.properties.find((p) => p.id === household.propertyId)!;
    const assessment = assessmentFor(property.id, household.id);
    const relatedCases = d.cases.filter((c) => c.householdId === household.id).map((c) => ({ ref: c.ref, status: c.status, title: c.title }));
    return { household: cast<any>(household), property: cast<any>(property), assessment, cases: relatedCases };
  },

  getCases(f: { status?: string; team?: string; band?: string; q?: string }) {
    const d = db();
    const q = f.q?.toLowerCase();
    let rows = d.cases.map((c) => {
      const p = d.properties.find((x) => x.id === c.propertyId)!;
      return { c: cast<any>({ ...c, openedAt: new Date(c.openedAt), responseDueAt: toDate(c.responseDueAt), followUpDueAt: toDate(c.followUpDueAt), closedAt: toDate(c.closedAt) }), locality: p.locality, propertyRef: p.ref };
    });
    if (f.status) rows = rows.filter((r) => r.c.status === f.status);
    if (f.team) rows = rows.filter((r) => r.c.ownerTeam === f.team);
    if (f.band) rows = rows.filter((r) => r.c.priorityBand === f.band);
    if (q) rows = rows.filter((r) => r.c.ref.toLowerCase().includes(q) || r.c.title.toLowerCase().includes(q));
    return rows.sort((a, b) => (b.c.currentRiskScore ?? 0) - (a.c.currentRiskScore ?? 0));
  },

  getCaseByRef(ref: string) {
    const d = db();
    const c = d.cases.find((x) => x.ref === ref);
    if (!c) return null;
    const property = d.properties.find((x) => x.id === c.propertyId)!;
    const household = d.households.find((x) => x.id === c.householdId)!;
    const assessment = assessmentFor(property.id, household.id);
    const notes = d.notes.filter((n) => n.caseId === c.id).map((n) => cast<any>({ ...n, createdAt: new Date(n.createdAt) })).sort((a, b) => a.createdAt - b.createdAt);
    const ints = d.interventions.filter((i) => i.caseId === c.id).map((i) => cast<any>({ ...i, targetDate: toDate(i.targetDate), completedAt: toDate(i.completedAt), followUpDate: toDate(i.followUpDate), createdAt: new Date(i.createdAt) })).sort((a, b) => a.createdAt - b.createdAt);
    const audit = d.audit.filter((a) => a.caseId === c.id).map((a) => cast<any>({ ...a, createdAt: new Date(a.createdAt) })).sort((a, b) => a.createdAt - b.createdAt);
    const caseObj = cast<any>({ ...c, openedAt: new Date(c.openedAt), responseDueAt: toDate(c.responseDueAt), followUpDueAt: toDate(c.followUpDueAt), closedAt: toDate(c.closedAt) });
    return { case: caseObj, property: cast<any>(property), household: cast<any>(household), assessment, notes, interventions: ints, audit };
  },

  getInterventionsList(f: { status?: string; team?: string; type?: string }) {
    const d = db();
    let rows = d.interventions.map((i) => {
      const c = d.cases.find((x) => x.id === i.caseId)!;
      const p = d.properties.find((x) => x.id === c.propertyId)!;
      return { i: cast<any>({ ...i, targetDate: toDate(i.targetDate), completedAt: toDate(i.completedAt), followUpDate: toDate(i.followUpDate), createdAt: new Date(i.createdAt) }), caseRef: c.ref, locality: p.locality };
    });
    if (f.status) rows = rows.filter((r) => r.i.status === f.status);
    if (f.team) rows = rows.filter((r) => r.i.team === f.team);
    if (f.type) rows = rows.filter((r) => r.i.type === f.type);
    return rows.sort((a, b) => (a.i.targetDate?.getTime() ?? 0) - (b.i.targetDate?.getTime() ?? 0));
  },

  getDataSources() {
    return db().dataSources.map((s) => cast<any>({ ...s, lastUpdate: toDate(s.lastUpdate) }));
  },

  getRecentAudit(limit = 40) {
    return db().audit
      .map((a) => cast<any>({ ...a, createdAt: new Date(a.createdAt) }))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },

  getAnalytics() {
    const d = db();
    const byLocalityMap = new Map<string, number>();
    const byLocality: { locality: string; band: string; n: number }[] = [];
    for (const a of d.assessments) {
      const p = d.properties.find((x) => x.id === a.propertyId)!;
      const key = `${p.locality}|${a.band}`;
      byLocalityMap.set(key, (byLocalityMap.get(key) ?? 0) + 1);
    }
    for (const [key, n] of byLocalityMap) { const [locality, band] = key.split("|"); byLocality.push({ locality, band, n }); }

    const typeAgg = new Map<string, { sum: number; n: number }>();
    for (const a of d.assessments) {
      const p = d.properties.find((x) => x.id === a.propertyId)!;
      const t = typeAgg.get(p.propertyType) ?? { sum: 0, n: 0 };
      t.sum += a.overallScore; t.n++; typeAgg.set(p.propertyType, t);
    }
    const byType = [...typeAgg].map(([type, { sum, n }]) => ({ type, avgScore: sum / n, n }));

    const primAgg = new Map<string, number>();
    for (const a of d.assessments) primAgg.set(a.primaryRisk, (primAgg.get(a.primaryRisk) ?? 0) + 1);
    const byPrimary = [...primAgg].map(([primary, n]) => ({ primary, n }));

    const intTypeAgg = new Map<string, number>();
    for (const i of d.interventions) intTypeAgg.set(i.type, (intTypeAgg.get(i.type) ?? 0) + 1);
    const interventionsByType = [...intTypeAgg].map(([type, n]) => ({ type, n }));

    const intStatusAgg = new Map<string, number>();
    for (const i of d.interventions) intStatusAgg.set(i.status, (intStatusAgg.get(i.status) ?? 0) + 1);
    const interventionOutcomes = [...intStatusAgg].map(([status, n]) => ({ status, n }));

    const riskReduction = d.cases
      .filter((c) => c.followupRiskScore != null)
      .map((c) => ({ ref: c.ref, opening: c.openingRiskScore, followup: c.followupRiskScore, title: c.title }))
      .sort((a, b) => (b.opening ?? 0) - (b.followup ?? 0) - ((a.opening ?? 0) - (a.followup ?? 0)));

    const repeatAgg = new Map<string, { locality: string; n: number }>();
    for (const i of d.interventions) {
      const c = d.cases.find((x) => x.id === i.caseId)!;
      const p = d.properties.find((x) => x.id === c.propertyId)!;
      const r = repeatAgg.get(p.ref) ?? { locality: p.locality, n: 0 };
      r.n++; repeatAgg.set(p.ref, r);
    }
    const repeatedIssues = [...repeatAgg].filter(([, v]) => v.n >= 3).map(([ref, v]) => ({ ref, locality: v.locality, n: v.n })).sort((a, b) => b.n - a.n);

    return { byLocality, byType, byPrimary, interventionsByType, interventionOutcomes, riskReduction, repeatedIssues };
  },

  getOperational() {
    return computeOperational(db().cases.map((c) => ({ openedAt: c.openedAt, closedAt: c.closedAt, ownerTeam: c.ownerTeam, status: c.status })));
  },

  // ---- Mutations ----
  findCase(ref: string) {
    return db().cases.find((c) => c.ref === ref) ?? null;
  },
  addNote(caseId: number, caseRef: string, kind: string, body: string, author: string) {
    const d = db();
    d.notes.push({ id: Math.max(0, ...d.notes.map((n) => n.id)) + 1, caseId, author, kind, body, createdAt: new Date().toISOString() });
    d.audit.push({ id: Math.max(0, ...d.audit.map((a) => a.id)) + 1, entityType: "case", entityRef: caseRef, caseId, action: kind, actor: author, detail: body.slice(0, 240), createdAt: new Date().toISOString() });
  },
  updateCase(ref: string, patch: Record<string, unknown>) {
    const c = this.findCase(ref);
    if (c) Object.assign(c, patch);
  },
  updateIntervention(ref: string, caseId: number, interventionRef: string, patch: Record<string, unknown>) {
    const it = db().interventions.find((i) => i.ref === interventionRef && i.caseId === caseId);
    if (it) Object.assign(it, patch);
  },
  completedCount(caseId: number) {
    return db().interventions.filter((i) => i.caseId === caseId && i.status === "completed").length;
  },
  openCaseForHousehold(householdRef: string): string | null {
    const d = db();
    const h = d.households.find((x) => x.ref === householdRef);
    if (!h) return null;
    const existing = d.cases.find((c) => c.householdId === h.id && c.status === "open");
    if (existing) return existing.ref;
    const p = d.properties.find((x) => x.id === h.propertyId)!;
    const input = toInput(p, h);
    const a = assessRisk(input);
    const plan = planNewCase({ locality: p.locality, assessment: a, recommendations: recommendInterventions(input, a) });
    const id = Math.max(0, ...d.cases.map((c) => c.id)) + 1;
    const ref = `HAV-C-${pad4(id)}`;
    const nowIso = new Date().toISOString();
    d.cases.push({
      id, ref, propertyId: p.id, householdId: h.id, title: plan.title, status: "open", ownerTeam: plan.ownerTeam,
      ownerName: null, priorityBand: plan.priorityBand, openingRiskScore: plan.openingRiskScore, openingBand: plan.openingBand,
      currentRiskScore: plan.openingRiskScore, currentBand: plan.openingBand, followupRiskScore: null, followupBand: null,
      outcome: null, openedAt: nowIso, responseDueAt: plan.responseDueAt.toISOString(), followUpDueAt: plan.followUpDueAt.toISOString(), closedAt: null,
    });
    for (const n of plan.notes) this.addNote(id, ref, n.kind, n.body, n.author);
    this.addNote(id, ref, "risk_calculated", `overall=${a.overallScore} band=${a.band}`, "System");
    let iid = Math.max(0, ...d.interventions.map((i) => i.id));
    for (const it of plan.interventions) {
      iid++;
      d.interventions.push({ id: iid, ref: `HAV-I-${pad4(iid)}`, caseId: id, type: it.type, label: it.label, reason: it.reason, status: "recommended", team: it.team, ownerName: null, urgency: it.urgency, targetDate: it.targetDate.toISOString(), completedAt: null, expectedOutcome: it.expectedOutcome, actualOutcome: null, followUpDate: null, createdAt: nowIso });
      this.addNote(id, ref, "intervention", `Intervention recommended: ${it.label} — ${it.reason}.`, "System");
    }
    return ref;
  },
};
/* eslint-enable @typescript-eslint/no-explicit-any */
