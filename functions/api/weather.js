import { stationCoords } from "./_stationCoords.js";
import { cacheGet, cachePut, corsJson } from "./_helpers.js";

const CACHE_TTL = 3600;
const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function getWeatherIcon(snowfall, cloudCover) {
  if (snowfall >= 5) return "\u2744\uFE0F";
  if (snowfall > 0) return "\uD83C\uDF28\uFE0F";
  if (cloudCover < 30) return "\u2600\uFE0F";
  if (cloudCover < 70) return "\u26C5";
  return "\u2601\uFE0F";
}

export async function onRequestGet(context) {
  const { env } = context;
  const hit = await cacheGet(env, "weather:all");
  if (hit) return hit;

  const lats = stationCoords.map(s => s.lat).join(",");
  const lons = stationCoords.map(s => s.lon).join(",");

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=snowfall_sum,sunshine_duration,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,cloud_cover_mean&hourly=visibility,cloud_cover_low,cloud_cover_mid,direct_normal_irradiance&forecast_days=6&timezone=Europe/Zurich`;

  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    return corsJson({ error: "Open-Meteo API error" }, 502);
  }

  const raw = await response.json();
  const results = Array.isArray(raw) ? raw : [raw];
  const data = {};

  stationCoords.forEach((station, idx) => {
    const r = results[idx];
    if (!r || !r.daily) return;

    // Compute jour blanc (whiteout) hours per day from hourly data
    const hourlyTimes = r.hourly?.time || [];
    const hourlyVisibility = r.hourly?.visibility || [];
    const hourlyCloudLow = r.hourly?.cloud_cover_low || [];
    const hourlyCloudMid = r.hourly?.cloud_cover_mid || [];
    const hourlyDNI = r.hourly?.direct_normal_irradiance || [];

    const jourBlancByDate = {};
    hourlyTimes.forEach((time, hi) => {
      const dateKey = time.slice(0, 10);
      const hour = parseInt(time.slice(11, 13), 10);
      if (hour < 8 || hour >= 16) return;

      const vis = hourlyVisibility[hi];
      const cloudLow = hourlyCloudLow[hi];
      const cloudMid = hourlyCloudMid[hi];
      const dni = hourlyDNI[hi];

      const isJourBlanc =
        (vis != null && vis < 2000) ||
        (cloudLow > 80 && dni != null && dni < 50) ||
        (cloudLow > 60 && cloudMid > 70 && vis != null && vis < 5000);

      if (!jourBlancByDate[dateKey]) jourBlancByDate[dateKey] = 0;
      if (isJourBlanc) jourBlancByDate[dateKey]++;
    });

    const forecast = r.daily.time.map((date, di) => {
      const d = new Date(date);
      return {
        date,
        dayShort: DAYS_FR[d.getDay()],
        snowfallSum: Math.round((r.daily.snowfall_sum?.[di] || 0) * 10) / 10,
        sunshineHours: Math.round((r.daily.sunshine_duration?.[di] || 0) / 3600 * 10) / 10,
        tempMax: Math.round((r.daily.temperature_2m_max?.[di] || 0) * 10) / 10,
        tempMin: Math.round((r.daily.temperature_2m_min?.[di] || 0) * 10) / 10,
        windMax: Math.round(r.daily.wind_speed_10m_max?.[di] || 0),
        cloudCover: Math.round(r.daily.cloud_cover_mean?.[di] || 0),
        jourBlancHours: jourBlancByDate[date] || 0,
        icon: getWeatherIcon(r.daily.snowfall_sum?.[di] || 0, r.daily.cloud_cover_mean?.[di] || 0),
      };
    });

    data[station.id] = { updatedAt: new Date().toISOString(), forecast };
  });

  const result = { updatedAt: new Date().toISOString(), stations: data };
  return cachePut(env, "weather:all", result, CACHE_TTL);
}
