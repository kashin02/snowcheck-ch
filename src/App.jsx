import { useState, useMemo } from "react";
import useDashboardData from "./hooks/useDashboardData";
import useLocation, { proximityBonus } from "./hooks/useLocation";
import Header from "./components/Header";
import DangerBanner from "./components/DangerBanner";
import DataStatusBanner from "./components/DataStatusBanner";
import FilterBar from "./components/FilterBar";
import StationCard from "./components/StationCard";
import StationCardSkeleton from "./components/StationCardSkeleton";
import ErrorMessage from "./components/ErrorMessage";
import Footer from "./components/Footer";
import { normalize } from "./utils/format";

export default function App() {
  const { stations, avalanche, isLoading, allFailed, lastUpdate, sourceStatus } = useDashboardData();
  const location = useLocation(stations);
  const [region, setRegion] = useState("Tous");
  const [search, setSearch] = useState("");
  const [maxDurationMin, setMaxDurationMinState] = useState(
    () => Number(localStorage.getItem("snowcheck-max-duration")) || 300
  );

  function setMaxDurationMin(val) {
    setMaxDurationMinState(val);
    localStorage.setItem("snowcheck-max-duration", val);
  }

  const filtered = useMemo(() => {
    let s = stations;
    if (region !== "Tous") s = s.filter(x => x.region === region);
    if (search) s = s.filter(x => normalize(x.name).includes(normalize(search)));

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

    // Filter by max travel duration when location is set
    if (location.travelTimes && maxDurationMin < 300) {
      s = s.filter(st => !st.travelTime || st.travelTime.durationMin <= maxDurationMin);
    }

    // Sort by combined score (with proximity) or base score
    const key = location.travelTimes ? "combinedScore" : "verdictScore";
    return [...s].sort((a, b) => (b[key] ?? -1) - (a[key] ?? -1));
  }, [stations, region, search, location.travelTimes, maxDurationMin]);

  return (
    <>
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "var(--font-body)", overflowX: "hidden" }}>
        <Header stationCount={stations.length} lastUpdate={lastUpdate} />
        <DangerBanner avalancheData={avalanche} />
        <DataStatusBanner sourceStatus={sourceStatus} fetchedAt={lastUpdate} />
        <FilterBar
          region={region} setRegion={setRegion}
          search={search} setSearch={setSearch}
          filtered={filtered}
          location={location}
          maxDurationMin={maxDurationMin}
          setMaxDurationMin={setMaxDurationMin}
        />

        {allFailed && <ErrorMessage />}

        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 24px 24px" }}>
          {isLoading
            ? Array.from({ length: 6 }, (_, i) => <StationCardSkeleton key={i} index={i} />)
            : filtered.map((s, i) => (
                <StationCard
                  key={s.id}
                  station={s}
                  forecast={s.liveForecast}
                  index={i}
                />
              ))
          }
        </section>

        <Footer lastUpdate={lastUpdate} sourceStatus={sourceStatus} />
      </div>
    </>
  );
}
