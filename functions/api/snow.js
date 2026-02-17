import { cacheGet, cachePut } from "./_helpers.js";

const CACHE_TTL = 1800; // 30 minutes

const IMIS_CODES = [
  "SAA2", "ANV3", "DIA2", "CHA2", "ANZ2",
  "CHX2", "STL2", "ARO2", "LAU2", "GUT2",
  "CHA3", "SRB2", "MEL2", "MUN2", "JAU2",
  "MOL2", "PLI2", "BER2", "BEL2", "EVO2", "SIM2",
];

export async function onRequestGet(context) {
  const { env } = context;
  const hit = await cacheGet(env, "snow:all");
  if (hit) return hit;

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const from = threeDaysAgo.toISOString().slice(0, 19) + "Z";
  const to = now.toISOString().slice(0, 19) + "Z";

  const data = {};

  const fetches = IMIS_CODES.map(async (code) => {
    try {
      const url = `https://measurement-api.slf.ch/public/api/imis/station/${code}/measurements?from=${from}&to=${to}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return;

      const measurements = await res.json();
      if (!Array.isArray(measurements) || measurements.length === 0) return;

      const latest = measurements[measurements.length - 1];
      const oldest = measurements[0];

      const currentHS = latest.HS != null ? Math.round(latest.HS) : null;
      const oldHS = oldest.HS != null ? Math.round(oldest.HS) : null;
      const fresh72h = (currentHS != null && oldHS != null) ? Math.max(0, currentHS - oldHS) : null;

      data[code] = {
        updatedAt: latest.measurementDate || new Date().toISOString(),
        snowDepth: currentHS,
        fresh72h,
        temperature: latest.TA != null ? Math.round(latest.TA * 10) / 10 : null,
        windSpeed: latest.VW != null ? Math.round(latest.VW * 10) / 10 : null,
        windDirection: latest.DW != null ? Math.round(latest.DW) : null,
      };
    } catch {
      // Skip failed station
    }
  });

  await Promise.all(fetches);

  const result = { updatedAt: new Date().toISOString(), stations: data };
  return cachePut(env, "snow:all", result, CACHE_TTL);
}
