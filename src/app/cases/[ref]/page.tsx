import Link from "next/link";
import { notFound } from "next/navigation";
import { getCaseByRef, toRiskInput } from "@/db/queries";
import { recommendInterventions } from "@/lib/intervention-engine";
import { Card, SectionTitle, Definition, Prototype } from "@/components/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RiskExplanation } from "@/components/risk-explanation";
import { RiskBadge, StatusPill, UrgencyBadge } from "@/components/severity";
import { label, formatDate, formatDateTime, daysBetween } from "@/lib/format";
import { computeResponseSchedule } from "@/lib/response-rules";
import { CASE_WORKFLOW, stageForStatus, agencyForType } from "@/lib/places";
import {
  assignCase, startCase, addCaseNote, escalateCase, updateInterventionStatus,
  recordOutcome, runFollowUpAssessment, closeCase, reopenCase,
} from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function CaseDetail({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const rec = await getCaseByRef(ref);
  if (!rec) notFound();
  const { case: c, property: p, household: h, assessment, notes, interventions: ints, audit } = rec;
  const recs = recommendInterventions(toRiskInput(p, h), assessment);
  const schedule = computeResponseSchedule(assessment.urgency, assessment.band);
  const overdue = c.responseDueAt && new Date(c.responseDueAt) < new Date() && c.status !== "closed";
  const change = c.followupRiskScore != null && c.openingRiskScore != null ? c.openingRiskScore - c.followupRiskScore : null;
  const nextStep = recs[0];
  const stage = stageForStatus(c.status, c.outcome);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Cases", href: "/cases" }, { label: c.ref }]} />

      {/* Dossier header */}
      <div className="mb-5 overflow-hidden rounded-xl border border-graphite-200/70 bg-white shadow-subtle">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow mb-1">Case file</p>
            <h1 className="font-display text-2xl font-semibold text-ink-900">{c.ref}</h1>
            <p className="mt-1 max-w-xl text-sm text-graphite-600">{c.title}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill status={c.status} />
              <RiskBadge band={c.currentBand ?? assessment.band} score={c.currentRiskScore ?? assessment.overallScore} />
              <UrgencyBadge urgency={assessment.urgency} />
              <span className="text-sm text-graphite-500">
                <Link href={`/properties/${p.ref}`} className="text-ink-700 hover:underline">{p.ref}</Link> · <Link href={`/households/${h.ref}`} className="text-ink-700 hover:underline">{h.ref}</Link> · {p.locality}
              </span>
            </div>
          </div>
          <dl className="grid w-full max-w-sm grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-limestone-100 p-4 text-sm lg:w-auto">
            <div><dt className="field-label">Owner</dt><dd className="mt-0.5 font-medium text-ink-900">{c.ownerName ?? "Unassigned"}</dd><dd className="text-xs text-graphite-500">{c.ownerTeam}</dd></div>
            <div><dt className="field-label">Response due</dt><dd className={`mt-0.5 font-medium ${overdue ? "text-risk-critical-700" : "text-ink-900"}`}>{formatDate(c.responseDueAt)}{overdue ? " · overdue" : ""}</dd></div>
            <div className="col-span-2 border-t border-graphite-200 pt-2"><dt className="field-label">Recommended next step</dt><dd className="mt-0.5 font-medium text-ink-900">{nextStep ? nextStep.label : "Monitor"}</dd>{nextStep && <dd className="text-xs text-graphite-500">{nextStep.team}</dd>}</div>
          </dl>
        </div>
      </div>

      {/* Workflow stepper */}
      <div className="mb-5 overflow-x-auto scroll-y rounded-lg border border-graphite-200/70 bg-white p-3 shadow-subtle">
        <ol className="flex min-w-max items-center gap-1.5">
          {CASE_WORKFLOW.map((s, i) => {
            const done = i < stage, current = i === stage;
            return (
              <li key={s} className="flex items-center gap-1.5">
                <span className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${current ? "bg-ink-800 text-white" : done ? "text-ink-700" : "text-graphite-400"}`}>
                  <span aria-hidden className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${current ? "bg-terracotta-400 text-ink-900" : done ? "bg-sage-500 text-white" : "border border-graphite-300"}`}>{done ? "✓" : i + 1}</span>
                  {s}
                </span>
                {i < CASE_WORKFLOW.length - 1 && <span aria-hidden className={`h-px w-4 ${done ? "bg-sage-400" : "bg-graphite-200"}`} />}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Risk reduction */}
          <Card>
            <SectionTitle sub="Opening → current → follow-up. Does the intervention reduce risk?">Risk trajectory</SectionTitle>
            <div className="grid grid-cols-3 gap-3 text-center">
              {([["At opening", c.openingBand, c.openingRiskScore], ["Current", c.currentBand, c.currentRiskScore], ["At follow-up", c.followupBand, c.followupRiskScore]] as const).map(([lbl, band, score], i) => (
                <div key={i} className="rounded-lg border border-graphite-200 bg-limestone-50 p-3">
                  <div className="text-xs text-graphite-500">{lbl}</div>
                  <div className="mt-1.5 flex justify-center">{score != null ? <RiskBadge band={band ?? "Low"} score={score} /> : <span className="text-sm text-graphite-400">Not yet</span>}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {change != null ? (
                  change > 0 ? <span className="font-medium text-risk-low-700">▼ Risk reduced by {change} points</span>
                    : change < 0 ? <span className="font-medium text-risk-high-700">▲ Risk increased by {Math.abs(change)} points</span>
                    : <span className="text-graphite-500">No change measured yet</span>
                ) : (
                  <span className="text-graphite-500">Complete interventions, then run a follow-up assessment to measure change.</span>
                )}
              </span>
              {c.outcome && <span className="text-graphite-600">Outcome: {c.outcome}</span>}
            </div>
            <form action={runFollowUpAssessment} className="mt-3">
              <input type="hidden" name="ref" value={c.ref} />
              <button className="btn-accent">Run follow-up assessment</button>
            </form>
          </Card>

          {/* Interventions */}
          <Card>
            <SectionTitle sub="Update status and record outcomes">Interventions</SectionTitle>
            <div className="space-y-3">
              {ints.map((it) => (
                <div key={it.id} className="rounded-lg border border-graphite-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><span className="font-medium text-ink-900">{it.label}</span><span className="ml-2 text-xs text-graphite-400">{it.ref}</span></div>
                    <StatusPill status={it.status} />
                  </div>
                  <p className="mt-1 text-sm text-graphite-600">{it.reason}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-graphite-500">
                    <span>Team: {it.team}</span><span>Partner: {agencyForType(it.type)}</span><span>Owner: {it.ownerName ?? "—"}</span><span>Target: {formatDate(it.targetDate)}</span>
                    {it.completedAt && <span>Completed: {formatDate(it.completedAt)}</span>}
                    {it.followUpDate && <span>Follow-up: {formatDate(it.followUpDate)}</span>}
                  </div>
                  {it.actualOutcome && <p className="mt-1 text-xs text-sage-700">Outcome: {it.actualOutcome}</p>}
                  {it.status !== "completed" && it.status !== "cancelled" && (
                    <form action={updateInterventionStatus} className="mt-2 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="ref" value={c.ref} />
                      <input type="hidden" name="interventionRef" value={it.ref} />
                      <select name="status" className="input py-1 text-xs" defaultValue="in_progress">
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <input name="actualOutcome" placeholder="Outcome (if completing)" className="input py-1 text-xs w-56" />
                      <button className="btn-secondary py-1 text-xs">Update</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Engine recommendations */}
          <Card>
            <SectionTitle sub="What the engine recommends for this profile now">Engine recommendations</SectionTitle>
            <ul className="divide-y divide-graphite-100">
              {recs.map((r) => (
                <li key={r.type} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <div><span className="font-medium text-ink-900">{r.label}</span><div className="text-xs text-graphite-500">{r.reason} · {r.team}</div></div>
                  <UrgencyBadge urgency={r.urgency} />
                </li>
              ))}
            </ul>
          </Card>

          {/* Timeline */}
          <Card>
            <SectionTitle>Case timeline</SectionTitle>
            <ol className="relative space-y-3 border-l-2 border-graphite-200 pl-4">
              {notes.map((n) => (
                <li key={n.id} className="relative">
                  <span aria-hidden className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-terracotta-500" />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-graphite-500">{label(n.kind)}</span>
                    <span className="text-xs text-graphite-400">{formatDateTime(n.createdAt)} · {n.author}</span>
                  </div>
                  <p className="text-sm text-ink-800">{n.body}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <Card>
            <SectionTitle>Case details</SectionTitle>
            <dl>
              <Definition term="Opened">{formatDate(c.openedAt)} · {daysBetween(c.openedAt)}d ago</Definition>
              <Definition term="Follow-up due">{formatDate(c.followUpDueAt)}</Definition>
              {c.closedAt && <Definition term="Closed">{formatDate(c.closedAt)}</Definition>}
            </dl>
            <div className="mt-2 flex items-center gap-2 text-xs text-graphite-500">
              <Prototype /> response {schedule.responseDueDays}d · inspection {schedule.inspectionDueDays ?? "—"}d · follow-up {schedule.followUpDueDays}d
            </div>
          </Card>

          <Card>
            <SectionTitle>Actions</SectionTitle>
            <div className="space-y-3">
              <form action={assignCase} className="flex gap-2">
                <input type="hidden" name="ref" value={c.ref} />
                <input name="ownerName" placeholder="Assign to…" defaultValue={c.ownerName ?? ""} className="input flex-1 py-1.5 text-sm" />
                <button className="btn-secondary py-1.5 text-sm">Assign</button>
              </form>
              <div className="flex flex-wrap gap-2">
                <form action={startCase}><input type="hidden" name="ref" value={c.ref} /><button className="btn-secondary py-1.5 text-sm">Start</button></form>
                {c.status !== "closed" ? (
                  <form action={closeCase}><input type="hidden" name="ref" value={c.ref} /><button className="btn-secondary py-1.5 text-sm">Close</button></form>
                ) : (
                  <form action={reopenCase}><input type="hidden" name="ref" value={c.ref} /><button className="btn-secondary py-1.5 text-sm">Reopen</button></form>
                )}
              </div>
              <form action={escalateCase} className="space-y-1">
                <input type="hidden" name="ref" value={c.ref} />
                <input name="reason" placeholder="Escalation reason" className="input w-full py-1.5 text-sm" />
                <button className="btn-secondary w-full py-1.5 text-sm">Escalate</button>
              </form>
              <form action={recordOutcome} className="space-y-1">
                <input type="hidden" name="ref" value={c.ref} />
                <input name="outcome" placeholder="Record outcome" className="input w-full py-1.5 text-sm" />
                <button className="btn-secondary w-full py-1.5 text-sm">Record outcome</button>
              </form>
              <form action={addCaseNote} className="space-y-1">
                <input type="hidden" name="ref" value={c.ref} />
                <textarea name="body" placeholder="Add a note…" rows={2} className="input w-full py-1.5 text-sm" />
                <button className="btn-primary w-full py-1.5 text-sm">Add note</button>
              </form>
            </div>
          </Card>

          <Card>
            <SectionTitle sub="Immutable record of key actions">Audit trail</SectionTitle>
            <ul className="max-h-80 space-y-1.5 overflow-y-auto scroll-y text-xs">
              {audit.map((a) => (
                <li key={a.id} className="border-b border-graphite-100 pb-1 last:border-0">
                  <span className="font-medium text-ink-800">{label(a.action)}</span>
                  <span className="text-graphite-400"> · {formatDateTime(a.createdAt)} · {a.actor}</span>
                  {a.detail && <div className="text-graphite-500">{a.detail}</div>}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <SectionTitle sub="Recomputed from current signals — the same transparent engine used everywhere">Why this risk</SectionTitle>
        <RiskExplanation a={assessment} />
      </Card>
    </div>
  );
}
