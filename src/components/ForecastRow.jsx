const VERDICT_COLORS = {
  top: "#059669",
  good: "#2563eb",
  ok: "#d97706",
  bad: "#dc2626",
};

const VERDICT_BG = {
  top: "#ecfdf5",
  good: "#eff6ff",
  ok: "#fffbeb",
  bad: "#fef2f2",
};

export default function ForecastRow({ forecast, sun5, targetDayIndex, selectedDay, onDayClick }) {
  // After 14h, skip today and start from tomorrow — always show up to 5 days
  const displayed = forecast.slice(targetDayIndex, targetDayIndex + 5);
  const displayedSun = sun5.slice(targetDayIndex, targetDayIndex + 5);
  const totalSun = displayedSun.reduce((a, b) => a + b, 0);
  const totalSnow = displayed.reduce((sum, f) => sum + (parseInt(f.snow) || 0), 0);

  return (
    <div style={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>
        {"Pr\u00E9visions 5 jours"}
      </div>
      <div style={{ display: "flex", gap: 2, minWidth: "fit-content" }}>
        {displayed.map((f, fi) => {
          const sunH = displayedSun[fi];
          const snowCm = parseInt(f.snow) || 0;
          const isSelected = fi === selectedDay;
          return (
            <div key={fi}
              onClick={(e) => { e.stopPropagation(); onDayClick?.(fi); }}
              style={{
                flex: "1 1 0", minWidth: 58, padding: "5px 4px 4px", borderRadius: 5, textAlign: "center",
                cursor: "pointer", userSelect: "none",
                background: isSelected ? "#eef2ff" : f.accent ? "#fef2f2" : "#f8fafc",
                border: isSelected ? "2px solid #6366f1" : f.accent ? "1.5px solid #fecaca" : "1px solid #f1f5f9",
                transition: "border 0.15s, background 0.15s",
              }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: isSelected ? "#4338ca" : f.accent ? "#dc2626" : "#475569", marginBottom: 2 }}>{f.day}</div>
              <div style={{ fontSize: 16, lineHeight: 1, marginBottom: 2 }}>{f.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: sunH >= 3 ? "#b45309" : sunH > 0 ? "#d97706" : "#d1d5db" }}>{"\u2600"} {sunH}h</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: snowCm >= 20 ? "#059669" : snowCm > 0 ? "#3b82f6" : "#d1d5db", marginTop: 1 }}>{"\u2744"} {snowCm > 0 ? `${snowCm}` : "\u2014"}</div>
              {f.wind >= 50 && <div style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", marginTop: 1 }}>{"\uD83D\uDCA8"} {f.wind}</div>}
              {f.dayScore != null && (
                <div style={{
                  marginTop: 3, paddingTop: 3, borderTop: "1px solid #e2e8f0",
                  fontSize: 10, fontWeight: 700,
                  color: VERDICT_COLORS[f.dayVerdict] || "#94a3b8",
                }}>
                  <span style={{
                    display: "inline-block",
                    padding: "1px 5px", borderRadius: 3,
                    background: VERDICT_BG[f.dayVerdict] || "#f8fafc",
                    fontSize: 9, lineHeight: "14px",
                  }}>
                    {f.dayScore}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 4 }}>
        {"Total : "}<b style={{ color: totalSun >= 8 ? "#b45309" : "#64748b" }}>{"\u2600"} {totalSun}h</b>
        {totalSnow > 0 && <span style={{ marginLeft: 8, fontWeight: 600, color: totalSnow >= 30 ? "#059669" : "#64748b" }}>{"\u2744"} +{totalSnow}{"cm cumul\u00E9s"}</span>}
      </div>
    </div>
  );
}
