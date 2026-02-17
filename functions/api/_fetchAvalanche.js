import { fetchRetry } from "./_helpers.js";

const DANGER_MAP = { low: 1, moderate: 2, considerable: 3, high: 4, very_high: 5 };
const DANGER_LABELS = { 1: "Faible", 2: "Limité", 3: "Marqué", 4: "Fort", 5: "Très fort" };

export async function fetchAvalancheData({ timeout = 10000, retries = 2 } = {}) {
  const response = await fetchRetry("https://aws.slf.ch/api/bulletin/caaml/fr/json", { timeout, retries });
  const raw = await response.json();

  const regions = {};
  let maxDanger = 0;

  const bulletins = raw?.bulletins || raw || [];
  const bulletinList = Array.isArray(bulletins) ? bulletins : [];

  for (const bulletin of bulletinList) {
    const mainRating = (bulletin.dangerRatings || [])[0];
    if (!mainRating) continue;

    const dangerText = mainRating.mainValue || "low";
    const level = DANGER_MAP[dangerText] || 1;
    if (level > maxDanger) maxDanger = level;

    for (const r of (bulletin.regions || [])) {
      const regionId = r.regionID || r.id;
      if (regionId) {
        regions[regionId] = {
          danger: dangerText, level,
          label: DANGER_LABELS[level] || dangerText,
          name: r.name || regionId,
        };
      }
    }
  }

  return {
    maxDanger,
    maxDangerLabel: DANGER_LABELS[maxDanger] || "Inconnu",
    regions,
    summary: Object.values(
      Object.values(regions).reduce((acc, r) => {
        if (!acc[r.level]) acc[r.level] = { level: r.level, label: r.label, count: 0 };
        acc[r.level].count++;
        return acc;
      }, {})
    ).sort((a, b) => b.level - a.level),
  };
}
