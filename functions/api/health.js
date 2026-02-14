export async function onRequestGet() {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "snowcheck.ch",
  });
}
