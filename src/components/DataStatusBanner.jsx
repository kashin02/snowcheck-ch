import { formatDate } from "../utils/format";

const SOURCE_LABELS = {
  weather: "Pr\u00e9visions m\u00e9t\u00e9o",
  snow: "Mesures de neige",
  avalanche: "Bulletin d\u2019avalanches",
};

export default function DataStatusBanner({ sourceStatus, fetchedAt }) {
  if (!sourceStatus) return null;

  const failed = Object.entries(sourceStatus)
    .filter(([, s]) => !s.ok)
    .map(([k]) => SOURCE_LABELS[k] || k);

  if (failed.length === 0) return null;

  const updateLabel = fetchedAt ? formatDate(fetchedAt) : null;

  return (
    <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "6px 24px",
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 12 }}>{"\u26A0\uFE0F"}</span>
        <span style={{ fontSize: 11, color: "#92400e", fontWeight: 600 }}>
          Donn&eacute;es partielles
        </span>
        <span style={{ fontSize: 11, color: "#78716c" }}>
          {failed.join(" \u00B7 ")}
          {" \u2014 "}
          <span style={{ fontStyle: "italic" }}>nouvelle tentative automatique dans quelques minutes</span>
        </span>
        {updateLabel && (
          <span style={{ marginLeft: "auto", fontSize: 9, color: "#a8a29e" }}>
            Derni&egrave;re mise &agrave; jour : {updateLabel}
          </span>
        )}
      </div>
    </div>
  );
}
