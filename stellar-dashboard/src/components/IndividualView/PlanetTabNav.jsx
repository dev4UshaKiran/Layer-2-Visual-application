import { PLANET_CONFIG } from "../../constants/planets";

export default function PlanetTabNav({ activePlanet, setActivePlanet }) {
  const PLANETS = ["MARS", "VENUS", "MERCURY", "MOON", "SUN"];

  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
      {PLANETS.map((p) => {
        const cfg = PLANET_CONFIG[p];
        const active = activePlanet === p;
        return (
          <button
            key={p}
            onClick={() => setActivePlanet(p)}
            style={{
              background: active ? `${cfg.color}12` : "#ffffff",
              border: `1px solid ${active ? cfg.color + "55" : "#e0e0dd"}`,
              borderRadius: 8,
              color: active ? cfg.color : "#999",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              padding: "8px 16px",
              cursor: "pointer",
              letterSpacing: 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s ease",
            }}
          >
            <span style={{ fontSize: 14 }}>{cfg.symbol}</span>
            {p}
          </button>
        );
      })}
    </div>
  );
}
