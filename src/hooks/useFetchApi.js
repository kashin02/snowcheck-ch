import { useState, useEffect, useRef } from "react";

const DEFAULT_TIMEOUT = 15000; // 15s — most requests return <100ms from KV
const MAX_RETRIES = 3;
const RETRY_DELAYS = [800, 1600]; // wait before 2nd and 3rd attempt

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: controller.signal });
    if (!r.ok) throw new Error(`API ${url}: ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function useFetchApi(url, { timeout = DEFAULT_TIMEOUT } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    attemptRef.current = 0;

    async function run() {
      let lastErr = null;
      for (let i = 0; i < MAX_RETRIES; i++) {
        if (cancelled) return;
        attemptRef.current = i + 1;
        // Wait before retry (not before first attempt)
        if (i > 0 && RETRY_DELAYS[i - 1]) {
          await delay(RETRY_DELAYS[i - 1]);
          if (cancelled) return;
        }
        try {
          const d = await fetchWithTimeout(url, timeout);
          if (!cancelled) {
            setData(d);
            setError(null);
            setLoading(false);
          }
          return; // success
        } catch (e) {
          lastErr = e;
        }
      }
      // All retries exhausted
      if (!cancelled) {
        setError(lastErr?.message || "Fetch failed");
        setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [url, timeout]);

  return { data, loading, error };
}
