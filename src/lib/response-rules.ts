// Haven response rules — PROTOTYPE timing rules only.
//
// These are NOT statutory deadlines. They are configurable prototype response
// windows used to give cases an operational rhythm. Any real deployment must
// map these to the landlord's own policy and to applicable Scottish social
// housing standards. Labelled in the UI as "Prototype response rule".

import type { RiskBand, UrgencyCategory } from "./types";

export interface ResponseRule {
  id: string;
  label: string;
  description: string;
  appliesTo: string;
  dueDays: number;
  prototype: true;
}

export const RESPONSE_RULES: ResponseRule[] = [
  { id: "resp-immediate", label: "Immediate response", description: "First contact / triage for immediate-urgency cases", appliesTo: "Urgency: Immediate", dueDays: 2, prototype: true },
  { id: "resp-soon", label: "Prompt response", description: "First action for soon-urgency cases", appliesTo: "Urgency: Soon", dueDays: 7, prototype: true },
  { id: "resp-scheduled", label: "Scheduled response", description: "Planned action for scheduled-urgency cases", appliesTo: "Urgency: Scheduled", dueDays: 21, prototype: true },
  { id: "resp-routine", label: "Routine response", description: "Routine handling for low-urgency cases", appliesTo: "Urgency: Routine", dueDays: 60, prototype: true },
  { id: "insp-critical", label: "Critical inspection window", description: "On-site inspection target for critical-band cases", appliesTo: "Band: Critical", dueDays: 5, prototype: true },
  { id: "followup-standard", label: "Follow-up assessment window", description: "Re-assessment after intervention completion", appliesTo: "All resolved cases", dueDays: 30, prototype: true },
];

const URGENCY_DUE: Record<UrgencyCategory, number> = {
  Immediate: 2,
  Soon: 7,
  Scheduled: 21,
  Routine: 60,
};

const BAND_INSPECTION_DUE: Record<RiskBand, number | null> = {
  Critical: 5,
  High: 14,
  Moderate: 30,
  Low: null,
};

export interface ResponseSchedule {
  responseDueDays: number;
  inspectionDueDays: number | null;
  followUpDueDays: number;
  prototype: true;
}

export function computeResponseSchedule(urgency: UrgencyCategory, band: RiskBand): ResponseSchedule {
  return {
    responseDueDays: URGENCY_DUE[urgency],
    inspectionDueDays: BAND_INSPECTION_DUE[band],
    followUpDueDays: 30,
    prototype: true,
  };
}

/** Add N days to a base date, returning a new Date (UTC-safe). */
export function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Whether a due date has passed relative to `now`. */
export function isOverdue(dueDate: Date, now: Date = new Date()): boolean {
  return dueDate.getTime() < now.getTime();
}

/** Days until (positive) or since (negative) a due date. */
export function daysUntil(dueDate: Date, now: Date = new Date()): number {
  return Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
