import { useState } from "react";
import { formatDuration } from "../utils/format";
import { verdictConfig, scoreToVerdict } from "../data/constants";
import { JBI_LEVELS, jbiLevel, JbiTooltip } from "./ForecastRow";

function FactorRow({ icon, label, d, positive, barGradient, activeColor, extra }) {
  if (!d) return null;
  const pct = positive
    ? (d.max > 0 ? Math.round((d.pts / d.max) * 100) : 0)
    : (d.min < 0 ? Math.round((Math.abs(d.pts) / Math.abs(d.min)) * 100) : 0);
  const defaultGradient = positive
    ? "linear-gradient(90deg, #34d399, #059669)"
    : (d.pts < 0 ? "linear-gradient(90deg, #fca5a5, #dc2626)" : "transparent");
  const active = positive ? d.pts > 0 : d.pts < 0;
  const ptsColor = active ? (activeColor || (positive ? "#059669" : "#dc2626")) : "#cbd5e1";
  const ptsLabel = positive ? `+${d.pts}/${d.max}` : `${d.pts}/${Math.abs(d.min)}`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
      <span style={{ fontSize: 13, width: 20, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 11, color: "#334155", width: 90, flexShrink: 0, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
        {label}{extra}
      </span>
      <span style={{ fontSize: 10, color: "#64748b", width: 48, textAlign: "right", flexShrink: 0, fontWeight: 600 }}>{d.value}{d.unit}</span>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#e2e8f0", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: barGradient || defaultGradient, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, width: 40, textAlign: "right", flexShrink: 0, color: ptsColor }}>{ptsLabel}</span>
    </div>
  );
}

function JbiInfoButton() {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative" }}>
      <span
        onClick={(e) => { e.stopPropagation(); setShow(v => !v); }}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 13, height: 13, borderRadius: "50%", fontSize: 8, fontWeight: 700,
          color: "#64748b", background: "#e2e8f0", cursor: "help", lineHeight: 1,
        }}
      >?</span>
      {show && <JbiTooltip onClose={() => setShow(false)} />}
    </span>
  );
}

const POSITIVES = [
  { key: "sun", icon: "\u2600\uFE0F", label: "Soleil" },
  { key: "fresh", icon: "\u2744\uFE0F", label: "Neige fra\u00EEche" },
  { key: "depth", icon: "\uD83D\uDCCF", label: "Hauteur neige" },
  { key: "pistes", icon: "\uD83C\uDFBF", label: "Pistes ouvertes" },
];

const NEGATIVES = [
  { key: "jourBlanc", icon: "\uD83C\uDF2B\uFE0F", label: "Jour blanc" },
  { key: "wind", icon: "\uD83D\uDCA8", label: "Vent" },
  { key: "crowd", icon: "\uD83D\uDC65", label: "Fr\u00E9quentation" },
];

export default function VerdictBreakdown({ breakdown, score, targetDayLabel, proximityBonus, travelTime }) {
  if (!breakdown) return null;

  const hasProximity = proximityBonus != null && proximityBonus > 0 && travelTime;
  const totalScore = hasProximity ? score + proximityBonus : score;
  const factorCount = hasProximity ? 8 : 7;

  const v = verdictConfig[scoreToVerdict(totalScore)] || {};

  return (
    <div style={{ padding: "14px 14px 16px", borderTop: "1px solid #f1f5f9", background: "#fafbfc" }}>
      {/* Score hero */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: v.bg || "#f8fafc", border: `2.5px solid ${v.color || "#94a3b8"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: v.color || "#94a3b8",
        }}>
          {totalScore}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
            Score {targetDayLabel?.toLowerCase()}
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>
            {hasProximity
              ? `${score} ski + ${proximityBonus} proximit\u00E9 \u00B7 ${factorCount} facteurs`
              : `sur 100 points \u00B7 ${factorCount} facteurs`
            }
          </div>
        </div>
      </div>

      {/* Positive factors */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
          Facteurs positifs
        </div>
        {POSITIVES.map(({ key, icon, label }) => (
          <FactorRow key={key} icon={icon} label={label} d={breakdown[key]} positive />
        ))}
        {hasProximity && (
          <FactorRow
            icon={"\uD83D\uDE97"} label="Proximit\u00E9" positive
            d={{ pts: proximityBonus, max: 15, value: formatDuration(travelTime.durationMin), unit: "" }}
            barGradient="linear-gradient(90deg, #7dd3fc, #0284c7)" activeColor="#0284c7"
          />
        )}
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: "#e2e8f0", margin: "8px 0" }} />

      {/* Negative factors */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
          Facteurs n&eacute;gatifs
        </div>
        {NEGATIVES.map(({ key, icon, label }) => (
          <FactorRow
            key={key} icon={icon} label={label} d={breakdown[key]}
            extra={key === "jourBlanc" ? <JbiInfoButton /> : null}
          />
        ))}
      </div>
    </div>
  );
}
