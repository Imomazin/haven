import { buildDataset } from "@/seed/generate";
import type { PortfolioStats, QueueRow } from "@/db/queries";

export function getDemoOverviewData(): { stats: PortfolioStats; queue: QueueRow[] } {
  const ds = buildDataset();
  const current = ds.assessments.filter((a) => a.isCurrent);

  const bandCounts: PortfolioStats["bandCounts"] = {
    Critical: 0,
    High: 0,
    Moderate: 0,
    Low: 0,
  };
  for (const a of current) {
    if (a.band in bandCounts) bandCounts[a.band as keyof typeof bandCounts] += 1;
  }

  const casesByStatus: Record<string, number> = {};
  for (const c of ds.cases) casesByStatus[c.status] = (casesByStatus[c.status] ?? 0) + 1;
  const casesOpen = ds.cases.filter((c) => c.status !== "closed").length;

  const closedDurations = ds.cases
    .filter((c) => c.closedAt)
    .map((c) => (new Date(c.closedAt as string).getTime() - new Date(c.openedAt).getTime()) / 86400000);

  const stats: PortfolioStats = {
    propertiesMonitored: ds.properties.length,
    householdsRepresented: ds.households.length,
    bandCounts,
    casesOpen,
    casesByStatus,
    openInterventions: ds.interventions.filter((i) => ["recommended", "scheduled", "in_progress"].includes(i.status)).length,
    overdueActions: ds.cases.filter((c) => c.status !== "closed" && c.responseDueAt && new Date(c.responseDueAt).getTime() < Date.now()).length,
    fuelPovertyCount: ds.households.filter((h) => ["at_risk", "in_fuel_poverty"].includes(h.fuelPovertyIndicator)).length,
    dampRiskCount: ds.properties.filter((p) => p.dampHistoryCount > 0).length,
    mouldRiskCount: ds.properties.filter((p) => p.mouldHistoryCount > 0).length,
    coldHomeCount: ds.properties.filter((p) => p.indoorWinterTempC != null && p.indoorWinterTempC < 18).length,
    fabricRiskCount: ds.properties.filter((p) => p.wallInsulation === "none" || ["E", "F", "G"].includes(p.epcRating)).length,
    vulnerabilityCount: ds.households.filter((h) => h.healthVulnerability !== "none" || h.mobilitySupport || h.adultsOver65 > 0).length,
    casesImproving: ds.cases.filter((c) => c.followupRiskScore != null && c.followupRiskScore < c.openingRiskScore).length,
    casesWorsening: ds.cases.filter((c) => c.followupRiskScore != null && c.followupRiskScore > c.openingRiskScore).length,
    avgResolutionDays: closedDurations.length
      ? Math.round((closedDurations.reduce((a, b) => a + b, 0) / closedDurations.length) * 10) / 10
      : null,
  };

  const queue: QueueRow[] = [];
  for (const a of current) {
    const household = ds.households.find((h) => h.id === a.householdId);
    const property = ds.properties.find((p) => p.id === a.propertyId);
    if (!household || !property) continue;

    const activeCase = ds.cases.find((c) => c.householdId === household.id && c.status !== "closed") ?? null;
    queue.push({
      householdRef: household.ref,
      propertyRef: property.ref,
      locality: property.locality,
      propertyType: property.propertyType,
      overallScore: a.overallScore,
      band: a.band,
      primaryRisk: a.primaryRisk,
      secondaryRisk: a.secondaryRisk,
      confidence: a.confidence,
      urgency: a.urgency,
      reviewStatus: a.reviewStatus,
      caseRef: activeCase?.ref ?? null,
      caseStatus: activeCase?.status ?? null,
      ownerTeam: activeCase?.ownerTeam ?? null,
      ownerName: activeCase?.ownerName ?? null,
      responseDueAt: activeCase?.responseDueAt ? new Date(activeCase.responseDueAt) : null,
      daysOpen: activeCase
        ? Math.max(0, Math.floor((Date.now() - new Date(activeCase.openedAt).getTime()) / 86400000))
        : null,
    });
  }
  queue.sort((a, b) => b.overallScore - a.overallScore);

  return { stats, queue };
}