import { formatDate } from "../utils/format";

export default function Footer({ lastUpdate, sourceStatus }) {
  const formatted = formatDate(lastUpdate);
  const allOk = !sourceStatus || Object.values(sourceStatus).every(s => s.ok);
  const dotColor = allOk ? "#22c55e" : "#f59e0b";
  const statusText = allOk ? "Donn\u00e9es \u00e0 jour" : "Donn\u00e9es partielles";

  return (
    <footer style={{ borderTop: "1px solid #e2e8f0", padding: "14px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "#0f172a" }}>snowcheck<span style={{ color: "#3b82f6" }}>.ch</span></span>
          <span style={{ fontSize: 9, color: "#94a3b8", marginLeft: 10 }}>Sources : Open-Meteo / MeteoSwiss &middot; WSL/SLF &middot; bergfex &mdash; Non affili&eacute; &agrave; Magic Pass</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {formatted && (
            <>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor }} />
              <span style={{ fontSize: 9, color: "#94a3b8" }}>{statusText} &middot; {formatted}</span>
            </>
          )}
          {!formatted && (
            <span style={{ fontSize: 9, color: "#94a3b8" }}>Chargement des donn&eacute;es...</span>
          )}
        </div>
      </div>
    </footer>
  );
}
