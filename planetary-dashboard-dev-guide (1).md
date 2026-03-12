# Planetary State Dashboard — Frontend Development Guide
**Target: GitHub Copilot / AI-assisted development**

---

## 1. Project Overview

Build a React single-page application called **Planetary State Dashboard** for the StellarTrack Layer 2 system. The app allows a user to enter a Race Card ID, fetch planetary state history from a REST API, and visualise strength scores over time in interactive line charts — one per planet and one combined view.

**Tech Stack:**
- React 18 (Vite scaffold)
- Recharts (charting)
- IBM Plex Mono + Syne fonts (Google Fonts)
- Tailwind CSS (optional utility use) or plain CSS-in-JS (inline styles)
- No Redux — local state only via `useState` / `useCallback` / `useRef`

---

## 2. Existing Component Analysis (`PlanetaryDashboard__1_.jsx`)

An initial AI-generated prototype exists. Here is a thorough critique to guide the rewrite:

### ✅ What works well
| Feature | Notes |
|---|---|
| `PLANET_CONFIG` colour map | Good colour palette and planetary symbols (♂ ♀ ☿ ☽ ☉) |
| `STATE_COLORS` map | Correct state-to-colour mapping |
| `HoverPanel` component | Rich detail panel with header, stats, position trend, rules, context flags |
| Mock data generator | Useful for dev/demo mode |
| `fetchPlanetHistory` fallback | Falls back to mock on API error |
| `CombinedTooltip` | Clean multi-planet tooltip |
| `MiniSparkline` (SVG) | Lightweight sparkline in the combined summary row |
| Combined view layout | Good comparative approach |

### ❌ Bugs & Issues to Fix

#### Bug 1 — Hover panel positioning is broken
```jsx
// BROKEN: position.x and position.y are the SVG dot coordinates,
// not page/container coordinates. The panel renders off-screen.
onMouseEnter={(e) => {
  setHoveredPoint({
    data: d,
    position: { x: props.cx, y: props.cy }  // ← SVG local coords
  });
}}
```
**Fix:** Use `e.clientX`, `e.clientY` and subtract the `chartContainerRef.current.getBoundingClientRect()` offset, OR use a portal with `position:fixed` based on `e.clientX / e.clientY`.

#### Bug 2 — `containerRect` declared but never used
```jsx
const rect = chartContainerRef.current?.getBoundingClientRect();
const containerRect = chartContainerRef.current?.getBoundingClientRect(); // duplicate, unused
```
Remove the duplicate.

#### Bug 3 — Hover panel never dismisses
There is no `onMouseLeave` on the chart container to clear `hoveredPoint`. Add:
```jsx
<div ref={chartContainerRef} style={{position:"relative"}}
  onMouseLeave={() => setHoveredPoint(null)}>
```

