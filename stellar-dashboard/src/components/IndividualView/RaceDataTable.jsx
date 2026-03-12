import { PLANET_CONFIG, STATE_COLORS } from "../../constants/planets";

export default function RaceDataTable({ planetData, activePlanet, highlightedRace, setHighlightedRace }) {
  if (!planetData || planetData.length === 0) return null;

  const columns = ["Race", "Score", "State", "Authority", "Wins", "Top4", "Rules"];

  return (
    <div
      style={{
        marginTop: 16,
        background: "#ffffff",
        borderRadius: 12,
        border: "1px solid #e0e0dd",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {columns.map((h) => (
              <th
                key={h}
                style={{
                  color: "#333",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 700,
                  padding: "12px 10px",
                  textAlign: "left",
                  letterSpacing: 1,
                  borderBottom: "1px solid #e0e0dd",
                  fontSize: 13,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {planetData.map((d) => (
            <tr
              key={d.raceNumber}
              style={{
                borderBottom: "1px solid #f5f5f0",
                cursor: "pointer",
                background:
                  highlightedRace === d.raceNumber ? "#f5f5f0" : "transparent",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={() => setHighlightedRace(d.raceNumber)}
              onMouseLeave={() => setHighlightedRace(null)}
            >
              <td
                style={{
                  padding: "7px 10px",
                  color: "#444",
                  fontWeight: 700,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {d.raceNumber}
              </td>
              <td
                style={{
                  padding: "7px 10px",
                  color: "#1a1a2e",
                  fontWeight: 700,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {d.strengthScore}
              </td>
              <td
                style={{
                  padding: "7px 10px",
                  color: STATE_COLORS[d.stateCode] || "#555",
                  fontWeight: 700,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {d.stateName}
              </td>
              <td
                style={{
                  padding: "7px 10px",
                  color: "#333",
                  fontWeight: 600,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {d.authorityLevel || "—"}
              </td>
              <td
                style={{
                  padding: "7px 10px",
                  color: "#333",
                  fontWeight: 600,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {d.winCount}
              </td>
              <td
                style={{
                  padding: "7px 10px",
                  color: "#333",
                  fontWeight: 600,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {d.top4Count}
              </td>
              <td
                style={{
                  padding: "7px 10px",
                  color: PLANET_CONFIG[activePlanet].color,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {(d.triggeringRules || []).join(", ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
