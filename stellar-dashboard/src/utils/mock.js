import { PLANETS } from "../constants/planets";

const STATE_CODES = [
  "NEUTRAL",
  "BUILDING",
  "ACTIVE",
  "ACTIVE_MOMENTUM",
  "DOMINANT_CONTINUATION",
  "ABSENT",
  "ABSENT_PRESSURE",
  "PRESSURE_RELEASE",
];

const STATE_NAMES = {
  NEUTRAL: "Neutral",
  BUILDING: "Building",
  ACTIVE: "Active",
  ACTIVE_MOMENTUM: "Active Momentum",
  DOMINANT_CONTINUATION: "Dominant Continuation",
  ABSENT: "Absent",
  ABSENT_PRESSURE: "Absent Pressure",
  PRESSURE_RELEASE: "Pressure Release",
};

const AUTHORITY_LEVELS = [null, "NEUTRAL", "BUILDING", "STRONG", "DOMINANT"];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/**
 * Generate mock PlanetaryState[] history for a given card + planet.
 * Produces 8–12 races with semi-realistic progression.
 */
export function generateMockHistory(cardId, planet) {
  const raceCount = 8 + Math.floor(Math.random() * 5); // 8–12 races
  const history = [];
  let score = 40 + Math.floor(Math.random() * 30); // start 40–70
  let winCount = 0;
  let top4Count = 0;
  let racesSinceLastWin = null;

  for (let r = 1; r <= raceCount; r++) {
    // Walk score randomly
    const delta = Math.floor(Math.random() * 30) - 10; // -10 to +19
    score = clamp(score + delta, 0, 200);

    const stateCode = randomChoice(STATE_CODES);
    const authorityLevel = randomChoice(AUTHORITY_LEVELS);
    const position = Math.random() < 0.3 ? null : Math.ceil(Math.random() * 12);
    const runnerNumber = position != null ? Math.ceil(Math.random() * 14) : null;

    if (position === 1) {
      winCount++;
      racesSinceLastWin = 0;
    } else if (racesSinceLastWin != null) {
      racesSinceLastWin++;
    }

    if (position != null && position <= 4) {
      top4Count++;
    }

    const ruleBasedStrength = Math.floor(score * 0.6);
    const horaScore = Math.floor(Math.random() * 20);
    const zoneScore = Math.floor(Math.random() * 20);
    const triggerScore = Math.floor(Math.random() * 15);
    const stateScore = Math.floor(Math.random() * 15);
    const cycleScore = Math.floor(Math.random() * 10);
    const echoScore = Math.floor(Math.random() * 10);
    const returnTimeScore = Math.floor(Math.random() * 10);

    const triggeringRules = [];
    const rulePool = [
      `${planet}_NUMBER1_BASE`,
      `${planet}_TOP4_STREAK`,
      `${planet}_HORA_BOOST`,
      `${planet}_ZONE_ACTIVE`,
      `${planet}_CYCLE_ECHO`,
    ];
    const ruleCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < ruleCount; i++) {
      triggeringRules.push(randomChoice(rulePool));
    }

    history.push({
      cardId,
      raceNumber: r,
      planet,
      stateCode,
      stateName: STATE_NAMES[stateCode] || stateCode,
      strengthScore: score,
      authorityLevel,
      positionTrend: [
        { runnerNumber, position, raceNumber: r },
      ],
      momentum: Math.random() > 0.6 ? "RISING" : Math.random() > 0.5 ? "FALLING" : null,
      absenceDuration: stateCode.startsWith("ABSENT") ? Math.ceil(Math.random() * 4) : 0,
      winCount,
      top4Count,
      racesSinceLastWin: winCount > 0 ? racesSinceLastWin : null,
      triggeringRules: [...new Set(triggeringRules)],
      contextFlags: {
        state_score: stateScore,
        hora_score: horaScore,
        zone_score: zoneScore,
        trigger_score: triggerScore,
        cycle_score: cycleScore,
        echo_score: echoScore,
        return_time_score: returnTimeScore,
        rule_based_strength: ruleBasedStrength,
        final_score_uncapped: score,
        was_in_top4: position != null && position <= 4,
        return_pressure: Math.random() > 0.7,
        planetary_moment: Math.random() > 0.8,
        [`${planet.toLowerCase()}_tag`]: Math.random() > 0.5 ? "active" : "dormant",
      },
      rulesetVersion: "L2_v1.0.0",
      timestamp: new Date().toISOString(),
    });
  }

  return history;
}
