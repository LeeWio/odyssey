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
 * Personal places in China.
 * Coordinates use a representative city for each province/region.
 * Years follow the owner's recorded trips; Hubei is hometown (pre-trip anchor).
 */
export const FOOTPRINTS: readonly Footprint[] = [
  {
    id: "hubei",
    title: "Where the map begins",
    place: "Hubei",
    country: "China",
    year: 2019,
    visitedAt: "Hometown",
    latitude: 30.5928,
    longitude: 114.3055,
    memory: "Home first. Every later route still starts from here.",
    tags: ["china", "hometown", "central"],
    order: 1,
  },
  {
    id: "shaanxi",
    title: "West along the river of history",
    place: "Shaanxi",
    country: "China",
    year: 2019,
    visitedAt: "2019",
    latitude: 34.3416,
    longitude: 108.9398,
    memory: "The first recorded trip away: walls, dust, and a longer sense of time.",
    tags: ["china", "northwest"],
    order: 2,
  },
  {
    id: "guangzhou",
    title: "Southern heat",
    place: "Guangzhou",
    country: "China",
    year: 2020,
    visitedAt: "2020",
    latitude: 23.1291,
    longitude: 113.2644,
    memory: "A southern city of density, humidity, and forward motion.",
    tags: ["china", "south", "city"],
    order: 3,
  },
  {
    id: "shenzhen",
    title: "A city rewriting itself",
    place: "Shenzhen",
    country: "China",
    year: 2023,
    visitedAt: "2023",
    latitude: 22.5431,
    longitude: 114.0579,
    memory: "Glass, pace, and a skyline that keeps changing between visits.",
    tags: ["china", "south", "city"],
    order: 4,
  },
  {
    id: "chongqing",
    title: "Fog and stacked streets",
    place: "Chongqing",
    country: "China",
    year: 2024,
    visitedAt: "2024",
    latitude: 29.563,
    longitude: 106.5516,
    memory: "Stairs, bridges, and a city that climbs over itself.",
    tags: ["china", "southwest", "city"],
    order: 5,
  },
  {
    id: "anhui",
    title: "Quieter hills",
    place: "Anhui",
    country: "China",
    year: 2025,
    visitedAt: "2025",
    latitude: 31.8206,
    longitude: 117.2272,
    memory: "A softer stretch between louder destinations.",
    tags: ["china", "east"],
    order: 6,
  },
  {
    id: "henan",
    title: "Plains this year",
    place: "Henan",
    country: "China",
    year: 2026,
    visitedAt: "2026",
    latitude: 34.7466,
    longitude: 113.6253,
    memory: "A recent crossing of the central plains.",
    tags: ["china", "central"],
    order: 7,
  },
];

export function getFootprintMetaLabel(footprint: Footprint) {
  if (footprint.visitedAt && footprint.visitedAt !== String(footprint.year)) {
    return `${footprint.year} · ${footprint.visitedAt}`;
  }

  return `${footprint.year} · ${footprint.country}`;
}

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
