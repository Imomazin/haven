"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cases, caseNotes, interventions, auditEvents, properties, households } from "@/db/schema";
import { assessRisk } from "@/lib/risk-engine";
import { recommendInterventions } from "@/lib/intervention-engine";
import { planNewCase } from "@/lib/case-planning";
import { bandForScore } from "@/lib/constants";
import { toRiskInput } from "@/db/queries";
import { resetDemoData } from "@/db/reset";

const pad4 = (n: number) => String(n).padStart(4, "0");

const ACTOR = "Demo User";

async function loadCase(ref: string) {
  const db = getDb();
  const [c] = await db.select().from(cases).where(eq(cases.ref, ref)).limit(1);
  return c ?? null;
}

async function note(caseId: number, ref: string, kind: string, body: string, author = ACTOR) {
  const db = getDb();
  await db.insert(caseNotes).values({ caseId, author, kind, body });
  await db.insert(auditEvents).values({ entityType: "case", entityRef: ref, caseId, action: kind, actor: author, detail: body.slice(0, 240) });
}

function revalidateCase(ref: string) {
  revalidatePath(`/cases/${ref}`);
  revalidatePath("/cases");
  revalidatePath("/");
  revalidatePath("/risk-queue");
  revalidatePath("/interventions");
  revalidatePath("/analytics");
}

export async function assignCase(formData: FormData) {
  const ref = String(formData.get("ref"));
  const owner = String(formData.get("ownerName") || "").trim();
  if (!ref || !owner) return;
  const c = await loadCase(ref);
  if (!c) return;
  const db = getDb();
  await db.update(cases).set({ ownerName: owner, status: c.status === "open" ? "assigned" : c.status }).where(eq(cases.id, c.id));
  await note(c.id, ref, "assignment", `Assigned to ${owner}.`);
  revalidateCase(ref);
}

export async function startCase(formData: FormData) {
  const ref = String(formData.get("ref"));
  const c = await loadCase(ref);
  if (!c) return;
  const db = getDb();
  await db.update(cases).set({ status: "in_progress" }).where(eq(cases.id, c.id));
  await note(c.id, ref, "status_change", "Case moved to in progress.");
  revalidateCase(ref);
}

export async function addCaseNote(formData: FormData) {
  const ref = String(formData.get("ref"));
  const body = String(formData.get("body") || "").trim();
  if (!ref || !body) return;
  const c = await loadCase(ref);
  if (!c) return;
  await note(c.id, ref, "note", body);
  revalidateCase(ref);
}

export async function escalateCase(formData: FormData) {
  const ref = String(formData.get("ref"));
  const reason = String(formData.get("reason") || "Escalated for senior review.").trim();
  const c = await loadCase(ref);
  if (!c) return;
  const db = getDb();
  await db.update(cases).set({ status: "escalated" }).where(eq(cases.id, c.id));
  await note(c.id, ref, "escalation", reason);
  revalidateCase(ref);
}

export async function updateInterventionStatus(formData: FormData) {
  const ref = String(formData.get("ref"));
  const interventionRef = String(formData.get("interventionRef"));
  const status = String(formData.get("status"));
  const actualOutcome = String(formData.get("actualOutcome") || "").trim() || null;
  const c = await loadCase(ref);
  if (!c) return;
  const db = getDb();
  const patch: Record<string, unknown> = { status };
  if (status === "completed") {
    patch.completedAt = new Date();
    if (actualOutcome) patch.actualOutcome = actualOutcome;
  }
  if (status === "in_progress" || status === "scheduled") {
    patch.ownerName = c.ownerName;
  }
  await db.update(interventions).set(patch).where(and(eq(interventions.ref, interventionRef), eq(interventions.caseId, c.id)));
  await note(c.id, ref, "intervention", `Intervention ${interventionRef} → ${status}${actualOutcome ? `: ${actualOutcome}` : ""}.`);
  revalidateCase(ref);
}

export async function recordOutcome(formData: FormData) {
  const ref = String(formData.get("ref"));
  const outcome = String(formData.get("outcome") || "").trim();
  if (!ref || !outcome) return;
  const c = await loadCase(ref);
  if (!c) return;
  const db = getDb();
  await db.update(cases).set({ outcome }).where(eq(cases.id, c.id));
  await note(c.id, ref, "outcome", `Outcome recorded: ${outcome}`);
  revalidateCase(ref);
}

