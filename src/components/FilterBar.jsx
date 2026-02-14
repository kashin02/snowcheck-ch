import { regions } from "../data/regions";
import { verdictConfig } from "../data/constants";

export default function FilterBar({ region, setRegion, search, setSearch, filtered }) {
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 24px" }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>Comment lire :</span>
          <span style={{ fontSize: 9, color: "#64748b" }}><b style={{ color: "#059669", fontSize: 11 }}>58</b>/100 km = km de pistes ouvertes</span>
          <span style={{ fontSize: 9, color: "#64748b" }}>{"\u2600"} 3h = heures de soleil</span>
          <span style={{ fontSize: 9, color: "#64748b" }}>{"\u2744"} 45cm = neige fra&icirc;che attendue</span>
          <span style={{ fontSize: 9, color: "#64748b" }}>{"\uD83D\uDCA8"} 80 = vent en km/h</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, color: "#334155", background: "#f8fafc", width: 150, outline: "none", fontFamily: "var(--font-body)", flex: "0 0 auto" }} />
          {regions.map(r => (
            <button key={r} className="fbtn" onClick={() => setRegion(region === r ? "Tous" : r)} style={{ padding: "4px 11px", borderRadius: 14, fontSize: 11, fontWeight: 500, fontFamily: "var(--font-body)", background: region === r ? "#2563eb" : "#f1f5f9", color: region === r ? "#fff" : "#64748b", whiteSpace: "nowrap", flex: "0 0 auto" }}>{r}</button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flex: "0 0 auto" }}>
            {Object.entries(verdictConfig).map(([k, v]) => {
              const c = filtered.filter(s => s.verdict === k).length;
              return c > 0 ? <span key={k} style={{ fontSize: 10, color: v.color, fontWeight: 600 }}>{v.emoji} {c}</span> : null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
