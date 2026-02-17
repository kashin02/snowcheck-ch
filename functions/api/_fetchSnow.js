import { fetchRetry } from "./_helpers.js";

const IMIS_CODES = [
  "SAA2", "ANV3", "DIA2", "CHA2", "ANZ2",
  "CHX2", "STL2", "ARO2", "LAU2", "GUT2",
  "CHA3", "SRB2", "MEL2", "MUN2", "JAU2",
  "MOL2", "PLI2", "BER2", "BEL2", "EVO2", "SIM2",
];

const STATION_STALE_AGE = 1800;      // 30 min — per-station freshness window
const MAX_FAIL_COUNT = 3;             // consecutive failures before circuit opens
const CIRCUIT_OPEN_DURATION = 600;    // 10 min cooldown after circuit opens

// ── Fetch a single IMIS station (with retry) ────────────────────────────

async function fetchSingleStation(code, timeout) {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 72 * 3600 * 1000);
  const from = threeDaysAgo.toISOString().slice(0, 19) + "Z";
  const to = now.toISOString().slice(0, 19) + "Z";

  const url = `https://measurement-api.slf.ch/public/api/imis/station/${code}/measurements?from=${from}&to=${to}`;
  const res = await fetchRetry(url, { timeout, retries: 1 });
  const measurements = await res.json();

  if (!Array.isArray(measurements) || measurements.length === 0) return null;

  const latest = measurements[measurements.length - 1];
  const oldest = measurements[0];

  const currentHS = latest.HS != null ? Math.round(latest.HS) : null;
  const oldHS = oldest.HS != null ? Math.round(oldest.HS) : null;
  const fresh72h = (currentHS != null && oldHS != null) ? Math.max(0, currentHS - oldHS) : null;

  return {
    fetchedAt: new Date().toISOString(),
    failCount: 0,
    lastFailAt: null,
    updatedAt: latest.measurementDate || new Date().toISOString(),
    snowDepth: currentHS,
    fresh72h,
    temperature: latest.TA != null ? Math.round(latest.TA * 10) / 10 : null,
    windSpeed: latest.VW != null ? Math.round(latest.VW * 10) / 10 : null,
    windDirection: latest.DW != null ? Math.round(latest.DW) : null,
    solarRadiation: latest.ISWR != null ? Math.round(latest.ISWR) : null,
    relativeHumidity: latest.RH != null ? Math.round(latest.RH) : null,
  };
}

// ── Main entry: fetch only stale/missing/failed stations ────────────────

export async function fetchSnowData({ timeout = 8000, cachedStations = {} } = {}) {
  const now = Date.now();
  const toFetch = [];
  const data = {};

  for (const code of IMIS_CODES) {
    const cached = cachedStations[code];

    // Circuit breaker: skip stations that have failed too many times recently
    if (cached?.failCount >= MAX_FAIL_COUNT && cached.lastFailAt) {
      const elapsed = (now - new Date(cached.lastFailAt).getTime()) / 1000;
      if (elapsed < CIRCUIT_OPEN_DURATION) {
        data[code] = cached;
        continue;
      }
      // Cooldown passed → attempt half-open fetch below
    }

    // Freshness check: reuse cached station data if still within threshold
    if (cached?.fetchedAt && cached.snowDepth != null) {
      const age = (now - new Date(cached.fetchedAt).getTime()) / 1000;
      if (age < STATION_STALE_AGE) {
        data[code] = cached;
        continue;
      }
    }

    toFetch.push(code);
  }

  // Fetch only the stations that need updating
  if (toFetch.length > 0) {
    const results = await Promise.all(
      toFetch.map(async (code) => {
        try {
          return await fetchSingleStation(code, timeout);
        } catch {
          return null;
        }
      }),
    );

    toFetch.forEach((code, i) => {
      if (results[i]) {
        data[code] = results[i];
      } else {
        // Fetch failed: keep stale data but increment failure counter
        const prev = cachedStations[code] || {};
        data[code] = {
          ...prev,
          failCount: (prev.failCount || 0) + 1,
          lastFailAt: new Date().toISOString(),
        };
      }
    });
  }

  if (Object.keys(data).length === 0) {
    throw new Error("All IMIS stations failed");
  }

  return { stations: data };
}
