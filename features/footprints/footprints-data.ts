export type Footprint = {
  id: string;
  title: string;
  place: string;
  country: string;
  year: number;
  visitedAt?: string;
  latitude: number;
  longitude: number;
  memory: string;
  image?: string;
  tags: readonly string[];
  order: number;
};

export type FootprintArc = {
  id: string;
  toId: string;
  from: [number, number];
  to: [number, number];
  route: string;
  color: string;
  width: number;
};

/**
 * Personal places visited in China.
 * Coordinates use a representative city for each province/region.
 * Years are placeholders until the exact visit dates are filled in.
 */
export const FOOTPRINTS: readonly Footprint[] = [
  {
    id: "hubei",
    title: "Middle of the river country",
    place: "Hubei",
    country: "China",
    year: 2024,
    latitude: 30.5928,
    longitude: 114.3055,
    memory: "A stop that stayed on the map. Year and notes still being filled in.",
    tags: ["china", "central"],
    order: 1,
  },
  {
    id: "shaanxi",
    title: "Longer clocks",
    place: "Shaanxi",
    country: "China",
    year: 2024,
    latitude: 34.3416,
    longitude: 108.9398,
    memory: "A stop that stayed on the map. Year and notes still being filled in.",
    tags: ["china", "northwest"],
    order: 2,
  },
  {
    id: "henan",
    title: "Plains crossing",
    place: "Henan",
    country: "China",
    year: 2024,
    latitude: 34.7466,
    longitude: 113.6253,
    memory: "A stop that stayed on the map. Year and notes still being filled in.",
    tags: ["china", "central"],
    order: 3,
  },
  {
    id: "guangdong",
    title: "Southern density",
    place: "Guangdong",
    country: "China",
    year: 2024,
    latitude: 23.1291,
    longitude: 113.2644,
    memory: "A stop that stayed on the map. Year and notes still being filled in.",
    tags: ["china", "south"],
    order: 4,
  },
  {
    id: "shenzhen",
    title: "A city rewriting itself",
    place: "Shenzhen",
    country: "China",
    year: 2024,
    latitude: 22.5431,
    longitude: 114.0579,
    memory: "A stop that stayed on the map. Year and notes still being filled in.",
    tags: ["china", "city"],
    order: 5,
  },
  {
    id: "anhui",
    title: "Between louder destinations",
    place: "Anhui",
    country: "China",
    year: 2024,
    latitude: 31.8206,
    longitude: 117.2272,
    memory: "A stop that stayed on the map. Year and notes still being filled in.",
    tags: ["china", "east"],
    order: 6,
  },
  {
    id: "sichuan",
    title: "Basin weather",
    place: "Sichuan",
    country: "China",
    year: 2024,
    latitude: 30.5728,
    longitude: 104.0668,
    memory: "A stop that stayed on the map. Year and notes still being filled in.",
    tags: ["china", "southwest"],
    order: 7,
  },
];

export function getSortedFootprints(footprints: readonly Footprint[] = FOOTPRINTS) {
  return [...footprints].sort(
    (first, second) => second.year - first.year || first.order - second.order
  );
}

export function getFootprintYears(footprints: readonly Footprint[] = FOOTPRINTS) {
  return [...new Set(footprints.map((footprint) => footprint.year))].sort(
    (first, second) => second - first
  );
}

export function getFootprintArcs(footprints: readonly Footprint[] = FOOTPRINTS): FootprintArc[] {
  const ordered = [...footprints].sort(
    (first, second) => first.year - second.year || first.order - second.order
  );

  return ordered.slice(0, -1).flatMap((from, index) => {
    const to = ordered[index + 1];
    if (!to) return [];

    return [
      {
        id: `${from.id}-${to.id}`,
        toId: to.id,
        from: [from.longitude, from.latitude] as [number, number],
        to: [to.longitude, to.latitude] as [number, number],
        route: `${from.place} → ${to.place}`,
        color: index % 2 === 0 ? "#4285f4" : "#8b5cf6",
        width: index === ordered.length - 2 ? 3.5 : 2.5,
      },
    ];
  });
}

export function getFeaturedFootprints(limit = 3, footprints: readonly Footprint[] = FOOTPRINTS) {
  return getSortedFootprints(footprints).slice(0, Math.max(0, limit));
}

export function getFootprintsMapView(footprints: readonly Footprint[] = FOOTPRINTS) {
  if (footprints.length === 0) {
    return { center: [108, 33] as [number, number], zoom: 3.2 };
  }

  const longitudes = footprints.map((footprint) => footprint.longitude);
  const latitudes = footprints.map((footprint) => footprint.latitude);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const span = Math.max(maxLng - minLng, maxLat - minLat);

  return {
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2] as [number, number],
    zoom: span > 40 ? 2.2 : span > 15 ? 3.4 : span > 8 ? 4.2 : 5,
  };
}
