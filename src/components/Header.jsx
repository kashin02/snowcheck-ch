import { formatDate } from "../utils/format";

export default function Header({ stationCount, lastUpdate }) {
  return (
    <header style={{ padding: "18px 24px 14px", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "#0f172a" }}>snowcheck<span style={{ color: "#3b82f6" }}>.ch</span></h1>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>Magic Pass &middot; {stationCount} stations</span>
        </div>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>
          {lastUpdate ? `Mis \u00E0 jour ${formatDate(lastUpdate)}` : "Chargement..."}
        </span>
      </div>
    </header>
  );
}
