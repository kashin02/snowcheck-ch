import { corsJson, sourceGet, getLog } from "./_helpers.js";

export async function onRequestGet(context) {
  const { env } = context;

  const [weather, snow, avalanche, logWeather, logSnow, logAvalanche] = await Promise.all([
    sourceGet(env, "src:weather"),
    sourceGet(env, "src:snow"),
    sourceGet(env, "src:avalanche"),
    getLog(env, "weather"),
    getLog(env, "snow"),
    getLog(env, "avalanche"),
  ]);

  const summary = (entry) => entry ? {
    ok: !!entry.ok,
    fetchedAt: entry.fetchedAt || null,
    lastFailAt: entry.lastFailAt || null,
    error: entry.error || null,
    ms: entry.ms || null,
  } : null;

  return corsJson({
    now: new Date().toISOString(),
    config: {
      apiKeySet: !!env.OPEN_METEO_API_KEY,
      apiKeyLength: env.OPEN_METEO_API_KEY?.length || 0,
    },
    sources: {
      weather: summary(weather),
      snow: summary(snow),
      avalanche: summary(avalanche),
    },
    logs: {
      weather: logWeather,
      snow: logSnow,
      avalanche: logAvalanche,
    },
  });
}
