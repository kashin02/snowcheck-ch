import { useMemo } from "react";
import { stations as staticStations } from "../data/stations";
import useWeatherData from "./useWeatherData";
import useAvalancheData from "./useAvalancheData";
import useSnowMeasurements from "./useSnowMeasurements";

function computeVerdict(station, weatherData, snowData) {
  const snow = snowData?.stations?.[station.imisCode];
  const weather = weatherData?.stations?.[station.id];

  // Fallback to static verdict if no API data
  if (!snow && !weather) return station.verdict;

  const depth = snow?.snowDepth ?? station.snowBase;
  const fresh72 = snow?.fresh72h ?? station.fresh72;
  const forecastSnow = weather?.forecast
    ? weather.forecast.reduce((sum, d) => sum + (d.snowfallSum || 0), 0)
    : station.freshForecast;
  const { pistesOpen, pistesTotal } = station.operational;
  const openRatio = pistesTotal > 0 ? pistesOpen / pistesTotal : 0;

  let score = 0;
  if (depth > 100) score += 3; else if (depth > 50) score += 2; else if (depth > 20) score += 1;
  if (fresh72 > 30) score += 2; else if (fresh72 > 10) score += 1;
  if (forecastSnow > 30) score += 1;
  if (openRatio > 0.7) score += 2; else if (openRatio > 0.4) score += 1;

  if (score >= 7) return "top";
  if (score >= 4) return "good";
  if (score >= 2) return "ok";
  return "bad";
}

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function buildForecastForStation(station, weatherData) {
  const weather = weatherData?.stations?.[station.id];
  if (!weather?.forecast) return null;

  return weather.forecast.map((day) => ({
    day: day.dayShort || DAYS_FR[new Date(day.date).getDay()],
    date: day.date,
    icon: day.icon,
    sun: Math.round(day.sunshineHours || 0),
    snow: String(Math.round(day.snowfallSum || 0)),
    wind: day.windMax || 0,
    accent: (day.snowfallSum || 0) >= 30 || (day.windMax || 0) >= 60,
    sunH: Math.round(day.sunshineHours || 0),
  }));
}

export default function useDashboardData() {
  const weather = useWeatherData();
  const avalanche = useAvalancheData();
  const snow = useSnowMeasurements();

  const isLoading = weather.loading && avalanche.loading && snow.loading;
  const hasAnyData = weather.data || avalanche.data || snow.data;
  const allFailed = weather.error && avalanche.error && snow.error && !hasAnyData;

  const lastUpdate = weather.data?.updatedAt || snow.data?.updatedAt || null;

  const enrichedStations = useMemo(() => {
    return staticStations.map(station => {
      const snowMeasurement = snow.data?.stations?.[station.imisCode];
      const stationForecast = buildForecastForStation(station, weather.data);

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
        // Computed verdict
        verdict: computeVerdict(station, weather.data, snow.data),
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
