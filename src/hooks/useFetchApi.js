import { useState, useEffect, useRef } from "react";

const MAX_RETRIES = 3;
const TIMEOUT_MS = 6000;   // 6s per attempt — user accepts 1-2s, leave headroom
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

export default function useFetchApi(url) {
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
          const d = await fetchWithTimeout(url, TIMEOUT_MS);
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
  }, [url]);

  return { data, loading, error };
}
