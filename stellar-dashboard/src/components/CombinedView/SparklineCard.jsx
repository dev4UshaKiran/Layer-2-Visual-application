import { PLANET_CONFIG, STATE_COLORS } from "../../constants/planets";

/**
 * SparklineCard — lightweight SVG sparkline with latest score for one planet.
 */
export default function SparklineCard({ planet, data }) {
  const cfg = PLANET_CONFIG[planet];
  const latest = data && data.length > 0 ? data[data.length - 1] : null;

  const W = 120;
  const H = 40;
  const PAD = 4;

  let pathD = "";
  if (data && data.length > 1) {
    const scores = data.map((d) => d.strengthScore);
    const maxVal = 200;
    const xStep = (W - PAD * 2) / (scores.length - 1);

    pathD = scores
      .map((s, i) => {
        const x = PAD + i * xStep;
        const y = H - PAD - ((s / maxVal) * (H - PAD * 2));
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }

  return (
    <div
      style={{
        flex: "1 1 160px",
        background: "#ffffff",
        border: "1px solid #e0e0dd",
        borderRadius: 10,
        padding: "12px 14px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 14, filter: `drop-shadow(0 0 4px ${cfg.color})` }}>
          {cfg.symbol}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: cfg.color,
            letterSpacing: 2,
          }}
        >
          {planet}
        </span>
        {latest && (
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 14,
              fontWeight: 700,
              color: "#1a1a2e",
            }}
          >
            {latest.strengthScore}
          </span>
        )}
      </div>

      {data && data.length > 1 ? (
        <svg width={W} height={H} style={{ display: "block" }}>
          <path
            d={pathD}
            fill="none"
            stroke={cfg.color}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <div
          style={{
            height: H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ccc",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
          }}
        >
          —
        </div>
      )}

      {latest && (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color: STATE_COLORS[latest.stateCode] || "#888",
            marginTop: 4,
          }}
        >
          {latest.stateName}
        </div>
      )}
    </div>
  );
}
