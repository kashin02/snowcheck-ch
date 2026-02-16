export default function VerdictBreakdown({ breakdown, score, targetDayLabel }) {
  if (!breakdown) return null;

  const positives = [
    { key: "sun", icon: "\u2600\uFE0F", label: "Soleil" },
    { key: "fresh", icon: "\u2744\uFE0F", label: "Neige fra\u00EEche" },
    { key: "depth", icon: "\uD83D\uDCCF", label: "Hauteur neige" },
    { key: "pistes", icon: "\uD83C\uDFBF", label: "Pistes ouvertes" },
  ];

  const negatives = [
    { key: "jourBlanc", icon: "\uD83C\uDF2B\uFE0F", label: "Jour blanc" },
    { key: "wind", icon: "\uD83D\uDCA8", label: "Vent" },
    { key: "crowd", icon: "\uD83D\uDC65", label: "Fr\u00E9quentation" },
  ];

  const scoreColor = score >= 70 ? "#059669" : score >= 45 ? "#2563eb" : score >= 20 ? "#d97706" : "#dc2626";
  const scoreBg = score >= 70 ? "#ecfdf5" : score >= 45 ? "#eff6ff" : score >= 20 ? "#fffbeb" : "#fef2f2";

  return (
    <div style={{ padding: "14px 14px 16px", borderTop: "1px solid #f1f5f9", background: "#fafbfc" }}>
      {/* Score hero */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: scoreBg, border: `2.5px solid ${scoreColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: scoreColor,
        }}>
          {score}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
            Score {targetDayLabel.toLowerCase()}
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>
            sur 100 points &middot; 7 facteurs
          </div>
        </div>
      </div>

      {/* Positive factors */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
          Facteurs positifs
        </div>
        {positives.map(({ key, icon, label }) => {
          const d = breakdown[key];
          const pct = d.max > 0 ? Math.round((d.pts / d.max) * 100) : 0;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 13, width: 20, textAlign: "center", flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 11, color: "#334155", width: 90, flexShrink: 0, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 10, color: "#64748b", width: 48, textAlign: "right", flexShrink: 0, fontWeight: 600 }}>
                {d.value}{d.unit}
              </span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#e2e8f0", overflow: "hidden" }}>
                <div style={{
                  width: `${pct}%`, height: "100%", borderRadius: 4,
                  background: "linear-gradient(90deg, #34d399, #059669)",
                  transition: "width 0.4s ease",
                }} />
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, width: 40, textAlign: "right", flexShrink: 0,
                color: d.pts > 0 ? "#059669" : "#cbd5e1",
              }}>
                +{d.pts}/{d.max}
              </span>
            </div>
          );
        })}
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: "#e2e8f0", margin: "8px 0" }} />

      {/* Negative factors */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
          Facteurs n&eacute;gatifs
        </div>
        {negatives.map(({ key, icon, label }) => {
          const d = breakdown[key];
          const pct = d.min < 0 ? Math.round((Math.abs(d.pts) / Math.abs(d.min)) * 100) : 0;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 13, width: 20, textAlign: "center", flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 11, color: "#334155", width: 90, flexShrink: 0, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 10, color: "#64748b", width: 48, textAlign: "right", flexShrink: 0, fontWeight: 600 }}>
                {d.value}{d.unit}
              </span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#e2e8f0", overflow: "hidden" }}>
                <div style={{
                  width: `${pct}%`, height: "100%", borderRadius: 4,
                  background: d.pts < 0 ? "linear-gradient(90deg, #fca5a5, #dc2626)" : "transparent",
                  transition: "width 0.4s ease",
                }} />
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, width: 40, textAlign: "right", flexShrink: 0,
                color: d.pts < 0 ? "#dc2626" : "#cbd5e1",
              }}>
                {d.pts}/{Math.abs(d.min)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
