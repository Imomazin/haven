import { test, expect } from "vitest";
import { buildDataset } from "./generate";

test("synthetic dataset is internally consistent", () => {
  const ds = buildDataset(42);
  const propById = new Map(ds.properties.map((p) => [p.id, p]));
  const hhById = new Map(ds.households.map((h) => [h.id, h]));
  const problems: string[] = [];

  // Every household points at a real property.
  for (const h of ds.households) if (!propById.has(h.propertyId)) problems.push(`household ${h.ref} -> missing property ${h.propertyId}`);

  // Every assessment joins a real property+household that are linked to each other.
  for (const a of ds.assessments) {
    const p = propById.get(a.propertyId);
    const h = hhById.get(a.householdId);
    if (!p) problems.push(`assessment ${a.id} -> missing property`);
    if (!h) problems.push(`assessment ${a.id} -> missing household`);
    if (p && h && h.propertyId !== p.id) problems.push(`assessment ${a.id} property/household not linked`);
  }

  // Every case joins a property+household that are linked, and locality is single-sourced.
  const caseById = new Map(ds.cases.map((c) => [c.id, c]));
  for (const c of ds.cases) {
    const p = propById.get(c.propertyId);
    const h = hhById.get(c.householdId);
    if (!p) problems.push(`case ${c.ref} -> missing property`);
    if (!h) problems.push(`case ${c.ref} -> missing household`);
    if (p && h && h.propertyId !== p.id) problems.push(`case ${c.ref} property ${p.ref} not home of household ${h.ref}`);
  }

  // Every intervention belongs to a real case; completed ones have a completion date.
  for (const it of ds.interventions) {
    const c = caseById.get(it.caseId);
    if (!c) { problems.push(`intervention ${it.ref ?? it.id} -> missing case`); continue; }
    if (it.status === "completed" && !it.completedAt) problems.push(`intervention ${it.ref ?? it.id} completed without completedAt`);
    if (it.targetDate && it.createdAt && new Date(it.targetDate) < new Date(it.createdAt)) problems.push(`intervention ${it.ref ?? it.id} target before created`);
  }

  // Every audit row references a real case.
  for (const au of ds.audit) if (au.caseId != null && !caseById.has(au.caseId)) problems.push(`audit ${au.id} -> missing case`);

  expect(problems).toEqual([]);
});
