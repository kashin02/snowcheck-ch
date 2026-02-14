export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #e2e8f0", padding: "14px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "#0f172a" }}>snowcheck<span style={{ color: "#3b82f6" }}>.ch</span></span>
          <span style={{ fontSize: 9, color: "#94a3b8", marginLeft: 10 }}>Sources : Open-Meteo / MeteoSwiss &middot; WSL/SLF &middot; bergfex &mdash; Non affili&eacute; &agrave; Magic Pass</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 9, color: "#94a3b8" }}>Donn&eacute;es &agrave; jour &middot; 14.02.2026 10:15</span>
        </div>
      </div>
    </footer>
  );
}
