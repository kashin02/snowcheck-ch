import { computeCalendarCrowdScore } from "../data/crowdCalendar";
import { scoreToVerdict } from "../data/constants";

// ── Target day: after 15h Swiss time, focus on tomorrow ────────────────
export function getSwissTargetDayIndex() {
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
export const thresholdScore = (thresholds, fallback = 0) => (v) => {
  for (const [min, pts] of thresholds) if (v >= min) return pts;
  return fallback;
};

export const scoreSun    = thresholdScore([[8, 35], [6, 28], [4, 20], [2, 12], [1, 5]]);   // max +35
export const scoreFresh  = thresholdScore([[50, 30], [30, 24], [15, 18], [5, 10], [1, 4]]); // max +30
export const scoreDepth  = thresholdScore([[150, 20], [100, 16], [60, 12], [30, 6]]);       // max +20
export const scorePistes = thresholdScore([[100, 15], [60, 12], [30, 8], [15, 4]], 1);      // max +15
export const penaltyJB   = thresholdScore([[7, -30], [5, -22], [3, -12], [1, -5]]);         // max −30 (JBI 0-10)
export const penaltyWind = thresholdScore([[80, -20], [60, -15], [40, -8], [25, -3]]);      // max −20

// ── Score a single day ──────────────────────────────────────────────────
export function scoreForDay(station, snowData, dayForecast, dateStr, fallbackSun) {
  const snow = snowData?.stations?.[station.imisCode];
  const depth = snow?.snowDepth ?? station.snowBase;
  const fresh72 = snow?.fresh72h ?? station.fresh72;
  const { pistesOpen } = station.operational;

  const sunHours = dayForecast?.sunshineHours ?? (fallbackSun || 0);
  const windMax = dayForecast?.windMax ?? 0;
  const jourBlancIdx = dayForecast?.jourBlancIndex ?? 0;
  const targetDate = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
  const crowdScore = computeCalendarCrowdScore(targetDate);

  const sunPts = scoreSun(sunHours);
  const freshPts = scoreFresh(fresh72);
  const depthPts = scoreDepth(depth);
  const pistesPts = scorePistes(pistesOpen);
  const jbPts = penaltyJB(jourBlancIdx);
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
      jourBlanc: { pts: jbPts, min: -30, value: jourBlancIdx, unit: "/10" },
      wind: { pts: windPts, min: -20, value: windMax, unit: "km/h" },
      crowd: { pts: crowdPts, min: -15, value: crowdScore, unit: "/15" },
    },
  };
}
