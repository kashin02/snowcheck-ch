import { useState } from "react";

const DANGER_LABELS = { 1: "Faible", 2: "Limit\u00E9", 3: "Marqu\u00E9", 4: "Fort", 5: "Tr\u00E8s fort" };
const DANGER_ICONS = { 1: "\u2705", 2: "\u26A0\uFE0F", 3: "\u26A0\uFE0F", 4: "\u{1F6A8}", 5: "\u{1F6A8}" };

export default function DangerBanner({ avalancheData }) {
  const [open, setOpen] = useState(false);

  // Only show banner when live API data is available
  if (!avalancheData || !avalancheData.summary) return null;

  const dangers = avalancheData.summary.map(s => ({
    type: "Avalanches",
    level: s.level,
    icon: DANGER_ICONS[s.level] || "\u26A0\uFE0F",
    zone: `${s.count} r\u00E9gions`,
    detail: `Danger ${DANGER_LABELS[s.level] || s.level} (${s.level}/5)`,
  }));

  if (dangers.length === 0) return null;

  const mx = Math.max(...dangers.map(d => d.level));
  const top = dangers.find(d => d.level === mx);
  const col = mx >= 4 ? "#991b1b" : mx >= 3 ? "#dc2626" : "#d97706";

  return (
    <div style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div onClick={() => setOpen(!open)} style={{ padding: "6px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: col, borderRadius: 3, padding: "2px 6px" }}>DANGER {mx}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: col }}>{top.icon} {top.type} &mdash; {top.zone}</span>
          {dangers.length > 1 && <span style={{ fontSize: 10, color: "#78716c" }}>+ {dangers.length - 1} alertes</span>}
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#94a3b8", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "" }}>{"\u25BC"}</span>
        </div>
        {open && (
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
}
