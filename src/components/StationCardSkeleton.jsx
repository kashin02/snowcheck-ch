export default function StationCardSkeleton({ index }) {
  return (
    <div className="card" style={{
      background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 8,
      overflow: "hidden", animation: `fadeUp 0.2s ease ${index * 0.02}s both`,
      padding: "14px", height: 120,
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 48, height: 40, borderRadius: 6, background: "#f1f5f9", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: "40%", height: 14, borderRadius: 4, background: "#f1f5f9", marginBottom: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: "60%", height: 10, borderRadius: 4, background: "#f1f5f9", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
        <div style={{ width: 60, height: 22, borderRadius: 5, background: "#f1f5f9", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} style={{ flex: 1, height: 50, borderRadius: 5, background: "#f8fafc", animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    </div>
  );
}
