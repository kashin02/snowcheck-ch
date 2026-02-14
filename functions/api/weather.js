const CACHE_TTL = 3600; // 60 minutes

const stationCoords = [
  { id: "saas-fee", lat: 46.1082, lon: 7.9275 },
  { id: "grimentz-zinal", lat: 46.1833, lon: 7.5833 },
  { id: "glacier-3000", lat: 46.3567, lon: 7.2033 },
  { id: "villars-gryon", lat: 46.3000, lon: 7.0500 },
  { id: "anzere", lat: 46.3000, lon: 7.4000 },
  { id: "champex-lac", lat: 46.0667, lon: 7.1167 },
  { id: "st-luc-chandolin", lat: 46.2167, lon: 7.6000 },
  { id: "arolla", lat: 46.0333, lon: 7.4833 },
  { id: "gstaad", lat: 46.4750, lon: 7.2867 },
  { id: "meiringen-hasliberg", lat: 46.7333, lon: 8.1833 },
  { id: "leysin", lat: 46.3500, lon: 7.0167 },
  { id: "sorenberg", lat: 46.8167, lon: 8.0333 },
  { id: "melchsee-frutt", lat: 46.7667, lon: 8.2667 },
  { id: "leukerbad", lat: 46.3833, lon: 7.6333 },
  { id: "charmey", lat: 46.6167, lon: 7.1667 },
  { id: "moleson", lat: 46.5500, lon: 7.0167 },
  { id: "les-pleiades", lat: 46.4667, lon: 6.8500 },
  { id: "la-berra", lat: 46.6333, lon: 7.2167 },
];

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
  const cacheKey = "weather:all";

  // Check cache
  try {
    const cached = await env.CACHE_KV.get(cacheKey, "json");
    if (cached) {
      return Response.json(cached, { headers: { "X-Cache": "HIT", "Access-Control-Allow-Origin": "*" } });
    }
  } catch {
    // KV not available (local dev without KV), continue
  }

  // Batch request to Open-Meteo
  const lats = stationCoords.map(s => s.lat).join(",");
  const lons = stationCoords.map(s => s.lon).join(",");

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=snowfall_sum,sunshine_duration,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,cloud_cover_mean&hourly=snow_depth&forecast_days=5&timezone=Europe/Zurich`;

  const response = await fetch(url);
  if (!response.ok) {
    return Response.json({ error: "Open-Meteo API error" }, { status: 502 });
  }

  const raw = await response.json();

  // Open-Meteo returns array when multiple locations
  const results = Array.isArray(raw) ? raw : [raw];

  const data = {};
  stationCoords.forEach((station, idx) => {
    const r = results[idx];
    if (!r || !r.daily) return;

    // Get current snow depth from latest hourly reading
    const snowDepths = r.hourly?.snow_depth || [];
    const currentSnowDepth = snowDepths.length > 0
      ? Math.round((snowDepths.filter(v => v !== null).pop() || 0) * 100) // meters to cm
      : null;

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
        icon: getWeatherIcon(r.daily.snowfall_sum?.[di] || 0, r.daily.cloud_cover_mean?.[di] || 0),
      };
    });

    data[station.id] = {
      updatedAt: new Date().toISOString(),
      currentSnowDepth,
      forecast,
    };
  });

  const result = { updatedAt: new Date().toISOString(), stations: data };

  // Store in cache
  try {
    await env.CACHE_KV.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL });
  } catch {
    // KV not available
  }

  return Response.json(result, { headers: { "X-Cache": "MISS", "Access-Control-Allow-Origin": "*" } });
}
