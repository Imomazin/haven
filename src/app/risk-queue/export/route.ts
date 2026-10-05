import { getRiskQueue } from "@/db/queries";
import { label } from "@/lib/format";

export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const rows = await getRiskQueue({ band: sp.band, locality: sp.locality, propertyType: sp.propertyType, caseStatus: sp.caseStatus, q: sp.q, sort: sp.sort });

  const header = [
    "property_ref", "household_ref", "locality", "property_type", "overall_score", "band",
    "primary_risk", "secondary_risk", "confidence", "urgency", "review_status",
    "case_ref", "case_status", "owner_team", "owner_name", "days_open", "response_due",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.propertyRef, r.householdRef, r.locality, label(r.propertyType), r.overallScore, r.band,
        label(r.primaryRisk), r.secondaryRisk ? label(r.secondaryRisk) : "", r.confidence, r.urgency, r.reviewStatus,
        r.caseRef ?? "", r.caseStatus ?? "", r.ownerTeam ?? "", r.ownerName ?? "", r.daysOpen ?? "",
        r.responseDueAt ? new Date(r.responseDueAt).toISOString().slice(0, 10) : "",
      ].map(csvCell).join(","),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="haven-risk-queue-${stamp}.csv"`,
    },
  });
}
