import { getVersion } from "maplibre-gl";

// OpenFreeMap's public instance serves these without an API key or registration, so the
// demos stay renderable for anyone copying them. Keyed providers watermark unkeyed tiles.
export const footprintMapStyles = {
  dark: "https://tiles.openfreemap.org/styles/dark",
  light: "https://tiles.openfreemap.org/styles/positron",
};

// MapLibre's style worker ships as a separate ESM chunk. Pass `workerUrl` when your
// bundler cannot resolve that worker from the maplibre-gl package on its own.
export const footprintMapWorkerUrl = `https://cdn.jsdelivr.net/npm/maplibre-gl@${getVersion()}/dist/maplibre-gl-worker.mjs`;
