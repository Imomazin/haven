import Link from "next/link";
import { notFound } from "next/navigation";
import { getCaseByRef } from "@/db/queries";
import { recommendInterventions } from "@/lib/intervention-engine";
import { toRiskInput } from "@/db/queries";
import { PageHeader, Card, SectionTitle, Definition, Prototype } from "@/components/ui";
import { RiskExplanation } from "@/components/risk-explanation";
import { RiskBadge, StatusPill, UrgencyBadge } from "@/components/severity";
import { label, formatDate, formatDateTime, daysBetween } from "@/lib/format";
import { computeResponseSchedule } from "@/lib/response-rules";
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

  return (
    <div>
      <PageHeader
        title={c.ref}
        description={c.title}
        actions={<Link href="/cases" className="btn-secondary">← All cases</Link>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusPill status={c.status} />
        <RiskBadge band={c.currentBand ?? assessment.band} score={c.currentRiskScore ?? assessment.overallScore} />
        <UrgencyBadge urgency={assessment.urgency} />
        <span className="text-sm text-navy-500">
          <Link href={`/properties/${p.ref}`} className="underline">{p.ref}</Link> · <Link href={`/households/${h.ref}`} className="underline">{h.ref}</Link> · {p.locality}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: summary + risk reduction + interventions + actions */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <SectionTitle>Risk reduction</SectionTitle>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-navy-100 p-3">
                <div className="text-xs text-navy-500">At opening</div>
                <div className="mt-1"><RiskBadge band={c.openingBand ?? "Low"} score={c.openingRiskScore ?? undefined} /></div>
              </div>
              <div className="rounded-lg border border-navy-100 p-3">
                <div className="text-xs text-navy-500">Current</div>
                <div className="mt-1"><RiskBadge band={c.currentBand ?? "Low"} score={c.currentRiskScore ?? undefined} /></div>
              </div>
              <div className="rounded-lg border border-navy-100 p-3">
                <div className="text-xs text-navy-500">At follow-up</div>
                <div className="mt-1">{c.followupRiskScore != null ? <RiskBadge band={c.followupBand ?? "Low"} score={c.followupRiskScore} /> : <span className="text-sm text-navy-400">Not yet</span>}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {change != null ? (
                  change > 0 ? <span className="font-medium text-teal-700">▼ Risk reduced by {change} points</span>
                    : change < 0 ? <span className="font-medium text-orange-800">▲ Risk increased by {Math.abs(change)} points</span>
                    : <span className="text-navy-500">No change measured yet</span>
                ) : (
                  <span className="text-navy-500">Run a follow-up assessment after completing interventions to measure change.</span>
                )}
              </span>
              {c.outcome && <span className="text-navy-600">Outcome: {c.outcome}</span>}
            </div>
            <form action={runFollowUpAssessment} className="mt-3">
              <input type="hidden" name="ref" value={c.ref} />
              <button className="btn-teal">Run follow-up assessment</button>
            </form>
          </Card>

          <Card>
            <SectionTitle sub="Persisted for this case — update status and record outcomes">Interventions</SectionTitle>
            <div className="space-y-3">
              {ints.map((it) => (
                <div key={it.id} className="rounded-lg border border-navy-100 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-medium text-navy-800">{it.label}</span>
                      <span className="ml-2 text-xs text-navy-400">{it.ref}</span>
                    </div>
                    <StatusPill status={it.status} />
                  </div>
                  <p className="mt-1 text-sm text-navy-600">{it.reason}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-500">
                    <span>Team: {it.team}</span>
                    <span>Owner: {it.ownerName ?? "—"}</span>
                    <span>Target: {formatDate(it.targetDate)}</span>
                    {it.completedAt && <span>Completed: {formatDate(it.completedAt)}</span>}
                    {it.followUpDate && <span>Follow-up: {formatDate(it.followUpDate)}</span>}
                  </div>
                  {it.actualOutcome && <p className="mt-1 text-xs text-teal-700">Outcome: {it.actualOutcome}</p>}
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

          <Card>
            <SectionTitle sub="What the engine recommends for this profile right now">Engine recommendations</SectionTitle>
            <ul className="space-y-2">
              {recs.map((r) => (
                <li key={r.type} className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-50 pb-2 text-sm">
                  <div>
                    <span className="font-medium text-navy-800">{r.label}</span>
                    <div className="text-xs text-navy-500">{r.reason} · {r.team} · expected: {r.expectedOutcome}</div>
                  </div>
                  <UrgencyBadge urgency={r.urgency} />
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionTitle>Case timeline</SectionTitle>
            <ol className="relative space-y-3 border-l-2 border-navy-100 pl-4">
              {notes.map((n) => (
                <li key={n.id} className="relative">
                  <span aria-hidden className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal-500" />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-navy-500">{label(n.kind)}</span>
                    <span className="text-xs text-navy-400">{formatDateTime(n.createdAt)} · {n.author}</span>
                  </div>
                  <p className="text-sm text-navy-700">{n.body}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* Right: assessment + actions + audit */}
        <div className="space-y-4">
          <Card>
            <SectionTitle>Case details</SectionTitle>
            <dl>
              <Definition term="Owner team">{c.ownerTeam}</Definition>
              <Definition term="Case owner">{c.ownerName ?? "Unassigned"}</Definition>
              <Definition term="Opened">{formatDate(c.openedAt)} ({daysBetween(c.openedAt)}d ago)</Definition>
              <Definition term="Response due"><span className={overdue ? "font-medium text-red-700" : ""}>{formatDate(c.responseDueAt)}{overdue ? " (overdue)" : ""}</span></Definition>
              <Definition term="Follow-up due">{formatDate(c.followUpDueAt)}</Definition>
              {c.closedAt && <Definition term="Closed">{formatDate(c.closedAt)}</Definition>}
            </dl>
            <div className="mt-2 flex items-center gap-2 text-xs text-navy-500">
              <Prototype /> response {schedule.responseDueDays}d · inspection {schedule.inspectionDueDays ?? "—"}d · follow-up {schedule.followUpDueDays}d
            </div>
          </Card>

          <Card>
            <SectionTitle>Actions</SectionTitle>
            <div className="space-y-3">
              <form action={assignCase} className="flex gap-2">
                <input type="hidden" name="ref" value={c.ref} />
                <input name="ownerName" placeholder="Assign to…" defaultValue={c.ownerName ?? ""} className="input flex-1 py-1 text-sm" />
                <button className="btn-secondary py-1 text-sm">Assign</button>
              </form>
              <div className="flex flex-wrap gap-2">
                <form action={startCase}><input type="hidden" name="ref" value={c.ref} /><button className="btn-secondary py-1 text-sm">Start</button></form>
                {c.status !== "closed" ? (
                  <form action={closeCase}><input type="hidden" name="ref" value={c.ref} /><button className="btn-secondary py-1 text-sm">Close case</button></form>
                ) : (
                  <form action={reopenCase}><input type="hidden" name="ref" value={c.ref} /><button className="btn-secondary py-1 text-sm">Reopen</button></form>
                )}
              </div>
              <form action={escalateCase} className="space-y-1">
                <input type="hidden" name="ref" value={c.ref} />
                <input name="reason" placeholder="Escalation reason" className="input w-full py-1 text-sm" />
                <button className="btn-secondary w-full py-1 text-sm">Escalate</button>
              </form>
              <form action={recordOutcome} className="space-y-1">
                <input type="hidden" name="ref" value={c.ref} />
                <input name="outcome" placeholder="Record outcome" className="input w-full py-1 text-sm" />
                <button className="btn-secondary w-full py-1 text-sm">Record outcome</button>
              </form>
              <form action={addCaseNote} className="space-y-1">
                <input type="hidden" name="ref" value={c.ref} />
                <textarea name="body" placeholder="Add a note…" rows={2} className="input w-full py-1 text-sm" />
                <button className="btn-primary w-full py-1 text-sm">Add note</button>
              </form>
            </div>
          </Card>

          <Card>
            <SectionTitle sub="Immutable record of key actions">Audit trail</SectionTitle>
            <ul className="max-h-72 space-y-1.5 overflow-y-auto text-xs">
              {audit.map((a) => (
                <li key={a.id} className="border-b border-navy-50 pb-1">
                  <span className="font-medium text-navy-700">{label(a.action)}</span>
                  <span className="text-navy-400"> · {formatDateTime(a.createdAt)} · {a.actor}</span>
                  {a.detail && <div className="text-navy-500">{a.detail}</div>}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <SectionTitle sub="Recomputed from current signals — the same transparent engine used everywhere">Why is this risk high? — full explanation</SectionTitle>
        <RiskExplanation a={assessment} />
      </Card>
    </div>
  );
}
