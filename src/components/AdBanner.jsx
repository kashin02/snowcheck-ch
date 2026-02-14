export default function AdBanner({ position }) {
  return (
    <div style={{ padding: "8px 20px", background: "#f8fafc", borderTop: position === "bottom" ? "1px solid #e2e8f0" : "none", borderBottom: position === "top" ? "1px solid #e2e8f0" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <span style={{ fontSize: 8, color: "#cbd5e1", letterSpacing: "0.5px", textTransform: "uppercase" }}>Annonce</span>
      <div style={{ width: 728, maxWidth: "90%", height: 50, borderRadius: 6, background: "linear-gradient(135deg, #e0f2fe, #dbeafe, #ede9fe)", border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 11, fontFamily: "var(--font-body)" }}>
        Espace publicitaire 728&times;50
      </div>
    </div>
  );
}
