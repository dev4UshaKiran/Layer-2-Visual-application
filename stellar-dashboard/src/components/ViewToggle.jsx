export default function ViewToggle({ view, setView }) {
  const tabs = [
    { key: "individual", label: "INDIVIDUAL" },
    { key: "combined", label: "COMBINED" },
    { key: "allplanets", label: "ALL PLANETS" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "0 32px",
        marginBottom: 16,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setView(tab.key)}
          style={{
            background: view === tab.key ? "#1a1a2e" : "transparent",
            border: `1px solid ${view === tab.key ? "#1a1a2e" : "#e0e0dd"}`,
            borderRadius: 8,
            color: view === tab.key ? "#fff" : "#999",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            padding: "8px 20px",
            cursor: "pointer",
            letterSpacing: 2,
            transition: "all 0.2s ease",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
