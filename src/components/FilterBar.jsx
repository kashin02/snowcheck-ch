import { regions } from "../data/regions";
import { verdictConfig } from "../data/constants";
import LocationInput from "./LocationInput";

function formatDuration(min) {
  if (min >= 300) return "Toutes";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

export default function FilterBar({ region, setRegion, search, setSearch, filtered, location, maxDurationMin, setMaxDurationMin }) {
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 24px" }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>Comment lire :</span>
          <span style={{ fontSize: 9, color: "#64748b" }}><b style={{ color: "#059669", fontSize: 11 }}>58</b>/100 km = km de pistes ouvertes</span>
          <span style={{ fontSize: 9, color: "#64748b" }}>{"\u2600"} 3h = heures de soleil</span>
          <span style={{ fontSize: 9, color: "#64748b" }}>{"\u2744"} 45cm = neige fra{"\u00EE"}che attendue</span>
          <span style={{ fontSize: 9, color: "#64748b" }}>{"\uD83D\uDCA8"} 80 = vent en km/h</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, color: "#334155", background: "#f8fafc", width: 130, outline: "none", fontFamily: "var(--font-body)", flex: "0 0 auto" }} />
          <LocationInput
            npa={location.npa}
            npaName={location.npaName}
            setNpa={location.setNpa}
            loading={location.loading}
          />
          {regions.map(r => (
            <button key={r} className="fbtn" onClick={() => setRegion(region === r ? "Tous" : r)} style={{ padding: "4px 11px", borderRadius: 14, fontSize: 11, fontWeight: 500, fontFamily: "var(--font-body)", background: region === r ? "#42BDD6" : "#f1f5f9", color: region === r ? "#fff" : "#64748b", whiteSpace: "nowrap", flex: "0 0 auto" }}>{r}</button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flex: "0 0 auto" }}>
            {Object.entries(verdictConfig).map(([k, v]) => {
              const c = filtered.filter(s => s.verdict === k).length;
              return c > 0 ? <span key={k} style={{ fontSize: 10, color: v.color, fontWeight: 600 }}>{v.emoji} {c}</span> : null;
            })}
          </div>
        </div>
        {location.travelTimes && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
              {"\uD83D\uDE97"} max : <b style={{ color: "#42BDD6" }}>{formatDuration(maxDurationMin)}</b>
            </span>
            <input
              type="range"
              min="30"
              max="300"
              step="15"
              value={maxDurationMin}
              onChange={e => setMaxDurationMin(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#42BDD6", cursor: "pointer" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
