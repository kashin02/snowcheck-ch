// School holidays & public holidays for ski crowd estimation
// Sources: CH cantonal calendars (26 cantons), FR Zone A/B, DE Baden-Württemberg/Bayern,
//          BE (Belgium), NL (Netherlands), UK (England)
// Format: [start, end] inclusive date ranges (YYYY-MM-DD)

const SCHOOL_HOLIDAYS_2025_2026 = {
  // ── Swiss cantons (26) — keyed CH_XX ────────────────────────────────────
  // Romand cantons — sport break starts Feb 7
  CH_GE: [ // Geneva
    ["2025-12-20", "2026-01-04"],
    ["2026-02-07", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_VD: [ // Vaud
    ["2025-12-20", "2026-01-04"],
    ["2026-02-07", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_NE: [ // Neuchâtel
    ["2025-12-22", "2026-01-04"],
    ["2026-02-07", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_JU: [ // Jura
    ["2025-12-22", "2026-01-04"],
    ["2026-02-07", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_FR: [ // Fribourg (bilingual, follows Romand)
    ["2025-12-22", "2026-01-04"],
    ["2026-02-07", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_VS: [ // Valais (bilingual, follows Romand)
    ["2025-12-22", "2026-01-04"],
    ["2026-02-07", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_BE: [ // Bern (bilingual, follows Romand for sport break)
    ["2025-12-22", "2026-01-04"],
    ["2026-02-07", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_BS: [ // Basel-Stadt (follows Romand)
    ["2025-12-22", "2026-01-04"],
    ["2026-02-07", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],

  // German-speaking cantons — sport break starts Feb 14
  CH_BL: [ // Basel-Landschaft
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_SO: [ // Solothurn
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_ZH: [ // Zurich
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_LU: [ // Lucerne
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_ZG: [ // Zug
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_SH: [ // Schaffhausen
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_TG: [ // Thurgau
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_SZ: [ // Schwyz
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_NW: [ // Nidwalden
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_OW: [ // Obwalden
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_UR: [ // Uri
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_GL: [ // Glarus
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_AR: [ // Appenzell Ausserrhoden
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_AI: [ // Appenzell Innerrhoden
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_SG: [ // St. Gallen
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_AG: [ // Aargau
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-17"],
  ],
  CH_GR: [ // Graubünden — earlier Easter (ski canton)
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-03-28", "2026-04-12"],
  ],
  CH_TI: [ // Ticino — longer Christmas, earlier Easter
    ["2025-12-22", "2026-01-06"],
    ["2026-02-14", "2026-02-22"],
    ["2026-03-28", "2026-04-12"],
  ],

  // ── Foreign countries ────────────────────────────────────────────────────
  // France — Zone A (Lyon, Grenoble — closest to CH ski)
  FR_A: [
    ["2025-12-20", "2026-01-05"],
    ["2026-02-07", "2026-02-23"],
    ["2026-04-04", "2026-04-20"],
  ],
  // France — Zone B (borderlands)
  FR_B: [
    ["2025-12-20", "2026-01-05"],
    ["2026-02-21", "2026-03-09"],
    ["2026-04-18", "2026-05-04"],
  ],
  // Germany — Baden-Württemberg & Bayern
  DE: [
    ["2025-12-22", "2026-01-05"],
    ["2026-02-16", "2026-02-20"],
    ["2026-03-30", "2026-04-10"],
  ],
  // Belgium
  BE: [
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-19"],
  ],
  // Netherlands — combined window (Noord/Midden/Zuid regions)
  NL: [
    ["2025-12-22", "2026-01-04"],
    ["2026-02-14", "2026-03-01"],
    ["2026-04-04", "2026-04-17"],
  ],
  // United Kingdom — England
  UK: [
    ["2025-12-20", "2026-01-04"],
    ["2026-02-14", "2026-02-22"],
    ["2026-04-04", "2026-04-19"],
  ],
};

// Derived key lists (computed once)
const CH_KEYS = Object.keys(SCHOOL_HOLIDAYS_2025_2026).filter(k => k.startsWith("CH_"));
const FOREIGN_KEYS = ["FR_A", "FR_B", "DE", "BE", "NL", "UK"];

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

// Peak weeks: Noël-Nouvel An + core February overlap (all 26 cantons + most foreign)
const PEAK_RANGES = [
  ["2025-12-20", "2026-01-04"], // Fêtes de fin d'année
  ["2026-02-14", "2026-02-22"], // Semaine la plus chargée (all CH + NL + UK + BE + DE)
];

function isInRange(dateStr, ranges) {
  return ranges.some(([start, end]) => dateStr >= start && dateStr <= end);
}

/**
 * Compute a crowd score from 0 (empty) to 15 (packed) based on calendar data.
 *
 * Scoring:
 *   - Peak periods (PEAK_RANGES)      → 15 immediately
 *   - Weekend (Sat/Sun)               → +5
 *   - Friday                          → +2
 *   - CH cantons on holiday (0–26):
 *       ≥ 19 cantons                  → +6
 *       ≥  7 cantons                  → +4
 *       ≥  1 canton                   → +2
 *   - Foreign countries on holiday (0–6):
 *       ≥ 4 countries                 → +4
 *       ≥ 2 countries                 → +3
 *       ≥ 1 country                   → +2
 *   - Swiss public holiday            → +3
 *   - Capped at 15
 *
 * @param {Date} date - the date to evaluate
 * @returns {number} crowd score 0–15
 */
export function computeCalendarCrowdScore(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const dateStr = `${y}-${m}-${d}`;
  const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Peak periods override everything
  if (isInRange(dateStr, PEAK_RANGES)) {
    return 15;
  }

  let score = 0;

  // Weekend and Friday load
  if (isWeekend) score += 5;
  if (dayOfWeek === 5) score += 2;

  // Swiss cantons on holiday (counted separately — 26 cantons total)
  const chCount = CH_KEYS.filter(k => isInRange(dateStr, SCHOOL_HOLIDAYS_2025_2026[k])).length;
  if      (chCount >= 19) score += 6;
  else if (chCount >=  7) score += 4;
  else if (chCount >=  1) score += 2;

  // Foreign countries on holiday (6 entries total)
  const foreignCount = FOREIGN_KEYS.filter(k => isInRange(dateStr, SCHOOL_HOLIDAYS_2025_2026[k])).length;
  if      (foreignCount >= 4) score += 4;
  else if (foreignCount >= 2) score += 3;
  else if (foreignCount >= 1) score += 2;

  // Swiss public holidays
  if (PUBLIC_HOLIDAYS_2025_2026.includes(dateStr)) {
    score += 3;
  }

  return Math.min(score, 15);
}
