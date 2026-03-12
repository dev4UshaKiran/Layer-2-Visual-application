import { useState, useCallback } from "react";
import PlanetTabNav from "./PlanetTabNav";
import PlanetChart from "./PlanetChart";
import HoverPanel from "./HoverPanel";
import RaceDetailPanel from "./RaceDetailPanel";
import RaceDataTable from "./RaceDataTable";
import { PLANET_STATE_API } from "../../constants/api";

export default function IndividualView({
  allData,
  activePlanet,
  setActivePlanet,
  hoveredPoint,
  setHoveredPoint,
  selectedRace,
  setSelectedRace,
  cardId,
}) {
  const [highlightedRace, setHighlightedRace] = useState(null);
  const [raceDetail, setRaceDetail] = useState(null); // fetched planetary behaviour
  const [raceDetailLoading, setRaceDetailLoading] = useState(false);
  const [raceDetailError, setRaceDetailError] = useState(null);
  const planetData = allData?.[activePlanet] || [];

  /**
   * Fetch planetary behaviour for a specific race from the live API.
   * Endpoint: GET /api/v1/planetary-state/{cardId}/planet/{PLANET}?raceNumber={N}
   */
  const fetchRaceDetail = useCallback(
    async (planet, raceNumber) => {
      setRaceDetailLoading(true);
      setRaceDetailError(null);
      setRaceDetail(null);
      try {
        const url = `${PLANET_STATE_API}/${cardId}/planet/${planet}?raceNumber=${raceNumber}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRaceDetail(data);
      } catch (err) {
        console.error("Failed to fetch race detail:", err);
        setRaceDetailError(err.message);
      } finally {
        setRaceDetailLoading(false);
      }
    },
    [cardId]
  );

  const handleDotClick = (raceData) => {
    // Toggle: click same race again to deselect
    if (
      selectedRace?.raceNumber === raceData.raceNumber &&
      selectedRace?.planet === raceData.planet
    ) {
      setSelectedRace(null);
      setRaceDetail(null);
      setRaceDetailError(null);
    } else {
      setSelectedRace(raceData);
      // Fetch full planetary behaviour from API
      fetchRaceDetail(raceData.planet, raceData.raceNumber);
    }
  };

  const handleCloseDetail = () => {
    setSelectedRace(null);
    setRaceDetail(null);
    setRaceDetailError(null);
  };

  return (
    <div style={{ padding: "0 32px 32px" }}>
      <PlanetTabNav
        activePlanet={activePlanet}
        setActivePlanet={(p) => {
          setActivePlanet(p);
          setSelectedRace(null);
          setRaceDetail(null);
          setRaceDetailError(null);
        }}
      />

      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e0e0dd",
          padding: 20,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <PlanetChart
          planet={activePlanet}
          data={planetData}
          setHoveredPoint={setHoveredPoint}
          onDotClick={handleDotClick}
          selectedRaceNumber={selectedRace?.raceNumber}
        />
      </div>

      {/* HoverPanel is rendered via portal to document.body — NOT inside chart container */}
      {hoveredPoint && (
        <HoverPanel
          data={hoveredPoint.data}
          x={hoveredPoint.x}
          y={hoveredPoint.y}
        />
      )}

      {/* 
        Conditional: 
        - When a race dot is selected → show fetched planetary behaviour (RaceDetailPanel)
        - When no dot is selected → show RaceDataTable 
      */}
      {selectedRace && selectedRace.planet === activePlanet ? (
        <>
          {raceDetailLoading && (
            <div
              style={{
                marginTop: 16,
                padding: "32px 0",
                textAlign: "center",
                color: "#999",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              Loading planetary behaviour for Race {selectedRace.raceNumber}…
            </div>
          )}
          {raceDetailError && (
            <div
              style={{
                marginTop: 16,
                padding: "16px 20px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                color: "#b91c1c",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 15,
                fontWeight: 700,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Failed to load planetary behaviour: {raceDetailError}</span>
              <button
                onClick={handleCloseDetail}
                style={{
                  background: "none",
                  border: "none",
                  color: "#b91c1c",
                  cursor: "pointer",
                  fontSize: 18,
                  fontWeight: bold,
                }}
              >
                ✕
              </button>
            </div>
          )}
          {raceDetail && !raceDetailLoading && (
            <RaceDetailPanel data={raceDetail} onClose={handleCloseDetail} />
          )}
        </>
      ) : (
        <RaceDataTable
          planetData={planetData}
          activePlanet={activePlanet}
          highlightedRace={highlightedRace}
          setHighlightedRace={setHighlightedRace}
        />
      )}
    </div>
  );
}