export async function runFollowUpAssessment(formData: FormData) {
  const ref = String(formData.get("ref"));
  const c = await loadCase(ref);
  if (!c) return;
  const db = getDb();
  const [p] = await db.select().from(properties).where(eq(properties.id, c.propertyId)).limit(1);
  const [h] = await db.select().from(households).where(eq(households.id, c.householdId)).limit(1);
  const assessment = assessRisk(toRiskInput(p, h));
  // Prototype follow-up: reflect the effect of completed interventions by
  // stepping current risk down toward the recomputed baseline (demo behaviour).
  const completed = await db
    .select()
    .from(interventions)
    .where(and(eq(interventions.caseId, c.id), eq(interventions.status, "completed")));
  const reduction = Math.min(45, completed.length * 12);
  const base = c.currentRiskScore ?? assessment.overallScore;
  const followup = Math.max(5, base - reduction);
  await db
    .update(cases)
    .set({ followupRiskScore: followup, followupBand: bandForScore(followup), currentRiskScore: followup, currentBand: bandForScore(followup) })
    .where(eq(cases.id, c.id));
  await note(c.id, ref, "assessment", `Follow-up assessment: risk now ${followup} (${bandForScore(followup)}), down from ${base} (${bandForScore(base)}). ${completed.length} completed intervention(s).`, "System");
  revalidateCase(ref);
}

export async function closeCase(formData: FormData) {
  const ref = String(formData.get("ref"));
  const c = await loadCase(ref);
  if (!c) return;
  const db = getDb();
  await db.update(cases).set({ status: "closed", closedAt: new Date(), outcome: c.outcome ?? "Case closed" }).where(eq(cases.id, c.id));
  await note(c.id, ref, "status_change", "Case closed.");
  revalidateCase(ref);
}

export async function reopenCase(formData: FormData) {
  const ref = String(formData.get("ref"));
  const c = await loadCase(ref);
  if (!c) return;
  const db = getDb();
  await db.update(cases).set({ status: "monitoring", closedAt: null }).where(eq(cases.id, c.id));
  await note(c.id, ref, "status_change", "Case reopened for monitoring.");
  revalidateCase(ref);
}

export async function openCaseForHousehold(formData: FormData) {
  const householdRef = String(formData.get("householdRef") || "");
  if (!householdRef) return;
  const db = getDb();
  const [h] = await db.select().from(households).where(eq(households.ref, householdRef)).limit(1);
  if (!h) return;

  // If an open case already exists for this household, go there instead.
  const [existing] = await db
    .select({ ref: cases.ref })
    .from(cases)
    .where(and(eq(cases.householdId, h.id), eq(cases.status, "open")))
    .limit(1);
  if (existing) {
    redirect(`/cases/${existing.ref}`);
  }

  const [p] = await db.select().from(properties).where(eq(properties.id, h.propertyId)).limit(1);
  const input = toRiskInput(p, h);
  const assessment = assessRisk(input);
  const plan = planNewCase({ locality: p.locality, assessment, recommendations: recommendInterventions(input, assessment) });

  const now = new Date();
  const [created] = await db
    .insert(cases)
    .values({
      ref: `TMP-${Date.now()}`,
      propertyId: p.id,
      householdId: h.id,
      title: plan.title,
      status: "open",
      ownerTeam: plan.ownerTeam,
      priorityBand: plan.priorityBand,
      openingRiskScore: plan.openingRiskScore,
      openingBand: plan.openingBand,
      currentRiskScore: plan.openingRiskScore,
      currentBand: plan.openingBand,
      openedAt: now,
      responseDueAt: plan.responseDueAt,
      followUpDueAt: plan.followUpDueAt,
    })
    .returning({ id: cases.id });

  const caseId = created.id;
  const ref = `HAV-C-${pad4(caseId)}`;
  await db.update(cases).set({ ref }).where(eq(cases.id, caseId));

  for (const n of plan.notes) {
    await db.insert(caseNotes).values({ caseId, author: n.author, kind: n.kind, body: n.body });
  }
  await db.insert(auditEvents).values({ entityType: "case", entityRef: ref, caseId, action: "risk_calculated", actor: "System", detail: `overall=${assessment.overallScore} band=${assessment.band}` });
  await db.insert(auditEvents).values({ entityType: "case", entityRef: ref, caseId, action: "case_created", actor: ACTOR, detail: `ref=${ref}` });

  for (const it of plan.interventions) {
    const [itRow] = await db
      .insert(interventions)
      .values({ ref: `TMP-${Date.now()}-${it.type}`, caseId, type: it.type, label: it.label, reason: it.reason, status: "recommended", team: it.team, urgency: it.urgency, targetDate: it.targetDate, expectedOutcome: it.expectedOutcome })
      .returning({ id: interventions.id });
    await db.update(interventions).set({ ref: `HAV-I-${pad4(itRow.id)}` }).where(eq(interventions.id, itRow.id));
    await db.insert(caseNotes).values({ caseId, author: "System", kind: "intervention", body: `Intervention recommended: ${it.label} — ${it.reason}.` });
    await db.insert(auditEvents).values({ entityType: "case", entityRef: ref, caseId, action: "intervention_created", actor: "System", detail: `type=${it.type} status=recommended` });
  }

  revalidatePath("/risk-queue");
  revalidatePath("/cases");
  revalidatePath("/");
  redirect(`/cases/${ref}`);
}

export async function resetDemo() {
  await resetDemoData();
  revalidatePath("/", "layout");
}
