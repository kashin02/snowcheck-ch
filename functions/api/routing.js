const CACHE_TTL = 86400; // 24 hours — routes don't change

export async function onRequestGet(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const coords = url.searchParams.get("coords");

  if (!coords) {
    return Response.json({ error: "Missing coords parameter" }, { status: 400 });
  }

  // Cache key based on coords (same NPA → same result)
  const cacheKey = `routing:${coords.slice(0, 30)}`;

  try {
    const cached = await env.CACHE_KV.get(cacheKey, "json");
    if (cached) {
      return Response.json(cached, {
        headers: { "X-Cache": "HIT", "Access-Control-Allow-Origin": "*" },
      });
    }
  } catch {
    // KV not available
  }

  // Call OSRM table API — sources=0 means only compute FROM the first coord TO all others
  const osrmUrl = `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=duration,distance`;

  const res = await fetch(osrmUrl, {
    headers: { "User-Agent": "snowcheck-ch/1.0" },
  });

  if (!res.ok) {
    return Response.json({ error: "OSRM API error" }, { status: 502 });
  }

  const data = await res.json();

  if (data.code !== "Ok") {
    return Response.json({ error: data.code, message: data.message }, { status: 502 });
  }

  const result = {
    durations: data.durations,
    distances: data.distances,
  };

  // Cache result
  try {
    await env.CACHE_KV.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL });
  } catch {
    // KV not available
  }

  return Response.json(result, {
    headers: {
      "X-Cache": "MISS",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
