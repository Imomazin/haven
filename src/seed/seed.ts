// Seed runner. Two modes:
//   npm run db:seed            -> inserts the deterministic dataset into DATABASE_URL
//   npm run db:seed:sql        -> writes drizzle/seed.sql (no DB connection needed)
//   npm run db:reset           -> truncates then re-seeds (same as db:seed with --reset)
//
// The SQL-emit mode exists so the dataset can be applied through environments
// (e.g. Neon MCP) that cannot open a direct Postgres TCP connection.

import { writeFileSync, mkdirSync } from "node:fs";
import { buildDataset, type Dataset } from "./generate";

type Val = string | number | boolean | null | object;

function lit(v: Val): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

function insertMany(table: string, columns: string[], rows: Val[][]): string {
  if (rows.length === 0) return "";
  const cols = columns.map((c) => `"${c}"`).join(", ");
  const values = rows.map((r) => `(${r.map(lit).join(", ")})`).join(",\n  ");
  return `INSERT INTO "${table}" (${cols}) VALUES\n  ${values};`;
}

export function datasetToTableInserts(ds: Dataset): { table: string; sql: string }[] {
  const out: { table: string; sql: string }[] = [];
  const add = (table: string, sql: string) => out.push({ table, sql });

  add(
    "properties",
    insertMany(
      "properties",
      ["id", "ref", "locality", "property_type", "construction_era", "epc_rating", "heating_type", "wall_insulation", "loft_insulation", "glazing", "ventilation", "damp_history_count", "mould_history_count", "open_repairs", "last_repair_days_ago", "indoor_humidity_pct", "indoor_winter_temp_c", "co2_ppm", "readings_age_days"],
      ds.properties.map((p) => [p.id, p.ref, p.locality, p.propertyType, p.constructionEra, p.epcRating, p.heatingType, p.wallInsulation, p.loftInsulation, p.glazing, p.ventilation, p.dampHistoryCount, p.mouldHistoryCount, p.openRepairs, p.lastRepairDaysAgo, p.indoorHumidityPct, p.indoorWinterTempC, p.co2Ppm, p.readingsAgeDays]),
    ),
  );

  add(
    "households",
    insertMany(
      "households",
      ["id", "ref", "property_id", "household_size", "adults_over_65", "children_under_5", "children_present", "income_risk_indicator", "fuel_poverty_indicator", "mobility_support", "health_vulnerability", "recent_household_change", "energy_use_pattern"],
      ds.households.map((h) => [h.id, h.ref, h.propertyId, h.householdSize, h.adultsOver65, h.childrenUnder5, h.childrenPresent, h.incomeRiskIndicator, h.fuelPovertyIndicator, h.mobilitySupport, h.healthVulnerability, h.recentHouseholdChange, h.energyUsePattern]),
    ),
  );

  add(
    "risk_assessments",
    insertMany(
      "risk_assessments",
      ["id", "property_id", "household_id", "overall_score", "band", "confidence_score", "confidence", "urgency_score", "urgency", "primary_risk", "secondary_risk", "response_due_days", "dimensions", "detail", "model_version", "review_status", "reviewed_by", "is_current", "assessed_at"],
      ds.assessments.map((a) => [a.id, a.propertyId, a.householdId, a.overallScore, a.band, a.confidenceScore, a.confidence, a.urgencyScore, a.urgency, a.primaryRisk, a.secondaryRisk, a.responseDueDays, a.dimensions as object, a.detail as object, a.modelVersion, a.reviewStatus, a.reviewedBy, a.isCurrent, a.assessedAt]),
    ),
  );

  add(
    "cases",
    insertMany(
      "cases",
      ["id", "ref", "property_id", "household_id", "title", "status", "owner_team", "owner_name", "priority_band", "opening_risk_score", "opening_band", "current_risk_score", "current_band", "followup_risk_score", "followup_band", "outcome", "opened_at", "response_due_at", "follow_up_due_at", "closed_at"],
      ds.cases.map((c) => [c.id, c.ref, c.propertyId, c.householdId, c.title, c.status, c.ownerTeam, c.ownerName, c.priorityBand, c.openingRiskScore, c.openingBand, c.currentRiskScore, c.currentBand, c.followupRiskScore, c.followupBand, c.outcome, c.openedAt, c.responseDueAt, c.followUpDueAt, c.closedAt]),
    ),
  );

  add(
    "interventions",
    insertMany(
      "interventions",
      ["id", "ref", "case_id", "type", "label", "reason", "status", "team", "owner_name", "urgency", "target_date", "completed_at", "expected_outcome", "actual_outcome", "follow_up_date", "created_at"],
      ds.interventions.map((it) => [it.id, it.ref, it.caseId, it.type, it.label, it.reason, it.status, it.team, it.ownerName, it.urgency, it.targetDate, it.completedAt, it.expectedOutcome, it.actualOutcome, it.followUpDate, it.createdAt]),
    ),
  );

  add(
    "case_notes",
    insertMany(
      "case_notes",
      ["id", "case_id", "author", "kind", "body", "created_at"],
      ds.notes.map((n) => [n.id, n.caseId, n.author, n.kind, n.body, n.createdAt]),
    ),
  );

  add(
    "audit_events",
    insertMany(
      "audit_events",
      ["id", "entity_type", "entity_ref", "case_id", "action", "actor", "detail", "created_at"],
      ds.audit.map((a) => [a.id, a.entityType, a.entityRef, a.caseId, a.action, a.actor, a.detail, a.createdAt]),
    ),
  );

  add(
    "data_sources",
    insertMany(
      "data_sources",
      ["id", "name", "category", "purpose", "confidence", "adapter_status", "lawful_basis_placeholder", "access_concept", "retention_concept", "last_update"],
      ds.dataSources.map((d) => [d.id, d.name, d.category, d.purpose, d.confidence, d.adapterStatus, d.lawfulBasisPlaceholder, d.accessConcept, d.retentionConcept, d.lastUpdate]),
    ),
  );

  return out;
}

