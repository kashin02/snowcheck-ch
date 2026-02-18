import { describe, it, expect } from "vitest";
import { computeCalendarCrowdScore } from "../src/data/crowdCalendar";

// Helper: create a Date at noon to avoid timezone shift issues
const d = (str) => new Date(str + "T12:00:00");

// ─────────────────────────────────────────────────────────────────────────
// 1. Peak periods → always returns 15
// ─────────────────────────────────────────────────────────────────────────
describe("peak periods", () => {
  it("returns 15 on first day of Christmas peak (2025-12-20, Sat)", () => {
    expect(computeCalendarCrowdScore(d("2025-12-20"))).toBe(15);
  });

  it("returns 15 mid-Christmas peak (2025-12-25, Thu)", () => {
    expect(computeCalendarCrowdScore(d("2025-12-25"))).toBe(15);
  });

  it("returns 15 on New Year's Eve (2025-12-31, Wed)", () => {
    expect(computeCalendarCrowdScore(d("2025-12-31"))).toBe(15);
  });

  it("returns 15 on last day of Christmas peak (2026-01-04, Sun)", () => {
    expect(computeCalendarCrowdScore(d("2026-01-04"))).toBe(15);
  });

  it("returns 15 on first day of February peak (2026-02-14, Sat)", () => {
    expect(computeCalendarCrowdScore(d("2026-02-14"))).toBe(15);
  });

  it("returns 15 on last day of February peak (2026-02-22, Sun)", () => {
    expect(computeCalendarCrowdScore(d("2026-02-22"))).toBe(15);
  });

  it("returns 15 mid-February peak (2026-02-18, Wed)", () => {
    expect(computeCalendarCrowdScore(d("2026-02-18"))).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Peak boundary edges
// ─────────────────────────────────────────────────────────────────────────
describe("peak boundary edges", () => {
  it("day before Christmas peak is NOT peak (2025-12-19, Fri)", () => {
    const score = computeCalendarCrowdScore(d("2025-12-19"));
    expect(score).not.toBe(15);
    // Friday → +2, no school holidays yet → 0
    expect(score).toBe(2);
  });

  it("day after Christmas peak is NOT peak (2026-01-05, Mon)", () => {
    const score = computeCalendarCrowdScore(d("2026-01-05"));
    expect(score).not.toBe(15);
    // Monday → base 0, holidays: FR_A + FR_B + DE → 3 countries → +8
    expect(score).toBe(8);
  });

  it("day before February peak is NOT peak (2026-02-13, Fri)", () => {
    const score = computeCalendarCrowdScore(d("2026-02-13"));
    expect(score).not.toBe(15);
    // Friday → +2, holidays: CH(02-07 to 02-22) + FR_A(02-07 to 02-23) → 2 → +6
    expect(score).toBe(8);
  });

  it("day after February peak is NOT peak (2026-02-23, Mon)", () => {
    const score = computeCalendarCrowdScore(d("2026-02-23"));
    expect(score).not.toBe(15);
    // Monday → base 0, holidays: FR_A(02-07 to 02-23) + FR_B(02-21 to 03-09) → 2 → +6
    expect(score).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. Weekend bonus
// ─────────────────────────────────────────────────────────────────────────
describe("weekend bonus", () => {
  it("Saturday outside holidays adds +5", () => {
    // 2026-06-13 is Saturday, no holidays
    expect(computeCalendarCrowdScore(d("2026-06-13"))).toBe(5);
  });

  it("Sunday outside holidays adds +5", () => {
    // 2026-06-14 is Sunday, no holidays
    expect(computeCalendarCrowdScore(d("2026-06-14"))).toBe(5);
  });

  it("Monday outside holidays is 0", () => {
    // 2026-06-15 is Monday, no holidays
    expect(computeCalendarCrowdScore(d("2026-06-15"))).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. Friday bonus
// ─────────────────────────────────────────────────────────────────────────
describe("Friday bonus", () => {
  it("Friday outside holidays adds +2", () => {
    // 2026-06-12 is Friday, no holidays
    expect(computeCalendarCrowdScore(d("2026-06-12"))).toBe(2);
  });

  it("Friday is NOT counted as weekend", () => {
    const score = computeCalendarCrowdScore(d("2026-06-12"));
    // Only +2 (Friday), not +5 (weekend) + +2 (Friday)
    expect(score).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. School holidays — country overlap scoring
// ─────────────────────────────────────────────────────────────────────────
describe("school holidays country overlap", () => {
  it("1 country on holiday: +4 (2026-02-24, Tue — FR_B only)", () => {
    // FR_B: 02-21 to 03-09 → YES. Others: no.
    expect(computeCalendarCrowdScore(d("2026-02-24"))).toBe(4);
  });

  it("2 countries on holiday: +6 (2026-02-10, Tue — CH + FR_A)", () => {
    // CH: 02-07 to 02-22 ✓, FR_A: 02-07 to 02-23 ✓, others: no
    expect(computeCalendarCrowdScore(d("2026-02-10"))).toBe(6);
  });

  it("3+ countries on holiday: +8 (2026-01-05, Mon — FR_A + FR_B + DE)", () => {
    // FR_A: 12-20 to 01-05 ✓, FR_B: 12-20 to 01-05 ✓, DE: 12-22 to 01-05 ✓
    // CH: 12-20 to 01-04 → NO (ends 01-04), BE: 12-22 to 01-04 → NO
    expect(computeCalendarCrowdScore(d("2026-01-05"))).toBe(8);
  });

  it("4+ countries on holiday: +8 (2026-04-06, Mon — CH + FR_A + DE + BE)", () => {
    // CH: 03-28 to 04-12 ✓, FR_A: 04-04 to 04-20 ✓
    // DE: 03-30 to 04-10 ✓, BE: 04-04 to 04-19 ✓ → 4 countries
    // + public holiday (Lundi de Pâques) → +3
    expect(computeCalendarCrowdScore(d("2026-04-06"))).toBe(8 + 3);
  });

  it("no countries on holiday: +0 (2026-06-15, Mon)", () => {
    expect(computeCalendarCrowdScore(d("2026-06-15"))).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. Public holidays
// ─────────────────────────────────────────────────────────────────────────
describe("public holidays", () => {
  it("Vendredi Saint adds +3 on top of base (2026-04-03, Fri)", () => {
    // Friday → +2, CH + DE holidays → 2 countries → +6, public → +3
    expect(computeCalendarCrowdScore(d("2026-04-03"))).toBe(2 + 6 + 3);
  });

  it("Lundi de Pâques adds +3 (2026-04-06, Mon)", () => {
    // Monday → base 0, 4 countries → +8, public → +3
    expect(computeCalendarCrowdScore(d("2026-04-06"))).toBe(11);
  });

  it("Ascension adds +3 (2026-05-14, Thu)", () => {
    // Thursday → base 0, no school holidays in May → 0, public → +3
    expect(computeCalendarCrowdScore(d("2026-05-14"))).toBe(3);
  });

  it("Lundi de Pentecôte adds +3 (2026-05-25, Mon)", () => {
    // Monday → base 0, no school holidays → 0, public → +3
    expect(computeCalendarCrowdScore(d("2026-05-25"))).toBe(3);
  });

  it("public holiday inside peak still returns 15 (2025-12-25)", () => {
    // Peak overrides everything
    expect(computeCalendarCrowdScore(d("2025-12-25"))).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7. Combined scenarios
// ─────────────────────────────────────────────────────────────────────────
describe("combined scenarios", () => {
  it("Saturday during CH holidays: 5 + 6 = 11 (2026-02-07, Sat)", () => {
    // Weekend → +5, CH(02-07 to 02-22) + FR_A(02-07 to 02-23) → 2 → +6
    expect(computeCalendarCrowdScore(d("2026-02-07"))).toBe(11);
  });

  it("Friday during 2 country holidays: 2 + 6 = 8 (2026-02-13, Fri)", () => {
    // Friday → +2, CH + FR_A → 2 → +6
    expect(computeCalendarCrowdScore(d("2026-02-13"))).toBe(8);
  });

  it("Sunday during Easter (4 countries + public): capped at 15 (2026-04-05, Sun)", () => {
    // Weekend → +5, CH + FR_A + DE + BE → 4 → +8. Total = 13, not public holiday
    // 2026-04-05 is not a public holiday
    expect(computeCalendarCrowdScore(d("2026-04-05"))).toBe(13);
  });

  it("Saturday during Easter with 5 countries: weekend(5) + holidays(8) = 13 (2026-04-04, Sat)", () => {
    // Weekend → +5
    // CH: 03-28 to 04-12 ✓, FR_A: 04-04 to 04-20 ✓, DE: 03-30 to 04-10 ✓, BE: 04-04 to 04-19 ✓
    // FR_B: 04-18 to 05-04 → NO
    // 4 countries → +8
    expect(computeCalendarCrowdScore(d("2026-04-04"))).toBe(13);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 8. Clamp to max 15
// ─────────────────────────────────────────────────────────────────────────
describe("clamp to 15", () => {
  it("score is always <= 15", () => {
    // Test a date that could theoretically exceed 15:
    // Lundi de Pâques: 0 + 8(4 countries) + 3(public) = 11 → under 15
    // Even the worst case non-peak: weekend(5) + 3+countries(8) + public(3) = 16 → clamped
    // We can't easily construct this date with the current data,
    // but verify the function never exceeds 15 across a wide range
    const testDates = [
      "2025-12-20", "2025-12-25", "2025-12-31", "2026-01-01", "2026-01-04",
      "2026-01-05", "2026-02-07", "2026-02-10", "2026-02-14", "2026-02-22",
      "2026-02-23", "2026-03-28", "2026-04-03", "2026-04-04", "2026-04-05",
      "2026-04-06", "2026-05-14", "2026-05-25", "2026-06-15",
    ];
    for (const dateStr of testDates) {
      const score = computeCalendarCrowdScore(d(dateStr));
      expect(score).toBeLessThanOrEqual(15);
      expect(score).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 9. Edge cases
// ─────────────────────────────────────────────────────────────────────────
describe("edge cases", () => {
  it("date far outside any range returns 0 on weekday", () => {
    expect(computeCalendarCrowdScore(d("2026-07-15"))).toBe(0); // Tue in summer
  });

  it("handles dates in 2025 before ski season", () => {
    // 2025-10-15 (Wed) — no holidays, no peak
    expect(computeCalendarCrowdScore(d("2025-10-15"))).toBe(0);
  });

  it("handles dates well into future (2027) — no matching ranges", () => {
    // Hardcoded 2025-2026 ranges won't match 2027
    expect(computeCalendarCrowdScore(d("2027-02-15"))).toBe(0); // Mon in Feb 2027
  });
});
