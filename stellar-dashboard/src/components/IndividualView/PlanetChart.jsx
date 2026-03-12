import { useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { PLANET_CONFIG, STATE_COLORS } from "../../constants/planets";

/**
 * PlanetChart — single planet line chart.
 *
 * Mouse events use onMouseMove / onMouseLeave on the <LineChart> element,
 * NOT onMouseEnter on individual dots.
 *
 * Custom dots are coloured by stateCode using STATE_COLORS.
 */
export default function PlanetChart({ planet, data, setHoveredPoint, onDotClick, selectedRaceNumber }) {
  const chartContainerRef = useRef(null);
  const onDotClickRef = useRef(onDotClick);
  onDotClickRef.current = onDotClick;
  const cfg = PLANET_CONFIG[planet];

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 320,
          background: "#ffffff",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ccc",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
        }}
      >
        NO DATA FOR {planet}
      </div>
    );
  }

  /**
   * Custom dot renderer — colour each dot by stateCode, NOT by planet colour.
   * Highlighted ring if this race is currently selected.
   */
  const renderCustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;
    const color = STATE_COLORS[payload.stateCode] || "#888";
    const isSelected = selectedRaceNumber === payload.raceNumber;
    return (
      <g key={`dot-${payload.raceNumber}`}>
        {isSelected && (
          <circle
            cx={cx}
            cy={cy}
            r={10}
            fill="none"
            stroke={cfg.color}
            strokeWidth={2}
            strokeDasharray="3 2"
            style={{ filter: `drop-shadow(0 0 6px ${cfg.color}88)` }}
          />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 7 : 5}
          fill={color}
          stroke={cfg.color}
          strokeWidth={1.5}
          style={{ cursor: "pointer", filter: `drop-shadow(0 0 4px ${color})` }}
          onClick={(e) => {
            e.stopPropagation();
            if (onDotClickRef.current) onDotClickRef.current(payload);
          }}
        />
      </g>
    );
  };

  /**
   * Correct coordinate calculation:
   * Use chart's bounding rect to convert chartX/chartY to viewport coords
   * for the position:fixed HoverPanel portal.
   */
  const handleChartMouseMove = (state) => {
    if (!state?.isTooltipActive || !state?.activePayload?.[0]) {
      return;
    }
    const payload = state.activePayload[0].payload;
    const containerRect = chartContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    // state.chartX / state.chartY are relative to the SVG chart area.
    // Add container's viewport offset to get viewport-relative position.
    setHoveredPoint({
      data: payload,
      x: containerRect.left + state.chartX,
      y: containerRect.top + state.chartY,
    });
  };

  const handleChartMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Click is handled directly on each dot circle via onDotClickRef — no chart-level onClick needed.

  return (
    <div ref={chartContainerRef} style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
          onMouseMove={handleChartMouseMove}
          onMouseLeave={handleChartMouseLeave}
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
              offset: -8,
              style: {
                fill: "#999",
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
              },
            }}
            tick={{
              fill: "#999",
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          />
          <YAxis
            domain={[0, 200]}
            tickCount={5}
            label={{
              value: "Strength",
              angle: -90,
              position: "insideLeft",
              style: {
                fill: "#999",
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
              },
            }}
            tick={{
              fill: "#999",
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          />
          <ReferenceLine
            y={100}
            stroke="#00000011"
            strokeDasharray="4 4"
          />
          <Line
            type="monotone"
            dataKey="strengthScore"
            stroke={cfg.color}
            strokeWidth={2}
            dot={renderCustomDot}
            activeDot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
