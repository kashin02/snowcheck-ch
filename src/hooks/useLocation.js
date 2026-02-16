import { useState, useEffect, useCallback, useRef } from "react";
import { npaData } from "../data/npaData";

// Build a Map for fast NPA→entry lookup
const npaMap = new Map();
for (const entry of npaData) {
  npaMap.set(entry[0], entry);
}

const LS_NPA_KEY = "snowcheck-npa";
const LS_CACHE_KEY = "snowcheck-routing-cache";
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24h

function readRoutingCache(npa) {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    if (cache.npa === npa && Date.now() - cache.ts < CACHE_MAX_AGE) {
      return cache.data;
    }
  } catch { /* ignore */ }
  return null;
}

function writeRoutingCache(npa, data) {
  try {
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify({ npa, data, ts: Date.now() }));
  } catch { /* ignore */ }
}

/**
 * Search NPA data — matches by code prefix or place name substring.
 * Returns at most `limit` results.
 */
export function searchNpa(query, limit = 8) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const isNum = /^\d+$/.test(query);
  const results = [];

  for (const entry of npaData) {
    if (results.length >= limit) break;
    if (isNum) {
      if (entry[0].startsWith(query)) results.push(entry);
    } else {
      if (entry[1].toLowerCase().includes(q)) results.push(entry);
    }
  }
  return results;
}

/**
 * Compute proximity bonus from travel duration in minutes.
 * Returns 0–15 bonus points.
 */
export function proximityBonus(durationMin) {
  if (durationMin == null) return 0;
  if (durationMin < 30) return 15;
  if (durationMin < 60) return 10;
  if (durationMin < 90) return 5;
  if (durationMin < 120) return 2;
  return 0;
}

/**
 * Hook managing user location (NPA), travel time computation, and localStorage persistence.
 */
export default function useLocation(stations) {
  const [npa, setNpaState] = useState(() => {
    try { return localStorage.getItem(LS_NPA_KEY) || ""; } catch { return ""; }
  });
  const [npaName, setNpaName] = useState("");
  const [travelTimes, setTravelTimes] = useState(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  // Resolve NPA to coordinates
  const userCoords = npa ? (() => {
    const entry = npaMap.get(npa);
    return entry ? { lat: entry[2], lon: entry[3], name: entry[1] } : null;
  })() : null;

  // Set NPA and persist
  const setNpa = useCallback((code, name) => {
    setNpaState(code);
    setNpaName(name || "");
    try {
      if (code) localStorage.setItem(LS_NPA_KEY, code);
      else localStorage.removeItem(LS_NPA_KEY);
    } catch { /* ignore */ }
    if (!code) setTravelTimes(null);
  }, []);

  // Resolve saved NPA name on mount
  useEffect(() => {
    if (npa && !npaName) {
      const entry = npaMap.get(npa);
      if (entry) setNpaName(entry[1]);
    }
  }, [npa, npaName]);

  // Fetch travel times from OSRM when userCoords or stations change
  useEffect(() => {
    if (!userCoords || !stations || stations.length === 0) {
      setTravelTimes(null);
      return;
    }

    // Check localStorage cache first
    const cached = readRoutingCache(npa);
    if (cached) {
      setTravelTimes(cached);
      return;
    }

    // Build OSRM table request: user coords first, then all stations
    const stationCoordStr = stations
      .map(s => `${s.coordinates.lon},${s.coordinates.lat}`)
      .join(";");
    const coordsParam = `${userCoords.lon},${userCoords.lat};${stationCoordStr}`;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    fetch(`/api/routing?coords=${encodeURIComponent(coordsParam)}`, {
      signal: controller.signal,
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setTravelTimes(null); return; }

        const times = {};
        stations.forEach((s, i) => {
          const duration = data.durations?.[0]?.[i + 1];
          const distance = data.distances?.[0]?.[i + 1];
          if (duration != null && duration !== null) {
            times[s.id] = {
              durationMin: Math.round(duration / 60),
              distanceKm: Math.round(distance / 1000),
            };
          }
        });
        setTravelTimes(times);
        writeRoutingCache(npa, times);
      })
      .catch(err => {
        if (err.name !== "AbortError") setTravelTimes(null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [userCoords?.lat, userCoords?.lon, stations.length, npa]);

  return { npa, npaName, setNpa, userCoords, travelTimes, loading };
}
