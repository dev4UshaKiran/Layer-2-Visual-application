import { useState, useCallback } from "react";
import { PLANETS } from "../constants/planets";
import { API_BASE } from "../constants/api";

/**
 * Custom hook encapsulating all planet data fetching logic.
 * Uses Promise.allSettled — partial failures show data for successful planets.
 */
export function usePlanetaryData() {
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedCardId, setSubmittedCardId] = useState(null);

  const fetchAll = useCallback(async (cardId) => {
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        PLANETS.map((p) =>
          fetch(`${API_BASE}/${cardId}/history?planet=${p}`)
            .then((r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.json();
            })
        )
      );

      const data = {};
      results.forEach((result, i) => {
        const p = PLANETS[i];
        if (result.status === "fulfilled") {
          // Sort by raceNumber ascending after fetch
          data[p] = result.value.sort((a, b) => a.raceNumber - b.raceNumber);
        } else {
          console.warn(`Failed to fetch ${p}:`, result.reason);
          data[p] = [];
        }
      });

      const allFailed = PLANETS.every((p) => data[p].length === 0);
      if (allFailed) throw new Error("All planet fetches failed");

      setAllData(data);
      setSubmittedCardId(cardId);
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return { allData, loading, error, submittedCardId, fetchAll };
}
