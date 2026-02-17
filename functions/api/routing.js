import { cacheGet, cachePut, corsJson } from "./_helpers.js";

const CACHE_TTL = 86400; // 24 hours — routes don't change

async function hashKey(str) {
  const encoded = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

export async function onRequestGet(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const coords = url.searchParams.get("coords");

  if (!coords) {
    return corsJson({ error: "Missing coords parameter" }, 400);
  }

  if (!/^[\d.,;\s-]+$/.test(coords)) {
    return corsJson({ error: "Invalid coords format" }, 400);
  }
  const pairCount = coords.split(";").length;
  if (pairCount > 100) {
    return corsJson({ error: "Too many coordinates (max 100)" }, 400);
  }

  const cacheKey = `routing:${await hashKey(coords)}`;
  const hit = await cacheGet(env, cacheKey);
  if (hit) return hit;

  const osrmUrl = `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=duration,distance`;

  const res = await fetch(osrmUrl, {
    headers: { "User-Agent": "snowcheck-ch/1.0" },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    return corsJson({ error: "OSRM API error" }, 502);
  }

  const data = await res.json();

  if (data.code !== "Ok") {
    return corsJson({ error: data.code, message: data.message }, 502);
  }

  const result = { durations: data.durations, distances: data.distances };
  return cachePut(env, cacheKey, result, CACHE_TTL);
}
