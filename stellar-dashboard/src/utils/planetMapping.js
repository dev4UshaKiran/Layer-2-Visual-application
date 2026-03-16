/**
 * Maps runner/competitor numbers to their corresponding planet.
 * Sourced from the Java enum definition:
 *   MARS(1, 8, 16, 17, 32, 33, 34, 35)
 *   VENUS(2, 7, 14, 15, 28, 29, 30, 31)
 *   MERCURY(3, 6, 12, 13, 24, 25, 26, 27)
 *   MOON(4, 9, 18, 19, 36, 37, 38, 39)
 *   SUN(5, 10, 11, 20, 21, 22, 23, 40, 41)
 */
export const PLANET_NUMBER_MAP = {
  1: "MARS",  8: "MARS",  16: "MARS", 17: "MARS",
  32: "MARS", 33: "MARS", 34: "MARS", 35: "MARS",

  2: "VENUS",  7: "VENUS",  14: "VENUS", 15: "VENUS",
  28: "VENUS", 29: "VENUS", 30: "VENUS", 31: "VENUS",

  3: "MERCURY",  6: "MERCURY",  12: "MERCURY", 13: "MERCURY",
  24: "MERCURY", 25: "MERCURY", 26: "MERCURY", 27: "MERCURY",

  4: "MOON",  9: "MOON",  18: "MOON", 19: "MOON",
  36: "MOON", 37: "MOON", 38: "MOON", 39: "MOON",

  5: "SUN",  10: "SUN",  11: "SUN",  20: "SUN",
  21: "SUN", 22: "SUN",  23: "SUN",  40: "SUN",  41: "SUN",
};

/**
 * Returns the planet name for a given runner number.
 * Returns "UNKNOWN" if not found.
 */
export function getPlanetForNumber(num) {
  return PLANET_NUMBER_MAP[num] ?? "UNKNOWN";
}

/**
 * Parses a comma/space-separated string of numbers into an array of integers.
 * Filters out any non-numeric or out-of-range values.
 */
export function parseNumberInput(input) {
  return input
    .split(/[\s,]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0);
}
