import { PLANET_CONFIG } from "../../constants/planets";

/**
 * CombinedTooltip — clean multi-planet tooltip for the combined chart.
 */
export default function CombinedTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e0e0dd",
        borderRadius: 10,
        padding: "12px 16px",
        fontFamily: "'IBM Plex Mono', monospace",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#999",
          letterSpacing: 2,
          marginBottom: 8,
        }}
      >
        RACE {label}
      </div>
      {payload.map((entry) => {
        const cfg = PLANET_CONFIG[entry.dataKey];
        if (!cfg) return null;
        return (
          <div
            key={entry.dataKey}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "3px 0",
              fontSize: 12,
            }}
          >
            <span style={{ color: cfg.color, fontSize: 14 }}>{cfg.symbol}</span>
            <span style={{ color: cfg.color, width: 70 }}>{entry.dataKey}</span>
            <span style={{ color: "#1a1a2e", fontWeight: 700 }}>
              {entry.value ?? "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
