import LabelValue from "./LabelValue";

export default function SnowStats({ station }) {
  return (
    <div className="zone-left" style={{ flex: "0 0 auto", minWidth: 170, paddingRight: 14, borderRight: "1px solid #f1f5f9", marginRight: 14 }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Enneigement actuel</div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <LabelValue label="Sommet" value={station.snowBase} unit="cm" color="#1e40af" bold />
        <LabelValue label="Base" value={station.snowMin} unit="cm" color="#60a5fa" />
        {station.fresh72 > 0 && <LabelValue label="Frais 72h" value={`+${station.fresh72}`} unit="cm" color="#059669" bold />}
      </div>
      <span style={{ display: "inline-block", marginTop: 4, padding: "1px 7px", borderRadius: 3, fontSize: 9, fontWeight: 600, color: station.quality === "Poudreuse" ? "#059669" : station.quality === "Humide" ? "#dc2626" : "#64748b", background: station.quality === "Poudreuse" ? "#ecfdf5" : station.quality === "Humide" ? "#fef2f2" : "#f8fafc" }}>{station.quality}</span>
    </div>
  );
}
