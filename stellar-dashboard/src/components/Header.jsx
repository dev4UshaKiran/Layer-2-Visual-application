export default function Header({
  cardIdInput,
  setCardIdInput,
  onFetch,
  loading,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") onFetch();
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 32px",
        borderBottom: "1px solid #e0e0dd",
        background: "#ffffff",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      {/* Logo / Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>🪐</span>
        <div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: "#1a1a2e",
              margin: 0,
              letterSpacing: 1,
            }}
          >
            PLANETARY STATE DASHBOARD
          </h1>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: "#999",
              letterSpacing: 2,
              marginTop: 2,
            }}
          >
            STELLARTRACK LAYER 2
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <input
          value={cardIdInput}
          onChange={(e) => setCardIdInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. SAN-2026-03-11"
          style={{
            background: "#f5f5f0",
            border: "1px solid #e0e0dd",
            borderRadius: 8,
            color: "#1a1a2e",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13,
            padding: "10px 16px",
            outline: "none",
            width: 240,
          }}
        />
        <button
          onClick={onFetch}
          disabled={loading}
          style={{
            background: loading ? "#e8e8e3" : "#1a1a2e",
            border: "1px solid #1a1a2e",
            borderRadius: 8,
            color: "#fff",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            padding: "10px 20px",
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: 2,
          }}
        >
          {loading ? "LOADING..." : "FETCH"}
        </button>

      </div>
    </header>
  );
}
