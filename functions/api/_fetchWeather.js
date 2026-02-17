import { stationCoords } from "./_stationCoords.js";
import { fetchRetry } from "./_helpers.js";

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function getWeatherIcon(snowfall, cloudCover) {
  if (snowfall >= 5) return "\u2744\uFE0F";
  if (snowfall > 0) return "\uD83C\uDF28\uFE0F";
  if (cloudCover < 30) return "\u2600\uFE0F";
  if (cloudCover < 70) return "\u26C5";
  return "\u2601\uFE0F";
}

// ── Jour Blanc Index (JBI) — scored 0–10 per hour ──────────────────────
function visScore(vis) {
  if (vis == null) return 0;
  if (vis < 500)  return 10;
  if (vis < 1000) return 8;
  if (vis < 2000) return 6;
  if (vis < 5000) return 3;
  if (vis < 10000) return 1;
  return 0;
}

function flatLightScore(dni, diffuse, isDay) {
  if (!isDay) return 0;
  if (dni != null && dni < 10) return 9;
  if (dni == null || diffuse == null) return 0;
  const total = diffuse + dni + 0.1;
  const fraction = diffuse / total;
  if (fraction > 0.95) return 10;
  if (fraction > 0.85) return 8;
  if (fraction > 0.70) return 5;
  if (fraction > 0.50) return 2;
  return 0;
}

function cloudScore(low, mid, high) {
  if (low > 90) return Math.min(10, 8 + (mid > 50 ? 2 : 0));
  if (low > 80) return Math.min(10, 6 + (mid > 60 ? 2 : 0));
  if (low > 60 && mid > 70) return 6;
  const total = Math.max(low || 0, mid || 0, high || 0);
  if (total > 95) return 5;
  return Math.min((low || 0) / 20, 4);
}

function precipScore(wmo, snowfall) {
  if (wmo === 45 || wmo === 48) return 8;
  if (wmo >= 71 && wmo <= 77) return Math.min(10, 6 + Math.min((snowfall || 0) * 2, 4));
  if (wmo >= 51 && wmo <= 67) return 3;
  if (snowfall > 2) return 8;
  if (snowfall > 0.5) return 5;
  if (snowfall > 0) return 3;
  return 0;
}

function humidityScore(rh) {
  if (rh == null) return 0;
  if (rh > 98) return 8;
  if (rh > 95) return 6;
  if (rh > 90) return 3;
  if (rh > 85) return 1;
  return 0;
}

function immersionScore(freezingLevel, stationElev, cloudCover) {
  if (freezingLevel == null || stationElev == null) return 0;
  if (freezingLevel < stationElev && cloudCover > 90) return 9;
  if (freezingLevel < stationElev && cloudCover > 70) return 6;
  if (freezingLevel < stationElev + 500) return 3;
  return 0;
}

function computeHourlyJBI(params) {
  const { vis, dni, diffuse, cloudLow, cloudMid, cloudHigh, wmo, snowfall, rh, freezingLevel, stationElev, isDay, cloudCover, recentSnow } = params;
  if (!isDay) return 0;

  const vS = visScore(vis);
  const fS = flatLightScore(dni, diffuse, true);
  const cS = cloudScore(cloudLow, cloudMid, cloudHigh);
  const pS = precipScore(wmo, snowfall);
  const hS = humidityScore(rh);
  const iS = immersionScore(freezingLevel, stationElev, cloudCover);

  const weighted = vS * 0.25 + fS * 0.20 + cS * 0.20 + pS * 0.15 + hS * 0.10 + iS * 0.10;

  let synergy = 0;
  const albedoProxy = recentSnow > 10 ? 0.9 : recentSnow > 3 ? 0.8 : 0.5;
  if (albedoProxy > 0.7 && (cloudCover || 0) > 95 && (vis < 2000 || fS > 7)) {
    synergy = 1.5;
  }

  return Math.min(10, Math.round((weighted + synergy) * 10) / 10);
}

// ── Process one station result into forecast data ───────────────────────

