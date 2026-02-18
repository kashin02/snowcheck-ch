import { describe, it, expect } from "vitest";
import { computeCalendarCrowdScore } from "../src/data/crowdCalendar";

// Helper: create a Date at noon to avoid timezone shift issues
const d = (str) => new Date(str + "T12:00:00");

// Scoring recap (for reference in comments):
//   Peak range            → 15 (immediate)
//   Weekend               → +5
//   Friday                → +2
//   CH cantons (0-26):  ≥19 → +6 | ≥7 → +4 | ≥1 → +2
//   Foreign (0-6):      ≥4  → +4 | ≥2 → +3 | ≥1 → +2
//   Public holiday        → +3
//   Capped at 15

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
    // Friday → +2; no CH cantons yet; no foreign holidays yet → 0
    expect(score).toBe(2);
  });

  it("day after Christmas peak is NOT peak (2026-01-05, Mon)", () => {
    const score = computeCalendarCrowdScore(d("2026-01-05"));
    expect(score).not.toBe(15);
    // Mon → 0; CH: CH_TI still on holiday (Dec 22-Jan 6) = 1 canton → +2
    // Foreign: FR_A ✓ + FR_B ✓ + DE ✓ = 3 → +3. Total = 5.
    expect(score).toBe(5);
  });

  it("day before February peak is NOT peak (2026-02-13, Fri)", () => {
    const score = computeCalendarCrowdScore(d("2026-02-13"));
    expect(score).not.toBe(15);
    // Friday → +2; CH: 8 Romand cantons (Feb 7-22) → ≥7 → +4
    // Foreign: FR_A (Feb 7-23) = 1 → +2
    expect(score).toBe(8);
  });

  it("day after February peak is NOT peak (2026-02-23, Mon)", () => {
    const score = computeCalendarCrowdScore(d("2026-02-23"));
    expect(score).not.toBe(15);
    // Mon → 0; CH: 0 cantons (all ended Feb 22) → +0
    // Foreign: FR_A (Feb 7-23) ✓ + FR_B (Feb 21-Mar 9) ✓ + NL (Feb 14-Mar 1) ✓ = 3 → +3
    expect(score).toBe(3);
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
// 5. Swiss canton holiday scoring (26 cantons, two-wave February)
// ─────────────────────────────────────────────────────────────────────────
describe("Swiss canton holiday scoring", () => {
  it("8 Romand cantons on holiday: CH +4 (2026-02-10, Tue)", () => {
    // CH: GE VD NE JU FR VS BE BS on holiday (Feb 7-22) = 8 → ≥7 → +4
    // Foreign: FR_A (Feb 7-23) = 1 → +2
    expect(computeCalendarCrowdScore(d("2026-02-10"))).toBe(6);
  });

  it("0 CH cantons outside holiday windows: +0 (2026-02-24, Tue)", () => {
    // CH: 0 cantons (all ended Feb 22) → +0
    // Foreign: FR_B (Feb 21-Mar 9) ✓ + NL (Feb 14-Mar 1) ✓ = 2 → +3
    expect(computeCalendarCrowdScore(d("2026-02-24"))).toBe(3);
  });

  it("only GR + TI on holiday before Easter for others (2026-03-28, Sat)", () => {
    // CH: CH_GR + CH_TI start Mar 28 = 2 → ≥1 → +2
    // Foreign: DE (Mar 30-Apr 10 → NO), others → 0 → +0
    // Weekend: +5
    expect(computeCalendarCrowdScore(d("2026-03-28"))).toBe(7);
  });

  it("all 26 CH cantons on holiday at Easter (2026-04-05, Sun)", () => {
    // CH: 24 cantons (Apr 4-17) + GR + TI (Mar 28-Apr 12) = 26 → ≥19 → +6
    // Foreign: FR_A ✓ + DE ✓ + BE ✓ + NL ✓ + UK ✓ = 5 → ≥4 → +4
    // Weekend: +5. Total = 15 (clamped)
    expect(computeCalendarCrowdScore(d("2026-04-05"))).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. Foreign country scoring
// ─────────────────────────────────────────────────────────────────────────
describe("foreign country holiday scoring", () => {
  it("1 foreign country: +2 (2026-02-17, Tue — DE only)", () => {
    // In PEAK range Feb 14-22 → 15. Let's use a date with only DE.
    // DE Faschingsferien: Feb 16-20. Use a date outside Feb PEAK for a non-peak check.
    // This date IS in peak → skip; use 2026-02-25 (Wed) with only FR_B + NL for +3.
    // Instead test Jan 5: FR_A + FR_B + DE = 3 → +3 already tested.
    // Test with DE alone: no good date avoids CH+FR_A overlap well.
    // Use 2026-03-31 (Tue): DE (Mar 30-Apr 10 ✓), FR_A → NO, FR_B → NO, others → NO = 1 → +2
    // CH: GR + TI (Mar 28-Apr 12) = 2 → +2. Total = 4.
    expect(computeCalendarCrowdScore(d("2026-03-31"))).toBe(4);
  });

  it("2 foreign countries: +3 (2026-02-24, Tue — FR_B + NL)", () => {
    // CH: 0 → +0; FR_B ✓ + NL ✓ = 2 → +3
    expect(computeCalendarCrowdScore(d("2026-02-24"))).toBe(3);
  });

  it("3 foreign countries: +3 (2026-01-05, Mon — FR_A + FR_B + DE)", () => {
    // CH: CH_TI still on (Dec 22-Jan 6) = 1 → +2
    // Foreign: FR_A ✓ + FR_B ✓ + DE ✓ = 3 → +3. Total = 5.
    expect(computeCalendarCrowdScore(d("2026-01-05"))).toBe(5);
  });

  it("5 foreign countries: +4 (2026-04-06, Mon — FR_A+DE+BE+NL+UK)", () => {
    // CH: 26 → +6; Foreign: FR_A ✓ + DE ✓ + BE ✓ + NL ✓ + UK ✓ = 5 → +4
    // public (Lundi Pâques) → +3. Total = 13.
    expect(computeCalendarCrowdScore(d("2026-04-06"))).toBe(13);
  });

  it("no foreign countries on holiday: +0 (2026-06-15, Mon)", () => {
    expect(computeCalendarCrowdScore(d("2026-06-15"))).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7. Public holidays
// ─────────────────────────────────────────────────────────────────────────
describe("public holidays", () => {
  it("Vendredi Saint adds +3 (2026-04-03, Fri)", () => {
    // Friday → +2; CH: GR + TI (Mar 28-Apr 12) = 2 → +2
    // Foreign: DE (Mar 30-Apr 10) = 1 → +2; public → +3. Total = 9.
    expect(computeCalendarCrowdScore(d("2026-04-03"))).toBe(9);
  });

  it("Lundi de Pâques adds +3 (2026-04-06, Mon)", () => {
    // Mon → 0; CH: 26 → +6; Foreign: 5 → +4; public → +3. Total = 13.
    expect(computeCalendarCrowdScore(d("2026-04-06"))).toBe(13);
  });

  it("Ascension adds +3 (2026-05-14, Thu)", () => {
    // Thu → 0; no school holidays in May; public → +3
    expect(computeCalendarCrowdScore(d("2026-05-14"))).toBe(3);
  });

  it("Lundi de Pentecôte adds +3 (2026-05-25, Mon)", () => {
    // Mon → 0; no school holidays; public → +3
    expect(computeCalendarCrowdScore(d("2026-05-25"))).toBe(3);
  });

  it("public holiday inside peak still returns 15 (2025-12-25)", () => {
    expect(computeCalendarCrowdScore(d("2025-12-25"))).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 8. Combined scenarios
// ─────────────────────────────────────────────────────────────────────────
describe("combined scenarios", () => {
  it("Saturday during Romand CH holidays: 5 + 4 + 2 = 11 (2026-02-07, Sat)", () => {
    // Weekend → +5; CH: 8 Romand → +4; Foreign: FR_A = 1 → +2
    expect(computeCalendarCrowdScore(d("2026-02-07"))).toBe(11);
  });

  it("Friday during Romand holidays + FR_A: 2 + 4 + 2 = 8 (2026-02-13, Fri)", () => {
    // Friday → +2; CH: 8 → +4; Foreign: FR_A = 1 → +2
    expect(computeCalendarCrowdScore(d("2026-02-13"))).toBe(8);
  });

  it("Easter Saturday with all CH + 5 foreign: capped at 15 (2026-04-04, Sat)", () => {
    // Weekend → +5; CH: 26 → +6; Foreign: FR_A+DE+BE+NL+UK = 5 → +4. Total = 15.
    expect(computeCalendarCrowdScore(d("2026-04-04"))).toBe(15);
  });

  it("Easter Sunday with all CH + 5 foreign: capped at 15 (2026-04-05, Sun)", () => {
    // Weekend → +5; CH: 26 → +6; Foreign: 5 → +4. Total = 15.
    expect(computeCalendarCrowdScore(d("2026-04-05"))).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 9. Clamp to max 15
// ─────────────────────────────────────────────────────────────────────────
describe("clamp to 15", () => {
  it("score is always <= 15 across key dates", () => {
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
// 10. Edge cases
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
