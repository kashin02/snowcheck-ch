export const FONT_LINK = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700&family=DM+Serif+Display:ital@0;1&display=swap";

export const verdictConfig = {
  top: { label: "Excellent", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", emoji: "\u{1F7E2}" },
  good: { label: "Bon", color: "#2D4D72", bg: "#EBF8FB", border: "#A8DDE9", emoji: "\u{1F535}" },
  ok: { label: "Correct", color: "#d97706", bg: "#fffbeb", border: "#fde68a", emoji: "\u{1F7E1}" },
  bad: { label: "Difficile", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", emoji: "\u{1F534}" },
};

export function scoreToVerdict(score) {
  if (score >= 70) return "top";
  if (score >= 45) return "good";
  if (score >= 20) return "ok";
  return "bad";
}
