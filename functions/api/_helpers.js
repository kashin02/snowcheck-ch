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
