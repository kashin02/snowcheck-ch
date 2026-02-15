import { useMemo } from "react";
import { stations as staticStations } from "../data/stations";
import { computeCalendarCrowdScore } from "../data/crowdCalendar";
import useWeatherData from "./useWeatherData";
import useAvalancheData from "./useAvalancheData";
import useSnowMeasurements from "./useSnowMeasurements";

// ── Target day: after 14h Swiss time, focus on tomorrow ────────────────
function getSwissTargetDayIndex() {
  const nowCH = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Zurich" }));
  return nowCH.getHours() >= 14 ? 1 : 0;
}

// ── Scoring helpers (new weighted algorithm, score out of 100) ──────────

// POSITIVE: Sunshine hours today (max +35) — most important factor
function scoreSun(sunHours) {
  if (sunHours >= 8) return 35;
  if (sunHours >= 6) return 28;
  if (sunHours >= 4) return 20;
  if (sunHours >= 2) return 12;
  if (sunHours >= 1) return 5;
  return 0;
}

// POSITIVE: Fresh snow last 72h (max +30)
function scoreFresh(fresh72) {
  if (fresh72 >= 50) return 30;
  if (fresh72 >= 30) return 24;
  if (fresh72 >= 15) return 18;
  if (fresh72 >= 5) return 10;
  if (fresh72 > 0) return 4;
  return 0;
}

// POSITIVE: Total snow depth (max +20)
function scoreDepth(depth) {
  if (depth >= 150) return 20;
  if (depth >= 100) return 16;
  if (depth >= 60) return 12;
  if (depth >= 30) return 6;
  return 0;
}

// POSITIVE: Absolute km of open slopes (max +15) — not a ratio
function scorePistes(pistesOpenKm) {
  if (pistesOpenKm >= 100) return 15;
  if (pistesOpenKm >= 60) return 12;
  if (pistesOpenKm >= 30) return 8;
  if (pistesOpenKm >= 15) return 4;
  return 1;
}

// NEGATIVE: Jour blanc / whiteout hours during ski time (max -30)
function penaltyJourBlanc(jourBlancHours) {
  if (jourBlancHours >= 6) return -30;
  if (jourBlancHours >= 4) return -22;
  if (jourBlancHours >= 2) return -12;
  if (jourBlancHours >= 1) return -5;
  return 0;
}

// NEGATIVE: Strong wind (max -20)
function penaltyWind(windMaxKmh) {
  if (windMaxKmh >= 80) return -20;
  if (windMaxKmh >= 60) return -15;
  if (windMaxKmh >= 40) return -8;
  if (windMaxKmh >= 25) return -3;
  return 0;
}

// NEGATIVE: Crowd level from calendar (max -15)
function penaltyCrowd(crowdScore) {
  return -crowdScore; // crowdScore is already 0-15
}

// ── Lightweight score for a single forecast day ─────────────────────────

function computeDayScore(station, snowData, dayForecast, dateStr) {
  if (!dayForecast) return null;
  const snow = snowData?.stations?.[station.imisCode];
  const depth = snow?.snowDepth ?? station.snowBase;
  const fresh72 = snow?.fresh72h ?? station.fresh72;
  const { pistesOpen } = station.operational;

  const sunHours = dayForecast.sunshineHours ?? 0;
  const windMax = dayForecast.windMax ?? 0;
  const jourBlancHours = dayForecast.jourBlancHours ?? 0;

  const targetDate = new Date(dateStr + "T12:00:00");
  const crowdScore = computeCalendarCrowdScore(targetDate);

  const raw = scoreSun(sunHours) + scoreFresh(fresh72) + scoreDepth(depth) +
    scorePistes(pistesOpen) + penaltyJourBlanc(jourBlancHours) +
    penaltyWind(windMax) + penaltyCrowd(crowdScore);
  const score = Math.max(0, Math.min(100, raw));

  let verdict;
  if (score >= 70) verdict = "top";
  else if (score >= 45) verdict = "good";
  else if (score >= 20) verdict = "ok";
  else verdict = "bad";

  return { score, verdict };
}

// ── Main verdict computation ────────────────────────────────────────────

