import { useState, useMemo } from "react";

const fontLink = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700&family=DM+Serif+Display:ital@0;1&display=swap";

const forecast = [
  { day: "Sam", date: "14.02", icon: "🌨", sun: 0, snow: "5", wind: 25, accent: false },
  { day: "Dim", date: "15.02", icon: "⛅", sun: 3, snow: "15", wind: 35, accent: false },
  { day: "Lun", date: "16.02", icon: "❄️", sun: 0, snow: "45", wind: 80, accent: true },
  { day: "Mar", date: "17.02", icon: "🌨", sun: 2, snow: "15", wind: 45, accent: false },
  { day: "Mer", date: "18.02", icon: "⛅", sun: 3, snow: "0", wind: 20, accent: false },
];

const stations = [
  { id: 1, name: "Saas-Fee", region: "Valais", alt: "1800–3600m", snowBase: 200, snowMin: 30, fresh72: 0, freshForecast: 45, quality: "Compacte", pistesOpen: 58, pistesTotal: 100, liftsOpen: 18, liftsTotal: 23, verdict: "top", sun5: [0, 3, 0, 2, 4] },
  { id: 2, name: "Grimentz-Zinal", region: "Valais", alt: "1570–2900m", snowBase: 170, snowMin: 80, fresh72: 55, freshForecast: 60, quality: "Poudreuse", pistesOpen: 88, pistesTotal: 115, liftsOpen: 21, liftsTotal: 21, verdict: "top", sun5: [0, 2, 0, 1, 3] },
  { id: 3, name: "Glacier 3000", region: "Vaud", alt: "1350–3000m", snowBase: 200, snowMin: 80, fresh72: 20, freshForecast: 50, quality: "Poudreuse", pistesOpen: 22, pistesTotal: 31, liftsOpen: 10, liftsTotal: 12, verdict: "top", sun5: [0, 3, 0, 2, 4] },
  { id: 4, name: "Villars-Gryon", region: "Vaud", alt: "1200–3000m", snowBase: 150, snowMin: 60, fresh72: 8, freshForecast: 40, quality: "Compacte", pistesOpen: 73, pistesTotal: 78, liftsOpen: 22, liftsTotal: 24, verdict: "top", sun5: [1, 3, 0, 2, 3] },
  { id: 5, name: "Anzère", region: "Valais", alt: "1500–2420m", snowBase: 180, snowMin: 100, fresh72: 0, freshForecast: 35, quality: "Poudreuse", pistesOpen: 24, pistesTotal: 27, liftsOpen: 10, liftsTotal: 14, verdict: "top", sun5: [0, 2, 0, 2, 4] },
  { id: 6, name: "Champex-Lac", region: "Valais", alt: "1470–2200m", snowBase: 152, snowMin: 80, fresh72: 50, freshForecast: 40, quality: "Poudreuse", pistesOpen: 7, pistesTotal: 7, liftsOpen: 4, liftsTotal: 4, verdict: "top", sun5: [0, 2, 0, 1, 3] },
  { id: 7, name: "St-Luc/Chandolin", region: "Valais", alt: "1650–3000m", snowBase: 120, snowMin: 60, fresh72: 15, freshForecast: 45, quality: "Poudreuse", pistesOpen: 50, pistesTotal: 55, liftsOpen: 10, liftsTotal: 12, verdict: "top", sun5: [0, 3, 0, 2, 5] },
  { id: 8, name: "Arolla", region: "Valais", alt: "2000–3000m", snowBase: 138, snowMin: 80, fresh72: 0, freshForecast: 50, quality: "Poudreuse", pistesOpen: 12, pistesTotal: 12, liftsOpen: 6, liftsTotal: 6, verdict: "top", sun5: [0, 3, 0, 2, 4] },
  { id: 9, name: "Le Grand-Bornand", region: "France", alt: "1000–2100m", snowBase: 120, snowMin: 40, fresh72: 20, freshForecast: 55, quality: "Compacte", pistesOpen: 53, pistesTotal: 78, liftsOpen: 20, liftsTotal: 24, verdict: "good", sun5: [1, 2, 0, 1, 3] },
  { id: 10, name: "Gstaad", region: "Berne", alt: "1050–2160m", snowBase: 80, snowMin: 30, fresh72: 15, freshForecast: 35, quality: "Compacte", pistesOpen: 100, pistesTotal: 173, liftsOpen: 25, liftsTotal: 31, verdict: "good", sun5: [0, 2, 0, 1, 3] },
  { id: 11, name: "Meiringen-Hasliberg", region: "Berne", alt: "600–2433m", snowBase: 80, snowMin: 20, fresh72: 15, freshForecast: 40, quality: "Compacte", pistesOpen: 45, pistesTotal: 60, liftsOpen: 12, liftsTotal: 15, verdict: "good", sun5: [0, 1, 0, 1, 2] },
  { id: 12, name: "Leysin", region: "Vaud", alt: "1260–2205m", snowBase: 100, snowMin: 40, fresh72: 7, freshForecast: 30, quality: "Compacte", pistesOpen: 28, pistesTotal: 60, liftsOpen: 9, liftsTotal: 13, verdict: "good", sun5: [1, 3, 0, 2, 3] },
  { id: 13, name: "Sörenberg", region: "Lucerne", alt: "1166–2350m", snowBase: 80, snowMin: 20, fresh72: 15, freshForecast: 35, quality: "Compacte", pistesOpen: 40, pistesTotal: 53, liftsOpen: 12, liftsTotal: 15, verdict: "good", sun5: [0, 1, 0, 1, 2] },
  { id: 14, name: "Melchsee-Frutt", region: "Obwald", alt: "1080–2255m", snowBase: 80, snowMin: 30, fresh72: 15, freshForecast: 30, quality: "Compacte", pistesOpen: 25, pistesTotal: 32, liftsOpen: 8, liftsTotal: 10, verdict: "good", sun5: [0, 2, 0, 1, 3] },
  { id: 15, name: "Leukerbad", region: "Valais", alt: "1411–2610m", snowBase: 100, snowMin: 50, fresh72: 10, freshForecast: 25, quality: "Compacte", pistesOpen: 20, pistesTotal: 25, liftsOpen: 9, liftsTotal: 9, verdict: "good", sun5: [0, 2, 0, 2, 4] },
  { id: 16, name: "Charmey", region: "Fribourg", alt: "900–1630m", snowBase: 40, snowMin: 0, fresh72: 10, freshForecast: 20, quality: "Poudreuse", pistesOpen: 7, pistesTotal: 12, liftsOpen: 4, liftsTotal: 7, verdict: "ok", sun5: [1, 2, 0, 1, 2] },
  { id: 17, name: "Moléson", region: "Fribourg", alt: "1100–2002m", snowBase: 40, snowMin: 10, fresh72: 3, freshForecast: 15, quality: "Compacte", pistesOpen: 1, pistesTotal: 19, liftsOpen: 3, liftsTotal: 8, verdict: "bad", sun5: [1, 2, 0, 1, 2] },
  { id: 18, name: "Les Pléiades", region: "Vaud", alt: "1360–1397m", snowBase: 20, snowMin: 5, fresh72: 0, freshForecast: 5, quality: "Humide", pistesOpen: 3, pistesTotal: 15, liftsOpen: 7, liftsTotal: 10, verdict: "bad", sun5: [1, 3, 0, 2, 3] },
  { id: 19, name: "La Berra", region: "Fribourg", alt: "1050–1634m", snowBase: 15, snowMin: 0, fresh72: 0, freshForecast: 10, quality: "Humide", pistesOpen: 1, pistesTotal: 5, liftsOpen: 0, liftsTotal: 2, verdict: "bad", sun5: [0, 1, 0, 1, 2] },
];

