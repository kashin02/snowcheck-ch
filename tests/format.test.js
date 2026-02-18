import { describe, it, expect } from "vitest";
import { formatDuration, formatDate, normalize } from "../src/utils/format";
import { jbiLevel, JBI_LEVELS } from "../src/data/jbi";
import { proximityBonus } from "../src/hooks/useLocation";

// ─────────────────────────────────────────────────────────────────────────
// 1. formatDuration
// ─────────────────────────────────────────────────────────────────────────
describe("formatDuration", () => {
  it("returns empty string for null", () => {
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(undefined)).toBe("");
  });

  it("formats minutes only when < 60", () => {
    expect(formatDuration(0)).toBe("0min");
    expect(formatDuration(1)).toBe("1min");
    expect(formatDuration(30)).toBe("30min");
    expect(formatDuration(59)).toBe("59min");
  });

  it("formats hours only when exact hour", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(120)).toBe("2h");
    expect(formatDuration(180)).toBe("3h");
  });

  it("formats hours and zero-padded minutes", () => {
    expect(formatDuration(61)).toBe("1h01");
    expect(formatDuration(90)).toBe("1h30");
    expect(formatDuration(125)).toBe("2h05");
    expect(formatDuration(150)).toBe("2h30");
    expect(formatDuration(195)).toBe("3h15");
  });

  it("handles large values", () => {
    expect(formatDuration(600)).toBe("10h");
    expect(formatDuration(601)).toBe("10h01");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. formatDate
// ─────────────────────────────────────────────────────────────────────────
describe("formatDate", () => {
  it("returns null for falsy input", () => {
    expect(formatDate(null)).toBe(null);
    expect(formatDate("")).toBe(null);
    expect(formatDate(undefined)).toBe(null);
  });

  it("formats ISO string to Swiss locale", () => {
    const result = formatDate("2026-01-15T14:30:00Z");
    // Swiss locale: DD.MM.YYYY HH:MM
    expect(result).toMatch(/15/);       // day
    expect(result).toMatch(/01/);       // month or part of time
    expect(result).toMatch(/2026/);     // year
    // Time part present
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("includes both date and time parts", () => {
    const result = formatDate("2026-06-15T08:05:00Z");
    expect(result).toBeTruthy();
    // Should contain a space between date and time
    expect(result).toContain(" ");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. normalize — accent stripping for search
// ─────────────────────────────────────────────────────────────────────────
describe("normalize", () => {
  it("strips French accents", () => {
    expect(normalize("Pléiades")).toBe("pleiades");
    expect(normalize("Château-d'Œx")).toBe("chateau-d'œx"); // œ is a ligature not a diacritic
    expect(normalize("Gruyères")).toBe("gruyeres");
    expect(normalize("Ménières")).toBe("menieres");
  });

  it("converts to lowercase", () => {
    expect(normalize("VERBIER")).toBe("verbier");
    expect(normalize("Zermatt")).toBe("zermatt");
  });

  it("strips multiple accent types", () => {
    expect(normalize("àâäéèêëïîôùûüÿç")).toBe("aaaeeeeiiouuuyc");
  });

  it("preserves non-accented characters", () => {
    expect(normalize("abc-123")).toBe("abc-123");
    expect(normalize("la station")).toBe("la station");
  });

  it("handles empty string", () => {
    expect(normalize("")).toBe("");
  });

  it("enables accent-insensitive search matching", () => {
    const stations = ["Pléiades", "Gruyères", "Verbier", "Château-d'Œx"];
    const query = "pleiades";
    const matches = stations.filter(s => normalize(s).includes(normalize(query)));
    expect(matches).toEqual(["Pléiades"]);
  });

  it("enables partial matching", () => {
    const stations = ["Les Diablerets", "Les Pléiades", "Les Mosses"];
    const query = "diab";
    const matches = stations.filter(s => normalize(s).includes(normalize(query)));
    expect(matches).toEqual(["Les Diablerets"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. jbiLevel — JBI value → level descriptor
// ─────────────────────────────────────────────────────────────────────────
describe("jbiLevel", () => {
  it("returns 'Whiteout total' for JBI >= 9", () => {
    expect(jbiLevel(9).label).toBe("Whiteout total");
    expect(jbiLevel(10).label).toBe("Whiteout total");
  });

  it("returns 'Sévère' for JBI 7-8", () => {
    expect(jbiLevel(7).label).toBe("Sévère");
    expect(jbiLevel(8).label).toBe("Sévère");
    expect(jbiLevel(8.9).label).toBe("Sévère");
  });

  it("returns 'Modéré' for JBI 5-6", () => {
    expect(jbiLevel(5).label).toBe("Modéré");
    expect(jbiLevel(6).label).toBe("Modéré");
    expect(jbiLevel(6.9).label).toBe("Modéré");
  });

  it("returns 'Léger' for JBI 3-4", () => {
    expect(jbiLevel(3).label).toBe("Léger");
    expect(jbiLevel(4).label).toBe("Léger");
    expect(jbiLevel(4.9).label).toBe("Léger");
  });

  it("returns 'Aucun' for JBI 0-2", () => {
    expect(jbiLevel(0).label).toBe("Aucun");
    expect(jbiLevel(1).label).toBe("Aucun");
    expect(jbiLevel(2).label).toBe("Aucun");
    expect(jbiLevel(2.9).label).toBe("Aucun");
  });

  it("each level has color, bg, and desc", () => {
    for (const level of JBI_LEVELS) {
      expect(level).toHaveProperty("color");
      expect(level).toHaveProperty("bg");
      expect(level).toHaveProperty("desc");
      expect(level).toHaveProperty("label");
      expect(level).toHaveProperty("min");
    }
  });

  it("boundary: JBI 4.9 = Léger, JBI 5.0 = Modéré", () => {
    expect(jbiLevel(4.9).label).toBe("Léger");
    expect(jbiLevel(5.0).label).toBe("Modéré");
  });

  it("boundary: JBI 6.9 = Modéré, JBI 7.0 = Sévère", () => {
    expect(jbiLevel(6.9).label).toBe("Modéré");
    expect(jbiLevel(7.0).label).toBe("Sévère");
  });

  it("boundary: JBI 8.9 = Sévère, JBI 9.0 = Whiteout total", () => {
    expect(jbiLevel(8.9).label).toBe("Sévère");
    expect(jbiLevel(9.0).label).toBe("Whiteout total");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. proximityBonus — travel time → 0-15 bonus points
// ─────────────────────────────────────────────────────────────────────────
describe("proximityBonus", () => {
  it("returns 0 for null/undefined", () => {
    expect(proximityBonus(null)).toBe(0);
    expect(proximityBonus(undefined)).toBe(0);
  });

  it("returns 15 for < 30 min", () => {
    expect(proximityBonus(0)).toBe(15);
    expect(proximityBonus(15)).toBe(15);
    expect(proximityBonus(29)).toBe(15);
  });

  it("returns 10 for 30-59 min", () => {
    expect(proximityBonus(30)).toBe(10);
    expect(proximityBonus(45)).toBe(10);
    expect(proximityBonus(59)).toBe(10);
  });

  it("returns 5 for 60-89 min", () => {
    expect(proximityBonus(60)).toBe(5);
    expect(proximityBonus(75)).toBe(5);
    expect(proximityBonus(89)).toBe(5);
  });

  it("returns 2 for 90-119 min", () => {
    expect(proximityBonus(90)).toBe(2);
    expect(proximityBonus(100)).toBe(2);
    expect(proximityBonus(119)).toBe(2);
  });

  it("returns 0 for >= 120 min", () => {
    expect(proximityBonus(120)).toBe(0);
    expect(proximityBonus(180)).toBe(0);
    expect(proximityBonus(300)).toBe(0);
  });

  it("exact boundaries: 29→15, 30→10, 59→10, 60→5, 89→5, 90→2, 119→2, 120→0", () => {
    expect(proximityBonus(29)).toBe(15);
    expect(proximityBonus(30)).toBe(10);
    expect(proximityBonus(59)).toBe(10);
    expect(proximityBonus(60)).toBe(5);
    expect(proximityBonus(89)).toBe(5);
    expect(proximityBonus(90)).toBe(2);
    expect(proximityBonus(119)).toBe(2);
    expect(proximityBonus(120)).toBe(0);
  });
});
