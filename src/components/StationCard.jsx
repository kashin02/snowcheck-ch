import { useState } from "react";
import { verdictConfig } from "../data/constants";
import ForecastRow from "./ForecastRow";
import VerdictBreakdown from "./VerdictBreakdown";

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function StationCard({ station, forecast, index }) {
  const [level, setLevel] = useState(0); // 0=compact, 1=forecast, 2=breakdown
  const [selectedDay, setSelectedDay] = useState(0); // offset within displayed 5 days
  const v = verdictConfig[station.verdict];
  const { pistesOpen, pistesTotal } = station.operational;
  const isTomorrow = station.targetDayLabel === "Demain";
  const bd = station.verdictBreakdown;

  // Key metrics from the target day
  const sunH = bd?.sun?.value ?? 0;
  const windKmh = bd?.wind?.value ?? 0;

  // Resolve the active breakdown for the selected day
  const activeDayIndex = station.targetDayIndex + selectedDay;
  const activeData = station.dayBreakdowns?.[activeDayIndex];
  const activeBreakdown = activeData?.breakdown ?? station.verdictBreakdown;
  const activeScore = activeData?.score ?? station.verdictScore;

  // Build a label for the selected day
  const activeForecast = forecast?.[activeDayIndex];
  const activeDayLabel = selectedDay === 0
    ? (station.targetDayLabel || "Aujourd'hui")
    : activeForecast?.day || DAY_LABELS[new Date(activeForecast?.date).getDay()] || `J+${selectedDay}`;

  function handleDayClick(dayOffset) {
    setSelectedDay(dayOffset);
    // Auto-open breakdown when clicking a day
    if (level < 2) setLevel(2);
  }

  return (
    <div className="card" style={{
      background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0",
      marginBottom: 8, overflow: "hidden",
      animation: `fadeUp 0.2s ease ${index * 0.02}s both`,
    }}>
      {/* -- L0: Compact summary ----------------------------------------- */}
      <div
        onClick={() => { setLevel(l => l > 0 ? 0 : 1); setSelectedDay(0); }}
        style={{ padding: "10px 14px", cursor: "pointer", userSelect: "none" }}
      >
        {/* Row 1: Name + Score */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#0f172a", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {station.name}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {isTomorrow && (
              <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600, color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                Demain
              </span>
            )}
            <span style={{
              padding: "3px 9px", borderRadius: 5, fontWeight: 700,
              color: v.color, background: v.bg, border: `1px solid ${v.border}`,
              whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 10,
            }}>
              {v.label}
              {station.verdictScore != null && (
                <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 800 }}>
                  {station.verdictScore}
                </span>
              )}
            </span>
            <span style={{
              fontSize: 10, color: "#94a3b8",
              transition: "transform 0.2s",
              transform: level > 0 ? "rotate(180deg)" : "rotate(0deg)",
            }}>&#x25BC;</span>
          </div>
        </div>

        {/* Row 2: Metadata */}
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
          {station.region} &middot; {station.alt} &middot; {pistesOpen}/{pistesTotal}km pistes
        </div>

        {/* Row 3: Key metrics for the target day */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", marginTop: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: sunH >= 3 ? "#b45309" : sunH > 0 ? "#d97706" : "#94a3b8" }}>
            &#x2600;&#xFE0F; {sunH}h
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#1e40af" }}>
            &#x1F4CF; {station.snowBase}cm
          </span>
          {station.fresh72 > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#059669" }}>
              &#x2744;&#xFE0F; +{station.fresh72}cm
            </span>
          )}
          {windKmh >= 25 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: windKmh >= 60 ? "#dc2626" : "#d97706" }}>
              &#x1F4A8; {windKmh}km/h
            </span>
          )}
          <span style={{
            fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 3,
            color: station.quality === "Poudreuse" ? "#059669" : station.quality === "Humide" ? "#dc2626" : "#64748b",
            background: station.quality === "Poudreuse" ? "#ecfdf5" : station.quality === "Humide" ? "#fef2f2" : "#f8fafc",
          }}>
            {station.quality}
          </span>
        </div>
      </div>

      {/* -- L1: 5-day forecast ------------------------------------------ */}
      {level >= 1 && (
        <div style={{ padding: "0 14px 8px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ paddingTop: 10 }}>
            <ForecastRow
              forecast={forecast}
              sun5={station.sun5}
              targetDayIndex={station.targetDayIndex}
              selectedDay={selectedDay}
              onDayClick={handleDayClick}
            />
          </div>
          {/* Action bar: links + detail toggle */}
          <div style={{
            marginTop: 8, paddingTop: 8, borderTop: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", gap: 10 }}>
              {station.webcamUrl && (
                <a href={station.webcamUrl} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: 10, fontWeight: 600, color: "#2563eb", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                  &#x1F4F7; Webcam
                </a>
              )}
              {station.pisteMapUrl && (
                <a href={station.pisteMapUrl} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: 10, fontWeight: 600, color: "#2563eb", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                  &#x1F5FA;&#xFE0F; Plan des pistes
                </a>
              )}
            </div>
            <div
              onClick={(e) => { e.stopPropagation(); setLevel(l => l >= 2 ? 1 : 2); }}
              style={{ cursor: "pointer", userSelect: "none", fontSize: 10, fontWeight: 600, color: "#64748b" }}
            >
              {"Détail du score "}{level >= 2 ? "\u25B2" : "\u25BC"}
            </div>
          </div>
        </div>
      )}

      {/* -- L2: Score breakdown ----------------------------------------- */}
      {level >= 2 && (
        <VerdictBreakdown
          breakdown={activeBreakdown}
          score={activeScore}
          targetDayLabel={activeDayLabel}
        />
      )}
    </div>
  );
}
