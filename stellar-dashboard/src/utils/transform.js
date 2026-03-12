import { PLANETS } from "../constants/planets";

/**
 * Merge all 5 planet history arrays into a single array of objects
 * keyed by race number, with each planet's strengthScore as a named key.
 *
 * Output shape: [{ race: 1, MARS: 50, VENUS: 55, MARS_state: "NEUTRAL", ... }]
 */
export function buildCombinedData(allData) {
  if (!allData) return [];

  const allRaces = new Set(
    PLANETS.flatMap((p) => (allData[p] || []).map((d) => d.raceNumber))
  );

  return Array.from(allRaces)
    .sort((a, b) => a - b)
    .map((race) => {
      const row = { race };
      PLANETS.forEach((p) => {
        const entry = allData[p]?.find((x) => x.raceNumber === race);
        row[p] = entry?.strengthScore ?? null;
        row[`${p}_state`] = entry?.stateCode ?? null;
      });
      return row;
    });
}
