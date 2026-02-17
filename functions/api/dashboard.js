import { corsJson } from "./_helpers.js";
import { fetchWeatherData } from "./_fetchWeather.js";
import { fetchSnowData } from "./_fetchSnow.js";
import { fetchAvalancheData } from "./_fetchAvalanche.js";

const KV_KEY = "dashboard:all";
const KV_TTL = 7200;            // 2h — generous; logic handles freshness
const FULL_REFRESH_AGE = 3600;   // 1h — triggers full refresh
const STALE_AGE = 3300;          // 55min — proactive background refresh
const RETRY_INTERVAL = 600;      // 10min — retry failed sources

// ── Source fetchers (sequential, generous timeouts) ─────────────────────

const SOURCE_FETCHERS = {
  weather:   () => fetchWeatherData({ timeout: 20000, retries: 2 }),
  snow:      () => fetchSnowData({ timeout: 8000 }),
  avalanche: () => fetchAvalancheData({ timeout: 10000, retries: 2 }),
};

async function fetchSource(name) {
  const t0 = Date.now();
  try {
    const data = await SOURCE_FETCHERS[name]();
    return { ok: true, fetchedAt: new Date().toISOString(), ms: Date.now() - t0, data };
  } catch (e) {
    return { ok: false, error: e?.message || "Unknown error", ms: Date.now() - t0, data: null };
  }
}

// ── Full refresh: fetch all 3 sources sequentially ──────────────────────

async function fullRefresh(env) {
  const results = {};
  // Sequential: weather → snow → avalanche
  for (const name of ["weather", "snow", "avalanche"]) {
    results[name] = await fetchSource(name);
  }

  const complete = Object.values(results).every(r => r.ok);

  const dashboard = {
    fetchedAt: new Date().toISOString(),
    complete,
    nextRetryAfter: complete ? null : new Date(Date.now() + RETRY_INTERVAL * 1000).toISOString(),
    sources: Object.fromEntries(
      Object.entries(results).map(([k, v]) => [k, { ok: v.ok, fetchedAt: v.fetchedAt, error: v.error || null }])
    ),
    weather: results.weather.data,
    snow: results.snow.data,
    avalanche: results.avalanche.data,
  };

  try {
    await env.CACHE_KV.put(KV_KEY, JSON.stringify(dashboard), { expirationTtl: KV_TTL });
  } catch { /* KV unavailable in dev */ }

  return dashboard;
}

// ── Partial retry: re-fetch only failed sources, merge into cache ───────

async function retryFailed(env, cached) {
  const failedNames = Object.entries(cached.sources)
    .filter(([, s]) => !s.ok)
    .map(([k]) => k);

  if (failedNames.length === 0) return;

  let changed = false;

  // Sequential retry of failed sources only
  for (const name of failedNames) {
    const result = await fetchSource(name);
    if (result.ok) {
      cached[name] = result.data;
      cached.sources[name] = { ok: true, fetchedAt: result.fetchedAt, error: null };
      changed = true;
    }
  }

  cached.complete = Object.values(cached.sources).every(s => s.ok);
  cached.nextRetryAfter = cached.complete
    ? null
    : new Date(Date.now() + RETRY_INTERVAL * 1000).toISOString();

  if (changed) {
    try {
      await env.CACHE_KV.put(KV_KEY, JSON.stringify(cached), { expirationTtl: KV_TTL });
    } catch { /* KV unavailable */ }
  }
}

// ── Endpoint ────────────────────────────────────────────────────────────

export async function onRequestGet(context) {
  const { env, waitUntil } = context;

  // 1. Read existing cache
  let cached = null;
  try {
    cached = await env.CACHE_KV.get(KV_KEY, "json");
  } catch { /* KV unavailable */ }

  if (cached) {
    const ageS = (Date.now() - new Date(cached.fetchedAt).getTime()) / 1000;
    const needsFullRefresh = ageS >= STALE_AGE;
    const needsRetry = !cached.complete
      && cached.nextRetryAfter
      && Date.now() >= new Date(cached.nextRetryAfter).getTime();

    if (needsFullRefresh) {
      // Stale: return cached immediately, full refresh in background
      waitUntil(fullRefresh(env));
      return corsJson(cached);
    }

    if (needsRetry) {
      // Incomplete + retry interval passed: return cached, retry failed in background
      // Optimistically bump nextRetryAfter to prevent duplicate retries
      cached.nextRetryAfter = new Date(Date.now() + RETRY_INTERVAL * 1000).toISOString();
      waitUntil(retryFailed(env, structuredClone(cached)));
      return corsJson(cached);
    }

    // Fresh (or incomplete but not yet time to retry) → return as-is
    return corsJson(cached);
  }

  // 2. No cache at all → synchronous full refresh (cold start)
  const dashboard = await fullRefresh(env);
  return corsJson(dashboard);
}