const verdictConfig = {
  top: { label: "Excellent", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", emoji: "🟢" },
  good: { label: "Bon", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", emoji: "🔵" },
  ok: { label: "Correct", color: "#d97706", bg: "#fffbeb", border: "#fde68a", emoji: "🟡" },
  bad: { label: "Difficile", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", emoji: "🔴" },
};

const regions = ["Tous", "Valais", "Vaud", "Berne", "Fribourg", "Lucerne", "Obwald", "France"];

function LV({ label, value, unit, color, bold }) {
  return (
    <div style={{ textAlign: "center", minWidth: 0 }}>
      <div style={{ fontSize: 8, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>{label}</div>
      <span style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 600, color: color || "#334155", fontFamily: "var(--font-body)" }}>
        {value}<span style={{ fontSize: 9, fontWeight: 400, color: "#94a3b8" }}>{unit}</span>
      </span>
    </div>
  );
}

function AdBanner({ position }) {
  return (
    <div style={{ padding: "8px 20px", background: "#f8fafc", borderTop: position === "bottom" ? "1px solid #e2e8f0" : "none", borderBottom: position === "top" ? "1px solid #e2e8f0" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <span style={{ fontSize: 8, color: "#cbd5e1", letterSpacing: "0.5px", textTransform: "uppercase" }}>Annonce</span>
      <div style={{ width: 728, maxWidth: "90%", height: 50, borderRadius: 6, background: "linear-gradient(135deg, #e0f2fe, #dbeafe, #ede9fe)", border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 11, fontFamily: "var(--font-body)" }}>
        Espace publicitaire 728×50
      </div>
    </div>
  );
}

export default function Poudreuse() {
  const [region, setRegion] = useState("Tous");
  const [search, setSearch] = useState("");
  const [dangersOpen, setDangersOpen] = useState(false);

  const filtered = useMemo(() => {
    let s = stations;
    if (region !== "Tous") s = s.filter(x => x.region === region);
    if (search) s = s.filter(x => x.name.toLowerCase().includes(search.toLowerCase()));
    return s;
  }, [region, search]);

  return (
    <>
      <link href={fontLink} rel="stylesheet" />
      <style>{`
        :root { --font-display: 'DM Serif Display', Georgia, serif; --font-body: 'DM Sans', -apple-system, sans-serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .card { transition: box-shadow 0.15s; }
        .card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .fbtn { transition: all 0.1s; cursor: pointer; border: none; }
        .fbtn:hover { transform: translateY(-1px); }
        @media (max-width: 700px) {
          .card-body { flex-direction: column !important; }
          .zone-left { border-right: none !important; border-bottom: 1px solid #f1f5f9 !important; padding-right: 0 !important; margin-right: 0 !important; padding-bottom: 10px !important; margin-bottom: 10px !important; min-width: 100% !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "var(--font-body)", overflowX: "hidden" }}>

        <AdBanner position="top" />

        {/* HEADER */}
        <header style={{ padding: "18px 24px 14px", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "#0f172a" }}>snowcheck<span style={{ color: "#3b82f6" }}>.ch</span></h1>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Magic Pass · {stations.length} stations</span>
            </div>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>Mis à jour 14.02.2026 10h15</span>
          </div>
        </header>

        {/* DANGERS */}
        {(() => {
          const dangers = [
            { type: "Avalanches", level: 4, icon: "⚠️", zone: "Alpes >2000m", detail: "Danger FORT (4/5) · Lun 16–Mer 18" },
            { type: "Neige", level: 3, icon: "❄️", zone: "Alpes occ. >1500m", detail: "30–60cm en 24h · Lun 16–Mar 17" },
            { type: "Vent", level: 3, icon: "💨", zone: "Crêtes alpines", detail: "Rafales 80–120 km/h · Lun 16" },
            { type: "Neige", level: 2, icon: "❄️", zone: "Jura >1000m", detail: "15–25cm · Lun 16–Mar 17" },
            { type: "Verglas", level: 2, icon: "🧊", zone: "Plateau 400–800m", detail: "Pluie verglaçante · Lun 16 matin" },
            { type: "Vent", level: 2, icon: "💨", zone: "Plateau & Léman", detail: "Rafales 60–80 km/h · Lun 16" },
          ];
          const mx = Math.max(...dangers.map(d => d.level));
          const top = dangers.find(d => d.level === mx);
          const col = mx >= 4 ? "#991b1b" : mx >= 3 ? "#dc2626" : "#d97706";
          return (
            <div style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
              <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                <div onClick={() => setDangersOpen(!dangersOpen)} style={{ padding: "6px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: col, borderRadius: 3, padding: "2px 6px" }}>DANGER {mx}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: col }}>{top.icon} {top.type} — {top.zone}</span>
                  <span style={{ fontSize: 10, color: "#78716c" }}>+ {dangers.length - 1} alertes</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "#94a3b8", transition: "transform 0.2s", transform: dangersOpen ? "rotate(180deg)" : "" }}>▼</span>
                </div>
                {dangersOpen && (
                  <div style={{ padding: "0 24px 10px", display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {dangers.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 6, background: a.level >= 3 ? "#fef2f2" : "#fffbeb", border: `1px solid ${a.level >= 3 ? "#fecaca" : "#fde68a"}`, flex: "1 1 auto", minWidth: 190, maxWidth: 340 }}>
                        <span style={{ fontSize: 14 }}>{a.icon}</span>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: a.level >= 3 ? "#dc2626" : "#d97706" }}>{a.type} </span>
                          <span style={{ fontSize: 8, fontWeight: 800, color: "#fff", background: a.level >= 3 ? "#dc2626" : "#d97706", borderRadius: 2, padding: "0 3px" }}>{a.level}</span>
                          <span style={{ fontSize: 9, color: "#78716c", marginLeft: 3 }}>{a.zone}</span>
                          <div style={{ fontSize: 9, color: "#57534e" }}>{a.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* LEGEND + FILTERS */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 24px" }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>Comment lire :</span>
              <span style={{ fontSize: 9, color: "#64748b" }}><b style={{ color: "#059669", fontSize: 11 }}>58</b>/100 km = km de pistes ouvertes</span>
              <span style={{ fontSize: 9, color: "#64748b" }}>☀ 3h = heures de soleil</span>
              <span style={{ fontSize: 9, color: "#64748b" }}>❄ 45cm = neige fraîche attendue</span>
              <span style={{ fontSize: 9, color: "#64748b" }}>💨 80 = vent en km/h</span>
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

        {/* STATION CARDS */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 24px 24px" }}>
          {filtered.map((s, i) => {
            const v = verdictConfig[s.verdict];
            const pctOpen = Math.round((s.pistesOpen / s.pistesTotal) * 100);
            const totalSun = s.sun5.reduce((a, b) => a + b, 0);
            return (
              <div key={s.id} className="card" style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 8, overflow: "hidden", animation: `fadeUp 0.2s ease ${i * 0.02}s both` }}>

                {/* TOP: identity + verdict */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 0", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ textAlign: "center", minWidth: 48 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, color: pctOpen > 70 ? "#059669" : pctOpen > 40 ? "#d97706" : "#dc2626" }}>{s.pistesOpen}</div>
                      <div style={{ fontSize: 8, color: "#94a3b8" }}>/{s.pistesTotal} km</div>
                      <div style={{ width: 34, height: 3, borderRadius: 2, background: "#e2e8f0", margin: "2px auto 0", overflow: "hidden" }}>
                        <div style={{ width: `${pctOpen}%`, height: "100%", borderRadius: 2, background: pctOpen > 70 ? "#059669" : pctOpen > 40 ? "#d97706" : "#dc2626" }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#0f172a" }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.region} · {s.alt} · {s.liftsOpen}/{s.liftsTotal} remontées</div>
                    </div>
                  </div>
                  <span style={{ padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 700, color: v.color, background: v.bg, border: `1px solid ${v.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>{v.label}</span>
                </div>

                {/* BODY: two zones */}
                <div className="card-body" style={{ display: "flex", padding: "8px 14px 10px", gap: 0 }}>

                  {/* ZONE LEFT — current snow */}
                  <div className="zone-left" style={{ flex: "0 0 auto", minWidth: 170, paddingRight: 14, borderRight: "1px solid #f1f5f9", marginRight: 14 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Enneigement actuel</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                      <LV label="Sommet" value={s.snowBase} unit="cm" color="#1e40af" bold />
                      <LV label="Base" value={s.snowMin} unit="cm" color="#60a5fa" />
                      {s.fresh72 > 0 && <LV label="Frais 72h" value={`+${s.fresh72}`} unit="cm" color="#059669" bold />}
                    </div>
                    <span style={{ display: "inline-block", marginTop: 4, padding: "1px 7px", borderRadius: 3, fontSize: 9, fontWeight: 600, color: s.quality === "Poudreuse" ? "#059669" : s.quality === "Humide" ? "#dc2626" : "#64748b", background: s.quality === "Poudreuse" ? "#ecfdf5" : s.quality === "Humide" ? "#fef2f2" : "#f8fafc" }}>{s.quality}</span>
                  </div>

                  {/* ZONE RIGHT — 5-day forecast */}
                  <div style={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Prévisions 5 jours</div>
                    <div style={{ display: "flex", gap: 2, minWidth: "fit-content" }}>
                      {forecast.map((f, fi) => {
                        const sunH = s.sun5[fi];
                        const snowCm = parseInt(f.snow) || 0;
                        return (
                          <div key={fi} style={{
                            flex: "1 1 0", minWidth: 58, padding: "5px 4px 4px", borderRadius: 5, textAlign: "center",
                            background: f.accent ? "#fef2f2" : "#f8fafc",
                            border: f.accent ? "1.5px solid #fecaca" : "1px solid #f1f5f9",
                          }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: f.accent ? "#dc2626" : "#475569", marginBottom: 2 }}>{f.day}</div>
                            <div style={{ fontSize: 16, lineHeight: 1, marginBottom: 2 }}>{f.icon}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: sunH >= 3 ? "#b45309" : sunH > 0 ? "#d97706" : "#d1d5db" }}>☀ {sunH}h</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: snowCm >= 20 ? "#059669" : snowCm > 0 ? "#3b82f6" : "#d1d5db", marginTop: 1 }}>❄ {snowCm > 0 ? `${snowCm}` : "—"}</div>
                            {f.wind >= 50 && <div style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", marginTop: 1 }}>💨 {f.wind}</div>}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 4 }}>
                      Total : <b style={{ color: totalSun >= 8 ? "#b45309" : "#64748b" }}>☀ {totalSun}h</b>
                      {s.freshForecast > 0 && <span style={{ marginLeft: 8, fontWeight: 600, color: s.freshForecast >= 30 ? "#059669" : "#64748b" }}>❄ +{s.freshForecast}cm cumulés</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <AdBanner position="bottom" />

        <footer style={{ borderTop: "1px solid #e2e8f0", padding: "14px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "#0f172a" }}>snowcheck<span style={{ color: "#3b82f6" }}>.ch</span></span>
              <span style={{ fontSize: 9, color: "#94a3b8", marginLeft: 10 }}>Sources : Open-Meteo / MeteoSwiss · WSL/SLF · bergfex — Non affilié à Magic Pass</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 9, color: "#94a3b8" }}>Données à jour · 14.02.2026 10:15</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