#### Bug 4 — `Objects.equals` shadow class in `RuleValidationService.java`
(Backend note only — the frontend doesn't import this, but worth flagging.)

#### Bug 5 — Individual planet chart renders custom dots but `activeDot={false}` disables Recharts hover
The dot `onMouseEnter` receives `props` (Recharts dot render props), but the chart fires no event since `activeDot={false}`. Switch to `activeDot` with a custom component instead, or use `onMouseMove` on the `<LineChart>` itself.

**Recommended fix:**
```jsx
<LineChart
  onMouseMove={(state) => {
    if (state.isTooltipActive && state.activePayload?.[0]) {
      const d = state.activePayload[0].payload;
      // use state.chartX / state.chartY for position
      setHoveredPoint({ data: d, position: { x: state.chartX, y: state.chartY } });
    }
  }}
  onMouseLeave={() => setHoveredPoint(null)}
>
```

#### Bug 6 — Planet tab state reset on re-fetch
`activePlanet` persists across fetches, but `hoveredPoint` is not cleared on new fetch. Add `setHoveredPoint(null)` inside `fetchAll`.

#### Bug 7 — History endpoint returns an array, but `getStates` endpoint returns `Map<Planet, PlanetaryState>`
The history fetch (`/history?planet=MARS`) returns `PlanetaryState[]`. The mock generates correct array shape. The API call is correct. However, there is no per-race lookup guard — if `raceNumber` is not sequential, chart gaps appear. Use `connectNulls` (already present) but also sort the array by `raceNumber` after fetch.

#### Bug 8 — `useMock` toggle does not re-fetch
Toggling `useMock` only takes effect on the next manual fetch. Consider adding a `useEffect` dependency or showing a notice.

### ⚠️ Missing Features to Add
1. **Loading skeleton** — the `loading` state shows nothing currently
2. **Error state** — API errors are silently swallowed into mock data
3. **Race range filter** — allow `fromRace`/`toRace` query params
4. **Export CSV** — nice-to-have for ops teams
5. **Responsive mobile layout** — current layout breaks below 768px

---

## 3. API Contract

### Base URL
```
http://localhost:8080/api/v1/planetary-state
```

### Endpoints Used

#### GET `/{cardId}/history?planet={PLANET}`
Returns full history array for one planet.

**Response:** `PlanetaryState[]` — sorted ascending by `raceNumber`

```json
[
  {
    "cardId": "SAN-2026-03-11",
    "raceNumber": 1,
    "planet": "MARS",
    "stateCode": "NEUTRAL",
    "stateName": "Neutral",
    "strengthScore": 50,
    "authorityLevel": "NEUTRAL",
    "positionTrend": [
      { "runnerNumber": 1, "position": 4, "raceNumber": 1 }
    ],
    "momentum": null,
    "absenceDuration": 0,
    "winCount": 0,
    "top4Count": 1,
    "racesSinceLastWin": null,
    "triggeringRules": ["MARS_NUMBER1_BASE"],
    "contextFlags": {
      "state_score": 0,
      "hora_score": 10,
      "zone_score": 10,
      "trigger_score": 0,
      "cycle_score": 0,
      "echo_score": 0,
      "return_time_score": 0,
      "rule_based_strength": 30,
      "final_score_uncapped": 50
    },
    "rulesetVersion": "L2_v1.0.0",
    "timestamp": "2026-03-11T10:57:21.879075Z"
  }
]
```

#### GET `/{cardId}/current?raceNumber={N}`
Returns all 5 planets for a single race.

**Response:** `Map<Planet, PlanetaryState>` (object keyed by planet name)

#### GET `/{cardId}/planet/{planet}?raceNumber={N}`
Single planet, single race.

### Parallel Fetch Pattern
Fetch all 5 planets simultaneously:
```js
const PLANETS = ["MARS", "VENUS", "MERCURY", "MOON", "SUN"];

const results = await Promise.all(
  PLANETS.map(p =>
    fetch(`${API_BASE}/${cardId}/history?planet=${p}`).then(r => r.json())
  )
);

const allData = Object.fromEntries(PLANETS.map((p, i) => [p, results[i]]));
```

---

## 4. Data Model (TypeScript-style reference)

```typescript
interface PositionTrendEntry {
  runnerNumber: number | null;
  position: number | null;
  raceNumber: number;
}

interface ContextFlags {
  state_score: number;
  hora_score: number;
  zone_score: number;
  trigger_score: number;
  cycle_score: number;
  echo_score: number;
  return_time_score: number;
  rule_based_strength: number;
  final_score_uncapped: number;
  was_in_top4: boolean;
  return_pressure: boolean;
  planetary_moment: boolean;
  visible_t_minus_1?: boolean;
  was_visible_recently?: boolean;
  visibility_streak?: number;
  absence_streak?: number;
  [key: string]: unknown;  // planet-specific flags like "mars_tag", "moon_tag"
}

type StateCode =
  | "NEUTRAL"
  | "BUILDING"
  | "ACTIVE"
  | "ACTIVE_MOMENTUM"
  | "DOMINANT_CONTINUATION"
  | "ABSENT"
  | "ABSENT_PRESSURE"
  | "PRESSURE_RELEASE";

type AuthorityLevel = "NEUTRAL" | "BUILDING" | "STRONG" | "DOMINANT" | null;

interface PlanetaryState {
  cardId: string;
  raceNumber: number;
  planet: string;
  stateCode: StateCode;
  stateName: string;
  strengthScore: number;           // 0–200
  authorityLevel: AuthorityLevel;
  positionTrend: PositionTrendEntry[];
  momentum: string | null;
  absenceDuration: number;
  winCount: number;
  top4Count: number;
  racesSinceLastWin: number | null;
  triggeringRules: string[];
  contextFlags: ContextFlags;
  rulesetVersion: string;
  timestamp: string;               // ISO 8601
}

type AllPlanetData = Record<"MARS" | "VENUS" | "MERCURY" | "MOON" | "SUN", PlanetaryState[]>;
```

---

## 5. Component Architecture

```
App
├── Header                        (logo, card ID input, fetch button, mode toggle)
├── PlanetSummaryBar              (5 planet cards with latest score + state)
│   └── PlanetCard × 5
├── ViewToggle                    ("Individual" | "Combined" tabs)
├── IndividualView                (shown when view = "individual")
│   ├── PlanetTabNav              (MARS | VENUS | MERCURY | MOON | SUN tabs)
│   ├── PlanetChart               (single planet line chart)
│   │   └── HoverPanel            (absolute-positioned detail panel)
│   └── RaceDataTable             (race-by-race breakdown table)
└── CombinedView                  (shown when view = "combined")
    ├── AllPlanetsChart           (multi-line Recharts chart)
    └── SparklineSummaryRow       (5 sparkline cards)
        └── SparklineCard × 5
```

---

## 6. Planet & State Configuration

```js
const PLANETS = ["MARS", "VENUS", "MERCURY", "MOON", "SUN"];

const PLANET_CONFIG = {
  MARS:    { color: "#ff4d4d", glow: "#ff4d4d55", symbol: "♂" },
  VENUS:   { color: "#ffb347", glow: "#ffb34755", symbol: "♀" },
  MERCURY: { color: "#7ecfff", glow: "#7ecfff55", symbol: "☿" },
  MOON:    { color: "#c8b8f8", glow: "#c8b8f855", symbol: "☽" },
  SUN:     { color: "#ffe566", glow: "#ffe56655", symbol: "☉" },
};

const STATE_COLORS = {
  DOMINANT_CONTINUATION: "#00ff9d",
  ACTIVE_MOMENTUM:       "#7ecfff",
  ACTIVE:                "#ffe566",
  BUILDING:              "#ffb347",
  NEUTRAL:               "#888888",
  ABSENT:                "#ff4d4d",
  ABSENT_PRESSURE:       "#ff6b6b",
  PRESSURE_RELEASE:      "#c8b8f8",
};

// Score breakdown components shown in hover panel
const SCORE_FLAGS = [
  "rule_based_strength",
  "state_score",
  "hora_score",
  "zone_score",
  "trigger_score",
  "cycle_score",
  "echo_score",
  "return_time_score",
  "final_score_uncapped",
];
```

---

## 7. Chart Specifications

### Individual Planet Chart

```jsx
<ResponsiveContainer width="100%" height={320}>
  <LineChart
    data={planetHistory}           // PlanetaryState[] sorted by raceNumber
    margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
    onMouseMove={handleChartMouseMove}
    onMouseLeave={() => setHoveredPoint(null)}
  >
    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
    <XAxis
      dataKey="raceNumber"
      label={{ value: "Race", position: "insideBottom", offset: -8 }}
      tick={{ fill: "#ffffff44", fontSize: 11, fontFamily: "IBM Plex Mono" }}
    />
    <YAxis
      domain={[0, 200]}
      tickCount={5}
      label={{ value: "Strength", angle: -90, position: "insideLeft" }}
      tick={{ fill: "#ffffff44", fontSize: 11, fontFamily: "IBM Plex Mono" }}
    />
    <ReferenceLine y={100} stroke="#ffffff11" strokeDasharray="4 4" />
    <Line
      type="monotone"
      dataKey="strengthScore"
      stroke={PLANET_CONFIG[planet].color}
      strokeWidth={2}
      dot={renderCustomDot}         // coloured by stateCode
      activeDot={false}
      connectNulls
    />
  </LineChart>
</ResponsiveContainer>
```

**Custom dot renderer** — colour each dot by the stateCode at that race:
```jsx
const renderCustomDot = (props) => {
  const { cx, cy, payload } = props;
  const color = STATE_COLORS[payload.stateCode] || "#888";
  return (
    <circle
      key={`dot-${payload.raceNumber}`}
      cx={cx} cy={cy} r={5}
      fill={color}
      stroke={PLANET_CONFIG[planet].color}
      strokeWidth={1.5}
      style={{ cursor: "pointer", filter: `drop-shadow(0 0 4px ${color})` }}
    />
  );
};
```

**Mouse move handler** — correct coordinate calculation:
```jsx
const handleChartMouseMove = (state) => {
  if (!state.isTooltipActive || !state.activePayload?.[0]) return;
  const payload = state.activePayload[0].payload;
  const containerRect = chartContainerRef.current.getBoundingClientRect();
  // state.chartX/Y are relative to the chart SVG, not the page
  setHoveredPoint({
    data: payload,
    x: state.chartX,
    y: state.chartY,
  });
};
```

### Combined Chart

```jsx
<LineChart data={combinedChartData}>
  {/* combinedChartData shape: [{ race: 1, MARS: 50, VENUS: 55, ... }] */}
  {PLANETS.map(p => (
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
  <Tooltip content={<CombinedTooltip />} />
  <Legend formatter={(val) => `${PLANET_CONFIG[val]?.symbol} ${val}`} />
</LineChart>
```

---

## 8. HoverPanel Component — Correct Implementation

The hover panel must be position-fixed to avoid SVG clipping issues:

```jsx
function HoverPanel({ data, x, y }) {
  if (!data) return null;

  const PANEL_WIDTH = 380;
  const PANEL_MAX_HEIGHT = 520;

  // Flip left if near right edge of viewport
  const flipLeft = x + PANEL_WIDTH + 32 > window.innerWidth;
  // Flip up if near bottom
  const flipUp = y + PANEL_MAX_HEIGHT > window.innerHeight;

  const cfg = PLANET_CONFIG[data.planet];

  return ReactDOM.createPortal(
    <div style={{
      position: "fixed",
      top: flipUp ? y - PANEL_MAX_HEIGHT : y,
      left: flipLeft ? x - PANEL_WIDTH - 16 : x + 16,
      width: PANEL_WIDTH,
      maxHeight: PANEL_MAX_HEIGHT,
      overflowY: "auto",
      background: "#0a0a18",
      border: `1px solid ${cfg.color}55`,
      borderRadius: 14,
      fontFamily: "'IBM Plex Mono', monospace",
      boxShadow: `0 12px 60px #000000cc, 0 0 30px ${cfg.color}22`,
      zIndex: 9999,
      pointerEvents: "none",
      animation: "fadeIn 0.15s ease",
    }}>
      <HoverPanelHeader data={data} cfg={cfg} />
      <HoverPanelBody data={data} cfg={cfg} />
    </div>,
    document.body
  );
}
```

### HoverPanel Sections

#### Header
- Planet symbol + name (left)
- Strength score large (right)
- Card ID + race number subtitle

#### State Badge Row
- `stateName` badge (coloured by `STATE_COLORS[stateCode]`)
- `authorityLevel` badge (white/muted)
- `rulesetVersion` badge (muted)

#### Stats Grid (2×2 or 4-column)
| Label | Field |
|---|---|
| WINS | `winCount` |
| TOP 4 | `top4Count` |
| ABSENT | `absenceDuration` |
| SINCE WIN | `racesSinceLastWin ?? "—"` |

#### Score Breakdown (bar or rows)
Show all `SCORE_FLAGS` keys from `contextFlags`. Display as label → value rows, coloured:
- `> 0` number → `#ffe566`
- `=== true` → `#00ff9d`
- `=== false` → `#ff4d4d44`
- other → `#aaa`

