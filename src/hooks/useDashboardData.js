import { useMemo } from "react";
import { stations as staticStations } from "../data/stations";
import { computeCalendarCrowdScore } from "../data/crowdCalendar";
import useFetchApi from "./useFetchApi";
import { DAYS_FR } from "../data/shared";
import { getSwissTargetDayIndex, scoreForDay } from "../utils/scoring";

// ── Hook ────────────────────────────────────────────────────────────────

export default function useDashboardData() {
  const dashboard = useFetchApi("/api/dashboard");

  const weatherData = dashboard.data?.weather || null;
  const snowData = dashboard.data?.snow || null;
  const avalancheData = dashboard.data?.avalanche || null;

  const isLoading = dashboard.loading;
  const allFailed = !!dashboard.error && !dashboard.data;
  const lastUpdate = dashboard.data?.fetchedAt || null;
  const sourceStatus = dashboard.data?.sources || null;

  const enrichedStations = useMemo(() => {
    const targetDayIndex = getSwissTargetDayIndex();
    const targetDayLabel = targetDayIndex === 0 ? "Aujourd'hui" : "Demain";

    return staticStations.map(station => {
      const snowMeasurement = snowData?.stations?.[station.imisCode];
      const rawForecast = weatherData?.stations?.[station.id]?.forecast;

      // Build forecast display + day breakdowns in one pass
      let stationForecast = null;
      const dayBreakdowns = [];

      if (rawForecast) {
        stationForecast = rawForecast.map((day) => {
          const result = scoreForDay(station, snowData, day, day.date);
          dayBreakdowns.push(result);
          const dateObj = day.date ? new Date(day.date + "T12:00:00") : new Date();
          return {
            day: day.dayShort || DAYS_FR[new Date(day.date).getDay()],
            date: day.date,
            icon: day.icon,
            snow: String(Math.round(day.snowfallSum || 0)),
            wind: day.windMax || 0,
            accent: (day.snowfallSum || 0) >= 30 || (day.windMax || 0) >= 60,
            sunH: Math.round(day.sunshineHours || 0),
            jbi: day.jourBlancIndex || 0,
            crowd: computeCalendarCrowdScore(dateObj),
            dayScore: result.score,
            dayVerdict: result.verdict,
          };
        });
      }

      // Target day: use pre-computed breakdown or compute with static sun5 fallback
      const target = dayBreakdowns[targetDayIndex]
        || scoreForDay(station, snowData, null, null, station.sun5?.[targetDayIndex]);

      return {
        ...station,
        snowBase: snowMeasurement?.snowDepth ?? station.snowBase,
        fresh72: snowMeasurement?.fresh72h ?? station.fresh72,
        liveForecast: stationForecast,
        sun5: stationForecast ? stationForecast.map(f => f.sunH) : station.sun5,
        freshForecast: stationForecast
          ? Math.round(stationForecast.reduce((sum, f) => sum + (parseInt(f.snow, 10) || 0), 0))
          : station.freshForecast,
        avalancheLevel: avalancheData?.regions?.[station.slfRegionId]?.level ?? null,
        verdict: target.verdict,
        verdictScore: target.score,
        verdictBreakdown: target.breakdown,
        dayBreakdowns,
        targetDayLabel,
        targetDayIndex,
      };
    });
  }, [weatherData, snowData, avalancheData]);

  return {
    stations: enrichedStations,
    avalanche: avalancheData,
    isLoading,
    allFailed,
    hasAnyData: !!dashboard.data,
    lastUpdate,
    sourceStatus,
  };
}
