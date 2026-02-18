import { describe, it, expect } from "vitest";
import {
  visScore,
  flatLightScore,
  cloudScore,
  precipScore,
  humidityScore,
  immersionScore,
  computeHourlyJBI,
  processStation,
  getWeatherIcon,
} from "../functions/api/_fetchWeather.js";

// ─────────────────────────────────────────────────────────────────────────
// 1. visScore — visibility → 0-10
// ─────────────────────────────────────────────────────────────────────────
describe("visScore", () => {
  it("returns 10 for very poor visibility (<500m)", () => {
    expect(visScore(0)).toBe(10);
    expect(visScore(100)).toBe(10);
    expect(visScore(499)).toBe(10);
  });

  it("returns 8 for poor visibility (500-999m)", () => {
    expect(visScore(500)).toBe(8);
    expect(visScore(999)).toBe(8);
  });

  it("returns 6 for moderate visibility (1000-1999m)", () => {
    expect(visScore(1000)).toBe(6);
    expect(visScore(1999)).toBe(6);
  });

  it("returns 3 for decent visibility (2000-4999m)", () => {
    expect(visScore(2000)).toBe(3);
    expect(visScore(4999)).toBe(3);
  });

  it("returns 1 for good visibility (5000-9999m)", () => {
    expect(visScore(5000)).toBe(1);
    expect(visScore(9999)).toBe(1);
  });

  it("returns 0 for excellent visibility (>=10km)", () => {
    expect(visScore(10000)).toBe(0);
    expect(visScore(50000)).toBe(0);
  });

  it("returns 0 for null/undefined", () => {
    expect(visScore(null)).toBe(0);
    expect(visScore(undefined)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. flatLightScore — DNI/diffuse ratio → 0-10
// ─────────────────────────────────────────────────────────────────────────
describe("flatLightScore", () => {
  it("returns 0 at night", () => {
    expect(flatLightScore(100, 200, false)).toBe(0);
  });

  it("returns 9 when DNI is very low (<10)", () => {
    expect(flatLightScore(5, 200, true)).toBe(9);
    expect(flatLightScore(0, 100, true)).toBe(9);
  });

  it("returns 10 when diffuse fraction > 0.95", () => {
    // Note: dni < 10 triggers early return (9), so use dni >= 10
    // diffuse=200, dni=10, total=210.1 → fraction=200/210.1 ≈ 0.952
    expect(flatLightScore(10, 200, true)).toBe(10);
  });

  it("returns 8 when diffuse fraction > 0.85", () => {
    // diffuse=90, dni=14, total=104.1 → fraction ≈ 0.864
    expect(flatLightScore(14, 90, true)).toBe(8);
  });

  it("returns 5 when diffuse fraction > 0.70", () => {
    // diffuse=75, dni=30, total=105.1 → fraction ≈ 0.714
    expect(flatLightScore(30, 75, true)).toBe(5);
  });

  it("returns 2 when diffuse fraction > 0.50", () => {
    // diffuse=55, dni=50, total=105.1 → fraction ≈ 0.523
    expect(flatLightScore(50, 55, true)).toBe(2);
  });

  it("returns 0 when mostly direct light", () => {
    // diffuse=20, dni=80, total=100.1 → fraction ≈ 0.20
    expect(flatLightScore(80, 20, true)).toBe(0);
  });

  it("returns 0 when dni or diffuse is null (and dni >= 10)", () => {
    expect(flatLightScore(100, null, true)).toBe(0);
    expect(flatLightScore(null, null, true)).toBe(0);
  });

  it("returns 9 when dni is null (treated as < 10? no, returns 0)", () => {
    // dni == null → first check: dni != null (false) → skip
    // then: dni == null → return 0
    expect(flatLightScore(null, 200, true)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. cloudScore — cloud coverage → 0-10
// ─────────────────────────────────────────────────────────────────────────
describe("cloudScore", () => {
  it("returns 8-10 for very low clouds (>90%)", () => {
    expect(cloudScore(95, 0, 0)).toBe(8);
    expect(cloudScore(95, 60, 0)).toBe(10);   // low>90 + mid>50 = 8+2
  });

  it("returns 6-8 for low clouds (80-90%)", () => {
    expect(cloudScore(85, 0, 0)).toBe(6);
    expect(cloudScore(85, 70, 0)).toBe(8);   // low>80 + mid>60 = 6+2
  });

  it("returns 6 for low+mid combination (low>60 && mid>70)", () => {
    expect(cloudScore(65, 75, 0)).toBe(6);
  });

  it("returns 5 for heavy total overcast (>95%)", () => {
    expect(cloudScore(50, 50, 96)).toBe(5);
  });

  it("returns low/20 capped at 4 for lower cloud cover", () => {
    expect(cloudScore(40, 0, 0)).toBe(2);   // 40/20 = 2
    expect(cloudScore(80, 0, 0)).toBe(4);   // min(80/20, 4) = 4 - wait, low>80 hits the second branch
  });

  it("returns 0 for clear sky", () => {
    expect(cloudScore(0, 0, 0)).toBe(0);
  });

  it("handles null cloud values", () => {
    // null || 0 → 0 in the total calc
    expect(cloudScore(null, null, null)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. precipScore — WMO code + snowfall → 0-10
// ─────────────────────────────────────────────────────────────────────────
describe("precipScore", () => {
  it("returns 8 for fog (WMO 45, 48)", () => {
    expect(precipScore(45, 0)).toBe(8);
    expect(precipScore(48, 0)).toBe(8);
  });

  it("returns 6-10 for snow codes (WMO 71-77)", () => {
    expect(precipScore(71, 0)).toBe(6);    // 6 + min(0, 4) = 6
    expect(precipScore(73, 1)).toBe(8);    // 6 + min(2, 4) = 8
    expect(precipScore(75, 3)).toBe(10);   // 6 + min(6, 4) = 10
    expect(precipScore(77, 5)).toBe(10);   // 6 + min(10, 4) = 10
  });

  it("returns 3 for rain/drizzle codes (WMO 51-67)", () => {
    expect(precipScore(51, 0)).toBe(3);
    expect(precipScore(61, 0)).toBe(3);
    expect(precipScore(67, 0)).toBe(3);
  });

  it("returns score based on snowfall when no WMO match", () => {
    expect(precipScore(0, 3)).toBe(8);     // snowfall > 2
    expect(precipScore(0, 1)).toBe(5);     // snowfall > 0.5
    expect(precipScore(0, 0.3)).toBe(3);   // snowfall > 0
    expect(precipScore(0, 0)).toBe(0);     // no precip
  });

  it("returns 0 for clear conditions", () => {
    expect(precipScore(0, 0)).toBe(0);
    expect(precipScore(1, 0)).toBe(0);
    expect(precipScore(2, 0)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. humidityScore — relative humidity → 0-8
// ─────────────────────────────────────────────────────────────────────────
describe("humidityScore", () => {
  it("returns 8 for very high humidity (>98%)", () => {
    expect(humidityScore(99)).toBe(8);
    expect(humidityScore(100)).toBe(8);
  });

  it("returns 6 for high humidity (96-98%)", () => {
    expect(humidityScore(96)).toBe(6);
    expect(humidityScore(98)).toBe(6);
  });

  it("returns 3 for moderate humidity (91-95%)", () => {
    expect(humidityScore(91)).toBe(3);
    expect(humidityScore(95)).toBe(3);
  });

  it("returns 1 for slightly elevated humidity (86-90%)", () => {
    expect(humidityScore(86)).toBe(1);
    expect(humidityScore(90)).toBe(1);
  });

  it("returns 0 for normal humidity (<=85%)", () => {
    expect(humidityScore(85)).toBe(0);
    expect(humidityScore(50)).toBe(0);
    expect(humidityScore(0)).toBe(0);
  });

  it("returns 0 for null", () => {
    expect(humidityScore(null)).toBe(0);
    expect(humidityScore(undefined)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. immersionScore — freezing level vs station elevation → 0-9
// ─────────────────────────────────────────────────────────────────────────
describe("immersionScore", () => {
  it("returns 9 when below freezing level with heavy clouds", () => {
    expect(immersionScore(1500, 2000, 95)).toBe(9);
  });

  it("returns 6 when below freezing level with moderate clouds", () => {
    expect(immersionScore(1500, 2000, 75)).toBe(6);
  });

  it("returns 3 when freezing level is close to station (+500m)", () => {
    expect(immersionScore(2200, 2000, 50)).toBe(3); // 2200 < 2000+500
  });

  it("returns 0 when freezing level is well above station", () => {
    expect(immersionScore(3000, 2000, 90)).toBe(0);
  });

  it("returns 0 for null inputs", () => {
    expect(immersionScore(null, 2000, 90)).toBe(0);
    expect(immersionScore(1500, null, 90)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7. computeHourlyJBI — weighted composite of all components
// ─────────────────────────────────────────────────────────────────────────
describe("computeHourlyJBI", () => {
  const clearSkyParams = {
    vis: 50000,
    dni: 800,
    diffuse: 100,
    cloudLow: 0,
    cloudMid: 0,
    cloudHigh: 0,
    wmo: 0,
    snowfall: 0,
    rh: 40,
    freezingLevel: 3000,
    stationElev: 2000,
    isDay: true,
    cloudCover: 10,
    recentSnow: 0,
  };

  const whiteoutParams = {
    vis: 200,
    dni: 0,
    diffuse: 50,
    cloudLow: 95,
    cloudMid: 80,
    cloudHigh: 90,
    wmo: 73,
    snowfall: 3,
    rh: 99,
    freezingLevel: 1500,
    stationElev: 2000,
    isDay: true,
    cloudCover: 98,
    recentSnow: 20,
  };

  it("returns 0 at night regardless of conditions", () => {
    expect(computeHourlyJBI({ ...whiteoutParams, isDay: false })).toBe(0);
  });

  it("returns low JBI for clear sky day", () => {
    const jbi = computeHourlyJBI(clearSkyParams);
    expect(jbi).toBeLessThanOrEqual(2);
    expect(jbi).toBeGreaterThanOrEqual(0);
  });

  it("returns high JBI for whiteout conditions", () => {
    const jbi = computeHourlyJBI(whiteoutParams);
    expect(jbi).toBeGreaterThanOrEqual(7);
    expect(jbi).toBeLessThanOrEqual(10);
  });

  it("is always clamped to [0, 10]", () => {
    const jbi = computeHourlyJBI(whiteoutParams);
    expect(jbi).toBeLessThanOrEqual(10);
    expect(jbi).toBeGreaterThanOrEqual(0);
  });

  it("weights components correctly (25/20/20/15/10/10)", () => {
    // Isolate: only visibility contributes
    const onlyVis = {
      ...clearSkyParams,
      vis: 100, // visScore = 10
    };
    const jbi = computeHourlyJBI(onlyVis);
    // 10 * 0.25 = 2.5 expected base contribution
    expect(jbi).toBeGreaterThanOrEqual(2);
    expect(jbi).toBeLessThanOrEqual(3.5);
  });

  it("triggers synergy bonus when all conditions met", () => {
    // Need: recentSnow > 10 (albedo > 0.7), cloudCover > 95, vis < 2000 or fS > 7
    const withSynergy = {
      ...clearSkyParams,
      vis: 500,
      cloudCover: 98,
      cloudLow: 95,
      cloudMid: 80,
      recentSnow: 15,
      dni: 5,     // triggers flatLightScore = 9 (> 7)
      diffuse: 50,
    };
    const withoutSynergy = {
      ...withSynergy,
      recentSnow: 1,   // albedo = 0.5, synergy won't trigger
    };
    const jbiWith = computeHourlyJBI(withSynergy);
    const jbiWithout = computeHourlyJBI(withoutSynergy);
    expect(jbiWith).toBeGreaterThan(jbiWithout);
  });

  it("does not trigger synergy when cloudCover <= 95", () => {
    const noSynergy = {
      ...clearSkyParams,
      vis: 500,
      cloudCover: 90,  // not > 95
      recentSnow: 15,
    };
    const jbi = computeHourlyJBI(noSynergy);
    // Without synergy, moderate JBI
    expect(jbi).toBeLessThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 8. getWeatherIcon
// ─────────────────────────────────────────────────────────────────────────
describe("getWeatherIcon", () => {
  it("returns snowflake for heavy snow (>=5cm)", () => {
    expect(getWeatherIcon(5, 50)).toBe("❄️");
    expect(getWeatherIcon(10, 20)).toBe("❄️");
  });

  it("returns snow cloud for light snow (0-5cm)", () => {
    expect(getWeatherIcon(1, 50)).toBe("🌨️");
    expect(getWeatherIcon(0.1, 0)).toBe("🌨️");
  });

  it("returns sun for clear sky (<30% cloud)", () => {
    expect(getWeatherIcon(0, 0)).toBe("☀️");
    expect(getWeatherIcon(0, 29)).toBe("☀️");
  });

  it("returns partly cloudy for moderate clouds (30-70%)", () => {
    expect(getWeatherIcon(0, 30)).toBe("⛅");
    expect(getWeatherIcon(0, 69)).toBe("⛅");
  });

  it("returns overcast for heavy clouds (>=70%)", () => {
    expect(getWeatherIcon(0, 70)).toBe("☁️");
    expect(getWeatherIcon(0, 100)).toBe("☁️");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 9. processStation — transforms raw API data into forecast
// ─────────────────────────────────────────────────────────────────────────
describe("processStation", () => {
  it("returns null for null/undefined input", () => {
    expect(processStation(null)).toBe(null);
    expect(processStation(undefined)).toBe(null);
  });

  it("returns null when daily data is missing", () => {
    expect(processStation({ hourly: {} })).toBe(null);
  });

  it("processes a minimal valid station", () => {
    const raw = {
      elevation: 2000,
      daily: {
        time: ["2026-01-15"],
        snowfall_sum: [5.2],
        sunshine_duration: [18000], // 5 hours in seconds
        temperature_2m_max: [-2.5],
        temperature_2m_min: [-8.3],
        wind_speed_10m_max: [35],
        cloud_cover_mean: [65],
      },
      hourly: {
        time: [],
        visibility: [],
        cloud_cover: [],
        cloud_cover_low: [],
        cloud_cover_mid: [],
        cloud_cover_high: [],
        direct_normal_irradiance: [],
        diffuse_radiation: [],
        weather_code: [],
        relative_humidity_2m: [],
        snowfall: [],
        freezing_level_height: [],
        is_day: [],
      },
    };

    const result = processStation(raw);
    expect(result).not.toBeNull();
    expect(result.forecast).toHaveLength(1);

    const day = result.forecast[0];
    expect(day.date).toBe("2026-01-15");
    expect(day.snowfallSum).toBe(5.2);
    expect(day.sunshineHours).toBe(5);     // 18000/3600 = 5
    expect(day.tempMax).toBe(-2.5);
    expect(day.tempMin).toBe(-8.3);
    expect(day.windMax).toBe(35);
    expect(day.cloudCover).toBe(65);
    expect(day.dayShort).toBe("Jeu");      // 2026-01-15 = Thursday
  });

  it("calculates JBI only for hours 9-16", () => {
    const raw = {
      elevation: 2000,
      daily: {
        time: ["2026-01-15"],
        snowfall_sum: [0],
        sunshine_duration: [0],
        temperature_2m_max: [0],
        temperature_2m_min: [0],
        wind_speed_10m_max: [0],
        cloud_cover_mean: [0],
      },
      hourly: {
        // 3 hours: 8:00 (excluded), 12:00 (included), 18:00 (excluded)
        time: ["2026-01-15T08:00", "2026-01-15T12:00", "2026-01-15T18:00"],
        visibility: [100, 100, 100],
        cloud_cover: [95, 95, 95],
        cloud_cover_low: [90, 90, 90],
        cloud_cover_mid: [80, 80, 80],
        cloud_cover_high: [70, 70, 70],
        direct_normal_irradiance: [0, 0, 0],
        diffuse_radiation: [50, 50, 50],
        weather_code: [73, 73, 73],
        relative_humidity_2m: [99, 99, 99],
        snowfall: [3, 3, 3],
        freezing_level_height: [1500, 1500, 1500],
        is_day: [1, 1, 0],
      },
    };

    const result = processStation(raw);
    const day = result.forecast[0];
    // Only hour 12:00 is included (9-16 range, is_day=1)
    // Hour 08:00 is excluded (< 9)
    // Hour 18:00 is excluded (> 16 and is_day=0)
    expect(day.jourBlancIndex).toBeGreaterThan(0);
  });

  it("computes correct jourBlancHours (hours with JBI >= 5)", () => {
    const raw = {
      elevation: 2000,
      daily: {
        time: ["2026-01-15"],
        snowfall_sum: [5],
        sunshine_duration: [0],
        temperature_2m_max: [0],
        temperature_2m_min: [0],
        wind_speed_10m_max: [0],
        cloud_cover_mean: [95],
      },
      hourly: {
        time: [
          "2026-01-15T09:00", "2026-01-15T10:00", "2026-01-15T11:00",
          "2026-01-15T12:00", "2026-01-15T13:00", "2026-01-15T14:00",
          "2026-01-15T15:00", "2026-01-15T16:00",
        ],
        visibility: [200, 200, 200, 200, 200, 200, 200, 200],
        cloud_cover: [98, 98, 98, 98, 98, 98, 98, 98],
        cloud_cover_low: [95, 95, 95, 95, 95, 95, 95, 95],
        cloud_cover_mid: [80, 80, 80, 80, 80, 80, 80, 80],
        cloud_cover_high: [70, 70, 70, 70, 70, 70, 70, 70],
        direct_normal_irradiance: [0, 0, 0, 0, 0, 0, 0, 0],
        diffuse_radiation: [50, 50, 50, 50, 50, 50, 50, 50],
        weather_code: [73, 73, 73, 73, 73, 73, 73, 73],
        relative_humidity_2m: [99, 99, 99, 99, 99, 99, 99, 99],
        snowfall: [3, 3, 3, 3, 3, 3, 3, 3],
        freezing_level_height: [1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500],
        is_day: [1, 1, 1, 1, 1, 1, 1, 1],
      },
    };

    const result = processStation(raw);
    const day = result.forecast[0];
    // All 8 hours should have high JBI (whiteout conditions)
    expect(day.jourBlancHours).toBeGreaterThanOrEqual(6);
    expect(day.jourBlancPeak).toBeGreaterThanOrEqual(7);
  });

  it("converts sunshine_duration from seconds to hours", () => {
    const raw = {
      elevation: 1500,
      daily: {
        time: ["2026-01-15"],
        snowfall_sum: [0],
        sunshine_duration: [28800], // 8 hours
        temperature_2m_max: [5],
        temperature_2m_min: [-3],
        wind_speed_10m_max: [10],
        cloud_cover_mean: [20],
      },
      hourly: { time: [], visibility: [], cloud_cover: [], cloud_cover_low: [], cloud_cover_mid: [], cloud_cover_high: [], direct_normal_irradiance: [], diffuse_radiation: [], weather_code: [], relative_humidity_2m: [], snowfall: [], freezing_level_height: [], is_day: [] },
    };

    const result = processStation(raw);
    expect(result.forecast[0].sunshineHours).toBe(8);
  });

  it("handles missing hourly data gracefully", () => {
    const raw = {
      elevation: 2000,
      daily: {
        time: ["2026-01-15"],
        snowfall_sum: [0],
        sunshine_duration: [3600],
        temperature_2m_max: [0],
        temperature_2m_min: [0],
        wind_speed_10m_max: [0],
        cloud_cover_mean: [0],
      },
      // No hourly data at all
    };

    const result = processStation(raw);
    expect(result).not.toBeNull();
    expect(result.forecast[0].jourBlancIndex).toBe(0);
  });

  it("rounds values correctly", () => {
    const raw = {
      elevation: 1500,
      daily: {
        time: ["2026-01-15"],
        snowfall_sum: [3.456],
        sunshine_duration: [12345],
        temperature_2m_max: [-1.234],
        temperature_2m_min: [-5.678],
        wind_speed_10m_max: [42.7],
        cloud_cover_mean: [55.3],
      },
      hourly: { time: [], visibility: [], cloud_cover: [], cloud_cover_low: [], cloud_cover_mid: [], cloud_cover_high: [], direct_normal_irradiance: [], diffuse_radiation: [], weather_code: [], relative_humidity_2m: [], snowfall: [], freezing_level_height: [], is_day: [] },
    };

    const result = processStation(raw);
    const day = result.forecast[0];
    expect(day.snowfallSum).toBe(3.5);         // round to 1 decimal
    expect(day.sunshineHours).toBe(3.4);       // 12345/3600 = 3.429, rounded to 3.4
    expect(day.tempMax).toBe(-1.2);            // round to 1 decimal
    expect(day.tempMin).toBe(-5.7);            // round to 1 decimal
    expect(day.windMax).toBe(43);              // rounded to integer
    expect(day.cloudCover).toBe(55);           // rounded to integer
  });

  it("produces correct dayShort labels (FR)", () => {
    const days = ["2026-01-11", "2026-01-12", "2026-01-13", "2026-01-14", "2026-01-15", "2026-01-16", "2026-01-17"];
    const expected = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    const raw = {
      elevation: 1500,
      daily: {
        time: days,
        snowfall_sum: days.map(() => 0),
        sunshine_duration: days.map(() => 0),
        temperature_2m_max: days.map(() => 0),
        temperature_2m_min: days.map(() => 0),
        wind_speed_10m_max: days.map(() => 0),
        cloud_cover_mean: days.map(() => 0),
      },
      hourly: { time: [], visibility: [], cloud_cover: [], cloud_cover_low: [], cloud_cover_mid: [], cloud_cover_high: [], direct_normal_irradiance: [], diffuse_radiation: [], weather_code: [], relative_humidity_2m: [], snowfall: [], freezing_level_height: [], is_day: [] },
    };

    const result = processStation(raw);
    result.forecast.forEach((day, i) => {
      expect(day.dayShort).toBe(expected[i]);
    });
  });
});