#### Position Trend
Render each `positionTrend` entry:
```
R{raceNumber}  #{runnerNumber} → P{position}
```
Colour position: `1` = `#00ff9d`, `2-4` = `#ffe566`, `5+` = `#aaa`

#### Triggering Rules
Each rule as a pill/badge in planet colour.

#### Context Flags (remaining)
All flags not in `SCORE_FLAGS`, excluding `null`/objects. Arrays shown as `[1, 2, 3]`.

#### Timestamp
`new Date(data.timestamp).toLocaleString()` right-aligned at bottom.

---

## 9. Loading & Error States

```jsx
// Loading skeleton for chart area
function ChartSkeleton() {
  return (
    <div style={{ height: 320, background: "#0d0d1a", borderRadius: 16,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ffffff22", fontSize: 12, animation: "pulse 1.5s infinite" }}>
        LOADING PLANETARY DATA...
      </div>
    </div>
  );
}

// Error banner
function ErrorBanner({ message }) {
  return (
    <div style={{ background: "#ff4d4d11", border: "1px solid #ff4d4d33",
      borderRadius: 8, padding: "12px 16px", color: "#ff4d4d", fontSize: 12 }}>
      ⚠ {message}
    </div>
  );
}
```

---

## 10. App State Structure

```js
// All state lives in the root App component
const [cardIdInput, setCardIdInput] = useState("SAN-2026-03-11");
const [submittedCardId, setSubmittedCardId] = useState(null);
const [allData, setAllData] = useState(null);       // AllPlanetData | null
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);           // string | null
const [useMock, setUseMock] = useState(true);       // demo / live toggle
const [activePlanet, setActivePlanet] = useState("MARS");
const [view, setView] = useState("individual");     // "individual" | "combined"
const [hoveredPoint, setHoveredPoint] = useState(null); // { data, x, y } | null

const chartContainerRef = useRef(null);
```

