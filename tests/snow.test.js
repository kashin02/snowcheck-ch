import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the fetchRetry helper before importing the module under test
vi.mock("../functions/api/_helpers.js", () => ({
  fetchRetry: vi.fn(),
}));

import { fetchSnowData } from "../functions/api/_fetchSnow.js";
import { fetchRetry } from "../functions/api/_helpers.js";

// The 21 IMIS station codes in source order
const IMIS_CODES = [
  "SAA2", "ANV3", "DIA2", "CHA2", "ANZ2",
  "CHX2", "STL2", "ARO2", "LAU2", "GUT2",
  "CHA3", "SRB2", "MEL2", "MUN2", "JAU2",
  "MOL2", "PLI2", "BER2", "BEL2", "EVO2", "SIM2",
];

// ── Helper: build a mock SLF IMIS API response ──────────────────────────
function makeMeasurements({ currentHS = 120, oldHS = 100, temp = -5, wind = 15 } = {}) {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 72 * 3600 * 1000);
  return [
    { measurementDate: threeDaysAgo.toISOString(), HS: oldHS, TA: temp - 2, VW: wind, DW: 270, ISWR: 50, RH: 85 },
    { measurementDate: now.toISOString(), HS: currentHS, TA: temp, VW: wind, DW: 180, ISWR: 100, RH: 75 },
  ];
}

function mockFetchSuccess(data) {
  fetchRetry.mockResolvedValueOnce({
    json: () => Promise.resolve(data),
  });
}

function mockFetchFailure() {
  fetchRetry.mockRejectedValueOnce(new Error("Network error"));
}

function mockAllStationsSuccess(overrides = {}) {
  for (let i = 0; i < IMIS_CODES.length; i++) {
    mockFetchSuccess(makeMeasurements(overrides));
  }
}

// Build a full cache object with all stations having fresh data
function buildFreshCache(overrides = {}) {
  const cache = {};
  for (const code of IMIS_CODES) {
    cache[code] = {
      snowDepth: 100,
      fetchedAt: new Date(Date.now() - 60000).toISOString(), // 1 min ago = fresh
      failCount: 0,
      ...overrides,
    };
  }
  return cache;
}

// Build a full cache object with all stations having stale data (> 30min)
function buildStaleCache(overrides = {}) {
  const cache = {};
  for (const code of IMIS_CODES) {
    cache[code] = {
      snowDepth: 100,
      fetchedAt: new Date(Date.now() - 2000000).toISOString(), // very stale
      failCount: 0,
      ...overrides,
    };
  }
  return cache;
}

