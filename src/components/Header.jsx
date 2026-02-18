import { formatDate } from "../utils/format";

export default function Header({ stationCount, lastUpdate }) {
  return (
    <header style={{ padding: "12px 24px", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo-icon.png" alt="" style={{ height: 48, width: "auto" }} />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 1.1 }}>
              <span style={{ color: "#42BDD6" }}>snow</span><span style={{ color: "#2D4D72" }}>check</span><span style={{ color: "#2D4D72" }}>.ch</span>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>Magic Pass &middot; {stationCount} stations</div>
          </div>
        </div>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>
          {lastUpdate ? `Mis \u00E0 jour ${formatDate(lastUpdate)}` : "Chargement..."}
        </span>
      </div>
    </header>
  );
}
