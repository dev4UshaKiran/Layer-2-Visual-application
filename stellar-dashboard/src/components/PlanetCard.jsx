import { PLANET_CONFIG, STATE_COLORS } from "../constants/planets";

export default function PlanetCard({ planet, data, isActive, onClick }) {
  const cfg = PLANET_CONFIG[planet];
  const latest = data && data.length > 0 ? data[data.length - 1] : null;

  return (
    <button
      onClick={onClick}
      style={{
        flex: "1 1 140px",
        background: isActive ? `${cfg.color}11` : "#ffffff",
        border: `1px solid ${isActive ? cfg.color + "66" : "#e0e0dd"}`,
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s ease",
        boxShadow: isActive ? `0 2px 12px ${cfg.color}15` : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18, filter: `drop-shadow(0 0 4px ${cfg.color}88)` }}>
          {cfg.symbol}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: cfg.color,
            letterSpacing: 2,
            fontWeight: 600,
          }}
        >
          {planet}
        </span>
      </div>

      {latest ? (
        <>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 28,
              fontWeight: 700,
              color: "#1a1a2e",
              lineHeight: 1,
            }}
          >
            {latest.strengthScore}
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: STATE_COLORS[latest.stateCode] || "#888",
              marginTop: 4,
              letterSpacing: 1,
            }}
          >
            {latest.stateName}
          </div>
        </>
      ) : (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: "#ccc",
          }}
        >
          NO DATA
        </div>
      )}
    </button>
  );
}
