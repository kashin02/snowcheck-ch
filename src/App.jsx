import { useState, useMemo } from "react";
import { FONT_LINK } from "./data/constants";
import useDashboardData from "./hooks/useDashboardData";
import useLocation, { proximityBonus } from "./hooks/useLocation";
import Header from "./components/Header";
import DangerBanner from "./components/DangerBanner";
import FilterBar from "./components/FilterBar";
import StationCard from "./components/StationCard";
import StationCardSkeleton from "./components/StationCardSkeleton";
import ErrorMessage from "./components/ErrorMessage";
import Footer from "./components/Footer";

// Fallback forecast (used when weather API hasn't loaded yet)
const fallbackForecast = [
  { day: "Sam", date: "14.02", icon: "\uD83C\uDF28\uFE0F", sun: 0, snow: "5", wind: 25, accent: false },
  { day: "Dim", date: "15.02", icon: "\u26C5", sun: 3, snow: "15", wind: 35, accent: false },
  { day: "Lun", date: "16.02", icon: "\u2744\uFE0F", sun: 0, snow: "45", wind: 80, accent: true },
  { day: "Mar", date: "17.02", icon: "\uD83C\uDF28\uFE0F", sun: 2, snow: "15", wind: 45, accent: false },
  { day: "Mer", date: "18.02", icon: "\u26C5", sun: 3, snow: "0", wind: 20, accent: false },
];

export default function App() {
  const { stations, avalanche, isLoading, allFailed, lastUpdate } = useDashboardData();
  const location = useLocation(stations);
  const [region, setRegion] = useState("Tous");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let s = stations;
    if (region !== "Tous") s = s.filter(x => x.region === region);
    if (search) s = s.filter(x => x.name.toLowerCase().includes(search.toLowerCase()));

    // Enrich with travel times + proximity bonus when location is set
    if (location.travelTimes) {
      s = s.map(st => {
        const tt = location.travelTimes[st.id];
        const bonus = tt ? proximityBonus(tt.durationMin) : 0;
        return {
          ...st,
          travelTime: tt || null,
          proximityBonus: bonus,
          combinedScore: (st.verdictScore ?? 0) + bonus,
        };
      });
    }

    // Sort by combined score (with proximity) or base score
    const key = location.travelTimes ? "combinedScore" : "verdictScore";
    return [...s].sort((a, b) => (b[key] ?? -1) - (a[key] ?? -1));
  }, [stations, region, search, location.travelTimes]);

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "var(--font-body)", overflowX: "hidden" }}>
        <Header stationCount={stations.length} lastUpdate={lastUpdate} />
        <DangerBanner avalancheData={avalanche} />
        <FilterBar
          region={region} setRegion={setRegion}
          search={search} setSearch={setSearch}
          filtered={filtered}
          location={location}
        />

        {allFailed && <ErrorMessage />}

        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 24px 24px" }}>
          {isLoading
            ? Array.from({ length: 6 }, (_, i) => <StationCardSkeleton key={i} index={i} />)
            : filtered.map((s, i) => (
                <StationCard
                  key={s.id}
                  station={s}
                  forecast={s.liveForecast || fallbackForecast}
                  index={i}
                />
              ))
          }
        </section>

        <Footer />
      </div>
    </>
  );
}
