export default function ChartSkeleton() {
  return (
    <div
      style={{
        height: 320,
        background: "#ffffff",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #e0e0dd",
      }}
    >
      <div
        style={{
          color: "#bbb",
          fontSize: 12,
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: 2,
          animation: "pulse 1.5s infinite",
        }}
      >
        LOADING PLANETARY DATA...
      </div>
    </div>
  );
}