---

## 11. Fetch Logic

```js
const fetchAll = useCallback(async (id) => {
  setLoading(true);
  setError(null);
  setHoveredPoint(null);

  try {
    let data;
    if (useMock) {
      data = Object.fromEntries(
        PLANETS.map(p => [p, generateMockHistory(id, p)])
      );
    } else {
      const results = await Promise.allSettled(
        PLANETS.map(p =>
          fetch(`${API_BASE}/${id}/history?planet=${p}`)
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        )
      );

      data = {};
      results.forEach((result, i) => {
        const p = PLANETS[i];
        if (result.status === "fulfilled") {
          // Sort by raceNumber ascending
          data[p] = result.value.sort((a, b) => a.raceNumber - b.raceNumber);
        } else {
          console.warn(`Failed to fetch ${p}:`, result.reason);
          data[p] = [];
        }
      });

      const allFailed = PLANETS.every(p => data[p].length === 0);
      if (allFailed) throw new Error("All planet fetches failed");
    }

    setAllData(data);
    setSubmittedCardId(id);
  } catch (err) {
    setError(`Failed to load data: ${err.message}`);
  } finally {
    setLoading(false);
  }
}, [useMock]);
```

---

## 12. Combined Chart Data Transform

```js
const combinedData = useMemo(() => {
  if (!allData) return [];

  const allRaces = new Set(
    PLANETS.flatMap(p => (allData[p] || []).map(d => d.raceNumber))
  );

  return Array.from(allRaces).sort((a, b) => a - b).map(race => {
    const row = { race };
    PLANETS.forEach(p => {
      const entry = allData[p]?.find(x => x.raceNumber === race);
      row[p] = entry?.strengthScore ?? null;
      row[`${p}_state`] = entry?.stateCode ?? null;
    });
    return row;
  });
}, [allData]);
```

