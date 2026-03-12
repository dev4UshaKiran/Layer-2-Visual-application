import { useMemo } from "react";
import { PLANETS } from "../../constants/planets";
import { buildCombinedData } from "../../utils/transform";
import AllPlanetsChart from "./AllPlanetsChart";
import SparklineCard from "./SparklineCard";

export default function CombinedView({ allData }) {
  const combinedData = useMemo(() => buildCombinedData(allData), [allData]);

  return (
    <div style={{ padding: "0 32px 32px" }}>
      <AllPlanetsChart combinedData={combinedData} />

      {/* Sparkline Summary Row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 16,
          flexWrap: "wrap",
        }}
      >
        {PLANETS.map((p) => (
          <SparklineCard key={p} planet={p} data={allData?.[p]} />
        ))}
      </div>
    </div>
  );
}
