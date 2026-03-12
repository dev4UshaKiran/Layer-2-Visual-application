import { PLANETS } from "../constants/planets";
import PlanetCard from "./PlanetCard";

export default function PlanetSummaryBar({ allData, activePlanet, setActivePlanet }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "16px 32px",
        flexWrap: "wrap",
      }}
    >
      {PLANETS.map((p) => (
        <PlanetCard
          key={p}
          planet={p}
          data={allData?.[p]}
          isActive={activePlanet === p}
          onClick={() => setActivePlanet(p)}
        />
      ))}
    </div>
  );
}