function processStation(r) {
  if (!r || !r.daily) return null;

  const stationElev = r.elevation ?? null;

  const hTime    = r.hourly?.time || [];
  const hVis     = r.hourly?.visibility || [];
  const hCC      = r.hourly?.cloud_cover || [];
  const hCCL     = r.hourly?.cloud_cover_low || [];
  const hCCM     = r.hourly?.cloud_cover_mid || [];
  const hCCH     = r.hourly?.cloud_cover_high || [];
  const hDNI     = r.hourly?.direct_normal_irradiance || [];
  const hDiff    = r.hourly?.diffuse_radiation || [];
  const hWMO     = r.hourly?.weather_code || [];
  const hRH      = r.hourly?.relative_humidity_2m || [];
  const hSnow    = r.hourly?.snowfall || [];
  const hFreeze  = r.hourly?.freezing_level_height || [];
  const hIsDay   = r.hourly?.is_day || [];

  const cumulSnow24 = [];
  for (let i = 0; i < hSnow.length; i++) {
    let sum = 0;
    for (let j = Math.max(0, i - 23); j <= i; j++) sum += (hSnow[j] || 0);
    cumulSnow24[i] = sum;
  }

  const jbiByDate = {};
  hTime.forEach((time, hi) => {
    const dateKey = time.slice(0, 10);
    const isDay = hIsDay[hi] === 1;
    const hour = parseInt(time.slice(11, 13), 10);
    if (hour < 9 || hour > 16) return;

    const jbi = computeHourlyJBI({
      vis: hVis[hi], dni: hDNI[hi], diffuse: hDiff[hi],
      cloudLow: hCCL[hi], cloudMid: hCCM[hi], cloudHigh: hCCH[hi],
      wmo: hWMO[hi], snowfall: hSnow[hi], rh: hRH[hi],
      freezingLevel: hFreeze[hi], stationElev, isDay,
      cloudCover: hCC[hi], recentSnow: cumulSnow24[hi] || 0,
    });

    if (!jbiByDate[dateKey]) jbiByDate[dateKey] = { sum: 0, count: 0, peak: 0, hours: 0 };
    const d = jbiByDate[dateKey];
    d.sum += jbi;
    d.count++;
    if (jbi > d.peak) d.peak = jbi;
    if (jbi >= 5) d.hours++;
  });

  const forecast = r.daily.time.map((date, di) => {
    const d = new Date(date);
    const jb = jbiByDate[date];
    return {
      date,
      dayShort: DAYS_FR[d.getDay()],
      snowfallSum: Math.round((r.daily.snowfall_sum?.[di] || 0) * 10) / 10,
      sunshineHours: Math.round((r.daily.sunshine_duration?.[di] || 0) / 3600 * 10) / 10,
      tempMax: Math.round((r.daily.temperature_2m_max?.[di] || 0) * 10) / 10,
      tempMin: Math.round((r.daily.temperature_2m_min?.[di] || 0) * 10) / 10,
      windMax: Math.round(r.daily.wind_speed_10m_max?.[di] || 0),
      cloudCover: Math.round(r.daily.cloud_cover_mean?.[di] || 0),
      jourBlancIndex: jb ? Math.round(jb.sum / jb.count * 10) / 10 : 0,
      jourBlancPeak: jb?.peak || 0,
      jourBlancHours: jb?.hours || 0,
      icon: getWeatherIcon(r.daily.snowfall_sum?.[di] || 0, r.daily.cloud_cover_mean?.[di] || 0),
    };
  });

  return { forecast };
}

// ── Main fetch — batched to avoid huge single requests ──────────────────

const BATCH_SIZE = 45;

const hourlyParams = [
  "visibility", "cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high",
  "direct_normal_irradiance", "diffuse_radiation",
  "weather_code", "relative_humidity_2m", "snowfall", "freezing_level_height", "is_day",
].join(",");
const dailyParams = "snowfall_sum,sunshine_duration,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,cloud_cover_mean";

export async function fetchWeatherData({ timeout = 20000, retries = 2 } = {}) {
  // Split stations into batches of BATCH_SIZE
  const batches = [];
  for (let i = 0; i < stationCoords.length; i += BATCH_SIZE) {
    batches.push(stationCoords.slice(i, i + BATCH_SIZE));
  }

  // Fetch all batches in parallel
  const batchResponses = await Promise.all(batches.map(async (batch) => {
    const lats = batch.map(s => s.lat).join(",");
    const lons = batch.map(s => s.lon).join(",");
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=${dailyParams}&hourly=${hourlyParams}&forecast_days=6&timezone=Europe/Zurich`;
    const response = await fetchRetry(url, { timeout, retries });
    const raw = await response.json();
    return Array.isArray(raw) ? raw : [raw];
  }));

  // Flatten and process all station results
  const allResults = batchResponses.flat();
  const data = {};

  stationCoords.forEach((station, idx) => {
    const processed = processStation(allResults[idx]);
    if (processed) data[station.id] = processed;
  });

  return { stations: data };
}
