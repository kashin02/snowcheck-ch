export default function VerdictBreakdown({ breakdown, score, targetDayLabel }) {
  if (!breakdown) return null;

  const positives = [
    { key: "sun", icon: "☀️", label: "Soleil" },
    { key: "fresh", icon: "❄️", label: "Neige fraîche 72h" },
    { key: "depth", icon: "⛷️", label: "Hauteur totale" },
    { key: "pistes", icon: "🎿", label: "Km pistes ouvertes" },
  ];

  const negatives = [
    { key: "jourBlanc", icon: "🌫️", label: "Jour blanc" },
    { key: "wind", icon: "💨", label: "Vent" },
    { key: "crowd", icon: "👥", label: "Fréquentation" },
  ];

  const scoreColor = score >= 70 ? "#059669" : score >= 45 ? "#2563eb" : score >= 20 ? "#d97706" : "#dc2626";

  return (
    <div style={{ padding: "10px 14px 12px", borderTop: "1px solid #f1f5f9", background: "#fafbfc" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Détail du score — {targetDayLabel}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor, fontFamily: "var(--font-display)" }}>
          {score}<span style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8" }}>/100</span>
        </span>
      </div>

      {/* Positive factors */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
          Facteurs positifs
        </div>
        {positives.map(({ key, icon, label }) => {
          const d = breakdown[key];
          const pct = d.max > 0 ? Math.round((d.pts / d.max) * 100) : 0;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 11, width: 16, textAlign: "center", flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 10, color: "#475569", width: 100, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 9, color: "#94a3b8", width: 42, textAlign: "right", flexShrink: 0 }}>
                {d.value}{d.unit}
              </span>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: "#e2e8f0", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "#059669", transition: "width 0.3s ease" }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: d.pts > 0 ? "#059669" : "#94a3b8", width: 28, textAlign: "right", flexShrink: 0 }}>
                +{d.pts}
              </span>
            </div>
          );
        })}
      </div>

      {/* Negative factors */}
      <div>
        <div style={{ fontSize: 8, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
          Facteurs négatifs
        </div>
        {negatives.map(({ key, icon, label }) => {
          const d = breakdown[key];
          const pct = d.min < 0 ? Math.round((Math.abs(d.pts) / Math.abs(d.min)) * 100) : 0;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 11, width: 16, textAlign: "center", flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 10, color: "#475569", width: 100, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 9, color: "#94a3b8", width: 42, textAlign: "right", flexShrink: 0 }}>
                {d.value}{d.unit}
              </span>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: "#e2e8f0", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: d.pts < 0 ? "#dc2626" : "transparent", transition: "width 0.3s ease" }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: d.pts < 0 ? "#dc2626" : "#94a3b8", width: 28, textAlign: "right", flexShrink: 0 }}>
                {d.pts}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
