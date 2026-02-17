// School holidays & public holidays for ski crowd estimation
// Sources: CH cantonal calendars, FR Zone A/B/C, DE Baden-Württemberg/Bayern, BE
// Format: [start, end] inclusive date ranges (YYYY-MM-DD)

const SCHOOL_HOLIDAYS_2025_2026 = {
  // Switzerland — main ski cantons
  CH: [
    ["2025-12-20", "2026-01-04"], // Noël / Nouvel An
    ["2026-02-07", "2026-02-22"], // Carnaval / Relâches (varies by canton, wide window)
    ["2026-03-28", "2026-04-12"], // Pâques
  ],
  // France — Zone A (Lyon, Grenoble — closest to CH ski)
  FR_A: [
    ["2025-12-20", "2026-01-05"], // Noël
    ["2026-02-07", "2026-02-23"], // Hiver
    ["2026-04-04", "2026-04-20"], // Printemps
  ],
  // France — Zone B (borderlands)
  FR_B: [
    ["2025-12-20", "2026-01-05"],
    ["2026-02-21", "2026-03-09"],
    ["2026-04-18", "2026-05-04"],
  ],
  // Germany — Baden-Württemberg & Bayern (drive to CH)
  DE: [
    ["2025-12-22", "2026-01-05"], // Weihnachtsferien
    ["2026-02-16", "2026-02-20"], // Faschingsferien (Bayern)
    ["2026-03-30", "2026-04-10"], // Osterferien
  ],
  // Belgium
  BE: [
    ["2025-12-22", "2026-01-04"], // Noël
    ["2026-02-14", "2026-02-22"], // Carnaval
    ["2026-04-04", "2026-04-19"], // Pâques
  ],
};

// Swiss public holidays relevant to ski (national + common cantonal)
const PUBLIC_HOLIDAYS_2025_2026 = [
  "2025-12-25", // Noël
  "2025-12-26", // Saint-Étienne (many cantons)
  "2026-01-01", // Nouvel An
  "2026-01-02", // Berchtoldstag (BE, VD, FR, etc.)
  "2026-04-03", // Vendredi Saint
  "2026-04-06", // Lundi de Pâques
  "2026-05-14", // Ascension
  "2026-05-25", // Lundi de Pentecôte
];

// Peak weeks: Noël-Nouvel An + main February school holiday overlap
const PEAK_RANGES = [
  ["2025-12-20", "2026-01-04"], // Fêtes de fin d'année
  ["2026-02-14", "2026-02-22"], // Semaine la plus chargée (overlap CH + FR + BE)
];

function isInRange(dateStr, ranges) {
  return ranges.some(([start, end]) => dateStr >= start && dateStr <= end);
}

/**
 * Compute a crowd score from 0 (empty) to 15 (packed) based on calendar data.
 * @param {Date} date - the date to evaluate
 * @returns {number} crowd score 0-15
 */
export function computeCalendarCrowdScore(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const dateStr = `${y}-${m}-${d}`;
  const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Check peak periods first (overrides everything)
  if (isInRange(dateStr, PEAK_RANGES)) {
    return 15; // Maximum crowd
  }

  let score = 0;

  // Weekend base load
  if (isWeekend) score += 5;
  // Friday afternoon effect
  if (dayOfWeek === 5) score += 2;

  // Count how many country-holiday-ranges the date falls into
  let holidayCountries = 0;
  for (const [, ranges] of Object.entries(SCHOOL_HOLIDAYS_2025_2026)) {
    if (isInRange(dateStr, ranges)) holidayCountries++;
  }

  // More countries on holiday = more crowd
  if (holidayCountries >= 3) score += 8;
  else if (holidayCountries >= 2) score += 6;
  else if (holidayCountries >= 1) score += 4;

  // Public holidays
  if (PUBLIC_HOLIDAYS_2025_2026.includes(dateStr)) {
    score += 3;
  }

  return Math.min(score, 15);
}
