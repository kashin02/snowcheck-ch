import { cacheGet, cachePut, corsJson } from "./_helpers.js";
import { fetchSnowData } from "./_fetchSnow.js";

const CACHE_TTL = 1800;

export async function onRequestGet(context) {
  const { env } = context;
  const hit = await cacheGet(env, "snow:all");
  if (hit) return hit;

  let data;
  try {
    data = await fetchSnowData({ timeout: 4000 });
  } catch {
    return corsJson({ error: "SLF IMIS API error" }, 502);
  }

  const result = { updatedAt: new Date().toISOString(), ...data };
  return cachePut(env, "snow:all", result, CACHE_TTL);
}
