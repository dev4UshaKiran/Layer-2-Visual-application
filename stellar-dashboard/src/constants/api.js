// Direct absolute URLs — both backends send CORS headers so no proxy is needed.
export const API_BASE = "http://localhost:8081/api/v1/planetary-state";

// Planetary state detail endpoint (single race + planet)
export const PLANET_STATE_API = "http://localhost:8081/api/v1/planetary-state";

// Standalone predictions endpoint
export const PREDICTIONS_BASE = "http://localhost:8080/api/v1/predictions/standalone";
