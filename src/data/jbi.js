export const JBI_LEVELS = [
  { min: 9, label: "Whiteout total", color: "#7f1d1d", bg: "#fecaca", desc: "Perte d'orientation \u2014 arr\u00eater de skier" },
  { min: 7, label: "S\u00e9v\u00e8re", color: "#dc2626", bg: "#fee2e2", desc: "Ciel/sol indistinguables \u2014 pistes en for\u00eat uniquement" },
  { min: 5, label: "Mod\u00e9r\u00e9", color: "#d97706", bg: "#fef3c7", desc: "Horizon flou, bosses invisibles \u2014 ralentir" },
  { min: 3, label: "L\u00e9ger", color: "#ca8a04", bg: "#fefce8", desc: "Light plat, relief diminu\u00e9 \u2014 lunettes orange" },
  { min: 0, label: "Aucun", color: "#16a34a", bg: "#ecfdf5", desc: "Ombres nettes, bon contraste" },
];

export function jbiLevel(jbi) {
  for (const l of JBI_LEVELS) if (jbi >= l.min) return l;
  return JBI_LEVELS[JBI_LEVELS.length - 1];
}
