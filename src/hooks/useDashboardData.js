import { useMemo } from "react";
import { stations as staticStations } from "../data/stations";
import { computeCalendarCrowdScore } from "../data/crowdCalendar";
import { scoreToVerdict } from "../data/constants";
import useWeatherData from "./useWeatherData";
import useAvalancheData from "./useAvalancheData";
import useSnowMeasurements from "./useSnowMeasurements";
import { DAYS_FR } from "../data/shared";

// ── Target day: after 15h Swiss time, focus on tomorrow ────────────────
function getSwissTargetDayIndex() {
  try {
    const hour = parseInt(
      new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Zurich", hour: "numeric", hour12: false }).format(new Date()),
      10,
    );
    return hour >= 15 ? 1 : 0;
  } catch {
    const nowCH = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Zurich" }));
    return nowCH.getHours() >= 15 ? 1 : 0;
  }
}

// ── Table-driven scoring (score out of 100) ─────────────────────────────
const thresholdScore = (thresholds, fallback = 0) => (v) => {
  for (const [min, pts] of thresholds) if (v >= min) return pts;
  return fallback;
};

const scoreSun    = thresholdScore([[8, 35], [6, 28], [4, 20], [2, 12], [1, 5]]);   // max +35
const scoreFresh  = thresholdScore([[50, 30], [30, 24], [15, 18], [5, 10], [1, 4]]); // max +30
const scoreDepth  = thresholdScore([[150, 20], [100, 16], [60, 12], [30, 6]]);       // max +20
const scorePistes = thresholdScore([[100, 15], [60, 12], [30, 8], [15, 4]], 1);      // max +15
const penaltyJB   = thresholdScore([[6, -30], [4, -22], [2, -12], [1, -5]]);         // max −30
const penaltyWind = thresholdScore([[80, -20], [60, -15], [40, -8], [25, -3]]);      // max −20

// ── Score a single day ──────────────────────────────────────────────────
function scoreForDay(station, snowData, dayForecast, dateStr, fallbackSun) {
  const snow = snowData?.stations?.[station.imisCode];
  const depth = snow?.snowDepth ?? station.snowBase;
  const fresh72 = snow?.fresh72h ?? station.fresh72;
  const { pistesOpen } = station.operational;

  const sunHours = dayForecast?.sunshineHours ?? (fallbackSun || 0);
  const windMax = dayForecast?.windMax ?? 0;
  const jourBlancH = dayForecast?.jourBlancHours ?? 0;
  const targetDate = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
  const crowdScore = computeCalendarCrowdScore(targetDate);

  const sunPts = scoreSun(sunHours);
  const freshPts = scoreFresh(fresh72);
  const depthPts = scoreDepth(depth);
  const pistesPts = scorePistes(pistesOpen);
  const jbPts = penaltyJB(jourBlancH);
  const windPts = penaltyWind(windMax);
  const crowdPts = -crowdScore;

  const raw = sunPts + freshPts + depthPts + pistesPts + jbPts + windPts + crowdPts;
  const score = Math.max(0, Math.min(100, raw));

  return {
    verdict: scoreToVerdict(score),
    score,
    breakdown: {
      sun: { pts: sunPts, max: 35, value: sunHours, unit: "h" },
      fresh: { pts: freshPts, max: 30, value: fresh72, unit: "cm" },
      depth: { pts: depthPts, max: 20, value: depth, unit: "cm" },
      pistes: { pts: pistesPts, max: 15, value: pistesOpen, unit: "km" },
      jourBlanc: { pts: jbPts, min: -30, value: jourBlancH, unit: "h" },
      wind: { pts: windPts, min: -20, value: windMax, unit: "km/h" },
      crowd: { pts: crowdPts, min: -15, value: crowdScore, unit: "/15" },
    },
  };
}

// ── Hook ────────────────────────────────────────────────────────────────

export default function useDashboardData() {
  const weather = useWeatherData();
  const avalanche = useAvalancheData();
  const snow = useSnowMeasurements();

  const isLoading = weather.loading || avalanche.loading || snow.loading;
  const hasAnyData = weather.data || avalanche.data || snow.data;
  const allFailed = weather.error && avalanche.error && snow.error && !hasAnyData;

  const lastUpdate = weather.data?.updatedAt || snow.data?.updatedAt || null;

  const enrichedStations = useMemo(() => {
    const targetDayIndex = getSwissTargetDayIndex();
    const targetDayLabel = targetDayIndex === 0 ? "Aujourd'hui" : "Demain";

    return staticStations.map(station => {
      const snowMeasurement = snow.data?.stations?.[station.imisCode];
      const rawForecast = weather.data?.stations?.[station.id]?.forecast;

      // Build forecast display + day breakdowns in one pass
      let stationForecast = null;
      const dayBreakdowns = [];

      if (rawForecast) {
        stationForecast = rawForecast.map((day) => {
          const result = scoreForDay(station, snow.data, day, day.date);
          dayBreakdowns.push(result);
          return {
            day: day.dayShort || DAYS_FR[new Date(day.date).getDay()],
            date: day.date,
            icon: day.icon,
            snow: String(Math.round(day.snowfallSum || 0)),
            wind: day.windMax || 0,
            accent: (day.snowfallSum || 0) >= 30 || (day.windMax || 0) >= 60,
            sunH: Math.round(day.sunshineHours || 0),
            dayScore: result.score,
            dayVerdict: result.verdict,
          };
        });
      }

      // Target day: use pre-computed breakdown or compute with static sun5 fallback
      const target = dayBreakdowns[targetDayIndex]
        || scoreForDay(station, snow.data, null, null, station.sun5?.[targetDayIndex]);

      return {
        ...station,
        snowBase: snowMeasurement?.snowDepth ?? station.snowBase,
        fresh72: snowMeasurement?.fresh72h ?? station.fresh72,
        liveForecast: stationForecast,
        sun5: stationForecast ? stationForecast.map(f => f.sunH) : station.sun5,
        freshForecast: stationForecast
          ? Math.round(stationForecast.reduce((sum, f) => sum + (parseInt(f.snow, 10) || 0), 0))
          : station.freshForecast,
        avalancheLevel: avalanche.data?.regions?.[station.slfRegionId]?.level ?? null,
        verdict: target.verdict,
        verdictScore: target.score,
        verdictBreakdown: target.breakdown,
        dayBreakdowns,
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
