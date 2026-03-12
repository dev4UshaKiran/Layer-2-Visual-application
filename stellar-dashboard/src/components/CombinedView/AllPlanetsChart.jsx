import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  Legend,
} from "recharts";
import { PLANETS, PLANET_CONFIG } from "../../constants/planets";
import CombinedTooltip from "./CombinedTooltip";

/**
 * AllPlanetsChart — multi-line Recharts chart showing all 5 planets.
 */
export default function AllPlanetsChart({ combinedData }) {
  if (!combinedData || combinedData.length === 0) {
    return (
      <div
        style={{
          height: 380,
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
        NO COMBINED DATA
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        border: "1px solid #e0e0dd",
        padding: 20,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <ResponsiveContainer width="100%" height={380}>
        <LineChart
          data={combinedData}
          margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#00000008"
            vertical={false}
          />
          <XAxis
            dataKey="race"
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
          <ReferenceLine y={100} stroke="#00000011" strokeDasharray="4 4" />
          <Tooltip content={<CombinedTooltip />} />
          <Legend
            formatter={(val) =>
              `${PLANET_CONFIG[val]?.symbol || ""} ${val}`
            }
            wrapperStyle={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
            }}
          />
          {PLANETS.map((p) => (
            <Line
              key={p}
              dataKey={p}
              stroke={PLANET_CONFIG[p].color}
              strokeWidth={2}
              dot={{ r: 4, fill: PLANET_CONFIG[p].color }}
              activeDot={{ r: 7 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
