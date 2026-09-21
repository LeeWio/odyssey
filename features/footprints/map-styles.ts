import type { MapStyleOption } from "@heroui-pro/react/map";
import { getVersion } from "maplibre-gl";

// Keep the basemap independent from remote font and sprite requests. OpenFreeMap's
// full vector styles can keep MapLibre's loading veil open while those assets are
// unavailable, even though the globe itself is ready for Flight Paths layers.
// Match the attribution that OpenFreeMap's public TileJSON serves with the demo styles.
const openFreeMapAttribution =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

const naturalEarthSource = {
  type: "raster" as const,
  tiles: ["https://tiles.openfreemap.org/natural_earth/ne2sr/{z}/{x}/{y}.png"],
  tileSize: 256,
  maxzoom: 6,
  attribution: openFreeMapAttribution,
};

const darkRasterStyle: MapStyleOption = {
  version: 8,
  sources: {
    "natural-earth": naturalEarthSource,
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "rgb(12, 12, 12)" },
    },
    {
      id: "natural-earth",
      type: "raster",
      source: "natural-earth",
      paint: {
        "raster-brightness-max": 0.38,
        "raster-brightness-min": 0,
        "raster-contrast": -0.12,
        "raster-opacity": 0.62,
        "raster-saturation": -0.72,
      },
    },
  ],
};

const lightRasterStyle: MapStyleOption = {
  version: 8,
  sources: {
    "natural-earth": naturalEarthSource,
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#dce7e8" },
    },
    {
      id: "natural-earth",
      type: "raster",
      source: "natural-earth",
      paint: { "raster-opacity": 0.72 },
    },
  ],
};

export const footprintMapStyles = {
  dark: darkRasterStyle,
  light: lightRasterStyle,
};

export const footprintMapWorkerUrl = `https://cdn.jsdelivr.net/npm/maplibre-gl@${getVersion()}/dist/maplibre-gl-worker.mjs`;
