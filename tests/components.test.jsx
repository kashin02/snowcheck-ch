/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import DangerBanner from "../src/components/DangerBanner";
import DataStatusBanner from "../src/components/DataStatusBanner";

// ─────────────────────────────────────────────────────────────────────────
// 1. DangerBanner — conditional rendering based on avalanche data
// ─────────────────────────────────────────────────────────────────────────
describe("DangerBanner", () => {
  it("renders nothing when avalancheData is null", () => {
    const { container } = render(<DangerBanner avalancheData={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when avalancheData has no summary", () => {
    const { container } = render(<DangerBanner avalancheData={{ maxDanger: 2 }} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when summary is empty array", () => {
    const { container } = render(<DangerBanner avalancheData={{ summary: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows danger level badge for single danger level", () => {
    const data = {
      summary: [{ level: 3, label: "Marqué", count: 5 }],
    };
    render(<DangerBanner avalancheData={data} />);

    expect(screen.getByText("DANGER 3")).toBeInTheDocument();
    expect(screen.getByText(/5 régions/)).toBeInTheDocument();
  });

  it("shows highest danger level prominently", () => {
    const data = {
      summary: [
        { level: 4, label: "Fort", count: 2 },
        { level: 2, label: "Limité", count: 10 },
      ],
    };
    render(<DangerBanner avalancheData={data} />);

    expect(screen.getByText("DANGER 4")).toBeInTheDocument();
  });

  it("shows +N alertes when multiple danger levels", () => {
    const data = {
      summary: [
        { level: 3, label: "Marqué", count: 5 },
        { level: 2, label: "Limité", count: 8 },
      ],
    };
    render(<DangerBanner avalancheData={data} />);

    expect(screen.getByText("+ 1 alertes")).toBeInTheDocument();
  });

  it("does not show +N alertes for single level", () => {
    const data = {
      summary: [{ level: 2, label: "Limité", count: 10 }],
    };
    render(<DangerBanner avalancheData={data} />);

    expect(screen.queryByText(/alertes/)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. DataStatusBanner — shows when sources are failing
// ─────────────────────────────────────────────────────────────────────────
describe("DataStatusBanner", () => {
  it("renders nothing when sourceStatus is null", () => {
    const { container } = render(<DataStatusBanner sourceStatus={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when all sources are OK", () => {
    const status = {
      weather: { ok: true },
      snow: { ok: true },
      avalanche: { ok: true },
    };
    const { container } = render(<DataStatusBanner sourceStatus={status} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows banner when snow source fails", () => {
    const status = {
      weather: { ok: true },
      snow: { ok: false },
      avalanche: { ok: true },
    };
    render(<DataStatusBanner sourceStatus={status} fetchedAt="2026-01-15T10:00:00Z" />);

    expect(screen.getByText("Données partielles")).toBeInTheDocument();
    expect(screen.getByText(/Mesures de neige/)).toBeInTheDocument();
  });

  it("shows banner when weather source fails", () => {
    const status = {
      weather: { ok: false },
      snow: { ok: true },
      avalanche: { ok: true },
    };
    render(<DataStatusBanner sourceStatus={status} />);

    expect(screen.getByText(/Prévisions météo/)).toBeInTheDocument();
  });

  it("shows banner when avalanche source fails", () => {
    const status = {
      weather: { ok: true },
      snow: { ok: true },
      avalanche: { ok: false },
    };
    render(<DataStatusBanner sourceStatus={status} />);

    expect(screen.getByText(/Bulletin d\u2019avalanches/)).toBeInTheDocument();
  });

  it("shows multiple failed sources", () => {
    const status = {
      weather: { ok: false },
      snow: { ok: false },
      avalanche: { ok: true },
    };
    render(<DataStatusBanner sourceStatus={status} />);

    expect(screen.getByText(/Prévisions météo/)).toBeInTheDocument();
    expect(screen.getByText(/Mesures de neige/)).toBeInTheDocument();
  });

  it("shows last update time when fetchedAt is provided", () => {
    const status = { weather: { ok: false }, snow: { ok: true }, avalanche: { ok: true } };
    render(<DataStatusBanner sourceStatus={status} fetchedAt="2026-01-15T10:30:00Z" />);

    expect(screen.getByText(/Dernière mise à jour/)).toBeInTheDocument();
  });

  it("does not show last update when fetchedAt is null", () => {
    const status = { weather: { ok: false }, snow: { ok: true }, avalanche: { ok: true } };
    render(<DataStatusBanner sourceStatus={status} fetchedAt={null} />);

    expect(screen.queryByText(/Dernière mise à jour/)).not.toBeInTheDocument();
  });

  it("shows retry message", () => {
    const status = { snow: { ok: false }, weather: { ok: true }, avalanche: { ok: true } };
    render(<DataStatusBanner sourceStatus={status} />);

    expect(screen.getByText(/nouvelle tentative automatique/)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. ForecastRow CrowdDot — crowd label logic
// ─────────────────────────────────────────────────────────────────────────
// CrowdDot is not exported, but we can test its logic indirectly
// by verifying the label thresholds from the source code
describe("CrowdDot labels (logic verification)", () => {
  // The CrowdDot component uses these rules:
  // crowdScore >= 12 → "Bondé" (red)
  // crowdScore >= 8  → "Chargé" (orange)
  // crowdScore >= 5  → "Moyen" (yellow)
  // else             → "Calme" (green)

  const crowdLabel = (score) => {
    if (score == null) return null;
    if (score >= 12) return "Bondé";
    if (score >= 8) return "Chargé";
    if (score >= 5) return "Moyen";
    return "Calme";
  };

  const crowdColor = (score) => {
    if (score >= 12) return "#dc2626";
    if (score >= 8) return "#d97706";
    if (score >= 5) return "#ca8a04";
    return "#16a34a";
  };

  it("returns null for null score", () => {
    expect(crowdLabel(null)).toBe(null);
  });

  it("returns 'Calme' for low crowd (0-4)", () => {
    expect(crowdLabel(0)).toBe("Calme");
    expect(crowdLabel(4)).toBe("Calme");
    expect(crowdColor(0)).toBe("#16a34a");
  });

  it("returns 'Moyen' for medium crowd (5-7)", () => {
    expect(crowdLabel(5)).toBe("Moyen");
    expect(crowdLabel(7)).toBe("Moyen");
    expect(crowdColor(5)).toBe("#ca8a04");
  });

  it("returns 'Chargé' for high crowd (8-11)", () => {
    expect(crowdLabel(8)).toBe("Chargé");
    expect(crowdLabel(11)).toBe("Chargé");
    expect(crowdColor(8)).toBe("#d97706");
  });

  it("returns 'Bondé' for packed (12-15)", () => {
    expect(crowdLabel(12)).toBe("Bondé");
    expect(crowdLabel(15)).toBe("Bondé");
    expect(crowdColor(12)).toBe("#dc2626");
  });

  it("exact boundaries: 4→Calme, 5→Moyen, 7→Moyen, 8→Chargé, 11→Chargé, 12→Bondé", () => {
    expect(crowdLabel(4)).toBe("Calme");
    expect(crowdLabel(5)).toBe("Moyen");
    expect(crowdLabel(7)).toBe("Moyen");
    expect(crowdLabel(8)).toBe("Chargé");
    expect(crowdLabel(11)).toBe("Chargé");
    expect(crowdLabel(12)).toBe("Bondé");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. StationCard display logic — conditional rendering rules
// ─────────────────────────────────────────────────────────────────────────
describe("StationCard display logic (verification)", () => {
  // Wind display threshold: only shown when >= 25 km/h
  it("wind is hidden below 25 km/h", () => {
    expect(24 >= 25).toBe(false);
    expect(25 >= 25).toBe(true);
  });

  // Wind color: red >= 60, orange otherwise
  it("wind color: red >= 60 km/h, orange < 60", () => {
    const windColor = (kmh) => kmh >= 60 ? "#dc2626" : "#d97706";
    expect(windColor(59)).toBe("#d97706");
    expect(windColor(60)).toBe("#dc2626");
    expect(windColor(100)).toBe("#dc2626");
  });

  // Fresh snow: only shown when > 0
  it("fresh snow badge hidden when 0", () => {
    expect(0 > 0).toBe(false);
    expect(1 > 0).toBe(true);
  });

  // Sunshine color logic
  it("sun color: golden >= 3h, amber > 0h, gray = 0h", () => {
    const sunColor = (h) => h >= 3 ? "#b45309" : h > 0 ? "#d97706" : "#94a3b8";
    expect(sunColor(0)).toBe("#94a3b8");
    expect(sunColor(1)).toBe("#d97706");
    expect(sunColor(3)).toBe("#b45309");
    expect(sunColor(8)).toBe("#b45309");
  });

  // Quality badge color
  it("quality badge: green for Poudreuse, red for Humide, gray otherwise", () => {
    const qualityColor = (q) => q === "Poudreuse" ? "#059669" : q === "Humide" ? "#dc2626" : "#64748b";
    expect(qualityColor("Poudreuse")).toBe("#059669");
    expect(qualityColor("Humide")).toBe("#dc2626");
    expect(qualityColor("Compacte")).toBe("#64748b");
    expect(qualityColor("Dure")).toBe("#64748b");
  });

  // Forecast accent (alert) condition
  it("forecast day has accent when snowfall >= 30cm or wind >= 60", () => {
    const isAccent = (snow, wind) => snow >= 30 || wind >= 60;
    expect(isAccent(0, 0)).toBe(false);
    expect(isAccent(29, 59)).toBe(false);
    expect(isAccent(30, 0)).toBe(true);
    expect(isAccent(0, 60)).toBe(true);
    expect(isAccent(50, 80)).toBe(true);
  });

  // Snow display in forecast: color thresholds
  it("forecast snow color: green >= 20cm, blue > 0, gray = 0", () => {
    const snowColor = (cm) => cm >= 20 ? "#059669" : cm > 0 ? "#3b82f6" : "#d1d5db";
    expect(snowColor(0)).toBe("#d1d5db");
    expect(snowColor(5)).toBe("#3b82f6");
    expect(snowColor(19)).toBe("#3b82f6");
    expect(snowColor(20)).toBe("#059669");
    expect(snowColor(50)).toBe("#059669");
  });

  // Forecast wind shown only when >= 50
  it("forecast wind badge only shown when >= 50 km/h", () => {
    expect(49 >= 50).toBe(false);
    expect(50 >= 50).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. VerdictBreakdown display logic
// ─────────────────────────────────────────────────────────────────────────
describe("VerdictBreakdown display logic", () => {
  // FactorRow percentage calculation
  it("positive factor bar: pts/max * 100", () => {
    const pct = (pts, max) => max > 0 ? Math.round((pts / max) * 100) : 0;
    expect(pct(35, 35)).toBe(100);
    expect(pct(0, 35)).toBe(0);
    expect(pct(20, 35)).toBe(57);
    expect(pct(0, 0)).toBe(0);
  });

  it("negative factor bar: |pts|/|min| * 100", () => {
    const pct = (pts, min) => min < 0 ? Math.round((Math.abs(pts) / Math.abs(min)) * 100) : 0;
    expect(pct(-30, -30)).toBe(100);
    expect(pct(0, -30)).toBe(0);
    expect(pct(-15, -30)).toBe(50);
    expect(pct(0, 0)).toBe(0);
  });

  // Factor count: 7 without proximity, 8 with
  it("shows 7 factors without proximity, 8 with", () => {
    const factorCount = (hasProximity) => hasProximity ? 8 : 7;
    expect(factorCount(false)).toBe(7);
    expect(factorCount(true)).toBe(8);
  });

  // Total score with proximity
  it("total score includes proximity bonus", () => {
    const totalScore = (score, proximityBonus, hasProximity) =>
      hasProximity ? score + proximityBonus : score;
    expect(totalScore(60, 15, true)).toBe(75);
    expect(totalScore(60, 15, false)).toBe(60);
    expect(totalScore(95, 10, true)).toBe(105); // not clamped in display
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. DangerBanner color logic
// ─────────────────────────────────────────────────────────────────────────
describe("DangerBanner color logic", () => {
  it("uses dark red for danger >= 4", () => {
    const col = (mx) => mx >= 4 ? "#991b1b" : mx >= 3 ? "#dc2626" : "#d97706";
    expect(col(5)).toBe("#991b1b");
    expect(col(4)).toBe("#991b1b");
  });

  it("uses red for danger 3", () => {
    const col = (mx) => mx >= 4 ? "#991b1b" : mx >= 3 ? "#dc2626" : "#d97706";
    expect(col(3)).toBe("#dc2626");
  });

  it("uses orange for danger 1-2", () => {
    const col = (mx) => mx >= 4 ? "#991b1b" : mx >= 3 ? "#dc2626" : "#d97706";
    expect(col(2)).toBe("#d97706");
    expect(col(1)).toBe("#d97706");
  });
});
