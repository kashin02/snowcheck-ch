import { corsJson, sourceGet, sourcePut } from "./_helpers.js";
import { fetchWeatherData } from "./_fetchWeather.js";
import { fetchSnowData } from "./_fetchSnow.js";
import { fetchAvalancheData } from "./_fetchAvalanche.js";

// ── Per-source configuration ────────────────────────────────────────────
//  kvTtl:         hard expiry in KV (generous — logic handles freshness)
//  staleAge:      triggers background refresh (stale-while-revalidate)
//  retryInterval: wait before retrying a failed source

const SOURCES = {
  weather:   { kvKey: "src:weather",   kvTtl: 7200, staleAge: 3300, retryInterval: 600 },
  snow:      { kvKey: "src:snow",      kvTtl: 3600, staleAge: 1200, retryInterval: 300 },
  avalanche: { kvKey: "src:avalanche", kvTtl: 7200, staleAge: 3300, retryInterval: 600 },
};

// ── Source fetchers ─────────────────────────────────────────────────────

function makeFetcher(name, cached) {
  switch (name) {
    case "weather":   return fetchWeatherData({ timeout: 12000, retries: 1 });
    case "snow":      return fetchSnowData({ timeout: 6000, cachedStations: cached?.data?.stations || {} });
    case "avalanche": return fetchAvalancheData({ timeout: 6000, retries: 1 });
  }
}

async function refreshSource(env, name, cached) {
  const cfg = SOURCES[name];
  const t0 = Date.now();
  try {
    const data = await makeFetcher(name, cached);
    const entry = { ok: true, fetchedAt: new Date().toISOString(), ms: Date.now() - t0, data };
    await sourcePut(env, cfg.kvKey, entry, cfg.kvTtl);
    return entry;
  } catch (e) {
    const entry = {
      ok: false,
      error: e?.message || "Unknown error",
      fetchedAt: cached?.fetchedAt || new Date().toISOString(),
      lastFailAt: new Date().toISOString(),
      ms: Date.now() - t0,
      data: cached?.data || null,
    };
    await sourcePut(env, cfg.kvKey, entry, cfg.kvTtl);
    return entry;
  }
}

// ── Freshness helpers ───────────────────────────────────────────────────

function ageSeconds(entry) {
  if (!entry?.fetchedAt) return Infinity;
  return (Date.now() - new Date(entry.fetchedAt).getTime()) / 1000;
}

function isStale(entry, cfg) {
  return ageSeconds(entry) >= cfg.staleAge;
}

function needsRetry(entry, cfg) {
  if (!entry || entry.ok) return false;
  if (!entry.lastFailAt) return true;
  return (Date.now() - new Date(entry.lastFailAt).getTime()) / 1000 >= cfg.retryInterval;
}

// ── Assemble the dashboard response (same shape as before) ──────────────

function assembleDashboard(sources) {
  const complete = Object.values(sources).every(s => s?.ok);
  return {
    fetchedAt: new Date().toISOString(),
    complete,
    sources: Object.fromEntries(
      Object.entries(sources).map(([k, v]) => [
        k,
        { ok: !!v?.ok, fetchedAt: v?.fetchedAt || null, error: v?.error || null },
      ]),
    ),
    weather:   sources.weather?.data   || null,
    snow:      sources.snow?.data      || null,
    avalanche: sources.avalanche?.data || null,
  };
}

// ── Endpoint ────────────────────────────────────────────────────────────

export async function onRequestGet(context) {
  const { env, waitUntil } = context;

  // 1. Read all 3 source caches in parallel
  const names = Object.keys(SOURCES);
  const entries = await Promise.all(names.map(n => sourceGet(env, SOURCES[n].kvKey)));
  const sources = Object.fromEntries(names.map((n, i) => [n, entries[i]]));

  // 2. Categorise each source
  const missing   = [];   // no data at all → must fetch synchronously
  const stale     = [];   // data exists but old → background refresh
  const retryable = [];   // failed + retry interval passed → background retry

  for (const [name, cfg] of Object.entries(SOURCES)) {
    const entry = sources[name];
    if (!entry || (!entry.ok && !entry.data)) { missing.push(name);   continue; }
    if (isStale(entry, cfg))                  { stale.push(name);     continue; }
    if (needsRetry(entry, cfg))               { retryable.push(name);           }
  }

  // 3a. Cold start: fetch missing sources synchronously
  if (missing.length > 0) {
    const fetched = await Promise.all(missing.map(n => refreshSource(env, n, null)));
    missing.forEach((n, i) => { sources[n] = fetched[i]; });
  }

  // 3b. Stale / retryable → return immediately, refresh in background
  const bgNames = [...stale, ...retryable];
  if (bgNames.length > 0) {
    waitUntil(
      Promise.all(bgNames.map(n => refreshSource(env, n, sources[n]))),
    );
  }

  // 4. Assemble and return
  return corsJson(assembleDashboard(sources));
}