---

## 13. Visual Design Specification

### Theme
- **Style:** Dark space / telemetry terminal
- **Background:** `#070710` (near-black with slight blue cast)
- **Surface:** `#0d0d1a` for cards/panels
- **Borders:** `#ffffff0d` to `#ffffff22`
- **Font:** IBM Plex Mono (monospace everywhere) + Syne Bold for headings

### Typography
```css
/* Headings */
font-family: 'Syne', sans-serif;
font-weight: 800;

/* All other text */
font-family: 'IBM Plex Mono', monospace;

/* Import */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Syne:wght@700;800&display=swap');
```

### Reference Line
Always show `y=100` as a dashed reference line (`#ffffff11`).

### Animations
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Scrollbar
```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #0d0d1a; }
::-webkit-scrollbar-thumb { background: #ffffff22; border-radius: 2px; }
```

---

## 14. Card ID Input

The standard format is `{VENUE}-{YYYY}-{MM}-{DD}` e.g. `SAN-2026-03-11`.

```jsx
<input
  value={cardIdInput}
  onChange={e => setCardIdInput(e.target.value)}
  onKeyDown={e => e.key === "Enter" && handleFetch()}
  placeholder="e.g. SAN-2026-03-11"
  style={{
    background: "#0d0d1a",
    border: "1px solid #ffffff22",
    borderRadius: 8,
    color: "#fff",
    fontFamily: "IBM Plex Mono",
    fontSize: 13,
    padding: "10px 16px",
    outline: "none",
    width: 240,
  }}
/>
<button onClick={handleFetch} disabled={loading} style={{
  background: loading ? "#ffffff11" : "#ffffff22",
  border: "1px solid #ffffff33",
  borderRadius: 8,
  color: "#fff",
  fontFamily: "IBM Plex Mono",
  fontSize: 12,
  padding: "10px 20px",
  cursor: loading ? "not-allowed" : "pointer",
  letterSpacing: 2,
}}>
  {loading ? "LOADING..." : "FETCH"}
</button>
```

