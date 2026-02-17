import { verdictConfig } from "../data/constants";
import { DAYS_FR } from "../data/shared";
import { JbiBadge } from "./JbiShared";

function CrowdDot({ crowdScore }) {
  if (crowdScore == null) return null;
  const color = crowdScore >= 12 ? "#dc2626" : crowdScore >= 8 ? "#d97706" : crowdScore >= 5 ? "#ca8a04" : "#16a34a";
  const label = crowdScore >= 12 ? "Bond\u00e9" : crowdScore >= 8 ? "Charg\u00e9" : crowdScore >= 5 ? "Moyen" : "Calme";
  return (
    <div style={{ fontSize: 9, fontWeight: 600, color, marginTop: 1 }}>
      {"\uD83D\uDC65"} {label}
    </div>
  );
}

export default function ForecastRow({ forecast, sun5, targetDayIndex, selectedDay, onDayClick }) {
  if (!sun5) return null;

  // Fallback: no live forecast yet — show static sun data only
  if (!forecast) {
    const displayed = sun5.slice(targetDayIndex, targetDayIndex + 5);
    const totalSun = displayed.reduce((a, b) => a + b, 0);
    const baseDate = new Date();
    return (
      <div style={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>
          {"Pr\u00e9visions 5 jours"}
        </div>
        <div style={{ display: "flex", gap: 2, minWidth: "fit-content" }}>
          {displayed.map((sunH, fi) => {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + targetDayIndex + fi);
            return (
              <div key={fi} style={{
                flex: "1 1 0", minWidth: 58, padding: "5px 4px 4px", borderRadius: 5, textAlign: "center",
                background: "#f8fafc", border: "1px solid #f1f5f9",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 2 }}>{DAYS_FR[d.getDay()]}</div>
                <div style={{ fontSize: 16, lineHeight: 1, marginBottom: 2 }}>{sunH >= 4 ? "\u2600\uFE0F" : sunH >= 1 ? "\u26C5" : "\u2601\uFE0F"}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: sunH >= 3 ? "#b45309" : sunH > 0 ? "#d97706" : "#d1d5db" }}>{"\u2600"} {sunH}h</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 4 }}>
          {"Total : "}<b style={{ color: totalSun >= 8 ? "#b45309" : "#64748b" }}>{"\u2600"} {totalSun}h</b>
          <span style={{ marginLeft: 8, fontSize: 9, color: "#d97706", fontStyle: "italic" }}>{"\u26A0\uFE0F Pr\u00e9visions d\u00e9taill\u00e9es momentan\u00e9ment indisponibles"}</span>
        </div>
      </div>
    );
  }

  // After 15h, skip today — ensure no past/today entries leak through
  let startIdx = targetDayIndex;
  if (targetDayIndex > 0) {
    try {
      const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich" }).format(new Date());
      while (startIdx < forecast.length && forecast[startIdx]?.date && forecast[startIdx].date <= today) {
        startIdx++;
      }
      if (startIdx >= forecast.length) startIdx = targetDayIndex;
    } catch { /* trust targetDayIndex */ }
  }

  const displayed = forecast.slice(startIdx, startIdx + 5);
  const displayedSun = sun5.slice(startIdx, startIdx + 5);
  const totalSun = displayedSun.reduce((a, b) => a + b, 0);
  const totalSnow = displayed.reduce((sum, f) => sum + (parseInt(f.snow, 10) || 0), 0);

  return (
    <div style={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>
        {"Pr\u00e9visions 5 jours"}
      </div>
      <div style={{ display: "flex", gap: 2, minWidth: "fit-content" }}>
        {displayed.map((f, fi) => {
          const sunH = displayedSun[fi];
          const snowCm = parseInt(f.snow, 10) || 0;
          const absoluteIdx = startIdx + fi;
          const isSelected = selectedDay == null ? fi === 0 : absoluteIdx === selectedDay;
          const vc = verdictConfig[f.dayVerdict];
          return (
            <div key={fi}
              onClick={(e) => { e.stopPropagation(); onDayClick?.(absoluteIdx); }}
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
              <div style={{ fontSize: 11, fontWeight: 600, color: snowCm >= 20 ? "#059669" : snowCm > 0 ? "#3b82f6" : "#d1d5db", marginTop: 1 }}>{"\u2744"} {snowCm > 0 ? `${snowCm}cm` : "\u2014"}</div>
              {f.wind >= 50 && <div style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", marginTop: 1 }}>{"\uD83D\uDCA8"} {f.wind}</div>}
              <JbiBadge jbi={f.jbi || 0} />
              <CrowdDot crowdScore={f.crowd} />
              {f.dayScore != null && vc && (
                <div style={{ marginTop: 3, paddingTop: 3, borderTop: "1px solid #e2e8f0", fontSize: 10, fontWeight: 700, color: vc.color }}>
                  <span style={{ display: "inline-block", padding: "1px 5px", borderRadius: 3, background: vc.bg, fontSize: 9, lineHeight: "14px" }}>
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
        {totalSnow > 0 && <span style={{ marginLeft: 8, fontWeight: 600, color: totalSnow >= 30 ? "#059669" : "#64748b" }}>{"\u2744"} +{totalSnow}{"cm cumul\u00e9s"}</span>}
      </div>
    </div>
  );
}
