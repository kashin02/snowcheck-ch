import { useState } from "react";
import { verdictConfig } from "../data/constants";
import SnowStats from "./SnowStats";
import ForecastRow from "./ForecastRow";
import VerdictBreakdown from "./VerdictBreakdown";

export default function StationCard({ station, forecast, index }) {
  const [expanded, setExpanded] = useState(false);
  const v = verdictConfig[station.verdict];
  const { pistesOpen, pistesTotal, liftsOpen, liftsTotal } = station.operational;
  const pctOpen = Math.round((pistesOpen / pistesTotal) * 100);
  const isTomorrow = station.targetDayLabel === "Demain";

  return (
    <div className="card" style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 8, overflow: "hidden", animation: `fadeUp 0.2s ease ${index * 0.02}s both` }}>
      {/* TOP: identity + verdict */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 0", gap: 8, cursor: "pointer", userSelect: "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "center", minWidth: 48 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, color: pctOpen > 70 ? "#059669" : pctOpen > 40 ? "#d97706" : "#dc2626" }}>{pistesOpen}</div>
            <div style={{ fontSize: 8, color: "#94a3b8" }}>/{pistesTotal} km</div>
            <div style={{ width: 34, height: 3, borderRadius: 2, background: "#e2e8f0", margin: "2px auto 0", overflow: "hidden" }}>
              <div style={{ width: `${pctOpen}%`, height: "100%", borderRadius: 2, background: pctOpen > 70 ? "#059669" : pctOpen > 40 ? "#d97706" : "#dc2626" }} />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#0f172a" }}>{station.name}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{station.region} &middot; {station.alt} &middot; {liftsOpen}/{liftsTotal} remont&eacute;es</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {isTomorrow && (
            <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600, color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
              Demain
            </span>
          )}
          <span style={{ padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 700, color: v.color, background: v.bg, border: `1px solid ${v.border}`, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}>
            {v.label}
            {station.verdictScore != null && (
              <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 800 }}>
                {station.verdictScore}
              </span>
            )}
          </span>
          <span style={{ fontSize: 10, color: "#94a3b8", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▼
          </span>
        </div>
      </div>

      {/* BODY: two zones */}
      <div className="card-body" style={{ display: "flex", padding: "8px 14px 10px", gap: 0 }}>
        <SnowStats station={station} />
        <ForecastRow forecast={forecast} sun5={station.sun5} freshForecast={station.freshForecast} targetDayIndex={station.targetDayIndex} />
      </div>

      {/* EXPANDED: verdict breakdown */}
      {expanded && (
        <VerdictBreakdown
          breakdown={station.verdictBreakdown}
          score={station.verdictScore}
          targetDayLabel={station.targetDayLabel || "Aujourd'hui"}
        />
      )}
    </div>
  );
}
