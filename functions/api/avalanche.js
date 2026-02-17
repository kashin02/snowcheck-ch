import { cacheGet, cachePut, corsJson } from "./_helpers.js";
import { fetchAvalancheData } from "./_fetchAvalanche.js";

const CACHE_TTL = 3600;

export async function onRequestGet(context) {
  const { env } = context;
  const hit = await cacheGet(env, "avalanche:bulletin");
  if (hit) return hit;

  let data;
  try {
    data = await fetchAvalancheData({ timeout: 5000, retries: 2 });
  } catch {
    return corsJson({ error: "SLF API error" }, 502);
  }

  const result = { updatedAt: new Date().toISOString(), ...data };
  return cachePut(env, "avalanche:bulletin", result, CACHE_TTL);
}
