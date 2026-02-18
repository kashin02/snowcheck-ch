import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock all external dependencies ──────────────────────────────────────
vi.mock("../functions/api/_helpers.js", () => ({
  corsJson: vi.fn((data, status = 200) => ({
    _type: "Response",
    _data: data,
    _status: status,
  })),
  sourceGet: vi.fn(),
  sourcePut: vi.fn(),
  logFetch: vi.fn(),
}));

vi.mock("../functions/api/_fetchWeather.js", () => ({
  fetchWeatherData: vi.fn(),
}));

vi.mock("../functions/api/_fetchSnow.js", () => ({
  fetchSnowData: vi.fn(),
}));

vi.mock("../functions/api/_fetchAvalanche.js", () => ({
  fetchAvalancheData: vi.fn(),
}));

import {
  onRequestGet,
  SOURCES,
  assembleDashboard,
  ageSeconds,
  isStale,
  needsRetry,
} from "../functions/api/dashboard.js";
import { corsJson, sourceGet, sourcePut } from "../functions/api/_helpers.js";
import { fetchWeatherData } from "../functions/api/_fetchWeather.js";
import { fetchSnowData } from "../functions/api/_fetchSnow.js";
import { fetchAvalancheData } from "../functions/api/_fetchAvalanche.js";

