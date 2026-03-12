import { useState, useCallback } from "react";
import { usePlanetaryData } from "./hooks/usePlanetaryData";
import Header from "./components/Header";
import PlanetSummaryBar from "./components/PlanetSummaryBar";
import ViewToggle from "./components/ViewToggle";
import IndividualView from "./components/IndividualView/IndividualView";
import CombinedView from "./components/CombinedView/CombinedView";
import AllPlanetsView from "./components/AllPlanetsView/AllPlanetsView";
import ChartSkeleton from "./components/ui/ChartSkeleton";
import ErrorBanner from "./components/ui/ErrorBanner";

export default function App() {
  // ── All state lives in the root App component ──
  const [cardIdInput, setCardIdInput] = useState("SAN-2026-03-11");
  const [activePlanet, setActivePlanet] = useState("MARS");
  const [view, setView] = useState("individual"); // "individual" | "combined"
  const [hoveredPoint, setHoveredPoint] = useState(null); // { data, x, y } | null
  const [selectedRace, setSelectedRace] = useState(null); // PlanetaryState | null — clicked dot

  const { allData, loading, error, submittedCardId, fetchAll } =
    usePlanetaryData();

  // ── Fetch handler — clears hoveredPoint and selectedRace on every new fetch ──
  const handleFetch = useCallback(() => {
    const id = cardIdInput.trim();
    if (!id) return;
    setHoveredPoint(null);
    setSelectedRace(null);
    fetchAll(id);
  }, [cardIdInput, fetchAll]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f0",
        color: "#1a1a2e",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <Header
        cardIdInput={cardIdInput}
        setCardIdInput={setCardIdInput}
        onFetch={handleFetch}
        loading={loading}
      />

      {/* Error banner */}
      {error && (
        <div style={{ padding: "16px 32px 0" }}>
          <ErrorBanner message={error} />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ padding: "24px 32px" }}>
          <ChartSkeleton />
        </div>
      )}

      {/* Main content — only shown when data is loaded */}
      {!loading && allData && (
        <>
          <PlanetSummaryBar
            allData={allData}
            activePlanet={activePlanet}
            setActivePlanet={setActivePlanet}
          />

          <ViewToggle view={view} setView={setView} />

          {view === "individual" ? (
            <IndividualView
              allData={allData}
              activePlanet={activePlanet}
              setActivePlanet={setActivePlanet}
              hoveredPoint={hoveredPoint}
              setHoveredPoint={setHoveredPoint}
              selectedRace={selectedRace}
              setSelectedRace={setSelectedRace}
              cardId={submittedCardId}
            />
          ) : view === "combined" ? (
            <CombinedView allData={allData} />
          ) : (
            <AllPlanetsView allData={allData} />
          )}
        </>
      )}

      {/* Empty state — before first fetch */}
      {!loading && !allData && !error && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "50vh",
            color: "#bbb",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13,
            textAlign: "center",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>🪐</div>
          <div style={{ letterSpacing: 2 }}>ENTER A CARD ID AND CLICK FETCH</div>
          <div style={{ fontSize: 10, color: "#ccc" }}>
            e.g. SAN-2026-03-11
          </div>
        </div>
      )}
    </div>
  );
}
