import { useState } from "react";
import { PLANETS, PLANET_CONFIG, STATE_COLORS } from "../../constants/planets";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
} from "recharts";

/* ── Custom Tooltip ───────────────────────────────── */
function PlanetTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const stateColor = STATE_COLORS[d.stateCode] || "#555";
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e0e0dd",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        minWidth: 160,
      }}
    >
      <div style={{ fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>
        Race {d.raceNumber}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <span style={{ color: "#888" }}>Strength</span>
        <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{d.strengthScore}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginTop: 2 }}>
        <span style={{ color: "#888" }}>State</span>
        <span style={{ fontWeight: 700, color: stateColor }}>{d.stateName}</span>
      </div>
      {d.authorityLevel && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginTop: 2 }}>
          <span style={{ color: "#888" }}>Authority</span>
          <span style={{ fontWeight: 600, color: "#555" }}>{d.authorityLevel}</span>
        </div>
      )}
    </div>
  );
}

/* ── Single Planet Panel ──────────────────────────── */
function PlanetPanel({ planet, data }) {
  const cfg = PLANET_CONFIG[planet];
  const latest = data?.[data.length - 1];

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        border: `1.5px solid ${cfg.color}33`,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 20px 10px",
          borderBottom: `1px solid ${cfg.color}22`,
          background: `${cfg.color}06`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 22,
              filter: `drop-shadow(0 0 4px ${cfg.color}88)`,
            }}
          >
            {cfg.symbol}
          </span>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: cfg.color,
              letterSpacing: 2,
            }}
          >
            {planet}
          </span>
        </div>

        {/* Latest score + state badge */}
        {latest && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: STATE_COLORS[latest.stateCode] || "#555",
                background: `${STATE_COLORS[latest.stateCode] || "#555"}15`,
                border: `1px solid ${STATE_COLORS[latest.stateCode] || "#555"}44`,
                borderRadius: 6,
                padding: "3px 10px",
                letterSpacing: 1,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {latest.stateName}
            </span>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#1a1a2e",
                  lineHeight: 1,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {latest.strengthScore}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "#999",
                  letterSpacing: 1,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                LATEST
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      {!data || data.length === 0 ? (
        <div
          style={{
            height: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ccc",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
          }}
        >
          NO DATA
        </div>
      ) : (
        <div style={{ padding: "12px 8px 8px" }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={data}
              margin={{ top: 8, right: 16, bottom: 16, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#00000008"
                vertical={false}
              />
              <XAxis
                dataKey="raceNumber"
                label={{
                  value: "Race",
                  position: "insideBottom",
                  offset: -6,
                  style: {
                    fill: "#aaa",
                    fontSize: 10,
                    fontFamily: "'IBM Plex Mono', monospace",
                  },
                }}
                tick={{
                  fill: "#aaa",
                  fontSize: 10,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              />
              <YAxis
                domain={[0, 200]}
                tickCount={5}
                tick={{
                  fill: "#aaa",
                  fontSize: 10,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
                width={32}
              />
              <ReferenceLine y={100} stroke="#00000010" strokeDasharray="4 4" />
              <Tooltip content={<PlanetTooltip />} />
              <Line
                type="monotone"
                dataKey="strengthScore"
                stroke={cfg.color}
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (cx == null || cy == null) return null;
                  const dotColor = STATE_COLORS[payload.stateCode] || "#888";
                  return (
                    <circle
                      key={`dot-${payload.raceNumber}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={dotColor}
                      stroke={cfg.color}
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 6, stroke: cfg.color, strokeWidth: 2 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mini stats footer */}
      {latest && (
        <div
          style={{
            display: "flex",
            gap: 0,
            borderTop: `1px solid ${cfg.color}15`,
          }}
        >
          {[
            { label: "RACES", value: data.length },
            { label: "WINS", value: latest.winCount },
            { label: "TOP 4", value: latest.top4Count },
            { label: "AUTHORITY", value: latest.authorityLevel || "—" },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRight: i < arr.length - 1 ? `1px solid ${cfg.color}15` : "none",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#aaa",
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: 1,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1a1a2e",
                  fontFamily: "'IBM Plex Mono', monospace",
                  marginTop: 2,
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── AllPlanetsView ───────────────────────────────── */
export default function AllPlanetsView({ allData }) {
  return (
    <div style={{ padding: "0 32px 40px" }}>
      {/* Section header */}
      <div
        style={{
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: "1px solid #e0e0dd",
          display: "flex",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: "#1a1a2e",
            margin: 0,
            letterSpacing: 2,
          }}
        >
          ALL PLANETS
        </h2>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: "#999",
            letterSpacing: 1,
          }}
        >
          STRENGTH OVER RACES
        </span>
      </div>

      {/* 2-column grid — 5 planets (last one full-width) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        {PLANETS.map((planet, i) => (
          <div
            key={planet}
            style={{
              // 5th planet spans both columns
              gridColumn: i === PLANETS.length - 1 && PLANETS.length % 2 !== 0 ? "1 / -1" : undefined,
            }}
          >
            <PlanetPanel planet={planet} data={allData?.[planet] || []} />
          </div>
        ))}
      </div>
    </div>
  );
}
