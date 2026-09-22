"use client";

import { createPageReveal } from "@/lib/motion";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { Card, Chip, CloseButton, Link } from "@heroui/react";
import { useMounted } from "@mantine/hooks";
import { motion } from "motion/react";
import { useCallback, useState } from "react";

import { dismissHomeOrientation, isHomeOrientationDismissed } from "./home-orientation-storage";

const DESTINATIONS = [
  { href: "/chronicle", label: "Read writing" },
  { href: "/footprints", label: "Open footprints" },
  { href: "/uses", label: "See tools" },
] as const;

export function HomeOrientation() {
  const mounted = useMounted();
  const shouldReduceMotion = useReducedMotionPreference();
  const { reveal } = createPageReveal(shouldReduceMotion);
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => {
    dismissHomeOrientation();
    setDismissed(true);
  }, []);

  // Read storage only after mount so SSR/hydration never flashes for returning visitors.
  if (!mounted || dismissed || isHomeOrientationDismissed()) {
    return null;
  }

  return (
    <motion.section
      aria-label="Site orientation"
      className="mx-auto w-full max-w-6xl px-6 pb-8 sm:px-10"
      {...reveal(0.05, 12)}
    >
      <Card variant="secondary" className="relative">
        <Card.Header className="gap-3 pe-12">
          <Chip size="sm" variant="secondary">
            Start here
          </Chip>
          <CloseButton
            aria-label="Dismiss orientation"
            className="absolute end-3 top-3"
            onPress={dismiss}
          />
          <Card.Title>Three honest doors</Card.Title>
          <Card.Description className="max-w-xl leading-6">
            Writing, places kept on the map, and the tools behind the work. Skip anytime.
          </Card.Description>
        </Card.Header>
        <Card.Footer className="flex flex-wrap gap-3">
          {DESTINATIONS.map((destination) => (
            <Link key={destination.href} href={destination.href} onPress={dismiss}>
              {destination.label}
              <Link.Icon aria-hidden="true" />
            </Link>
          ))}
        </Card.Footer>
      </Card>
    </motion.section>
  );
}
