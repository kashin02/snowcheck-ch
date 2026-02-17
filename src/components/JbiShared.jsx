import { useState } from "react";
import { JBI_LEVELS, jbiLevel } from "../data/jbi";

export function JbiTooltip({ onClose }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      style={{
        position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
        marginBottom: 6, background: "#fff", borderRadius: 8, padding: "10px 12px",
        border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        zIndex: 200, width: 240, cursor: "default",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
        Indice Jour Blanc (0-10)
      </div>
      {JBI_LEVELS.map((l) => (
        <div key={l.min} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{
            display: "inline-block", width: 8, height: 8, borderRadius: "50%",
            background: l.color, flexShrink: 0,
          }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: l.color, width: 30, flexShrink: 0 }}>
            {l.min === 0 ? "0-2" : l.min === 3 ? "3-4" : l.min === 5 ? "5-6" : l.min === 7 ? "7-8" : "9-10"}
          </span>
          <span style={{ fontSize: 9, color: "#334155" }}>{l.desc}</span>
        </div>
      ))}
    </div>
  );
}

export function JbiBadge({ jbi }) {
  const [showTip, setShowTip] = useState(false);
  const l = jbiLevel(jbi);
  return (
    <div style={{ position: "relative", marginTop: 1 }}>
      <span
        onClick={(e) => { e.stopPropagation(); setShowTip(v => !v); }}
        title={`Jour blanc : ${l.label}`}
        style={{
          fontSize: 9, fontWeight: 700, color: l.color, background: l.bg,
          padding: "1px 4px", borderRadius: 3, cursor: "help",
          display: "inline-flex", alignItems: "center", gap: 2,
        }}
      >
        {"\uD83C\uDF2B\uFE0F"}{jbi >= 1 ? Math.round(jbi) : "\u2014"}
      </span>
      {showTip && <JbiTooltip onClose={() => setShowTip(false)} />}
    </div>
  );
}
