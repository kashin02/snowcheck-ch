export default function ForecastRow({ forecast, sun5, freshForecast }) {
  const totalSun = sun5.reduce((a, b) => a + b, 0);

  return (
    <div style={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Pr&eacute;visions 5 jours</div>
      <div style={{ display: "flex", gap: 2, minWidth: "fit-content" }}>
        {forecast.map((f, fi) => {
          const sunH = sun5[fi];
          const snowCm = parseInt(f.snow) || 0;
          return (
            <div key={fi} style={{
              flex: "1 1 0", minWidth: 58, padding: "5px 4px 4px", borderRadius: 5, textAlign: "center",
              background: f.accent ? "#fef2f2" : "#f8fafc",
              border: f.accent ? "1.5px solid #fecaca" : "1px solid #f1f5f9",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: f.accent ? "#dc2626" : "#475569", marginBottom: 2 }}>{f.day}</div>
              <div style={{ fontSize: 16, lineHeight: 1, marginBottom: 2 }}>{f.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: sunH >= 3 ? "#b45309" : sunH > 0 ? "#d97706" : "#d1d5db" }}>{"\u2600"} {sunH}h</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: snowCm >= 20 ? "#059669" : snowCm > 0 ? "#3b82f6" : "#d1d5db", marginTop: 1 }}>{"\u2744"} {snowCm > 0 ? `${snowCm}` : "\u2014"}</div>
              {f.wind >= 50 && <div style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", marginTop: 1 }}>{"\uD83D\uDCA8"} {f.wind}</div>}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 4 }}>
        Total : <b style={{ color: totalSun >= 8 ? "#b45309" : "#64748b" }}>{"\u2600"} {totalSun}h</b>
        {freshForecast > 0 && <span style={{ marginLeft: 8, fontWeight: 600, color: freshForecast >= 30 ? "#059669" : "#64748b" }}>{"\u2744"} +{freshForecast}cm cumul&eacute;s</span>}
      </div>
    </div>
  );
}