---

## 15. Race Data Table

Below each individual planet chart, render a summary table.

**Columns:** Race · Score · State · Authority · Wins · Top4 · Rules

```jsx
<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
  <thead>
    <tr>
      {["Race", "Score", "State", "Authority", "Wins", "Top4", "Rules"].map(h => (
        <th key={h} style={{ color: "#ffffff33", fontWeight: 400, padding: "6px 8px",
          textAlign: "left", letterSpacing: 1, borderBottom: "1px solid #ffffff11" }}>
          {h}
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {planetData.map(d => (
      <tr key={d.raceNumber}
        style={{ borderBottom: "1px solid #ffffff06", cursor: "pointer" }}
        onMouseEnter={() => setHighlightedRace(d.raceNumber)}
        onMouseLeave={() => setHighlightedRace(null)}>
        <td style={{ padding: "5px 8px", color: "#888" }}>{d.raceNumber}</td>
        <td style={{ padding: "5px 8px", color: "#fff", fontWeight: 700 }}>{d.strengthScore}</td>
        <td style={{ padding: "5px 8px", color: STATE_COLORS[d.stateCode] || "#888" }}>{d.stateName}</td>
        <td style={{ padding: "5px 8px", color: "#aaa" }}>{d.authorityLevel || "—"}</td>
        <td style={{ padding: "5px 8px", color: "#aaa" }}>{d.winCount}</td>
        <td style={{ padding: "5px 8px", color: "#aaa" }}>{d.top4Count}</td>
        <td style={{ padding: "5px 8px", color: PLANET_CONFIG[activePlanet].color, fontSize: 10 }}>
          {(d.triggeringRules || []).join(", ") || "—"}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## 16. File Structure

```
src/
├── App.jsx                     ← root, all state, fetch logic
├── constants/
│   ├── planets.js              ← PLANETS, PLANET_CONFIG, STATE_COLORS, SCORE_FLAGS
│   └── api.js                  ← API_BASE constant
├── components/
│   ├── Header.jsx
│   ├── PlanetSummaryBar.jsx
│   ├── PlanetCard.jsx
│   ├── ViewToggle.jsx
│   ├── IndividualView.jsx
│   │   ├── PlanetTabNav.jsx
│   │   ├── PlanetChart.jsx
│   │   ├── HoverPanel.jsx
│   │   └── RaceDataTable.jsx
│   ├── CombinedView.jsx
│   │   ├── AllPlanetsChart.jsx
│   │   ├── CombinedTooltip.jsx
│   │   └── SparklineCard.jsx
│   └── ui/
│       ├── ChartSkeleton.jsx
│       └── ErrorBanner.jsx
├── hooks/
│   └── usePlanetaryData.js     ← fetchAll logic extracted
├── utils/
│   ├── mock.js                 ← generateMockHistory
│   └── transform.js            ← buildCombinedData
└── index.css                   ← global styles, keyframes, scrollbar
```

---

## 17. Copilot Prompting Tips

When prompting Copilot for specific components, use this framing:

**For HoverPanel:**
> "Create a React component `HoverPanel` that uses `ReactDOM.createPortal` to render at `position:fixed` coordinates `{x, y}` relative to the viewport. It takes `data: PlanetaryState` and `x, y: number` props. The panel displays..."

**For PlanetChart:**
> "Create a Recharts LineChart for PlanetaryState history. The chart must fire `onMouseMove` to call `setHoveredPoint` with the payload and chart-relative coordinates. Custom dots are rendered per point coloured by `stateCode` using `STATE_COLORS`."

**For data transform:**
> "Write a `buildCombinedData(allData: AllPlanetData)` function that merges all 5 planet arrays into a single array of objects keyed by `race`, with each planet's `strengthScore` as a named key, sorted ascending by race number."

---

## 18. Known Backend Behaviour Notes

- The history endpoint returns ALL races for the card, not paginated.
- `strengthScore` is capped at 200. Charts should always use `domain={[0, 200]}`.
- `positionTrend` may contain entries with `null` runner number and position (planet not in race).
- `contextFlags` keys vary by planet — e.g. `mars_tag`, `moon_tag`, `mercury_tag` only appear for their respective planets.
- `racesSinceLastWin` is `null` when the planet has never won (not zero).
- `absenceDuration` is `0` for non-absent states (not null).

---

## 19. Quick-Start Checklist for Copilot

- [ ] Scaffold Vite React app: `npm create vite@latest stellar-dashboard -- --template react`
- [ ] Install deps: `npm install recharts react-dom`
- [ ] Add Google Fonts import to `index.html` or `index.css`
- [ ] Create `constants/planets.js` with configs above
- [ ] Build `usePlanetaryData` hook with correct `Promise.allSettled` fetch
- [ ] Build `HoverPanel` with `ReactDOM.createPortal` and correct `position:fixed` logic
- [ ] Build `PlanetChart` with `onMouseMove` handler (not `onMouseEnter` on dots)
- [ ] Build `CombinedView` with `buildCombinedData` transform
- [ ] Wire `App.jsx` root state and pass props down
- [ ] Test with mock mode first, then verify live API with `SAN-2026-03-11`
