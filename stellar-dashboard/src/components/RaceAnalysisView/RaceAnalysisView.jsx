import { useState, useCallback } from "react";
import { API_BASE, PREDICTIONS_BASE } from "../../constants/api";
import { PLANET_CONFIG, STATE_COLORS } from "../../constants/planets";
import { getPlanetForNumber, parseNumberInput } from "../../utils/planetMapping";

// ─── Small helpers ────────────────────────────────────────────────────────────

function Badge({ label, color }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: `${color}18`,
        border: `1px solid ${color}55`,
        color,
        borderRadius: 6,
        padding: "2px 9px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        fontFamily: "'IBM Plex Mono', monospace",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function SmallBadge({ label, color }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: `${color}18`,
        border: "none",
        color,
        borderRadius: 6,
        padding: "2px 5px",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 1,
        fontFamily: "'IBM Plex Mono', monospace",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text", min, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
      <label
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color: "#888",
          letterSpacing: 2,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        min={min}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          background: "#f5f5f0",
          border: "1px solid #e0e0dd",
          borderRadius: 8,
          color: "#1a1a2e",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 13,
          padding: "10px 14px",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RaceAnalysisView({
  cardIdInput, setCardIdInput,
  raceNumberInput, setRaceNumberInput,
  numbersInput, setNumbersInput,
  actualResultsInput, setActualResultsInput,
  rows, setRows,
  predRows, setPredRows,
  actualRows, setActualRows,
  rawPlanetStates, setRawPlanetStates,
  loading, setLoading,
  error, setError,
  submittedMeta, setSubmittedMeta,
}) {
  // ── Reset — clears all results and inputs ──
  const handleReset = useCallback(() => {
    setCardIdInput("Taree-2026-03-10");
    setRaceNumberInput("1");
    setNumbersInput("");
    setActualResultsInput("");
    setRows(null);
    setPredRows(null);
    setActualRows(null);
    setRawPlanetStates(null);
    setError(null);
    setSubmittedMeta(null);
  }, [setCardIdInput, setRaceNumberInput, setNumbersInput, setActualResultsInput,
      setRows, setPredRows, setActualRows, setRawPlanetStates, setError, setSubmittedMeta]);

  // Fetch planetary state (race N) + predictions (race N+1) in parallel
  const handleAnalyse = useCallback(async () => {
    const cardId = cardIdInput.trim();
    const raceNumber = parseInt(raceNumberInput.trim(), 10);
    const numbers = parseNumberInput(numbersInput);
    const actualNumbers = parseNumberInput(actualResultsInput);

    if (!cardId) { setError("Please enter a Card ID."); return; }
    if (isNaN(raceNumber) || raceNumber < 1) { setError("Please enter a valid Race Number."); return; }
    if (numbers.length === 0) { setError("Please enter at least one runner number."); return; }

    setLoading(true);
    setError(null);
    setRows(null);
    setPredRows(null);
    setActualRows(null);
    setRawPlanetStates(null);

    try {
      const nextRace = raceNumber + 1;
      const [stateRes, predRes] = await Promise.allSettled([
        fetch(`${API_BASE}/${cardId}/current?raceNumber=${raceNumber}`),
        fetch(`${PREDICTIONS_BASE}/${cardId}/${nextRace}`),
      ]);

      // ── Planetary state table (race N) ───────────────────────
      if (stateRes.status === "rejected" || !stateRes.value.ok) {
        throw new Error(
          stateRes.status === "rejected"
            ? stateRes.reason.message
            : `Planetary state API: HTTP ${stateRes.value.status}`
        );
      }
      const apiData = await stateRes.value.json();
      const stateList = Array.isArray(apiData) ? apiData : Object.values(apiData);
      const planetStateMap = {};
      stateList.forEach((item) => {
        if (item.planet) planetStateMap[item.planet.toUpperCase()] = item;
      });
      setRawPlanetStates(planetStateMap);
      const tableRows = numbers.map((num) => {
        const planet = getPlanetForNumber(num);
        const state = planetStateMap[planet] ?? null;
        return {
          number: num,
          planet,
          stateCode: state?.stateCode ?? state?.state ?? "—",
          stateName: state?.stateName ?? state?.stateCode ?? state?.state ?? "—",
          strengthScore: state?.strengthScore ?? state?.strength ?? "—",
          authorityLevel: state?.authorityLevel ?? state?.authority ?? "—",
          top4Count: state?.top4Count ?? state?.top4 ?? "—",
          absenceDuration: state?.absenceDuration ?? state?.absenceStreak ?? state?.absent ?? "—",
        };
      });
      setRows(tableRows);

      // Build actual results rows (same Race N planet states, ordered by finish position)
      if (actualNumbers.length > 0) {
        const aRows = actualNumbers.slice(0, 4).map((num, i) => {
          const planet = getPlanetForNumber(num);
          const state = planetStateMap[planet] ?? null;
          return {
            finishPos: i + 1,
            number: num,
            planet,
            stateCode: state?.stateCode ?? state?.state ?? "—",
            strengthScore: state?.strengthScore ?? state?.strength ?? "—",
            authorityLevel: state?.authorityLevel ?? state?.authority ?? "—",
            top4Count: state?.top4Count ?? state?.top4 ?? "—",
          };
        });
        setActualRows(aRows);
      }

      // ── Predictions table (race N+1) ─────────────────────────
      if (predRes.status === "fulfilled" && predRes.value.ok) {
        const predData = await predRes.value.json();

        // Response shape: { cardId, raceNumber, rankings: [...] }
        // Each ranking: { horseNumber, planet, finalRank, confidenceScore, rankState, rankReason, ... }
        const predList = Array.isArray(predData)
          ? predData
          : predData.rankings ?? predData.predictions ?? predData.top4 ?? predData.results ?? [];

        // Sort by finalRank ascending, take top 4
        const top4 = [...predList]
          .sort((a, b) => (a.finalRank ?? a.rank ?? 99) - (b.finalRank ?? b.rank ?? 99))
          .slice(0, 4);

        // Build actual results lookup: horseNumber → finishing position
        const actualMap = {};
        actualNumbers.forEach((n, i) => { actualMap[n] = i + 1; });

        const pRows = top4.map((item, idx) => {
          const runnerNo = item.horseNumber ?? item.runnerNumber ?? item.runner ?? item.number ?? null;
          // Planet comes directly from API; fall back to number mapping
          const planet =
            item.planet
              ? item.planet.toUpperCase()
              : runnerNo != null
              ? getPlanetForNumber(Number(runnerNo))
              : "—";
          const score = item.confidenceScore ?? item.score ?? item.predictionScore ?? "—";
          const rank = item.finalRank ?? item.rank ?? (idx + 1);
          const rankState = item.rankState ?? null;

          const actualPos =
            runnerNo != null && actualMap[Number(runnerNo)] != null
              ? actualMap[Number(runnerNo)]
              : null;

          return { rank, runnerNo, planet, score, rankState, actualPos };
        });

        setPredRows(pRows);
      } else {
        // Predictions fetch failed — non-fatal, just show nothing
        console.warn("Predictions fetch failed:", predRes.reason ?? predRes.value?.status);
        // If user provided actual results, still show that table from actuals alone
        if (actualNumbers.length > 0) {
          setPredRows(
            actualNumbers.slice(0, 4).map((n, i) => ({
              rank: i + 1,
              runnerNo: n,
              planet: getPlanetForNumber(n),
              score: "—",
              rankState: null,
              actualPos: i + 1,
            }))
          );
        }
      }

      setSubmittedMeta({ cardId, raceNumber, nextRace });
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [cardIdInput, raceNumberInput, numbersInput, actualResultsInput]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAnalyse();
  };

  return (
    <div
      style={{
        padding: "24px 0px",
        fontFamily: "'IBM Plex Mono', monospace",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      {/* ── Page Title ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 20,
            color: "#1a1a2e",
            margin: 0,
            letterSpacing: 1,
          }}
        >
          RACE ANALYSIS
        </h2>
        <p
          style={{
            fontSize: 11,
            color: "#999",
            margin: "4px 0 0",
            letterSpacing: 1,
          }}
        >
          ENTER CARD ID, RACE NUMBER &amp; RUNNER NUMBERS TO GET PLANETARY STATE TABLE
        </p>
      </div>

      {/* ── Input Form ─────────────────────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e0e0dd",
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 24,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {/* Row 1: Card ID · Race No · Runner numbers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 140px 1fr",
            gap: 16,
            marginBottom: 14,
          }}
        >
          <InputField
            label="CARD ID"
            value={cardIdInput}
            onChange={(e) => setCardIdInput(e.target.value)}
            placeholder="e.g. Taree-2026-03-10"
          />
          <InputField
            label="RACE NUMBER"
            type="number"
            min="1"
            value={raceNumberInput}
            onChange={(e) => setRaceNumberInput(e.target.value)}
            placeholder="e.g. 1"
          />
          <InputField
            label="RUNNER NUMBERS — RACE N (comma or space separated)"
            value={numbersInput}
            onChange={(e) => setNumbersInput(e.target.value)}
            placeholder="e.g. 1, 3, 5, 8, 14"
          />
        </div>
        {/* Row 2: Actual results for race N+1 + buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            alignItems: "end",
          }}
        >
          <InputField
            label="ACTUAL RESULTS — RACE N+1 (top 4 finishing order, comma separated)"
            value={actualResultsInput}
            onChange={(e) => setActualResultsInput(e.target.value)}
            placeholder="e.g. 5, 2, 8, 1  (1st, 2nd, 3rd, 4th finisher)"
            onKeyDown={handleKeyDown}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleAnalyse}
              disabled={loading}
              style={{
                background: loading ? "#e8e8e3" : "#1a1a2e",
                border: "1px solid #1a1a2e",
                borderRadius: 8,
                color: "#fff",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                padding: "10px 22px",
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: 2,
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? "LOADING…" : "ANALYSE"}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              title="Clear all results and inputs"
              style={{
                background: "transparent",
                border: "1px solid #e0e0dd",
                borderRadius: 8,
                color: "#888",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                padding: "10px 16px",
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: 2,
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#e03131";
                e.currentTarget.style.color = "#e03131";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e0e0dd";
                e.currentTarget.style.color = "#888";
              }}
            >
              RESET
            </button>
          </div>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            background: "#fff0f0",
            border: "1px solid #e03131",
            borderRadius: 10,
            padding: "12px 18px",
            color: "#e03131",
            fontSize: 13,
            marginBottom: 20,
            fontWeight: 600,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* ── Loading skeleton ───────────────────────────────────── */}
      {loading && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e0e0dd",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
            color: "#bbb",
            fontSize: 13,
            letterSpacing: 2,
          }}
        >
          ⟳ FETCHING PLANETARY STATES…
        </div>
      )}

      {/* ── Results — side-by-side tables ─────────────────────── */}
      {!loading && rows && (
        <>
          {/* Meta bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#888", letterSpacing: 2 }}>RESULTS FOR</span>
            <Badge label={submittedMeta.cardId} color="#1a1a2e" />
            <Badge label={`RACE ${submittedMeta.raceNumber}`} color="#1a1a2e" />
            {predRows && (
              <>
                <span style={{ fontSize: 11, color: "#ccc" }}>+</span>
                <Badge label={`RACE ${submittedMeta.nextRace} PREDICTIONS`} color="#1971c2" />
              </>
            )}
            {actualRows && (
              <>
                <span style={{ fontSize: 11, color: "#ccc" }}>+</span>
                <Badge label={`RACE ${submittedMeta.nextRace} ACTUALS`} color="#0ca678" />
              </>
            )}
          </div>

          {/* Grid: 1 or 2 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: predRows ? "minmax(0, 650px) 1fr" : "1fr",
              gap: 10,
              alignItems: "start",
            }}
          >
            {/* ── Col 1: Planetary State — Race N ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <PlanetaryStateTable rows={rows} />
              {rawPlanetStates && <PositionTrendTable planetStates={rawPlanetStates} />}
            </div>

            {/* ── Col 2: Predictions (top) + Actual Results (below) ── */}
            {predRows && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <PredictionsTable
                  predRows={predRows}
                  nextRace={submittedMeta.nextRace}
                  actualRows={actualRows}
                />
                {actualRows && (
                  <ActualResultsTable
                    actualRows={actualRows}
                    nextRace={submittedMeta.nextRace}
                  />
                )}
              </div>
            )}
          </div>

          <PlanetLegend />
        </>
      )}

      {/* ── Empty state ────────────────────────────────────────── */}
      {!loading && !rows && !error && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 280,
            color: "#ccc",
            gap: 10,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 52 }}>🏇</div>
          <div style={{ fontSize: 12, letterSpacing: 2, color: "#bbb" }}>
            ENTER CARD ID, RACE NUMBER &amp; RUNNER NUMBERS, THEN CLICK ANALYSE
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Planetary State Table (Race N) ──────────────────────────────────────────

function PlanetaryStateTable({ rows }) {
  const headers = ["#", "PLANET", "STATE CODE", "STRENGTH", "AUTHORITY", "TOP 4", "ABSENCE"];
  // Narrower columns using fixed table layout.
  const colWidths = ["20px", "40px", "80px", "50px", "50px", "40px", "40px"];

  return (
    // Constrain width so table doesn't stretch to fill entire grid column
    <div style={{ width: "100%", maxWidth: 650 }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2,
          color: "#888",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "80%"
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#1a1a2e",
          }}
        />
        PLANETARY STATE — RACE N
      </div>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e0e0dd",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr style={{ background: "#f9f9f6" }}>
              {headers.map((h, idx) => (
                <th
                  key={h}
                  style={{
                    width: colWidths[idx],
                    padding: "8px 8px",
                    textAlign: "left",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: "#555",
                    borderBottom: "2px solid #e0e0dd",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const cfg = PLANET_CONFIG[row.planet];
              const stateColor = STATE_COLORS[row.stateCode] || "#888";
              const isEven = idx % 2 === 0;
              return (
                <tr
                  key={row.number}
                  style={{
                    background: isEven ? "#ffffff" : "#fafaf8",
                    borderBottom: "1px solid #f0f0eb",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f0")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = isEven ? "#ffffff" : "#fafaf8")
                  }
                >
                  <td
                    style={{
                      padding: "9px 12px",
                      fontWeight: 800,
                      fontSize: 14,
                      color: "#1a1a2e",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {row.number}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    {cfg ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                          style={{
                            fontSize: 14,
                            filter: `drop-shadow(0 0 3px ${cfg.color}99)`,
                          }}
                        >
                          {cfg.symbol}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: cfg.color,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 11,
                            letterSpacing: 1,
                          }}
                        >
                          {row.planet}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "#bbb", fontSize: 11 }}>{row.planet}</span>
                    )}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    {row.stateCode !== "—" ? (
                      <Badge label={row.stateCode} color={stateColor} />
                    ) : (
                      <span style={{ color: "#ccc", fontSize: 11 }}>—</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 800,
                      fontSize: 13,
                      color: "#1a1a2e",
                    }}
                  >
                    {row.strengthScore !== "—" ? (
                      <span
                        style={{
                          background: "#f0f0eb",
                          borderRadius: 5,
                          padding: "2px 8px",
                        }}
                      >
                        {row.strengthScore}
                      </span>
                    ) : (
                      <span style={{ color: "#ccc" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    {row.authorityLevel !== "—" ? (
                      <Badge label={row.authorityLevel} color="#6741d9" />
                    ) : (
                      <span style={{ color: "#ccc", fontSize: 11 }}>—</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 700,
                      fontSize: 13,
                      color:
                        row.top4Count !== "—" && Number(row.top4Count) > 0
                          ? "#0ca678"
                          : "#aaa",
                    }}
                  >
                    {row.top4Count}
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 700,
                      fontSize: 13,
                      color:
                        row.absenceDuration !== "—" && Number(row.absenceDuration) > 3
                          ? "#e03131"
                          : row.absenceDuration !== "—"
                          ? "#1a1a2e"
                          : "#aaa",
                    }}
                  >
                    {row.absenceDuration}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Predictions + Actual Results Table (Race N+1) ────────────────────────────

const POSITION_LABELS = ["🥇 1ST", "🥈 2ND", "🥉 3RD", "4TH"];
const POSITION_COLORS = ["#c47d00", "#6b7280", "#d4790a", "#888"];

function PredictionsTable({ predRows, nextRace, actualRows }) {
  // Build a set of horse numbers that actually finished in top 4
  const actualTop4Numbers = new Set((actualRows ?? []).map((r) => Number(r.number)));
  // Build a map: horseNumber → finishing position from actual results
  const actualPosMap = {};
  (actualRows ?? []).forEach((r) => { actualPosMap[Number(r.number)] = r.finishPos; });

  const hasActuals = (actualRows ?? []).length > 0;

  return (
    <div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2,
          color: "#1971c2",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#1971c2",
          }}
        />
        PREDICTIONS — RACE {nextRace} (TOP 4)
        {hasActuals && (
          <span
            style={{
              marginLeft: 6,
              background: "#e8f5e9",
              border: "1px solid #0ca67844",
              color: "#0ca678",
              borderRadius: 5,
              padding: "1px 7px",
              fontSize: 9,
              letterSpacing: 1,
            }}
          >
            + ACTUALS
          </span>
        )}
      </div>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #1971c222",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 6px rgba(25,113,194,0.06)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f0f6ff" }}>
              {["PRED. RANK", "RUNNER #", "PLANET", "PRED. SCORE", "RANK STATE",
                ...(hasActuals ? ["ACTUAL FINISH", "✓ HIT?"] : [])
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: "#1971c2",
                    borderBottom: "2px solid #1971c222",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {predRows.map((row, idx) => {
              const cfg = PLANET_CONFIG[row.planet];
              const posColor = POSITION_COLORS[idx] ?? "#888";
              const isEven = idx % 2 === 0;
              const runnerNoInt = row.runnerNo != null ? Number(row.runnerNo) : null;
              // Hit = predicted runner actually finished in top 4
              const isHit = hasActuals && runnerNoInt != null && actualTop4Numbers.has(runnerNoInt);
              // Exact = predicted rank === actual finishing position
              const actualFinishPos = runnerNoInt != null ? actualPosMap[runnerNoInt] : null;
              const isPerfectHit = isHit && actualFinishPos === row.rank;

              return (
                <tr
                  key={idx}
                  style={{
                    background: isPerfectHit
                      ? "#f0fff8"
                      : isHit
                      ? "#f7fbff"
                      : isEven
                      ? "#ffffff"
                      : "#fafaf8",
                    borderBottom: "1px solid #f0f0eb",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f6ff")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = isPerfectHit
                      ? "#f0fff8"
                      : isHit
                      ? "#f7fbff"
                      : isEven
                      ? "#ffffff"
                      : "#fafaf8")
                  }
                >
                  {/* Predicted Rank */}
                  <td style={{ padding: "9px 12px" }}>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontWeight: 800,
                        fontSize: 12,
                        color: posColor,
                      }}
                    >
                      {POSITION_LABELS[idx] ?? `#${row.rank}`}
                    </span>
                  </td>

                  {/* Runner Number */}
                  <td
                    style={{
                      padding: "9px 12px",
                      fontWeight: 800,
                      fontSize: 14,
                      color: "#1a1a2e",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {row.runnerNo ?? "—"}
                  </td>

                  {/* Planet */}
                  <td style={{ padding: "9px 12px" }}>
                    {cfg && row.planet !== "—" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                          style={{
                            fontSize: 14,
                            filter: `drop-shadow(0 0 3px ${cfg.color}99)`,
                          }}
                        >
                          {cfg.symbol}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: cfg.color,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 11,
                            letterSpacing: 1,
                          }}
                        >
                          {row.planet}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "#bbb", fontSize: 11 }}>—</span>
                    )}
                  </td>

                  {/* Prediction Score */}
                  <td
                    style={{
                      padding: "9px 12px",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 800,
                      fontSize: 13,
                      color: "#1971c2",
                    }}
                  >
                    {row.score !== "—" ? (
                      <span
                        style={{
                          background: "#e8f0fe",
                          borderRadius: 5,
                          padding: "2px 8px",
                        }}
                      >
                        {row.score}
                      </span>
                    ) : (
                      <span style={{ color: "#ccc" }}>—</span>
                    )}
                  </td>

                  {/* Rank State */}
                  <td style={{ padding: "9px 12px" }}>
                    {row.rankState ? (
                      <Badge
                        label={row.rankState}
                        color={
                          row.rankState === "PROMOTED" ? "#0ca678"
                          : row.rankState === "DEMOTED" ? "#e03131"
                          : row.rankState === "STABLE"  ? "#1971c2"
                          : "#888"
                        }
                      />
                    ) : (
                      <span style={{ color: "#ccc", fontSize: 11 }}>—</span>
                    )}
                  </td>

                  {/* Actual Finish Position */}
                  {hasActuals && (
                    <td
                      style={{
                        padding: "9px 12px",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontWeight: 700,
                        fontSize: 13,
                        color: actualFinishPos != null ? posColor : "#ccc",
                      }}
                    >
                      {actualFinishPos != null
                        ? POSITION_LABELS[actualFinishPos - 1] ?? `#${actualFinishPos}`
                        : "—"}
                    </td>
                  )}

                  {/* Hit indicator */}
                  {hasActuals && (
                    <td style={{ padding: "9px 12px" }}>
                      {isPerfectHit ? (
                        <span
                          style={{
                            background: "#e6fff4",
                            border: "1px solid #0ca67866",
                            color: "#0ca678",
                            borderRadius: 6,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}
                        >
                          ✓ EXACT
                        </span>
                      ) : isHit ? (
                        <span
                          style={{
                            background: "#e8f5e9",
                            border: "1px solid #0ca67844",
                            color: "#0ca678",
                            borderRadius: 6,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}
                        >
                          ✓ TOP 4
                        </span>
                      ) : row.runnerNo != null ? (
                        <span
                          style={{
                            background: "#fff0f0",
                            border: "1px solid #e0313144",
                            color: "#e03131",
                            borderRadius: 6,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}
                        >
                          ✗ MISS
                        </span>
                      ) : (
                        <span style={{ color: "#ccc", fontSize: 11 }}>—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Actual results not matched to prediction (ran in top 4 but not predicted) */}
      {hasActuals && (() => {
        const predictedNos = new Set(predRows.map((r) => r.runnerNo));
        const unpredictedActuals = predRows
          .filter((r) => r.actualPos != null && !predictedNos.has(r.runnerNo))
          .concat(
            // runners entered in actual results but not in predRows at all
            predRows
              .filter((r) => r.actualPos != null && r.score === "—")
          );
        return null; // placeholder — actual miss detection is handled by isHit logic above
      })()}
    </div>
  );
}

// ─── Actual Results Table (Race N+1) ──────────────────────────────────────────────

const FINISH_LABELS = ["🥇 1ST", "🥈 2ND", "🥉 3RD", "4TH"];
const FINISH_COLORS = ["#c47d00", "#6b7280", "#d4790a", "#888"];

function ActualResultsTable({ actualRows, nextRace }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2,
          color: "#0ca678",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#0ca678",
          }}
        />
        ACTUAL RESULTS — RACE {nextRace}
      </div>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #0ca67822",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 6px rgba(12,166,120,0.06)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f0fff8" }}>
              {["FINISH", "RUNNER #", "PLANET", "STATE CODE", "STRENGTH", "AUTHORITY", "TOP 4"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "5px 5px",
                    textAlign: "left",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: "#0ca678",
                    borderBottom: "2px solid #0ca67822",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actualRows.map((row, idx) => {
              const cfg = PLANET_CONFIG[row.planet];
              const stateColor = STATE_COLORS[row.stateCode] || "#888";
              const finishColor = FINISH_COLORS[idx] ?? "#888";
              const isEven = idx % 2 === 0;
              return (
                <tr
                  key={idx}
                  style={{
                    background: isEven ? "#ffffff" : "#fafaf8",
                    borderBottom: "1px solid #f0f0eb",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fff8")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = isEven ? "#ffffff" : "#fafaf8")
                  }
                >
                  {/* Finish Position */}
                  <td style={{ padding: "5px 5px" }}>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontWeight: 800,
                        fontSize: 12,
                        color: finishColor,
                      }}
                    >
                      {FINISH_LABELS[idx] ?? `#${row.finishPos}`}
                    </span>
                  </td>

                  {/* Runner Number */}
                  <td
                    style={{
                      padding: "9px 12px",
                      fontWeight: 800,
                      fontSize: 14,
                      color: "#1a1a2e",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {row.number}
                  </td>

                  {/* Planet */}
                  <td style={{ padding: "9px 12px" }}>
                    {cfg ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, filter: `drop-shadow(0 0 3px ${cfg.color}99)` }}>
                          {cfg.symbol}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: cfg.color,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 11,
                            letterSpacing: 1,
                          }}
                        >
                          {row.planet}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "#bbb", fontSize: 11 }}>{row.planet}</span>
                    )}
                  </td>

                  {/* State Code */}
                  <td style={{ padding: "9px 12px" }}>
                    {row.stateCode !== "—" ? (
                      <Badge label={row.stateCode} color={stateColor} />
                    ) : (
                      <span style={{ color: "#ccc", fontSize: 11 }}>—</span>
                    )}
                  </td>

                  {/* Strength Score */}
                  <td
                    style={{
                      padding: "9px 12px",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 800,
                      fontSize: 13,
                      color: "#1a1a2e",
                    }}
                  >
                    {row.strengthScore !== "—" ? (
                      <span
                        style={{
                          background: "#f0f0eb",
                          borderRadius: 5,
                          padding: "2px 8px",
                        }}
                      >
                        {row.strengthScore}
                      </span>
                    ) : (
                      <span style={{ color: "#ccc" }}>—</span>
                    )}
                  </td>

                  {/* Authority Level */}
                  <td style={{ padding: "9px 12px" }}>
                    {row.authorityLevel !== "—" ? (
                      <Badge label={row.authorityLevel} color="#6741d9" />
                    ) : (
                      <span style={{ color: "#ccc", fontSize: 11 }}>—</span>
                    )}
                  </td>

                  {/* Top 4 Count */}
                  <td
                    style={{
                      padding: "9px 12px",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 700,
                      fontSize: 13,
                      color: (row.top4Count ?? 0) > 0 ? "#0ca678" : "#aaa",
                    }}
                  >
                    {row.top4Count}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Position Trend Table ────────────────────────────────────────────────────

const POS_MEDAL = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };
const POS_COLOR = { 1: "#b42114", 2: "#2f436a", 3: "#57a955", 4: "#888" };

function PositionTrendTable({ planetStates }) {
  // Collect all unique race numbers across all planets, sorted ascending
  const allRaceNums = Array.from(
    new Set(
      Object.values(planetStates).flatMap((ps) =>
        (ps.positionTrend ?? []).map((t) => t.raceNumber)
      )
    )
  ).sort((a, b) => a - b);

  if (allRaceNums.length === 0) return null;

  const PLANETS_ORDER = ["MARS", "VENUS", "MERCURY", "MOON", "SUN"];
  const planets = PLANETS_ORDER.filter((p) => planetStates[p]);

  // Shared th style
  const thStyle = (align = "left") => ({
    padding: "10px 5px",
    textAlign: align,
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#555",
    borderBottom: "2px solid #e0e0dd",
    whiteSpace: "nowrap",
  });

  // Column widths: static columns + one width per trend column
  const staticColWidths = [70, 150, 40, 40, 70, 180];

  return (
    <div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2,
          color: "#6741d9",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#6741d9",
          }}
        />
        POSITION TREND — BY PLANET
      </div>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #6741d922",
          borderRadius: 12,
          overflow: "auto",
          boxShadow: "0 1px 6px rgba(103,65,217,0.06)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
          <colgroup>
            {staticColWidths.map((w, i) => (
              <col key={`static-${i}`} style={{ width: w }} />
            ))}
            {allRaceNums.map((rn) => (
              <col key={`trend-${rn}`} style={{ width: 48 }} />
            ))}
          </colgroup>
          <thead>
            <tr style={{ background: "#f7f4ff" }}>
              <th style={thStyle("left")}>Planet</th>
              <th style={thStyle("left")}>State</th>
              <th style={thStyle("center")}>Str</th>
              <th style={thStyle("center")}>Win</th>
              <th style={thStyle("center")}>Top 4</th>
              <th style={thStyle("left")}>Rules Triggered</th>
              {/* Divider before trend columns */}
              <th
                style={{
                  ...thStyle("center"),
                  borderLeft: "2px solid #e0e0dd",
                  color: "#6741d9",
                  letterSpacing: 2,
                  paddingLeft: 16,
                }}
                colSpan={allRaceNums.length}
              >
                POSITION TREND →
              </th>
            </tr>
            {/* Sub-header row for race numbers */}
            <tr style={{ background: "#f2eeff" }}>
              {/* Empty cells under static columns */}
              {["Planet", "State", "Str", "Win", "Top 4", "rules triggered"].map((_, i) => (
                <td key={i} style={{ borderBottom: "1px solid #e0e0dd" }} />
              ))}
              {allRaceNums.map((rn) => (
                <th
                  key={rn}
                  style={{
                    padding: "6px 5px",
                    textAlign: "center",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 700,
                    fontSize: 9,
                    letterSpacing: 1.5,
                    color: "#6741d9",
                    borderBottom: "1px solid #e0e0dd",
                    borderLeft: rn === allRaceNums[0] ? "2px solid #e0e0dd" : "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  R{rn}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planets.map((planetName, idx) => {
              const ps = planetStates[planetName];
              const cfg = PLANET_CONFIG[planetName];
              const stateColor = STATE_COLORS[ps.stateCode] ?? "#888";
              const rules = ps.triggeringRules ?? [];

              // Build a map: raceNumber → trend entry
              const trendMap = {};
              (ps.positionTrend ?? []).forEach((t) => {
                trendMap[t.raceNumber] = t;
              });
              const isEven = idx % 2 === 0;
              const rowBg = isEven ? "#ffffff" : "#fafaf8";

              return (
                <tr
                  key={planetName}
                  style={{
                    background: rowBg,
                    borderBottom: "1px solid #f0f0eb",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f2ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
                >
                  {/* Planet */}
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {cfg ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, filter: `drop-shadow(0 0 3px ${cfg.color}99)` }}>
                          {cfg.symbol}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: cfg.color,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 11,
                            letterSpacing: 1,
                          }}
                        >
                          {planetName}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "#bbb", fontSize: 11 }}>{planetName}</span>
                    )}
                  </td>

                  {/* State */}
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {ps.stateCode ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <SmallBadge label={ps.stateCode} color={stateColor} />
                        {/* {ps.stateName && (
                          <span style={{ fontSize: 9,fontWeight: 700, color: "#aaa", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5 }}>
                            {ps.stateName}
                          </span>
                        )} */}
                      </div>
                    ) : (
                      <span style={{ color: "#ccc", fontSize: 11 }}>—</span>
                    )}
                  </td>

                  {/* Strength */}
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    {ps.strengthScore != null ? (
                      <span
                        style={{
                          display: "inline-block",
                          background: "#f0f0eb",
                          borderRadius: 5,
                          padding: "2px 10px",
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontWeight: 800,
                          fontSize: 13,
                          color: ps.strengthScore >= 60 ? "#0ca678" : ps.strengthScore >= 40 ? "#c47d00" : "#888",
                        }}
                      >
                        {ps.strengthScore}
                      </span>
                    ) : (
                      <span style={{ color: "#ccc" }}>—</span>
                    )}
                  </td>

                  {/* Win count */}
                  <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 13, color: (ps.winCount ?? 0) > 0 ? "#c47d00" : "#aaa" }}>
                    {ps.winCount ?? 0}
                  </td>

                  {/* Top 4 count */}
                  <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 13, color: (ps.top4Count ?? 0) > 0 ? "#0ca678" : "#aaa" }}>
                    {ps.top4Count ?? 0}
                  </td>

                  {/* Triggering rules */}
                  <td style={{ padding: "10px 12px", maxWidth: 200 }}>
                    {rules.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {rules.map((rule) => (
                          <span
                            key={rule}
                            style={{
                              background: `${cfg?.color ?? "#888"}12`,
                              border: `1px solid ${cfg?.color ?? "#888"}33`,
                              color: cfg?.color ?? "#888",
                              borderRadius: 4,
                              padding: "1px 6px",
                              fontSize: 9,
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontWeight: 700,
                              letterSpacing: 0.5,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {rule}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#ddd", fontSize: 11 }}>—</span>
                    )}
                  </td>

                  {/* One cell per race number — position trend */}
                  {allRaceNums.map((rn) => {
                    const entry = trendMap[rn];
                    const pos = entry?.position ?? null;
                    const runner = entry?.runnerNumber ?? null;
                    const posColor = POS_COLOR[pos] ?? "#aaa";
                    const medal = POS_MEDAL[pos];

                    return (
                      <td
                        key={rn}
                        style={{
                          padding: "10px 10px",
                          textAlign: "center",
                          fontFamily: "'IBM Plex Mono', monospace",
                          borderLeft: rn === allRaceNums[0] ? "2px solid #e8e0ff" : "1px solid #f5f2ff",
                          background: pos === 1 ? "#fffbf0" : pos != null && pos <= 4 ? "#fafff8" : "transparent",
                        }}
                      >
                        {pos != null ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: posColor, lineHeight: 1 }}>
                              {medal ?? `P${pos}`}
                            </span>
                            {runner != null && (
                              <span style={{ fontSize: 12, color: "#0f0c0c", letterSpacing: 1 }}>
                                #{runner}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#ddd", fontSize: 14 }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Planet Legend ────────────────────────────────────────────────────────────

function PlanetLegend() {
  const entries = [
    { planet: "MARS",    numbers: "1,8,16,17,32–35" },
    { planet: "VENUS",   numbers: "2,7,14,15,28–31" },
    { planet: "MERCURY", numbers: "3,6,12,13,24–27" },
    { planet: "MOON",    numbers: "4,9,18,19,36–39" },
    { planet: "SUN",     numbers: "5,10,11,20–23,40,41" },
  ];

  return (
    <div
      style={{
        marginTop: 16,
        background: "#ffffff",
        border: "1px solid #e0e0dd",
        borderRadius: 12,
        padding: "14px 20px",
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "#aaa",
          letterSpacing: 2,
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 700,
        }}
      >
        PLANET MAP:
      </span>
      {entries.map(({ planet, numbers }) => {
        const cfg = PLANET_CONFIG[planet];
        return (
          <div
            key={planet}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            <span style={{ fontSize: 14, filter: `drop-shadow(0 0 3px ${cfg.color}88)` }}>
              {cfg.symbol}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>
              {planet}
            </span>
            <span style={{ fontSize: 10, color: "#bbb" }}>({numbers})</span>
          </div>
        );
      })}
    </div>
  );
}
