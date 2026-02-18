const CORS_HEADERS = { "Access-Control-Allow-Origin": "https://snowcheck.ch" };

export function corsJson(data, status = 200, extra = {}) {
  return Response.json(data, { status, headers: { ...CORS_HEADERS, ...extra } });
}

export async function cacheGet(env, key) {
  try {
    const cached = await env.CACHE_KV.get(key, "json");
    if (cached) return corsJson(cached, 200, { "X-Cache": "HIT" });
  } catch { /* KV unavailable in local dev */ }
  return null;
}

export async function cachePut(env, key, data, ttl) {
  try {
    await env.CACHE_KV.put(key, JSON.stringify(data), { expirationTtl: ttl });
  } catch { /* KV unavailable */ }
  return corsJson(data, 200, { "X-Cache": "MISS" });
}

// ── Fetch log (last N attempts per source, stored in KV) ──────────────

const MAX_LOG_ENTRIES = 30;

export async function logFetch(env, source, entry) {
  const key = `log:${source}`;
  try {
    const existing = await env.CACHE_KV.get(key, "json") || [];
    existing.push({ ...entry, ts: new Date().toISOString() });
    const trimmed = existing.slice(-MAX_LOG_ENTRIES);
    await env.CACHE_KV.put(key, JSON.stringify(trimmed), { expirationTtl: 86400 * 7 });
  } catch { /* KV unavailable */ }
}

export async function getLog(env, source) {
  try { return await env.CACHE_KV.get(`log:${source}`, "json") || []; }
  catch { return []; }
}

// ── Per-source KV helpers (used by dashboard + read-only endpoints) ──

export async function sourceGet(env, key) {
  try { return await env.CACHE_KV.get(key, "json"); }
  catch { return null; }
}

export async function sourcePut(env, key, data, ttl) {
  try { await env.CACHE_KV.put(key, JSON.stringify(data), { expirationTtl: ttl }); }
  catch { /* KV unavailable */ }
}

/**
 * Fetch with retry + timeout. Retries up to `retries` times with short delays.
 * @param {string} url
 * @param {{ timeout?: number, retries?: number }} opts
 * @returns {Promise<Response>}
 */
export async function fetchRetry(url, { timeout = 5000, retries = 2 } = {}) {
  const delays = [0, 600, 1200];
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, delays[i] || 1000));
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(timeout),
        headers: { "User-Agent": "snowcheck.ch/1.0" },
      });
      if (res.ok) return res;
      const body = await res.text().catch(() => "");
      lastErr = new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
      // Don't retry on rate limit — daily quota won't reset in seconds
      if (res.status === 429) throw lastErr;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}
