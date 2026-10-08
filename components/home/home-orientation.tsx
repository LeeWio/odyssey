"use client";

import { createPageReveal } from "@/lib/motion";
import { PageContainer } from "@/components/layout/page-container";
import { MotionCard } from "@/components/ui";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { Card, Chip, CloseButton, Link } from "@heroui/react";
import { useMounted } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { dismissHomeOrientation, isHomeOrientationDismissed } from "./home-orientation-storage";

const DESTINATION_HREFS = ["/chronicle", "/footprints", "/uses"] as const;
const DESTINATION_KEYS = ["writing", "footprints", "tools"] as const;

export function HomeOrientation() {
  const t = useTranslations("Home");
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
    <PageContainer as="section" aria-label={t("orientation.regionLabel")} className="pb-8">
      <MotionCard variant="secondary" className="relative" {...reveal(0.05, 12)}>
        <Card.Header className="gap-3 pe-12">
          <Chip size="sm" variant="secondary">
            {t("orientation.eyebrow")}
          </Chip>
          <CloseButton
            aria-label={t("orientation.dismiss")}
            className="absolute end-3 top-3"
            onPress={dismiss}
          />
          <Card.Title>{t("orientation.title")}</Card.Title>
          <Card.Description className="max-w-xl leading-6">
            {t("orientation.description")}
          </Card.Description>
        </Card.Header>
        <Card.Footer className="flex flex-wrap gap-3">
          {DESTINATION_HREFS.map((href, index) => (
            <Link key={href} href={href} onPress={dismiss}>
              {t(`orientation.${DESTINATION_KEYS[index]}`)}
              <Link.Icon aria-hidden="true" />
            </Link>
          ))}
        </Card.Footer>
      </MotionCard>
    </PageContainer>
  );
}