function computeVerdict(station, weatherData, snowData, targetDayIndex = 0) {
  const snow = snowData?.stations?.[station.imisCode];
  const weather = weatherData?.stations?.[station.id];

  // Fallback to static verdict if no API data at all
  if (!snow && !weather) return { verdict: station.verdict, score: null, breakdown: null };

  // Data extraction with fallbacks
  const depth = snow?.snowDepth ?? station.snowBase;
  const fresh72 = snow?.fresh72h ?? station.fresh72;
  const { pistesOpen } = station.operational;

  // Target day's forecast for sun, wind, jour blanc
  const dayForecast = weather?.forecast?.[targetDayIndex];
  const sunHours = dayForecast?.sunshineHours ?? (station.sun5?.[targetDayIndex] || 0);
  const windMax = dayForecast?.windMax ?? 0;
  const jourBlancHours = dayForecast?.jourBlancHours ?? 0;

  // Crowd from calendar for the target day (use actual forecast date when available)
  const dateStr = dayForecast?.date;
  const targetDate = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
  const crowdScore = computeCalendarCrowdScore(targetDate);

  // Compute sub-scores
  const sunPts = scoreSun(sunHours);
  const freshPts = scoreFresh(fresh72);
  const depthPts = scoreDepth(depth);
  const pistesPts = scorePistes(pistesOpen);
  const jourBlancPts = penaltyJourBlanc(jourBlancHours);
  const windPts = penaltyWind(windMax);
  const crowdPts = penaltyCrowd(crowdScore);

  const raw = sunPts + freshPts + depthPts + pistesPts + jourBlancPts + windPts + crowdPts;
  const score = Math.max(0, Math.min(100, raw));

  let verdict;
  if (score >= 70) verdict = "top";
  else if (score >= 45) verdict = "good";
  else if (score >= 20) verdict = "ok";
  else verdict = "bad";

  return {
    verdict,
    score,
    breakdown: {
      sun: { pts: sunPts, max: 35, value: sunHours, unit: "h" },
      fresh: { pts: freshPts, max: 30, value: fresh72, unit: "cm" },
      depth: { pts: depthPts, max: 20, value: depth, unit: "cm" },
      pistes: { pts: pistesPts, max: 15, value: pistesOpen, unit: "km" },
      jourBlanc: { pts: jourBlancPts, min: -30, value: jourBlancHours, unit: "h" },
      wind: { pts: windPts, min: -20, value: windMax, unit: "km/h" },
      crowd: { pts: crowdPts, min: -15, value: crowdScore, unit: "/15" },
    },
  };
}

// ── Forecast builder ────────────────────────────────────────────────────

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function buildForecastForStation(station, weatherData, snowData) {
  const weather = weatherData?.stations?.[station.id];
  if (!weather?.forecast) return null;

  return weather.forecast.map((day) => {
    const projected = computeDayScore(station, snowData, day, day.date);
    return {
      day: day.dayShort || DAYS_FR[new Date(day.date).getDay()],
      date: day.date,
      icon: day.icon,
      sun: Math.round(day.sunshineHours || 0),
      snow: String(Math.round(day.snowfallSum || 0)),
      wind: day.windMax || 0,
      jourBlanc: day.jourBlancHours || 0,
      accent: (day.snowfallSum || 0) >= 30 || (day.windMax || 0) >= 60,
      sunH: Math.round(day.sunshineHours || 0),
      dayScore: projected?.score ?? null,
      dayVerdict: projected?.verdict ?? null,
    };
  });
}

// ── Hook ────────────────────────────────────────────────────────────────

export default function useDashboardData() {
  const weather = useWeatherData();
  const avalanche = useAvalancheData();
  const snow = useSnowMeasurements();

  const isLoading = weather.loading && avalanche.loading && snow.loading;
  const hasAnyData = weather.data || avalanche.data || snow.data;
  const allFailed = weather.error && avalanche.error && snow.error && !hasAnyData;

  const lastUpdate = weather.data?.updatedAt || snow.data?.updatedAt || null;

  const enrichedStations = useMemo(() => {
    // Compute target day client-side (avoids stale cache issues)
    const targetDayIndex = getSwissTargetDayIndex();
    const targetDayLabel = targetDayIndex === 0 ? "Aujourd'hui" : "Demain";

    return staticStations.map(station => {
      const snowMeasurement = snow.data?.stations?.[station.imisCode];
      const stationForecast = buildForecastForStation(station, weather.data, snow.data);
      const { verdict, score, breakdown } = computeVerdict(station, weather.data, snow.data, targetDayIndex);

      return {
        ...station,
        // Override snow data with real measurements if available
        snowBase: snowMeasurement?.snowDepth ?? station.snowBase,
        fresh72: snowMeasurement?.fresh72h ?? station.fresh72,
        // Forecast data
        liveForecast: stationForecast,
        // Sun data from forecast
        sun5: stationForecast
          ? stationForecast.map(f => f.sunH)
          : station.sun5,
        freshForecast: stationForecast
          ? Math.round(stationForecast.reduce((sum, f) => sum + (parseInt(f.snow) || 0), 0))
          : station.freshForecast,
        // Avalanche data
        avalancheLevel: avalanche.data?.regions?.[station.slfRegionId]?.level ?? null,
        // New weighted verdict + score + breakdown
        verdict,
        verdictScore: score,
        verdictBreakdown: breakdown,
        targetDayLabel,
        targetDayIndex,
      };
    });
  }, [weather.data, avalanche.data, snow.data]);

  return {
    stations: enrichedStations,
    avalanche: avalanche.data,
    isLoading,
    allFailed,
    hasAnyData,
    lastUpdate,
    errors: {
      weather: weather.error,
      avalanche: avalanche.error,
      snow: snow.error,
    },
  };
}
