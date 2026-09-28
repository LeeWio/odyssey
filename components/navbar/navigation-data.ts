"use client";

import type { NavigationId } from "./types";

type NavigationTranslator = (key: string) => string;

const NAVIGATION_COPY: Record<
  NavigationId,
  { href: string; label: string; eyebrow: string; title: string; description: string; cta: string }
> = {
  chronicle: {
    href: "/chronicle",
    label: "items.chronicle.label",
    eyebrow: "items.chronicle.eyebrow",
    title: "items.chronicle.title",
    description: "items.chronicle.description",
    cta: "items.chronicle.cta",
  },
  daily: {
    href: "/persona",
    label: "items.orbit.label",
    eyebrow: "items.orbit.eyebrow",
    title: "items.orbit.title",
    description: "items.orbit.description",
    cta: "items.orbit.cta",
  },
  travelogue: {
    href: "/gallery",
    label: "items.travelogue.label",
    eyebrow: "items.travelogue.eyebrow",
    title: "items.travelogue.title",
    description: "items.travelogue.description",
    cta: "items.travelogue.cta",
  },
  more: {
    href: "/archive",
    label: "items.archive.label",
    eyebrow: "items.archive.eyebrow",
    title: "items.archive.title",
    description: "items.archive.description",
    cta: "items.archive.cta",
  },
};

export const getNavigationItem = (id: NavigationId | null, t: NavigationTranslator) => {
  if (!id) return null;
  const copy = NAVIGATION_COPY[id];
  if (!copy) return null;

  return {
    id,
    href: copy.href,
    label: t(copy.label),
    eyebrow: t(copy.eyebrow),
    title: t(copy.title),
    description: t(copy.description),
    cta: t(copy.cta),
  };
};
