import ReactDOM from "react-dom";
import { PLANET_CONFIG, STATE_COLORS, SCORE_FLAGS } from "../../constants/planets";

/**
 * HoverPanel — rendered via ReactDOM.createPortal to document.body at position:fixed.
 * NEVER rendered inside the chart container div.
 *
 * Props:
 *   data: PlanetaryState object
 *   x: number — viewport-relative X (from e.clientX or adjusted chartX)
 *   y: number — viewport-relative Y (from e.clientY or adjusted chartY)
 */
export default function HoverPanel({ data, x, y }) {
  if (!data) return null;

  const PANEL_WIDTH = 380;
  const PANEL_MAX_HEIGHT = 520;

  // Flip left if near right edge of viewport
  const flipLeft = x + PANEL_WIDTH + 32 > window.innerWidth;
  // Flip up if near bottom
  const flipUp = y + PANEL_MAX_HEIGHT > window.innerHeight;

  const cfg = PLANET_CONFIG[data.planet];

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top: flipUp ? Math.max(8, y - PANEL_MAX_HEIGHT) : y,
        left: flipLeft ? Math.max(8, x - PANEL_WIDTH - 16) : x + 16,
        width: PANEL_WIDTH,
        maxHeight: PANEL_MAX_HEIGHT,
        overflowY: "auto",
        background: "#ffffff",
        border: `1px solid ${cfg.color}44`,
        borderRadius: 14,
        fontFamily: "'IBM Plex Mono', monospace",
        boxShadow: `0 12px 40px rgba(0,0,0,0.15), 0 0 20px ${cfg.color}11`,
        zIndex: 9999,
        pointerEvents: "none",
        animation: "fadeIn 0.15s ease",
        padding: 0,
      }}
    >
      {/* ── Header ────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "16px 18px 12px",
          borderBottom: `1px solid ${cfg.color}22`,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20, filter: `drop-shadow(0 0 8px ${cfg.color})` }}>
              {cfg.symbol}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: cfg.color,
                letterSpacing: 2,
              }}
            >
              {data.planet}
            </span>
          </div>
          <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>
            {data.cardId} · Race {data.raceNumber}
          </div>
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#1a1a2e",
            lineHeight: 1,
          }}
        >
          {data.strengthScore}
        </div>
      </div>

      {/* ── State Badge Row ───────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "10px 18px",
          flexWrap: "wrap",
        }}
      >
        <Badge
          label={data.stateName}
          color={STATE_COLORS[data.stateCode] || "#888"}
        />
        {data.authorityLevel && (
          <Badge label={data.authorityLevel} color="#ffffff88" />
        )}
        <Badge label={data.rulesetVersion} color="#ffffff33" />
      </div>

      {/* ── Stats Grid ────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 1,
          padding: "0 18px 10px",
        }}
      >
        <StatCell label="WINS" value={data.winCount} />
        <StatCell label="TOP 4" value={data.top4Count} />
        <StatCell label="ABSENT" value={data.absenceDuration} />
        <StatCell label="SINCE WIN" value={data.racesSinceLastWin ?? "—"} />
      </div>

      {/* ── Score Breakdown ───────────────────────── */}
      <div style={{ padding: "8px 18px", borderTop: "1px solid #f0f0eb" }}>
        <div
          style={{
            fontSize: 9,
            color: "#aaa",
            letterSpacing: 2,
            marginBottom: 6,
          }}
        >
          SCORE BREAKDOWN
        </div>
        {SCORE_FLAGS.map((flag) => {
          const val = data.contextFlags?.[flag];
          if (val == null) return null;
          return (
            <div
              key={flag}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "2px 0",
                fontSize: 10,
              }}
            >
              <span style={{ color: "#888" }}>{flag}</span>
              <span style={{ color: getFlagValueColor(val), fontWeight: 600 }}>
                {String(val)}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Position Trend ────────────────────────── */}
      {data.positionTrend && data.positionTrend.length > 0 && (
        <div style={{ padding: "8px 18px", borderTop: "1px solid #f0f0eb" }}>
          <div
            style={{
              fontSize: 9,
              color: "#aaa",
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            POSITION TREND
          </div>
          {data.positionTrend.map((entry, i) => (
            <div
              key={i}
              style={{
                fontSize: 10,
                color: getPositionColor(entry.position),
                padding: "1px 0",
              }}
            >
              R{entry.raceNumber}{"  "}
              #{entry.runnerNumber ?? "—"} → P{entry.position ?? "—"}
            </div>
          ))}
        </div>
      )}

      {/* ── Triggering Rules ──────────────────────── */}
      {data.triggeringRules && data.triggeringRules.length > 0 && (
        <div style={{ padding: "8px 18px", borderTop: "1px solid #f0f0eb" }}>
          <div
            style={{
              fontSize: 9,
              color: "#aaa",
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            TRIGGERING RULES
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {data.triggeringRules.map((rule, i) => (
              <span
                key={i}
                style={{
                  background: `${cfg.color}22`,
                  border: `1px solid ${cfg.color}44`,
                  borderRadius: 6,
                  padding: "3px 8px",
                  fontSize: 9,
                  color: cfg.color,
                  letterSpacing: 1,
                }}
              >
                {rule}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Context Flags (remaining) ─────────────── */}
      {data.contextFlags && (
        <div style={{ padding: "8px 18px", borderTop: "1px solid #f0f0eb" }}>
          <div
            style={{
              fontSize: 9,
              color: "#aaa",
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            CONTEXT FLAGS
          </div>
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
                  padding: "2px 0",
                  fontSize: 10,
                }}
              >
                <span style={{ color: "#999" }}>{key}</span>
                <span style={{ color: getFlagValueColor(val), fontWeight: 600 }}>
                  {Array.isArray(val) ? `[${val.join(", ")}]` : String(val)}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* ── Timestamp ─────────────────────────────── */}
      <div
        style={{
          padding: "8px 18px 14px",
          borderTop: "1px solid #f0f0eb",
          textAlign: "right",
          fontSize: 9,
          color: "#bbb",
        }}
      >
        {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>,
    document.body
  );
}

/* ── Helper Sub-components ────────────────────────── */

function Badge({ label, color }) {
  return (
    <span
      style={{
        background: `${color}15`,
        border: `1px solid ${color}33`,
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 10,
        color,
        letterSpacing: 1,
      }}
    >
      {label}
    </span>
  );
}

function StatCell({ label, value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 9, color: "#aaa", letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

/* ── Helper Functions ─────────────────────────────── */

function getFlagValueColor(val) {
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
