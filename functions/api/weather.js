import { corsJson, sourceGet } from "./_helpers.js";

export async function onRequestGet(context) {
  const cached = await sourceGet(context.env, "src:weather");
  if (cached?.ok) return corsJson(cached.data, 200, { "X-Cache": "HIT" });
  if (cached?.data) return corsJson(cached.data, 200, { "X-Cache": "STALE" });
  return corsJson({ error: "No cached weather data" }, 503);
}
