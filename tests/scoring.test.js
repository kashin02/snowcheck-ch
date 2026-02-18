import { describe, it, expect } from "vitest";
import {
  thresholdScore,
  scoreSun,
  scoreFresh,
  scoreDepth,
  scorePistes,
  penaltyJB,
  penaltyWind,
  scoreForDay,
} from "../src/utils/scoring";
import { scoreToVerdict } from "../src/data/constants";

// ─────────────────────────────────────────────────────────────────────────
// 1. thresholdScore (generic engine)
// ─────────────────────────────────────────────────────────────────────────
describe("thresholdScore", () => {
  const fn = thresholdScore([[10, 100], [5, 50], [1, 10]], 0);

  it("returns highest matching threshold", () => {
    expect(fn(10)).toBe(100);
    expect(fn(15)).toBe(100);
    expect(fn(5)).toBe(50);
    expect(fn(7)).toBe(50);
    expect(fn(1)).toBe(10);
    expect(fn(3)).toBe(10);
  });

  it("returns fallback when below all thresholds", () => {
    expect(fn(0)).toBe(0);
    expect(fn(0.5)).toBe(0);
  });

  it("returns custom fallback", () => {
    const fn2 = thresholdScore([[5, 50]], 99);
    expect(fn2(0)).toBe(99);
  });

  it("handles negative values", () => {
    expect(fn(-5)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. scoreSun — sunshine hours → 0-35 pts
// ─────────────────────────────────────────────────────────────────────────
describe("scoreSun", () => {
  it("returns exact threshold values", () => {
    expect(scoreSun(8)).toBe(35);
    expect(scoreSun(6)).toBe(28);
    expect(scoreSun(4)).toBe(20);
    expect(scoreSun(2)).toBe(12);
    expect(scoreSun(1)).toBe(5);
  });

  it("returns 0 below minimum threshold", () => {
    expect(scoreSun(0)).toBe(0);
    expect(scoreSun(0.5)).toBe(0);
    expect(scoreSun(0.99)).toBe(0);
  });

  it("returns highest matching for above-max values", () => {
    expect(scoreSun(12)).toBe(35);
    expect(scoreSun(100)).toBe(35);
  });

  it("returns correct score for intermediate values", () => {
    expect(scoreSun(1.5)).toBe(5);   // between 1 and 2
    expect(scoreSun(3)).toBe(12);    // between 2 and 4
    expect(scoreSun(5)).toBe(20);    // between 4 and 6
    expect(scoreSun(7)).toBe(28);    // between 6 and 8
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. scoreFresh — fresh snow 72h → 0-30 pts
// ─────────────────────────────────────────────────────────────────────────
describe("scoreFresh", () => {
  it("returns exact threshold values", () => {
    expect(scoreFresh(50)).toBe(30);
    expect(scoreFresh(30)).toBe(24);
    expect(scoreFresh(15)).toBe(18);
    expect(scoreFresh(5)).toBe(10);
    expect(scoreFresh(1)).toBe(4);
  });

  it("returns 0 for no fresh snow", () => {
    expect(scoreFresh(0)).toBe(0);
  });

  it("handles above-max values", () => {
    expect(scoreFresh(100)).toBe(30);
    expect(scoreFresh(200)).toBe(30);
  });

  it("returns correct score for intermediate values", () => {
    expect(scoreFresh(0.5)).toBe(0);   // below 1cm
    expect(scoreFresh(3)).toBe(4);     // between 1 and 5
    expect(scoreFresh(10)).toBe(10);   // between 5 and 15
    expect(scoreFresh(20)).toBe(18);   // between 15 and 30
    expect(scoreFresh(40)).toBe(24);   // between 30 and 50
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. scoreDepth — snow depth → 0-20 pts
// ─────────────────────────────────────────────────────────────────────────
describe("scoreDepth", () => {
  it("returns exact threshold values", () => {
    expect(scoreDepth(150)).toBe(20);
    expect(scoreDepth(100)).toBe(16);
    expect(scoreDepth(60)).toBe(12);
    expect(scoreDepth(30)).toBe(6);
  });

  it("returns 0 below minimum threshold", () => {
    expect(scoreDepth(0)).toBe(0);
    expect(scoreDepth(10)).toBe(0);
    expect(scoreDepth(29)).toBe(0);
  });

  it("handles large values", () => {
    expect(scoreDepth(300)).toBe(20);
    expect(scoreDepth(500)).toBe(20);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. scorePistes — pistes open km → 1-15 pts (fallback = 1)
// ─────────────────────────────────────────────────────────────────────────
describe("scorePistes", () => {
  it("returns exact threshold values", () => {
    expect(scorePistes(100)).toBe(15);
    expect(scorePistes(60)).toBe(12);
    expect(scorePistes(30)).toBe(8);
    expect(scorePistes(15)).toBe(4);
  });

  it("returns fallback of 1 below minimum threshold", () => {
    expect(scorePistes(0)).toBe(1);
    expect(scorePistes(5)).toBe(1);
    expect(scorePistes(14)).toBe(1);
  });

  it("handles large values", () => {
    expect(scorePistes(200)).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. penaltyJB — jour blanc index → 0 to -30 pts
// ─────────────────────────────────────────────────────────────────────────
describe("penaltyJB", () => {
  it("returns exact threshold penalties", () => {
    expect(penaltyJB(7)).toBe(-30);
    expect(penaltyJB(5)).toBe(-22);
    expect(penaltyJB(3)).toBe(-12);
    expect(penaltyJB(1)).toBe(-5);
  });

  it("returns 0 for clear day (JBI = 0)", () => {
    expect(penaltyJB(0)).toBe(0);
    expect(penaltyJB(0.5)).toBe(0);
    expect(penaltyJB(0.99)).toBe(0);
  });

  it("returns maximum penalty for extreme JBI", () => {
    expect(penaltyJB(10)).toBe(-30);
    expect(penaltyJB(9)).toBe(-30);
    expect(penaltyJB(8)).toBe(-30);
  });

  it("handles intermediate values", () => {
    expect(penaltyJB(2)).toBe(-5);   // between 1 and 3
    expect(penaltyJB(4)).toBe(-12);  // between 3 and 5
    expect(penaltyJB(6)).toBe(-22);  // between 5 and 7
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7. penaltyWind — wind speed → 0 to -20 pts
// ─────────────────────────────────────────────────────────────────────────
describe("penaltyWind", () => {
  it("returns exact threshold penalties", () => {
    expect(penaltyWind(80)).toBe(-20);
    expect(penaltyWind(60)).toBe(-15);
    expect(penaltyWind(40)).toBe(-8);
    expect(penaltyWind(25)).toBe(-3);
  });

  it("returns 0 for calm conditions", () => {
    expect(penaltyWind(0)).toBe(0);
    expect(penaltyWind(10)).toBe(0);
    expect(penaltyWind(24)).toBe(0);
  });

  it("returns maximum penalty for extreme wind", () => {
    expect(penaltyWind(100)).toBe(-20);
    expect(penaltyWind(150)).toBe(-20);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 8. scoreToVerdict — score → verdict key
// ─────────────────────────────────────────────────────────────────────────
describe("scoreToVerdict", () => {
  it("returns 'top' for scores >= 70", () => {
    expect(scoreToVerdict(70)).toBe("top");
    expect(scoreToVerdict(85)).toBe("top");
    expect(scoreToVerdict(100)).toBe("top");
  });

  it("returns 'good' for scores 45-69", () => {
    expect(scoreToVerdict(45)).toBe("good");
    expect(scoreToVerdict(50)).toBe("good");
    expect(scoreToVerdict(69)).toBe("good");
  });

  it("returns 'ok' for scores 20-44", () => {
    expect(scoreToVerdict(20)).toBe("ok");
    expect(scoreToVerdict(30)).toBe("ok");
    expect(scoreToVerdict(44)).toBe("ok");
  });

  it("returns 'bad' for scores < 20", () => {
    expect(scoreToVerdict(0)).toBe("bad");
    expect(scoreToVerdict(10)).toBe("bad");
    expect(scoreToVerdict(19)).toBe("bad");
  });

  it("handles boundary values precisely", () => {
    expect(scoreToVerdict(69)).toBe("good");
    expect(scoreToVerdict(70)).toBe("top");
    expect(scoreToVerdict(44)).toBe("ok");
    expect(scoreToVerdict(45)).toBe("good");
    expect(scoreToVerdict(19)).toBe("bad");
    expect(scoreToVerdict(20)).toBe("ok");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 9. scoreForDay — integrated scoring with all components
// ─────────────────────────────────────────────────────────────────────────
describe("scoreForDay", () => {
  // A helper to build a minimal station object
  const makeStation = (overrides = {}) => ({
    imisCode: "TEST",
    snowBase: 0,
    fresh72: 0,
    operational: { pistesOpen: 0 },
    ...overrides,
  });

  const makeForecast = (overrides = {}) => ({
    sunshineHours: 0,
    windMax: 0,
    jourBlancIndex: 0,
    ...overrides,
  });

  it("returns score clamped between 0 and 100", () => {
    // Everything at zero except pistes fallback (1pt) minus potential crowd
    const result = scoreForDay(
      makeStation(),
      null,
      makeForecast(),
      "2026-06-15", // Monday in summer, no crowd
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("never exceeds 100 even with maximum positive inputs", () => {
    const result = scoreForDay(
      makeStation({ snowBase: 200, fresh72: 100, operational: { pistesOpen: 200 } }),
      null,
      makeForecast({ sunshineHours: 12 }),
      "2026-06-15",
    );
    expect(result.score).toBeLessThanOrEqual(100);
    // max = 35 + 30 + 20 + 15 = 100, clamped at 100
    expect(result.score).toBe(100);
  });

  it("never goes below 0 even with maximum penalties", () => {
    const result = scoreForDay(
      makeStation(),
      null,
      makeForecast({ jourBlancIndex: 10, windMax: 100 }),
      "2025-12-25", // Peak period: crowd=15
    );
    expect(result.score).toBe(0);
  });

  it("uses live snow data over static station data", () => {
    const station = makeStation({ imisCode: "SAA2", snowBase: 50, fresh72: 5 });
    const snowData = {
      stations: {
        SAA2: { snowDepth: 200, fresh72h: 60 },
      },
    };
    const result = scoreForDay(station, snowData, makeForecast(), "2026-06-15");

    // Should use snowDepth=200 (→ 20pts) and fresh72h=60 (→ 30pts) from live data
    expect(result.breakdown.depth.value).toBe(200);
    expect(result.breakdown.fresh.value).toBe(60);
    expect(result.breakdown.depth.pts).toBe(20);
    expect(result.breakdown.fresh.pts).toBe(30);
  });

  it("falls back to static station data when snow data is missing", () => {
    const station = makeStation({ snowBase: 80, fresh72: 20 });
    const result = scoreForDay(station, null, makeForecast(), "2026-06-15");

    expect(result.breakdown.depth.value).toBe(80);
    expect(result.breakdown.fresh.value).toBe(20);
  });

  it("uses fallbackSun when no forecast provided", () => {
    const result = scoreForDay(
      makeStation(),
      null,
      null,
      null,
      6, // fallbackSun = 6h
    );
    expect(result.breakdown.sun.value).toBe(6);
    expect(result.breakdown.sun.pts).toBe(28);
  });

  it("returns verdict key matching the score", () => {
    // Perfect day: lots of sun, snow, no penalties
    const result = scoreForDay(
      makeStation({ snowBase: 200, fresh72: 60, operational: { pistesOpen: 120 } }),
      null,
      makeForecast({ sunshineHours: 10 }),
      "2026-06-15",
    );
    expect(result.verdict).toBe("top");
    expect(result.score).toBe(100);
  });

  it("includes complete breakdown with all 7 components", () => {
    const result = scoreForDay(
      makeStation({ operational: { pistesOpen: 50 } }),
      null,
      makeForecast({ sunshineHours: 5, windMax: 30, jourBlancIndex: 2 }),
      "2026-06-15",
    );
    expect(result.breakdown).toHaveProperty("sun");
    expect(result.breakdown).toHaveProperty("fresh");
    expect(result.breakdown).toHaveProperty("depth");
    expect(result.breakdown).toHaveProperty("pistes");
    expect(result.breakdown).toHaveProperty("jourBlanc");
    expect(result.breakdown).toHaveProperty("wind");
    expect(result.breakdown).toHaveProperty("crowd");

    // Each breakdown entry has pts + value + unit
    for (const key of ["sun", "fresh", "depth", "pistes", "jourBlanc", "wind", "crowd"]) {
      expect(result.breakdown[key]).toHaveProperty("pts");
      expect(result.breakdown[key]).toHaveProperty("value");
      expect(result.breakdown[key]).toHaveProperty("unit");
    }
  });

  it("score equals sum of all breakdown pts, clamped to [0,100]", () => {
    const result = scoreForDay(
      makeStation({ snowBase: 80, fresh72: 10, operational: { pistesOpen: 40 } }),
      null,
      makeForecast({ sunshineHours: 3, windMax: 50, jourBlancIndex: 4 }),
      "2026-06-15",
    );

    const rawSum =
      result.breakdown.sun.pts +
      result.breakdown.fresh.pts +
      result.breakdown.depth.pts +
      result.breakdown.pistes.pts +
      result.breakdown.jourBlanc.pts +
      result.breakdown.wind.pts +
      result.breakdown.crowd.pts;

    expect(result.score).toBe(Math.max(0, Math.min(100, rawSum)));
  });

  it("handles undefined/null values in forecast gracefully", () => {
    const result = scoreForDay(
      makeStation({ operational: { pistesOpen: 10 } }),
      null,
      { sunshineHours: undefined, windMax: null, jourBlancIndex: undefined },
      "2026-06-15",
    );
    // sunshineHours=undefined → 0, windMax=null → 0, jbi=undefined → 0
    expect(result.breakdown.sun.pts).toBe(0);
    expect(result.breakdown.wind.pts).toBe(0);
    expect(result.breakdown.jourBlanc.pts).toBe(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 10. Realistic scoring scenarios
// ─────────────────────────────────────────────────────────────────────────
describe("realistic scoring scenarios", () => {
  const makeStation = (overrides = {}) => ({
    imisCode: "TEST",
    snowBase: 0,
    fresh72: 0,
    operational: { pistesOpen: 0 },
    ...overrides,
  });

  const makeForecast = (overrides = {}) => ({
    sunshineHours: 0,
    windMax: 0,
    jourBlancIndex: 0,
    ...overrides,
  });

  it("perfect powder day: Excellent verdict", () => {
    // Sun=8h(35) + Fresh=50cm(30) + Depth=150(20) + Pistes=100km(15) = 100
    const result = scoreForDay(
      makeStation({ snowBase: 150, fresh72: 50, operational: { pistesOpen: 100 } }),
      null,
      makeForecast({ sunshineHours: 8 }),
      "2026-06-15",
    );
    expect(result.score).toBe(100);
    expect(result.verdict).toBe("top");
  });

  it("whiteout storm day: Difficile verdict", () => {
    // Sun=0(0) + Fresh=0(0) + Depth=20(0) + Pistes=5km(1) + JBI=9(-30) + Wind=90(-20) = -49 → 0
    const result = scoreForDay(
      makeStation({ snowBase: 20, operational: { pistesOpen: 5 } }),
      null,
      makeForecast({ jourBlancIndex: 9, windMax: 90 }),
      "2026-06-15",
    );
    expect(result.score).toBe(0);
    expect(result.verdict).toBe("bad");
  });

  it("decent spring day: Bon verdict", () => {
    // Sun=6h(28) + Fresh=5cm(10) + Depth=80(12) + Pistes=40km(8) - Wind=30(-3) - JBI=1(-5) = 50
    const result = scoreForDay(
      makeStation({ snowBase: 80, fresh72: 5, operational: { pistesOpen: 40 } }),
      null,
      makeForecast({ sunshineHours: 6, windMax: 30, jourBlancIndex: 1 }),
      "2026-06-15",
    );
    expect(result.score).toBe(50);
    expect(result.verdict).toBe("good");
  });

  it("mediocre day with crowd: Correct verdict", () => {
    // Sun=2h(12) + Fresh=1cm(4) + Depth=30(6) + Pistes=15km(4) = 26
    // On a weekday in summer → crowd = 0 → score = 26
    const result = scoreForDay(
      makeStation({ snowBase: 30, fresh72: 1, operational: { pistesOpen: 15 } }),
      null,
      makeForecast({ sunshineHours: 2 }),
      "2026-06-15", // Monday in summer
    );
    expect(result.score).toBe(26);
    expect(result.verdict).toBe("ok");
  });
});