beforeEach(() => {
  vi.resetAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────
// 1. fresh72h calculation
// ─────────────────────────────────────────────────────────────────────────
describe("fresh72h calculation", () => {
  it("calculates fresh snow as difference between latest and oldest HS", async () => {
    mockAllStationsSuccess({ currentHS: 150, oldHS: 100 });

    const result = await fetchSnowData({ timeout: 5000 });
    expect(result.stations.SAA2.fresh72h).toBe(50); // 150 - 100
  });

  it("clamps fresh72h to 0 when snow melted", async () => {
    mockAllStationsSuccess({ currentHS: 80, oldHS: 120 });

    const result = await fetchSnowData({ timeout: 5000 });
    expect(result.stations.SAA2.fresh72h).toBe(0); // Max(0, 80-120) = 0
  });

  it("returns null fresh72h when HS is null", async () => {
    const measurements = [
      { measurementDate: new Date().toISOString(), HS: null, TA: -5 },
    ];
    for (let i = 0; i < IMIS_CODES.length; i++) {
      mockFetchSuccess(measurements);
    }

    const result = await fetchSnowData({ timeout: 5000 });
    expect(result.stations.SAA2.fresh72h).toBe(null);
  });

  it("rounds snow depth to nearest integer", async () => {
    mockAllStationsSuccess({ currentHS: 123.7, oldHS: 100.3 });

    const result = await fetchSnowData({ timeout: 5000 });
    expect(result.stations.SAA2.snowDepth).toBe(124); // Math.round(123.7)
    // fresh72h = Math.max(0, 124 - 100) = 24
    expect(result.stations.SAA2.fresh72h).toBe(24);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Station data extraction
// ─────────────────────────────────────────────────────────────────────────
describe("station data extraction", () => {
  it("extracts all measurements from latest reading", async () => {
    mockAllStationsSuccess({ currentHS: 120, temp: -5, wind: 15 });

    const result = await fetchSnowData({ timeout: 5000 });
    const station = result.stations.SAA2;

    expect(station.snowDepth).toBe(120);
    expect(station.temperature).toBe(-5);
    expect(station.windSpeed).toBe(15);
    expect(station.windDirection).toBe(180);
    expect(station.solarRadiation).toBe(100);
    expect(station.relativeHumidity).toBe(75);
    expect(station.failCount).toBe(0);
    expect(station.lastFailAt).toBe(null);
    expect(station.fetchedAt).toBeTruthy();
  });

  it("handles null values in measurements", async () => {
    const measurements = [
      { measurementDate: new Date().toISOString(), HS: 100, TA: null, VW: null, DW: null, ISWR: null, RH: null },
    ];
    for (let i = 0; i < IMIS_CODES.length; i++) {
      mockFetchSuccess(measurements);
    }

    const result = await fetchSnowData({ timeout: 5000 });
    const station = result.stations.SAA2;

    expect(station.snowDepth).toBe(100);
    expect(station.temperature).toBe(null);
    expect(station.windSpeed).toBe(null);
    expect(station.windDirection).toBe(null);
    expect(station.solarRadiation).toBe(null);
    expect(station.relativeHumidity).toBe(null);
  });

  it("returns failCount=1 for empty measurements array", async () => {
    for (let i = 0; i < IMIS_CODES.length; i++) {
      mockFetchSuccess([]);
    }

    const result = await fetchSnowData({ timeout: 5000 });
    // Stations that returned empty array get null from fetchSingleStation
    // → failure branch increments failCount
    expect(result.stations.SAA2.failCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. Circuit breaker pattern
// ─────────────────────────────────────────────────────────────────────────
describe("circuit breaker", () => {
  it("skips station after MAX_FAIL_COUNT (3) failures during cooldown", async () => {
    const cachedStations = {
      SAA2: {
        failCount: 3,
        lastFailAt: new Date().toISOString(), // just failed → within cooldown
        snowDepth: 100,
        fetchedAt: new Date(Date.now() - 60000).toISOString(),
      },
    };

    // SAA2 is skipped (circuit open). Other 20 stations have no cache → fetched
    for (let i = 0; i < 20; i++) {
      mockFetchSuccess(makeMeasurements());
    }

    const result = await fetchSnowData({ timeout: 5000, cachedStations });

    expect(result.stations.SAA2).toEqual(cachedStations.SAA2);
    expect(fetchRetry).toHaveBeenCalledTimes(20);
  });

  it("retries station after cooldown period expires (half-open)", async () => {
    const cachedStations = {
      SAA2: {
        failCount: 3,
        lastFailAt: new Date(Date.now() - 700000).toISOString(), // 700s ago (> 600s cooldown)
        snowDepth: 80,
        // fetchedAt also stale (> 1800s) so freshness check won't skip it
        fetchedAt: new Date(Date.now() - 2000000).toISOString(),
      },
    };

    // All 21 stations fetched (SAA2 cooldown expired + stale)
    for (let i = 0; i < IMIS_CODES.length; i++) {
      mockFetchSuccess(makeMeasurements({ currentHS: 130, oldHS: 80 }));
    }

    const result = await fetchSnowData({ timeout: 5000, cachedStations });

    expect(result.stations.SAA2.snowDepth).toBe(130);
    expect(result.stations.SAA2.failCount).toBe(0);
    expect(fetchRetry).toHaveBeenCalledTimes(IMIS_CODES.length);
  });

  it("increments failCount on fetch failure", async () => {
    // Only SAA2 is stale, others have no cache → all 21 fetched
    const cachedStations = {
      SAA2: {
        failCount: 1,
        snowDepth: 100,
        fetchedAt: new Date(Date.now() - 2000000).toISOString(), // very stale
      },
    };

    // SAA2 (first in IMIS_CODES) fails, others succeed
    mockFetchFailure(); // SAA2
    for (let i = 0; i < 20; i++) {
      mockFetchSuccess(makeMeasurements());
    }

    const result = await fetchSnowData({ timeout: 5000, cachedStations });

    expect(result.stations.SAA2.failCount).toBe(2);
    expect(result.stations.SAA2.lastFailAt).toBeTruthy();
    expect(result.stations.ANV3.failCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. Freshness / caching behavior
// ─────────────────────────────────────────────────────────────────────────
describe("freshness check", () => {
  it("reuses cached data if within 30min freshness window", async () => {
    const freshCached = buildFreshCache();

    const result = await fetchSnowData({ timeout: 5000, cachedStations: freshCached });

    // No fetches — all data is fresh
    expect(fetchRetry).not.toHaveBeenCalled();
    for (const code of IMIS_CODES) {
      expect(result.stations[code].snowDepth).toBe(100);
    }
  });

  it("fetches stale stations (>30min old)", async () => {
    const staleCached = buildStaleCache();

    mockAllStationsSuccess({ currentHS: 150, oldHS: 100 });

    const result = await fetchSnowData({ timeout: 5000, cachedStations: staleCached });

    expect(fetchRetry).toHaveBeenCalledTimes(IMIS_CODES.length);
    expect(result.stations.SAA2.snowDepth).toBe(150);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. Partial success handling
// ─────────────────────────────────────────────────────────────────────────
describe("partial success", () => {
  it("returns successful stations even if some fail", async () => {
    // SAA2 (first) fails, rest succeed
    mockFetchFailure();
    for (let i = 0; i < 20; i++) {
      mockFetchSuccess(makeMeasurements());
    }

    const result = await fetchSnowData({ timeout: 5000 });

    expect(Object.keys(result.stations).length).toBe(IMIS_CODES.length);
    // Failed station: fetchSingleStation throws → caught → null → failure branch
    expect(result.stations.SAA2.failCount).toBe(1);
    // Successful stations
    expect(result.stations.ANV3.failCount).toBe(0);
    expect(result.stations.ANV3.snowDepth).toBe(120);
  });

  it("all stations returning empty arrays results in all failCount=1", async () => {
    // Empty arrays → fetchSingleStation returns null → failure branch
    for (let i = 0; i < IMIS_CODES.length; i++) {
      mockFetchSuccess([]);
    }

    const result = await fetchSnowData({ timeout: 5000 });
    expect(Object.keys(result.stations).length).toBe(IMIS_CODES.length);
    for (const station of Object.values(result.stations)) {
      expect(station.failCount).toBe(1);
    }
  });

  it("preserves cached data on failure", async () => {
    const cachedStations = {
      SAA2: {
        snowDepth: 90,
        fresh72h: 10,
        temperature: -3,
        fetchedAt: new Date(Date.now() - 2000000).toISOString(), // stale
        failCount: 0,
      },
    };

    // SAA2 fails, others succeed
    mockFetchFailure();
    for (let i = 0; i < 20; i++) {
      mockFetchSuccess(makeMeasurements());
    }

    const result = await fetchSnowData({ timeout: 5000, cachedStations });

    expect(result.stations.SAA2.snowDepth).toBe(90);
    expect(result.stations.SAA2.fresh72h).toBe(10);
    expect(result.stations.SAA2.failCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. Edge cases
// ─────────────────────────────────────────────────────────────────────────
describe("edge cases", () => {
  it("handles no cached stations (cold start)", async () => {
    mockAllStationsSuccess();

    const result = await fetchSnowData({ timeout: 5000 });
    expect(Object.keys(result.stations).length).toBe(IMIS_CODES.length);
  });

  it("handles single measurement (no old reading for fresh72h)", async () => {
    const singleMeasurement = [
      { measurementDate: new Date().toISOString(), HS: 100, TA: -5, VW: 10, DW: 180, ISWR: 50, RH: 70 },
    ];
    for (let i = 0; i < IMIS_CODES.length; i++) {
      mockFetchSuccess(singleMeasurement);
    }

    const result = await fetchSnowData({ timeout: 5000 });
    // Single measurement: latest = oldest → fresh72h = max(0, 100-100) = 0
    expect(result.stations.SAA2.snowDepth).toBe(100);
    expect(result.stations.SAA2.fresh72h).toBe(0);
  });

  it("rounds temperature to 1 decimal", async () => {
    const measurements = [
      { measurementDate: new Date().toISOString(), HS: 100, TA: -3.456, VW: 12.789, DW: 180.4, ISWR: 45.6, RH: 72.3 },
    ];
    for (let i = 0; i < IMIS_CODES.length; i++) {
      mockFetchSuccess(measurements);
    }

    const result = await fetchSnowData({ timeout: 5000 });
    const station = result.stations.SAA2;
    expect(station.temperature).toBe(-3.5);
    expect(station.windSpeed).toBe(12.8);
    expect(station.windDirection).toBe(180);
    expect(station.solarRadiation).toBe(46);
    expect(station.relativeHumidity).toBe(72);
  });
});
