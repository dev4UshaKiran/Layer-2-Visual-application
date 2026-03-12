export const PLANETS = ["MARS", "VENUS", "MERCURY", "MOON", "SUN"];

export const PLANET_CONFIG = {
  MARS:    { color: "#e03131", glow: "#e0313155", symbol: "♂" },
  VENUS:   { color: "#d4790a", glow: "#d4790a55", symbol: "♀" },
  MERCURY: { color: "#1971c2", glow: "#1971c255", symbol: "☿" },
  MOON:    { color: "#6741d9", glow: "#6741d955", symbol: "☽" },
  SUN:     { color: "#c47d00", glow: "#c47d0055", symbol: "☉" },
};

export const STATE_COLORS = {
  DOMINANT_CONTINUATION: "#0ca678",
  ACTIVE_MOMENTUM:       "#1971c2",
  ACTIVE:                "#c47d00",
  BUILDING:              "#d4790a",
  NEUTRAL:               "#555555",
  ABSENT:                "#e03131",
  ABSENT_PRESSURE:       "#c2255c",
  PRESSURE_RELEASE:      "#6741d9",
};

export const SCORE_FLAGS = [
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
