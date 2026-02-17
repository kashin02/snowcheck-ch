import { cacheGet, cachePut, corsJson } from "./_helpers.js";
import { fetchWeatherData } from "./_fetchWeather.js";

const CACHE_TTL = 3600;

export async function onRequestGet(context) {
  const { env } = context;
  const hit = await cacheGet(env, "weather:all");
  if (hit) return hit;

  let data;
  try {
    data = await fetchWeatherData({ timeout: 5000, retries: 2 });
  } catch {
    return corsJson({ error: "Open-Meteo API error" }, 502);
  }

  const result = { updatedAt: new Date().toISOString(), ...data };
  return cachePut(env, "weather:all", result, CACHE_TTL);
}
