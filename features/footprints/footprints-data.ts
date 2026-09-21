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

// Illustrative seed content, not verified personal travel history.
export const FOOTPRINTS: readonly Footprint[] = [
  {
    id: "mount-rainier",
    title: "Weather as architecture",
    place: "Mount Rainier",
    country: "United States",
    year: 2025,
    visitedAt: "September 2025",
    latitude: 46.8523,
    longitude: -121.7603,
    memory:
      "Clouds moved across the glaciers like a second landscape, making stillness feel temporary.",
    image: "/IMG_4958.WEBP",
    tags: ["mountains", "weather"],
    order: 1,
  },
  {
    id: "shinjuku",
    title: "Lines after dark",
    place: "Shinjuku, Tokyo",
    country: "Japan",
    year: 2024,
    visitedAt: "November 2024",
    latitude: 35.6938,
    longitude: 139.7034,
    memory:
      "A city of quiet systems: crossings, elevators, signs, and the small choreography between them.",
    image: "/IMG_5332.JPG",
    tags: ["city", "geometry"],
    order: 2,
  },
  {
    id: "redwoods",
    title: "A deeper kind of green",
    place: "Redwoods National Park",
    country: "United States",
    year: 2023,
    visitedAt: "July 2023",
    latitude: 41.2132,
    longitude: -124.0046,
    memory:
      "The forest made distance feel physical: every step opened another layer of shadow and scale.",
    image: "/IMG_2232.JPG",
    tags: ["forest", "slow light"],
    order: 3,
  },
  {
    id: "cannon-beach",
    title: "Where weather meets stone",
    place: "Cannon Beach",
    country: "United States",
    year: 2022,
    visitedAt: "October 2022",
    latitude: 45.8918,
    longitude: -123.9615,
    memory:
      "Fog softened the coastline until the sea stacks felt less like landmarks and more like witnesses.",
    image: "/IMG_2260.JPG",
    tags: ["coast", "fog"],
    order: 4,
  },
  {
    id: "iceland",
    title: "A country made of edges",
    place: "South Coast, Iceland",
    country: "Iceland",
    year: 2021,
    visitedAt: "June 2021",
    latitude: 63.6158,
    longitude: -19.9886,
    memory: "Black sand, bright water, and a horizon that kept refusing to stay still.",
    tags: ["shoreline", "open sky"],
    order: 5,
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
