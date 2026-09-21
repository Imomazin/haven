import "server-only";
import { getDb } from "./client";
import * as schema from "./schema";
import { buildDataset, type Dataset } from "@/seed/generate";
import { sql } from "drizzle-orm";

const toDate = (s: string | null) => (s ? new Date(s) : null);

export async function applyDataset(ds: Dataset) {
  const db = getDb();
  await db.execute(
    sql`TRUNCATE audit_events, case_notes, interventions, cases, risk_assessments, households, properties, data_sources RESTART IDENTITY CASCADE`,
  );
  await db.insert(schema.properties).values(ds.properties);
  await db.insert(schema.households).values(ds.households);
  await db.insert(schema.riskAssessments).values(
    ds.assessments.map((a) => ({ ...a, dimensions: a.dimensions as object, detail: a.detail as object, assessedAt: new Date(a.assessedAt) })),
  );
  await db.insert(schema.cases).values(
    ds.cases.map((c) => ({
      ...c,
      openedAt: toDate(c.openedAt)!,
      responseDueAt: toDate(c.responseDueAt),
      followUpDueAt: toDate(c.followUpDueAt),
      closedAt: toDate(c.closedAt),
    })),
  );
  await db.insert(schema.interventions).values(
    ds.interventions.map((it) => ({
      ...it,
      targetDate: toDate(it.targetDate),
      completedAt: toDate(it.completedAt),
      followUpDate: toDate(it.followUpDate),
      createdAt: toDate(it.createdAt)!,
    })),
  );
  await db.insert(schema.caseNotes).values(ds.notes.map((n) => ({ ...n, createdAt: toDate(n.createdAt)! })));
  await db.insert(schema.auditEvents).values(ds.audit.map((a) => ({ ...a, createdAt: toDate(a.createdAt)! })));
  await db.insert(schema.dataSources).values(ds.dataSources.map((d) => ({ ...d, lastUpdate: toDate(d.lastUpdate) })));

  // Reset sequences past the seeded ids.
  for (const t of ["properties", "households", "risk_assessments", "cases", "case_notes", "interventions", "audit_events", "data_sources"]) {
    await db.execute(sql`SELECT setval(pg_get_serial_sequence(${t}, 'id'), (SELECT COALESCE(MAX(id), 1) FROM ${sql.raw(`"${t}"`)}))`);
  }
}

export async function resetDemoData() {
  await applyDataset(buildDataset());
}
