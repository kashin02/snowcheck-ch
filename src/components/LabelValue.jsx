export default function LabelValue({ label, value, unit, color, bold }) {
  return (
    <div style={{ textAlign: "center", minWidth: 0 }}>
      <div style={{ fontSize: 8, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>{label}</div>
      <span style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 600, color: color || "#334155", fontFamily: "var(--font-body)" }}>
        {value}<span style={{ fontSize: 9, fontWeight: 400, color: "#94a3b8" }}>{unit}</span>
      </span>
    </div>
  );
}
