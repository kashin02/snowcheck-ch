const CACHE_TTL = 3600; // 60 minutes

const DANGER_MAP = {
  "low": 1,
  "moderate": 2,
  "considerable": 3,
  "high": 4,
  "very_high": 5,
};

const DANGER_LABELS = {
  1: "Faible",
  2: "Limit\u00E9",
  3: "Marqu\u00E9",
  4: "Fort",
  5: "Tr\u00E8s fort",
};

export async function onRequestGet(context) {
  const { env } = context;
  const cacheKey = "avalanche:bulletin";

  // Check cache
  try {
    const cached = await env.CACHE_KV.get(cacheKey, "json");
    if (cached) {
      return Response.json(cached, { headers: { "X-Cache": "HIT", "Access-Control-Allow-Origin": "*" } });
    }
  } catch {
    // KV not available
  }

  const response = await fetch("https://aws.slf.ch/api/bulletin/caaml/fr/json");
  if (!response.ok) {
    return Response.json({ error: "SLF API error" }, { status: 502 });
  }

  const raw = await response.json();

  // Parse CAAML bulletin
  const regions = {};
  let maxDanger = 0;

  const bulletins = raw?.bulletins || raw || [];
  const bulletinList = Array.isArray(bulletins) ? bulletins : [];

  for (const bulletin of bulletinList) {
    const dangerRatings = bulletin.dangerRatings || [];
    const mainRating = dangerRatings[0];
    if (!mainRating) continue;

    const dangerText = mainRating.mainValue || "low";
    const level = DANGER_MAP[dangerText] || 1;
    if (level > maxDanger) maxDanger = level;

    const bulletinRegions = bulletin.regions || [];
    for (const r of bulletinRegions) {
      const regionId = r.regionID || r.id;
      if (regionId) {
        regions[regionId] = {
          danger: dangerText,
          level,
          label: DANGER_LABELS[level] || dangerText,
          name: r.name || regionId,
        };
      }
    }
  }

  const result = {
    updatedAt: new Date().toISOString(),
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

  // Store in cache
  try {
    await env.CACHE_KV.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL });
  } catch {
    // KV not available
  }

  return Response.json(result, { headers: { "X-Cache": "MISS", "Access-Control-Allow-Origin": "*" } });
}