const TRUNCATE_SQL =
  "TRUNCATE audit_events, case_notes, interventions, cases, risk_assessments, households, properties, data_sources RESTART IDENTITY CASCADE";

function seqResetSql(table: string): string {
  return `SELECT setval(pg_get_serial_sequence('${table}', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "${table}"))`;
}

export function datasetToSql(ds: Dataset): string {
  const inserts = datasetToTableInserts(ds);
  const parts = [
    "-- Haven synthetic seed data (deterministic). SYNTHETIC ONLY.",
    TRUNCATE_SQL + ";",
    ...inserts.map((i) => i.sql),
    ...inserts.map((i) => seqResetSql(i.table) + ";"),
  ];
  return parts.join("\n\n") + "\n";
}

async function insertViaDb(ds: Dataset) {
  const { getDb } = await import("../db/client");
  const schema = await import("../db/schema");
  const db = getDb();
  const toDate = (s: string | null) => (s ? new Date(s) : null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).execute?.(
    // best-effort truncate; ignored if execute unsupported
    "TRUNCATE audit_events, case_notes, interventions, cases, risk_assessments, households, properties, data_sources RESTART IDENTITY CASCADE",
  );

  await db.insert(schema.properties).values(ds.properties);
  await db.insert(schema.households).values(ds.households);
  await db.insert(schema.riskAssessments).values(
    ds.assessments.map((a) => ({ ...a, assessedAt: new Date(a.assessedAt) })),
  );
  await db.insert(schema.cases).values(
    ds.cases.map((c) => ({ ...c, openedAt: toDate(c.openedAt)!, responseDueAt: toDate(c.responseDueAt), followUpDueAt: toDate(c.followUpDueAt), closedAt: toDate(c.closedAt) })),
  );
  await db.insert(schema.interventions).values(
    ds.interventions.map((it) => ({ ...it, targetDate: toDate(it.targetDate), completedAt: toDate(it.completedAt), followUpDate: toDate(it.followUpDate), createdAt: toDate(it.createdAt)! })),
  );
  await db.insert(schema.caseNotes).values(ds.notes.map((n) => ({ ...n, createdAt: toDate(n.createdAt)! })));
  await db.insert(schema.auditEvents).values(ds.audit.map((a) => ({ ...a, createdAt: toDate(a.createdAt)! })));
  await db.insert(schema.dataSources).values(ds.dataSources.map((d) => ({ ...d, lastUpdate: toDate(d.lastUpdate) })));
}

async function main() {
  const args = process.argv.slice(2);
  const emitSql = args.includes("--emit-sql");
  const ds = buildDataset();
  const summary = `properties=${ds.properties.length} households=${ds.households.length} assessments=${ds.assessments.length} cases=${ds.cases.length} interventions=${ds.interventions.length} notes=${ds.notes.length} audit=${ds.audit.length}`;

  if (emitSql) {
    const sql = datasetToSql(ds);
    const outIdx = args.indexOf("--out");
    const out = outIdx >= 0 ? args[outIdx + 1] : "drizzle/seed.sql";
    writeFileSync(out, sql);
    console.log(`Wrote ${out} (${summary})`);
    const splitIdx = args.indexOf("--split");
    if (splitIdx >= 0) {
      const dir = args[splitIdx + 1];
      mkdirSync(dir, { recursive: true });
      const inserts = datasetToTableInserts(ds);
      inserts.forEach((ins, i) => {
        writeFileSync(`${dir}/${String(i + 1).padStart(2, "0")}_${ins.table}.sql`, ins.sql + "\n");
      });
      console.log(`Wrote ${inserts.length} per-table files to ${dir}`);
    }
    return;
  }

  await insertViaDb(ds);
  console.log(`Seeded database (${summary})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
