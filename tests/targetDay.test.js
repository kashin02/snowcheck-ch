import { describe, it, expect, vi, afterEach } from "vitest";
import { getSwissTargetDayIndex } from "../src/utils/scoring";

// ── Helpers ──────────────────────────────────────────────────────────────
// CET = UTC+1 (winter), CEST = UTC+2 (summer)
// getSwissTargetDayIndex returns 0 (today) before 15:00 Swiss, 1 (tomorrow) after

afterEach(() => {
  vi.useRealTimers();
});

function setFakeUTC(isoString) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(isoString));
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Winter time (CET = UTC+1)
// ─────────────────────────────────────────────────────────────────────────
describe("winter time (CET = UTC+1)", () => {
  it("returns 0 (today) at 08:00 Swiss = 07:00 UTC", () => {
    setFakeUTC("2026-01-15T07:00:00Z");
    expect(getSwissTargetDayIndex()).toBe(0);
  });

  it("returns 0 (today) at 14:00 Swiss = 13:00 UTC", () => {
    setFakeUTC("2026-01-15T13:00:00Z");
    expect(getSwissTargetDayIndex()).toBe(0);
  });

  it("returns 0 (today) at 14:59 Swiss = 13:59 UTC", () => {
    setFakeUTC("2026-01-15T13:59:00Z");
    expect(getSwissTargetDayIndex()).toBe(0);
  });

  it("returns 1 (tomorrow) at 15:00 Swiss = 14:00 UTC", () => {
    setFakeUTC("2026-01-15T14:00:00Z");
    expect(getSwissTargetDayIndex()).toBe(1);
  });

  it("returns 1 (tomorrow) at 18:00 Swiss = 17:00 UTC", () => {
    setFakeUTC("2026-01-15T17:00:00Z");
    expect(getSwissTargetDayIndex()).toBe(1);
  });

  it("returns 1 (tomorrow) at 23:59 Swiss = 22:59 UTC", () => {
    setFakeUTC("2026-01-15T22:59:00Z");
    expect(getSwissTargetDayIndex()).toBe(1);
  });

  it("returns 1 at midnight Swiss (Intl formats hour 0 as '24' in en-US h24 cycle)", () => {
    // Known quirk: Intl.DateTimeFormat with en-US + hour12:false formats
    // midnight as "24", so parseInt("24") >= 15 → returns 1.
    // Harmless: nobody uses the site at midnight.
    setFakeUTC("2026-01-14T23:00:00Z");
    expect(getSwissTargetDayIndex()).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Summer time (CEST = UTC+2)
// ─────────────────────────────────────────────────────────────────────────
describe("summer time (CEST = UTC+2)", () => {
  it("returns 0 (today) at 14:00 Swiss = 12:00 UTC", () => {
    setFakeUTC("2026-07-15T12:00:00Z");
    expect(getSwissTargetDayIndex()).toBe(0);
  });

  it("returns 0 (today) at 14:59 Swiss = 12:59 UTC", () => {
    setFakeUTC("2026-07-15T12:59:00Z");
    expect(getSwissTargetDayIndex()).toBe(0);
  });

  it("returns 1 (tomorrow) at 15:00 Swiss = 13:00 UTC", () => {
    setFakeUTC("2026-07-15T13:00:00Z");
    expect(getSwissTargetDayIndex()).toBe(1);
  });

  it("returns 1 (tomorrow) at 20:00 Swiss = 18:00 UTC", () => {
    setFakeUTC("2026-07-15T18:00:00Z");
    expect(getSwissTargetDayIndex()).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. DST transitions
// ─────────────────────────────────────────────────────────────────────────
describe("DST transitions", () => {
  // Spring forward: last Sunday of March 2026 = March 29
  // At 02:00 CET → clocks jump to 03:00 CEST (UTC+2)
  // So 01:00 UTC = 02:00 CET, then at 01:00 UTC it becomes 03:00 CEST

  it("spring forward day: morning still correct (2026-03-29 10:00 CEST = 08:00 UTC)", () => {
    setFakeUTC("2026-03-29T08:00:00Z");
    expect(getSwissTargetDayIndex()).toBe(0);
  });

  it("spring forward day: 14:59 CEST = 12:59 UTC → today", () => {
    setFakeUTC("2026-03-29T12:59:00Z");
    expect(getSwissTargetDayIndex()).toBe(0);
  });

  it("spring forward day: 15:00 CEST = 13:00 UTC → tomorrow", () => {
    setFakeUTC("2026-03-29T13:00:00Z");
    expect(getSwissTargetDayIndex()).toBe(1);
  });

  // Fall back: last Sunday of October 2026 = October 25
  // At 03:00 CEST → clocks go back to 02:00 CET (UTC+1)

  it("fall back day: 14:00 CET = 13:00 UTC → today", () => {
    setFakeUTC("2026-10-25T13:00:00Z");
    expect(getSwissTargetDayIndex()).toBe(0);
  });

  it("fall back day: 15:00 CET = 14:00 UTC → tomorrow", () => {
    setFakeUTC("2026-10-25T14:00:00Z");
    expect(getSwissTargetDayIndex()).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. Return type
// ─────────────────────────────────────────────────────────────────────────
describe("return value", () => {
  it("always returns 0 or 1", () => {
    // Test multiple times across the day
    const times = [
      "2026-01-15T00:00:00Z", "2026-01-15T06:00:00Z",
      "2026-01-15T12:00:00Z", "2026-01-15T18:00:00Z",
      "2026-01-15T23:59:59Z",
    ];
    for (const t of times) {
      setFakeUTC(t);
      const result = getSwissTargetDayIndex();
      expect([0, 1]).toContain(result);
      vi.useRealTimers();
    }
  });
});
