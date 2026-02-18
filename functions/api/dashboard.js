import { corsJson, sourceGet, sourcePut, logFetch } from "./_helpers.js";
import { fetchWeatherData } from "./_fetchWeather.js";
import { fetchSnowData } from "./_fetchSnow.js";
import { fetchAvalancheData } from "./_fetchAvalanche.js";

// ── Per-source configuration ────────────────────────────────────────────
//  kvTtl:         hard expiry in KV (generous — logic handles freshness)
//  staleAge:      triggers background refresh (stale-while-revalidate)
//  retryInterval: wait before retrying a failed source

const SOURCES = {
  weather:   { kvKey: "src:weather",   kvTtl: 21600, staleAge: 10800, retryInterval: 3600 },
  snow:      { kvKey: "src:snow",      kvTtl: 3600, staleAge: 1200, retryInterval: 300 },
  avalanche: { kvKey: "src:avalanche", kvTtl: 7200, staleAge: 3300, retryInterval: 600 },
};

// ── Source fetchers ─────────────────────────────────────────────────────
// Cold-start uses shorter timeouts so the synchronous path stays under
// the frontend's 15 s timeout budget.

function makeFetcher(name, cached, opts = {}) {
  const cold = opts.coldStart;
  switch (name) {
    case "weather":   return fetchWeatherData({ timeout: cold ? 8000 : 12000, retries: cold ? 0 : 1, apiKey: opts.apiKey });
    case "snow":      return fetchSnowData({ timeout: cold ? 4000 : 6000, cachedStations: cached?.data?.stations || {} });
    case "avalanche": return fetchAvalancheData({ timeout: cold ? 4000 : 6000, retries: cold ? 0 : 1 });
  }
}

async function refreshSource(env, name, cached, opts = {}) {
  const cfg = SOURCES[name];
  opts.apiKey = opts.apiKey || env.OPEN_METEO_API_KEY;
  const t0 = Date.now();
  try {
    const data = await makeFetcher(name, cached, opts);
    const entry = { ok: true, fetchedAt: new Date().toISOString(), ms: Date.now() - t0, data };
    await sourcePut(env, cfg.kvKey, entry, cfg.kvTtl);
    await logFetch(env, name, { ok: true, ms: entry.ms });
    return entry;
  } catch (e) {
    const error = e?.message || "Unknown error";
    const entry = {
      ok: false,
      error,
      fetchedAt: cached?.fetchedAt || new Date().toISOString(),
      lastFailAt: new Date().toISOString(),
      ms: Date.now() - t0,
      data: cached?.data || null,
    };
    await sourcePut(env, cfg.kvKey, entry, cfg.kvTtl);
    await logFetch(env, name, { ok: false, ms: entry.ms, error });
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

// Exported for testing
export { SOURCES, assembleDashboard, ageSeconds, isStale, needsRetry, refreshSource };

// ── Endpoint ────────────────────────────────────────────────────────────

export async function onRequestGet(context) {
  const { env, waitUntil } = context;

  // 1. Read all 3 source caches in parallel
  const names = Object.keys(SOURCES);
  const entries = await Promise.all(names.map(n => sourceGet(env, SOURCES[n].kvKey)));
  const sources = Object.fromEntries(names.map((n, i) => [n, entries[i]]));

  // 2. Categorise each source
  //    "missing"   = no KV entry at all (true cold start)
  //    "stale"     = successful data that needs background refresh
  //    "retryable" = failed entry whose retry interval has elapsed
  //    Otherwise   = fresh success OR failed waiting for retry → return as-is
  const missing   = [];
  const stale     = [];
  const retryable = [];

  for (const [name, cfg] of Object.entries(SOURCES)) {
    const entry = sources[name];
    if (!entry)                              { missing.push(name);   continue; }
    if (entry.ok && isStale(entry, cfg))     { stale.push(name);     continue; }
    if (!entry.ok && needsRetry(entry, cfg)) { retryable.push(name);           }
  }

  // 3a. Cold start: fetch truly-missing sources synchronously
  //     Use shorter timeouts so the total stays under the frontend's 15 s budget.
  if (missing.length > 0) {
    const fetched = await Promise.all(missing.map(n => refreshSource(env, n, null, { coldStart: true })));
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
