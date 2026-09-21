"use client";

import type { NavigationId } from "./types";

export const getNavigationItem = (id: NavigationId | null) => {
  if (!id) return null;
  switch (id) {
    case "chronicle":
      return {
        id: "chronicle" as const,
        label: "Chronicle",
        eyebrow: "Writing & systems",
        title: "Words that survive the build.",
        description:
          "Field notes on design systems, accessible engineering, and structural decisions that resist contact with the real world.",
        href: "/chronicle",
        cta: "Explore chronicle",
      };
    case "daily":
      return {
        id: "daily" as const,
        label: "Orbit", // Changed from Rituals to Orbit (representing your daily trajectory)
        eyebrow: "Daily practices",
        title: "How I spend the hours.",
        description:
          "Four pillars of focus, patience, biomechanics, and compiled logic that shape the rhythm of each day.",
        href: "/persona",
        cta: "Open persona",
      };
    case "travelogue":
      return {
        id: "travelogue" as const,
        label: "Travelogue",
        eyebrow: "Places & photography",
        title: "Moments framed in flow.",
        description:
          "Brutalist structures, wild coastlines, and silent weather studies collected across slow journeys in Iceland, Europe, and Asia.",
        href: "/gallery",
        cta: "View gallery",
      };
    case "more":
      return {
        id: "more" as const,
        label: "Archive",
        eyebrow: "Writing, in sequence",
        title: "The work, in context.",
        description:
          "A chronological path through essays, notes, and the threads that connect them over time.",
        href: "/archive",
        cta: "Browse archive",
      };
    default:
      return null;
  }
};