beforeEach(() => {
  vi.resetAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────
// 1. SOURCES configuration
// ─────────────────────────────────────────────────────────────────────────
describe("SOURCES configuration", () => {
  it("defines weather, snow, avalanche sources", () => {
    expect(SOURCES).toHaveProperty("weather");
    expect(SOURCES).toHaveProperty("snow");
    expect(SOURCES).toHaveProperty("avalanche");
  });

  it("weather has correct config", () => {
    expect(SOURCES.weather).toEqual({
      kvKey: "src:weather",
      kvTtl: 21600,
      staleAge: 10800,
      retryInterval: 3600,
    });
  });

  it("snow has shorter cache/stale times", () => {
    expect(SOURCES.snow.kvTtl).toBe(3600);       // 1h
    expect(SOURCES.snow.staleAge).toBe(1200);     // 20min
    expect(SOURCES.snow.retryInterval).toBe(300); // 5min
  });

  it("avalanche has correct config", () => {
    expect(SOURCES.avalanche).toEqual({
      kvKey: "src:avalanche",
      kvTtl: 7200,
      staleAge: 3300,
      retryInterval: 600,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. ageSeconds
// ─────────────────────────────────────────────────────────────────────────
describe("ageSeconds", () => {
  it("returns Infinity for null entry", () => {
    expect(ageSeconds(null)).toBe(Infinity);
  });

  it("returns Infinity for entry without fetchedAt", () => {
    expect(ageSeconds({ ok: true })).toBe(Infinity);
  });

  it("returns approximate elapsed seconds for valid fetchedAt", () => {
    const fiveMinAgo = new Date(Date.now() - 300000).toISOString();
    const age = ageSeconds({ fetchedAt: fiveMinAgo });
    expect(age).toBeGreaterThanOrEqual(299);
    expect(age).toBeLessThanOrEqual(302);
  });

  it("returns ~0 for just-now timestamp", () => {
    const now = new Date().toISOString();
    const age = ageSeconds({ fetchedAt: now });
    expect(age).toBeGreaterThanOrEqual(0);
    expect(age).toBeLessThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. isStale
// ─────────────────────────────────────────────────────────────────────────
describe("isStale", () => {
  it("returns true when age >= staleAge", () => {
    const old = { fetchedAt: new Date(Date.now() - 11000000).toISOString() }; // 11000s > 10800
    expect(isStale(old, SOURCES.weather)).toBe(true); // staleAge = 10800
  });

  it("returns false when age < staleAge", () => {
    const fresh = { fetchedAt: new Date(Date.now() - 60000).toISOString() }; // 60s
    expect(isStale(fresh, SOURCES.weather)).toBe(false);
  });

  it("returns true for null entry (Infinity age)", () => {
    expect(isStale(null, SOURCES.weather)).toBe(true);
  });

  it("snow has shorter stale window (1200s)", () => {
    const borderline = { fetchedAt: new Date(Date.now() - 1250000).toISOString() };
    expect(isStale(borderline, SOURCES.snow)).toBe(true);

    const fresh = { fetchedAt: new Date(Date.now() - 1100000).toISOString() };
    expect(isStale(fresh, SOURCES.snow)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. needsRetry
// ─────────────────────────────────────────────────────────────────────────
describe("needsRetry", () => {
  it("returns false for null entry", () => {
    expect(needsRetry(null, SOURCES.weather)).toBe(false);
  });

  it("returns false for successful entry", () => {
    expect(needsRetry({ ok: true }, SOURCES.weather)).toBe(false);
  });

  it("returns true for failed entry without lastFailAt", () => {
    expect(needsRetry({ ok: false }, SOURCES.weather)).toBe(true);
  });

  it("returns true when retry interval has elapsed", () => {
    const failed = {
      ok: false,
      lastFailAt: new Date(Date.now() - 3700000).toISOString(), // 3700s > 3600s retryInterval
    };
    expect(needsRetry(failed, SOURCES.weather)).toBe(true);
  });

  it("returns false when retry interval has NOT elapsed", () => {
    const failed = {
      ok: false,
      lastFailAt: new Date(Date.now() - 100000).toISOString(), // 100s < 3600s
    };
    expect(needsRetry(failed, SOURCES.weather)).toBe(false);
  });

  it("snow has shorter retry interval (300s)", () => {
    const failed = {
      ok: false,
      lastFailAt: new Date(Date.now() - 350000).toISOString(), // 350s > 300s
    };
    expect(needsRetry(failed, SOURCES.snow)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. assembleDashboard
// ─────────────────────────────────────────────────────────────────────────
describe("assembleDashboard", () => {
  it("returns complete=true when all sources ok", () => {
    const sources = {
      weather:   { ok: true, fetchedAt: "2026-01-15T10:00:00Z", data: { stations: {} } },
      snow:      { ok: true, fetchedAt: "2026-01-15T10:00:00Z", data: { stations: {} } },
      avalanche: { ok: true, fetchedAt: "2026-01-15T10:00:00Z", data: { maxDanger: 2, regions: {} } },
    };
    const result = assembleDashboard(sources);

    expect(result.complete).toBe(true);
    expect(result.fetchedAt).toBeTruthy();
    expect(result.weather).toEqual({ stations: {} });
    expect(result.snow).toEqual({ stations: {} });
    expect(result.avalanche).toEqual({ maxDanger: 2, regions: {} });
  });

  it("returns complete=false when any source failed", () => {
    const sources = {
      weather:   { ok: true, fetchedAt: "2026-01-15T10:00:00Z", data: {} },
      snow:      { ok: false, error: "timeout", data: null },
      avalanche: { ok: true, fetchedAt: "2026-01-15T10:00:00Z", data: {} },
    };
    const result = assembleDashboard(sources);

    expect(result.complete).toBe(false);
    expect(result.snow).toBe(null);
  });

  it("includes per-source status", () => {
    const sources = {
      weather:   { ok: true, fetchedAt: "2026-01-15T10:00:00Z", data: {} },
      snow:      { ok: false, error: "Network error", fetchedAt: "2026-01-15T09:30:00Z", data: null },
      avalanche: { ok: true, fetchedAt: "2026-01-15T10:00:00Z", data: {} },
    };
    const result = assembleDashboard(sources);

    expect(result.sources.weather).toEqual({ ok: true, fetchedAt: "2026-01-15T10:00:00Z", error: null });
    expect(result.sources.snow).toEqual({ ok: false, fetchedAt: "2026-01-15T09:30:00Z", error: "Network error" });
    expect(result.sources.avalanche).toEqual({ ok: true, fetchedAt: "2026-01-15T10:00:00Z", error: null });
  });

  it("handles null source entries", () => {
    const sources = {
      weather:   null,
      snow:      null,
      avalanche: null,
    };
    const result = assembleDashboard(sources);

    expect(result.complete).toBe(false);
    expect(result.weather).toBe(null);
    expect(result.snow).toBe(null);
    expect(result.avalanche).toBe(null);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. onRequestGet — integration tests
// ─────────────────────────────────────────────────────────────────────────
const makeContext = () => ({
  env: { CACHE_KV: {} },
  waitUntil: vi.fn(),
});

describe("onRequestGet", () => {

  const freshWeatherEntry = {
    ok: true,
    fetchedAt: new Date(Date.now() - 60000).toISOString(), // 1 min ago
    data: { stations: { verbier: { forecast: [] } } },
  };

  const freshSnowEntry = {
    ok: true,
    fetchedAt: new Date(Date.now() - 60000).toISOString(),
    data: { stations: { SAA2: { snowDepth: 120 } } },
  };

  const freshAvalancheEntry = {
    ok: true,
    fetchedAt: new Date(Date.now() - 60000).toISOString(),
    data: { maxDanger: 2, regions: {} },
  };

  describe("all data fresh in cache", () => {
    it("returns cached data without fetching", async () => {
      sourceGet
        .mockResolvedValueOnce(freshWeatherEntry)
        .mockResolvedValueOnce(freshSnowEntry)
        .mockResolvedValueOnce(freshAvalancheEntry);

      const ctx = makeContext();
      await onRequestGet(ctx);

      // No fetchers should have been called
      expect(fetchWeatherData).not.toHaveBeenCalled();
      expect(fetchSnowData).not.toHaveBeenCalled();
      expect(fetchAvalancheData).not.toHaveBeenCalled();

      // No background refresh needed
      expect(ctx.waitUntil).not.toHaveBeenCalled();

      // corsJson called with assembled dashboard
      expect(corsJson).toHaveBeenCalledTimes(1);
      const dashData = corsJson.mock.calls[0][0];
      expect(dashData.complete).toBe(true);
      expect(dashData.weather.stations.verbier).toBeTruthy();
    });
  });

  describe("cold start (no cache)", () => {
    it("fetches all sources synchronously", async () => {
      // All sourceGet return null (empty cache)
      sourceGet.mockResolvedValue(null);

      // Mock fetchers
      fetchWeatherData.mockResolvedValue({ stations: {} });
      fetchSnowData.mockResolvedValue({ stations: {} });
      fetchAvalancheData.mockResolvedValue({ maxDanger: 1, regions: {} });

      const ctx = makeContext();
      await onRequestGet(ctx);

      // All 3 fetchers should have been called
      expect(fetchWeatherData).toHaveBeenCalledTimes(1);
      expect(fetchSnowData).toHaveBeenCalledTimes(1);
      expect(fetchAvalancheData).toHaveBeenCalledTimes(1);

      // Cold start uses shorter timeouts
      expect(fetchWeatherData).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 8000, retries: 0 }),
      );
      expect(fetchSnowData).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 4000 }),
      );
      expect(fetchAvalancheData).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 4000, retries: 0 }),
      );

      // Data persisted to KV
      expect(sourcePut).toHaveBeenCalledTimes(3);

      // No background refresh (it was a synchronous cold fetch)
      expect(ctx.waitUntil).not.toHaveBeenCalled();
    });
  });

  describe("stale data", () => {
    it("returns cached immediately and triggers background refresh", async () => {
      const staleWeather = {
        ...freshWeatherEntry,
        fetchedAt: new Date(Date.now() - 11000000).toISOString(), // 11000s > 10800 staleAge
      };

      sourceGet
        .mockResolvedValueOnce(staleWeather)       // weather: stale
        .mockResolvedValueOnce(freshSnowEntry)      // snow: fresh
        .mockResolvedValueOnce(freshAvalancheEntry); // avalanche: fresh

      // Mock for background refresh
      fetchWeatherData.mockResolvedValue({ stations: {} });

      const ctx = makeContext();
      await onRequestGet(ctx);

      // Should NOT have fetched synchronously
      // But should have triggered waitUntil for weather
      expect(ctx.waitUntil).toHaveBeenCalledTimes(1);

      // corsJson returns the stale data immediately
      expect(corsJson).toHaveBeenCalledTimes(1);
      const dashData = corsJson.mock.calls[0][0];
      expect(dashData.weather).toBeTruthy();
    });
  });

  describe("failed source within retry interval", () => {
    it("returns old data without retrying", async () => {
      const failedSnow = {
        ok: false,
        error: "timeout",
        fetchedAt: new Date(Date.now() - 60000).toISOString(),
        lastFailAt: new Date(Date.now() - 100000).toISOString(), // 100s < 300s retryInterval
        data: { stations: { SAA2: { snowDepth: 90 } } },
      };

      sourceGet
        .mockResolvedValueOnce(freshWeatherEntry)
        .mockResolvedValueOnce(failedSnow)
        .mockResolvedValueOnce(freshAvalancheEntry);

      const ctx = makeContext();
      await onRequestGet(ctx);

      // Snow should NOT be retried (within retry interval)
      expect(fetchSnowData).not.toHaveBeenCalled();
      expect(ctx.waitUntil).not.toHaveBeenCalled();

      // Dashboard returns with failed snow (old data)
      const dashData = corsJson.mock.calls[0][0];
      expect(dashData.complete).toBe(false);
      expect(dashData.sources.snow.ok).toBe(false);
    });
  });

  describe("failed source after retry interval", () => {
    it("returns old data and triggers background retry", async () => {
      const failedSnow = {
        ok: false,
        error: "timeout",
        fetchedAt: new Date(Date.now() - 60000).toISOString(),
        lastFailAt: new Date(Date.now() - 400000).toISOString(), // 400s > 300s retryInterval
        data: { stations: { SAA2: { snowDepth: 90 } } },
      };

      sourceGet
        .mockResolvedValueOnce(freshWeatherEntry)
        .mockResolvedValueOnce(failedSnow)
        .mockResolvedValueOnce(freshAvalancheEntry);

      // Mock for background retry
      fetchSnowData.mockResolvedValue({ stations: {} });

      const ctx = makeContext();
      await onRequestGet(ctx);

      // Background retry should be triggered
      expect(ctx.waitUntil).toHaveBeenCalledTimes(1);

      // Dashboard returns immediately with old data
      const dashData = corsJson.mock.calls[0][0];
      expect(dashData.snow.stations.SAA2.snowDepth).toBe(90);
    });
  });

  describe("partial cold start", () => {
    it("fetches only missing sources synchronously", async () => {
      sourceGet
        .mockResolvedValueOnce(freshWeatherEntry)  // weather: cached
        .mockResolvedValueOnce(null)                // snow: missing
        .mockResolvedValueOnce(freshAvalancheEntry); // avalanche: cached

      fetchSnowData.mockResolvedValue({ stations: {} });

      const ctx = makeContext();
      await onRequestGet(ctx);

      // Only snow should be fetched
      expect(fetchWeatherData).not.toHaveBeenCalled();
      expect(fetchSnowData).toHaveBeenCalledTimes(1);
      expect(fetchAvalancheData).not.toHaveBeenCalled();

      // Snow fetched with cold start timeouts
      expect(fetchSnowData).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 4000 }),
      );
    });
  });

  describe("mixed stale + retryable", () => {
    it("triggers background refresh for both stale and retryable sources", async () => {
      const staleWeather = {
        ...freshWeatherEntry,
        fetchedAt: new Date(Date.now() - 11000000).toISOString(), // very stale
      };
      const retryableAvalanche = {
        ok: false,
        lastFailAt: new Date(Date.now() - 700000).toISOString(), // > 600s avalanche retryInterval
        data: null,
      };

      sourceGet
        .mockResolvedValueOnce(staleWeather)
        .mockResolvedValueOnce(freshSnowEntry)
        .mockResolvedValueOnce(retryableAvalanche);

      fetchWeatherData.mockResolvedValue({ stations: {} });
      fetchAvalancheData.mockResolvedValue({ maxDanger: 1, regions: {} });

      const ctx = makeContext();
      await onRequestGet(ctx);

      // Both weather (stale) and avalanche (retryable) in background
      expect(ctx.waitUntil).toHaveBeenCalledTimes(1);

      // Returns immediately with whatever we have
      expect(corsJson).toHaveBeenCalledTimes(1);
    });
  });

  describe("cold fetch failure", () => {
    it("returns error entry when cold fetch fails", async () => {
      sourceGet.mockResolvedValue(null);

      fetchWeatherData.mockRejectedValue(new Error("API down"));
      fetchSnowData.mockRejectedValue(new Error("timeout"));
      fetchAvalancheData.mockRejectedValue(new Error("500"));

      const ctx = makeContext();
      await onRequestGet(ctx);

      // All sources were attempted
      expect(fetchWeatherData).toHaveBeenCalledTimes(1);
      expect(fetchSnowData).toHaveBeenCalledTimes(1);
      expect(fetchAvalancheData).toHaveBeenCalledTimes(1);

      // sourcePut should store the error entries
      expect(sourcePut).toHaveBeenCalledTimes(3);

      // Dashboard should reflect failure
      const dashData = corsJson.mock.calls[0][0];
      expect(dashData.complete).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7. refreshSource — saves to KV
// ─────────────────────────────────────────────────────────────────────────
describe("refreshSource", () => {
  // Import refreshSource for direct testing
  // It's already imported above via the module exports

  // We can't easily test refreshSource directly without re-importing,
  // but we verify its behavior through onRequestGet above:
  // - On success: stores { ok: true, fetchedAt, ms, data }
  // - On failure: stores { ok: false, error, fetchedAt, lastFailAt, ms, data: cached }
  // - Always calls sourcePut with correct KV key and TTL

  it("verifies sourcePut receives correct TTL for each source", async () => {
    sourceGet.mockResolvedValue(null);
    fetchWeatherData.mockResolvedValue({ stations: {} });
    fetchSnowData.mockResolvedValue({ stations: {} });
    fetchAvalancheData.mockResolvedValue({ maxDanger: 1, regions: {} });

    await onRequestGet(makeContext());

    // Check TTLs passed to sourcePut
    const putCalls = sourcePut.mock.calls;
    expect(putCalls).toHaveLength(3);

    // Find each source's put call by KV key
    const weatherPut = putCalls.find(c => c[1] === "src:weather");
    const snowPut = putCalls.find(c => c[1] === "src:snow");
    const avalanchePut = putCalls.find(c => c[1] === "src:avalanche");

    expect(weatherPut[3]).toBe(21600);  // kvTtl
    expect(snowPut[3]).toBe(3600);
    expect(avalanchePut[3]).toBe(7200);
  });

  it("verifies success entry shape", async () => {
    sourceGet.mockResolvedValue(null);
    fetchWeatherData.mockResolvedValue({ stations: { test: 1 } });
    fetchSnowData.mockResolvedValue({ stations: {} });
    fetchAvalancheData.mockResolvedValue({ maxDanger: 1, regions: {} });

    await onRequestGet(makeContext());

    const weatherPut = sourcePut.mock.calls.find(c => c[1] === "src:weather");
    const entry = weatherPut[2]; // data argument

    expect(entry.ok).toBe(true);
    expect(entry.fetchedAt).toBeTruthy();
    expect(entry.ms).toBeGreaterThanOrEqual(0);
    expect(entry.data).toEqual({ stations: { test: 1 } });
  });

  it("verifies failure entry preserves cached data", async () => {
    sourceGet.mockResolvedValue(null);
    fetchWeatherData.mockRejectedValue(new Error("boom"));
    fetchSnowData.mockResolvedValue({ stations: {} });
    fetchAvalancheData.mockResolvedValue({ maxDanger: 1, regions: {} });

    await onRequestGet(makeContext());

    const weatherPut = sourcePut.mock.calls.find(c => c[1] === "src:weather");
    const entry = weatherPut[2];

    expect(entry.ok).toBe(false);
    expect(entry.error).toBe("boom");
    expect(entry.lastFailAt).toBeTruthy();
    expect(entry.data).toBe(null); // no cached data on cold start
  });
});
