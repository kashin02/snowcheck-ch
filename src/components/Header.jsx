import { formatDate } from "../utils/format";

export default function Header({ stationCount, lastUpdate }) {
  return (
    <header style={{ padding: "14px 24px", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="snowcheck.ch" style={{ height: 48, width: "auto" }} />
          <span style={{ fontSize: 11, color: "#94a3b8" }}>Magic Pass &middot; {stationCount} stations</span>
        </div>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>
          {lastUpdate ? `Mis \u00E0 jour ${formatDate(lastUpdate)}` : "Chargement..."}
        </span>
      </div>
    </header>
  );
}
