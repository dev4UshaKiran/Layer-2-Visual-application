import { PLANET_CONFIG, STATE_COLORS, SCORE_FLAGS } from "../../constants/planets";

/**
 * RaceDetailPanel — shown below the chart when a user clicks a dot.
 * Displays the full planetary behaviour for that specific race.
 */
export default function RaceDetailPanel({ data, onClose }) {
  if (!data) return null;

  const cfg = PLANET_CONFIG[data.planet];

  return (
    <div
      style={{
        marginTop: 16,
        background: "#ffffff",
        borderRadius: 14,
        border: `2px solid ${cfg.color}44`,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 18,
        fontWeight: 700,
        boxShadow: `0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px ${cfg.color}11`,
        animation: "fadeIn 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* ── Header ────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "18px 22px 14px",
          background: `${cfg.color}08`,
          borderBottom: `1px solid ${cfg.color}22`,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24, filter: `drop-shadow(0 0 6px ${cfg.color}88)` }}>
              {cfg.symbol}
            </span>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 20,
                fontWeight: 800,
                color: cfg.color,
                letterSpacing: 2,
              }}
            >
              {data.planet}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#555",
                marginLeft: 4,
              }}
            >
              Race {data.raceNumber}
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#444", marginTop: 4 }}>
            {data.cardId} · {data.rulesetVersion}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#1a1a2e",
                lineHeight: 1,
              }}
            >
              {data.strengthScore}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#555", letterSpacing: 1, marginTop: 2 }}>
              STRENGTH
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#f0f0eb",
              border: "1px solid #e0e0dd",
              color: "#888",
            fontSize: 18,
            fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── State + Authority Badges ──────────────── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 22px",
          flexWrap: "wrap",
          borderBottom: "1px solid #f0f0eb",
        }}
      >
        <Badge label={data.stateName} color={STATE_COLORS[data.stateCode] || "#888"} />
        {data.authorityLevel && <Badge label={data.authorityLevel} color="#6b7280" />}
        {data.momentum && <Badge label={`↕ ${data.momentum}`} color="#8b5cf6" />}
      </div>

      {/* ── Stats + Score Breakdown side by side ──── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
        }}
      >
        {/* Left: Stats Grid */}
        <div style={{ padding: "14px 22px", borderRight: "1px solid #f0f0eb" }}>
          <SectionTitle>STATS</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 8,
            }}
          >
            <StatCell label="WINS" value={data.winCount} />
            <StatCell label="TOP 4" value={data.top4Count} />
            <StatCell label="ABSENT" value={data.absenceDuration} />
            <StatCell label="SINCE WIN" value={data.racesSinceLastWin ?? "—"} />
          </div>
        </div>

        {/* Right: Score Breakdown */}
        <div style={{ padding: "14px 22px" }}>
          <SectionTitle>SCORE BREAKDOWN</SectionTitle>
          <div style={{ marginTop: 8 }}>
            {SCORE_FLAGS.map((flag) => {
              const val = data.contextFlags?.[flag];
              if (val == null) return null;
              return (
                <div
                  key={flag}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "3px 0",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "#444", fontWeight: 600 }}>{flag}</span>
                  <span style={{ color: getScoreColor(val), fontWeight: 700 }}>
                    {String(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Position Trend + Rules side by side ───── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          borderTop: "1px solid #f0f0eb",
        }}
      >
        {/* Left: Position Trend */}
        <div style={{ padding: "14px 22px", borderRight: "1px solid #f0f0eb" }}>
          <SectionTitle>POSITION TREND</SectionTitle>
          <div style={{ marginTop: 8 }}>
            {data.positionTrend && data.positionTrend.length > 0 ? (
              data.positionTrend.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    padding: "3px 0",
                  }}
                >
                  <span style={{ color: "#555", fontWeight: 700, fontSize: 13 }}>R{entry.raceNumber}</span>
                  <span style={{ color: "#333", fontWeight: 700 }}>#{entry.runnerNumber ?? "—"}</span>
                  <span style={{ color: "#999" }}>→</span>
                  <span
                    style={{
                      color: getPositionColor(entry.position),
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    P{entry.position ?? "—"}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 13, fontWeight: 600, color: "#999" }}>No position data</div>
            )}
          </div>
        </div>

        {/* Right: Triggering Rules */}
        <div style={{ padding: "14px 22px" }}>
          <SectionTitle>TRIGGERING RULES</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {data.triggeringRules && data.triggeringRules.length > 0 ? (
              data.triggeringRules.map((rule, i) => (
                <span
                  key={i}
                  style={{
                    background: `${cfg.color}15`,
                    border: `1px solid ${cfg.color}33`,
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 9,
                    color: cfg.color,
                    letterSpacing: 1,
                    fontWeight: 600,
                  }}
                >
                  {rule}
                </span>
              ))
            ) : (
              <div style={{ fontSize: 13, fontWeight: 600, color: "#999" }}>No rules triggered</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Context Flags (remaining) ─────────────── */}
      {data.contextFlags && (
        <div style={{ padding: "14px 22px", borderTop: "1px solid #f0f0eb" }}>
          <SectionTitle>CONTEXT FLAGS</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "4px 16px",
              marginTop: 8,
            }}
          >
            {Object.entries(data.contextFlags)
              .filter(
                ([key, val]) =>
                  !SCORE_FLAGS.includes(key) &&
                  val != null &&
                  typeof val !== "object"
              )
              .map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "3px 0",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "#444", fontWeight: 600 }}>{key}</span>
                  <span
                    style={{
                      color: getFlagColor(val),
                      fontWeight: 700,
                      marginLeft: 8,
                    }}
                  >
                    {Array.isArray(val) ? `[${val.join(", ")}]` : String(val)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Timestamp ─────────────────────────────── */}
      <div
        style={{
          padding: "10px 22px 14px",
          borderTop: "1px solid #f0f0eb",
          textAlign: "right",
          fontSize: 12,
          fontWeight: 600,
          color: "#888",
        }}
      >
        {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
}

/* ── Helper Sub-components ────────────────────────── */

function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: "#555",
        letterSpacing: 2,
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span
      style={{
        background: `${color}15`,
        border: `1px solid ${color}44`,
        borderRadius: 6,
        padding: "5px 14px",
        fontSize: 13,
        color,
        letterSpacing: 1,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function StatCell({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#555", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

/* ── Helper Functions ─────────────────────────────── */

function getScoreColor(val) {
  if (typeof val === "number" && val > 0) return "#b8860b";
  return "#999";
}

function getFlagColor(val) {
  if (typeof val === "number" && val > 0) return "#b8860b";
  if (val === true) return "#16a34a";
  if (val === false) return "#dc262688";
  return "#888";
}

function getPositionColor(position) {
  if (position === 1) return "#16a34a";
  if (position != null && position <= 4) return "#b8860b";
  return "#888";
}
