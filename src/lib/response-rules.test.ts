import { describe, it, expect } from "vitest";
import { computeResponseSchedule, addDays, isOverdue, daysUntil } from "./response-rules";

describe("response rules", () => {
  it("gives immediate/critical cases a tight response and inspection window", () => {
    const s = computeResponseSchedule("Immediate", "Critical");
    expect(s.responseDueDays).toBe(2);
    expect(s.inspectionDueDays).toBe(5);
    expect(s.prototype).toBe(true);
  });

  it("gives routine/low cases a long window and no inspection", () => {
    const s = computeResponseSchedule("Routine", "Low");
    expect(s.responseDueDays).toBe(60);
    expect(s.inspectionDueDays).toBeNull();
  });

  it("always sets a 30-day follow-up", () => {
    expect(computeResponseSchedule("Soon", "High").followUpDueDays).toBe(30);
  });

  it("addDays is UTC-safe and reversible", () => {
    const base = new Date("2026-01-01T00:00:00Z");
    expect(addDays(base, 10).toISOString()).toBe("2026-01-11T00:00:00.000Z");
    expect(addDays(base, -1).toISOString()).toBe("2025-12-31T00:00:00.000Z");
  });

  it("detects overdue dates", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    expect(isOverdue(new Date("2026-05-30T00:00:00Z"), now)).toBe(true);
    expect(isOverdue(new Date("2026-06-05T00:00:00Z"), now)).toBe(false);
  });

  it("computes signed days until due", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    expect(daysUntil(new Date("2026-06-08T00:00:00Z"), now)).toBe(7);
    expect(daysUntil(new Date("2026-05-25T00:00:00Z"), now)).toBe(-7);
  });
});
