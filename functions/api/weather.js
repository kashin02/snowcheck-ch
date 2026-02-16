const CACHE_TTL = 3600; // 60 minutes

const stationCoords = [
  // Valais
  { id: "saas-fee", lat: 46.1082, lon: 7.9275 },
  { id: "grimentz-zinal", lat: 46.1833, lon: 7.5833 },
  { id: "anzere", lat: 46.3000, lon: 7.4000 },
  { id: "st-luc-chandolin", lat: 46.2167, lon: 7.6000 },
  { id: "arolla", lat: 46.0333, lon: 7.4833 },
  { id: "leukerbad", lat: 46.3833, lon: 7.6333 },
  { id: "blatten-belalp", lat: 46.3719, lon: 7.8656 },
  { id: "vercorin", lat: 46.2500, lon: 7.5333 },
  { id: "ovronnaz", lat: 46.2000, lon: 7.1667 },
  { id: "evolene", lat: 46.1117, lon: 7.4917 },
  { id: "la-forclaz", lat: 46.1300, lon: 7.5000 },
  { id: "champex-lac", lat: 46.0667, lon: 7.1167 },
  { id: "les-marecotes", lat: 46.1090, lon: 7.0083 },
  { id: "nax-mont-noble", lat: 46.2333, lon: 7.4333 },
  { id: "eischoll", lat: 46.3167, lon: 7.7833 },
  { id: "unterbaech", lat: 46.3000, lon: 7.8000 },
  { id: "gspon", lat: 46.2333, lon: 7.9167 },
  { id: "rosswald", lat: 46.3333, lon: 8.0500 },
  { id: "jeizinen", lat: 46.3333, lon: 7.7167 },
  { id: "visperterminen", lat: 46.2667, lon: 7.9000 },
  { id: "mayens-de-conthey", lat: 46.2400, lon: 7.3100 },
  { id: "lauchernalp", lat: 46.4000, lon: 7.7500 },
  { id: "moosalp", lat: 46.3000, lon: 7.8500 },
  // Vaud
  { id: "glacier-3000", lat: 46.3567, lon: 7.2033 },
  { id: "villars-gryon", lat: 46.3000, lon: 7.0500 },
  { id: "leysin", lat: 46.3500, lon: 7.0167 },
  { id: "les-pleiades", lat: 46.4667, lon: 6.8500 },
  { id: "les-diablerets", lat: 46.3500, lon: 7.2167 },
  { id: "les-mosses", lat: 46.3950, lon: 7.1050 },
  { id: "les-rochers-de-naye", lat: 46.4300, lon: 6.9833 },
  { id: "les-rasses", lat: 46.7800, lon: 6.5100 },
  { id: "vallee-de-joux", lat: 46.6167, lon: 6.2500 },
  { id: "saint-cergue", lat: 46.4500, lon: 6.1600 },
  // Berne
  { id: "gstaad", lat: 46.4750, lon: 7.2867 },
  { id: "meiringen-hasliberg", lat: 46.7333, lon: 8.1833 },
  { id: "wiriehorn", lat: 46.6300, lon: 7.4500 },
  { id: "axalp", lat: 46.7200, lon: 8.0500 },
  { id: "beatenberg-niederhorn", lat: 46.7000, lon: 7.7800 },
  { id: "grimmialp", lat: 46.6200, lon: 7.4700 },
  { id: "jaunpass", lat: 46.5900, lon: 7.3400 },
  { id: "eriz", lat: 46.7800, lon: 7.8000 },
  { id: "bumbach-schangnau", lat: 46.8100, lon: 7.8500 },
  { id: "habkern", lat: 46.7200, lon: 7.8700 },
  { id: "springenboden", lat: 46.6000, lon: 7.4500 },
  { id: "gantrisch-gurnigel", lat: 46.7300, lon: 7.4500 },
  { id: "kiental", lat: 46.6300, lon: 7.7300 },
  { id: "aeschiallmend", lat: 46.6500, lon: 7.7000 },
  { id: "heimenschwand", lat: 46.8000, lon: 7.7000 },
  { id: "linden", lat: 46.8500, lon: 7.6800 },
  { id: "ottenleue", lat: 46.7800, lon: 7.3800 },
  { id: "selital", lat: 46.8300, lon: 7.5200 },
  { id: "tramelan", lat: 47.2200, lon: 7.1000 },
  { id: "homberg", lat: 47.1700, lon: 7.7000 },
  // Fribourg
  { id: "schwarzsee", lat: 46.6700, lon: 7.2800 },
  { id: "charmey", lat: 46.6167, lon: 7.1667 },
  { id: "moleson", lat: 46.5500, lon: 7.0167 },
  { id: "la-berra", lat: 46.6333, lon: 7.2167 },
  { id: "jaun", lat: 46.6100, lon: 7.2700 },
  { id: "les-paccots", lat: 46.5500, lon: 6.9200 },
  { id: "rathvel", lat: 46.5500, lon: 7.0700 },
  // Neuchâtel
  { id: "bugnenets-savagnieres", lat: 47.1000, lon: 7.0000 },
  { id: "cret-du-puy", lat: 47.0500, lon: 6.9000 },
  { id: "robella-val-de-travers", lat: 46.9300, lon: 6.6500 },
  // Soleure
  { id: "balmberg", lat: 47.2500, lon: 7.5200 },
  { id: "grenchenberg", lat: 47.2200, lon: 7.3800 },
  // Lucerne
  { id: "sorenberg", lat: 46.8167, lon: 8.0333 },
  { id: "marbachegg", lat: 46.8500, lon: 7.9500 },
  // Obwald
  { id: "melchsee-frutt", lat: 46.7667, lon: 8.2667 },
  { id: "morlialp", lat: 46.8200, lon: 8.1800 },
  // France
  { id: "le-grand-bornand", lat: 45.9400, lon: 6.4300 },
  { id: "praz-de-lys-sommand", lat: 46.1400, lon: 6.5700 },
  { id: "massif-des-brasses", lat: 46.1600, lon: 6.4400 },
  { id: "hirmentaz", lat: 46.2700, lon: 6.5200 },
  { id: "habere-poche", lat: 46.2300, lon: 6.4700 },
  { id: "thollon-les-memises", lat: 46.3600, lon: 6.6300 },
  { id: "monts-jura", lat: 46.3000, lon: 5.9000 },
  { id: "jura-sur-leman", lat: 46.4200, lon: 6.1000 },
  { id: "metabief", lat: 46.7700, lon: 6.3500 },
  // Italie
  { id: "alpe-devero", lat: 46.3200, lon: 8.2900 },
  { id: "san-domenico", lat: 46.2500, lon: 8.1900 },
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

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=snowfall_sum,sunshine_duration,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,cloud_cover_mean&hourly=snow_depth,visibility,cloud_cover_low,cloud_cover_mid,direct_normal_irradiance&forecast_days=6&timezone=Europe/Zurich`;

  const response = await fetch(url);
  if (!response.ok) {
    return Response.json({ error: "Open-Meteo API error" }, { status: 502 });
  }

  const raw = await response.json();

  // Open-Meteo returns array when multiple locations
  const results = Array.isArray(raw) ? raw : [raw];

  const data = {};

  // After 14h Swiss time, show tomorrow's conditions
  const nowCH = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Zurich" }));
  const targetDayIndex = nowCH.getHours() >= 14 ? 1 : 0;
  const targetDayLabel = targetDayIndex === 0 ? "Aujourd'hui" : "Demain";

  stationCoords.forEach((station, idx) => {
    const r = results[idx];
    if (!r || !r.daily) return;

    // Get current snow depth from latest hourly reading
    const snowDepths = r.hourly?.snow_depth || [];
    const currentSnowDepth = snowDepths.length > 0
      ? Math.round((snowDepths.filter(v => v !== null).pop() || 0) * 100) // meters to cm
      : null;

    // Compute jour blanc (whiteout) hours per day from hourly data
    const hourlyTimes = r.hourly?.time || [];
    const hourlyVisibility = r.hourly?.visibility || [];
    const hourlyCloudLow = r.hourly?.cloud_cover_low || [];
    const hourlyCloudMid = r.hourly?.cloud_cover_mid || [];
    const hourlyDNI = r.hourly?.direct_normal_irradiance || [];

    // Group hourly data by date, count whiteout hours during ski time (8h-16h)
    const jourBlancByDate = {};
    hourlyTimes.forEach((time, hi) => {
      const dateKey = time.slice(0, 10);
      const hour = parseInt(time.slice(11, 13), 10);
      if (hour < 8 || hour >= 16) return; // only ski hours

      const vis = hourlyVisibility[hi];
      const cloudLow = hourlyCloudLow[hi];
      const cloudMid = hourlyCloudMid[hi];
      const dni = hourlyDNI[hi];

      // Jour blanc detection: low visibility OR dense low clouds with no direct sun
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

    data[station.id] = {
      updatedAt: new Date().toISOString(),
      currentSnowDepth,
      targetDayIndex,
      targetDayLabel,
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
