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
  /** Signed bow for Map.Arc. Nearby routes use opposite signs so they separate. */
  curvature: number;
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
    id: "huizhou",
    title: "East of the bay",
    place: "Huizhou",
    country: "China",
    year: 2025,
    visitedAt: "2025",
    latitude: 23.1115,
    longitude: 114.4152,
    memory: "A slower afternoon past Shenzhen: the lake, the hills, and the coast.",
    tags: ["china", "south", "city"],
    order: 7,
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
    order: 8,
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
  const home = ordered[0];
  if (!home) return [];

  // Every recorded trip leaves home. A year-by-year chain zigzags inside China and
  // collapses into one knot at the globe zoom used by the Flight Paths example.
  return ordered.slice(1).map((destination, index) => {
    const from: [number, number] = [home.longitude, home.latitude];
    const to: [number, number] = [destination.longitude, destination.latitude];
    const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const reach = Math.min(0.42, 0.16 + distance / 48);
    const direction = index % 2 === 0 ? 1 : -1;

    return {
      id: `${home.id}-${destination.id}`,
      toId: destination.id,
      from,
      to,
      route: `${home.place} → ${destination.place}`,
      color: "#4285f4",
      width: distance < 4 ? 1.6 : 2.2,
      curvature: reach * direction,
    };
  });
}

export function getFeaturedFootprints(limit = 3, footprints: readonly Footprint[] = FOOTPRINTS) {
  return getSortedFootprints(footprints).slice(0, Math.max(0, limit));
}
