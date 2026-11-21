"use client";

import { PageContainer } from "@/components/layout/page-container";

import { Card, Chip, CloseButton, Link } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { dismissHomeOrientation } from "./home-orientation-storage";

const DESTINATION_HREFS = ["/chronicle", "/footprints", "/uses"] as const;
const DESTINATION_KEYS = ["writing", "footprints", "tools"] as const;

export function HomeOrientation() {
  const t = useTranslations("Home");
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => {
    dismissHomeOrientation();
    setDismissed(true);
  }, []);

  if (dismissed) return null;

  return (
    <PageContainer as="section" aria-label={t("orientation.regionLabel")} className="pb-4 md:pb-8">
      <Card variant="secondary">
        <Card.Header className="gap-2 pe-12 md:gap-3">
          <Chip size="sm">{t("orientation.eyebrow")}</Chip>
          <CloseButton
            aria-label={t("orientation.dismiss")}
            className="absolute end-3 top-3"
            onPress={dismiss}
          />
          <Card.Title className="text-lg md:text-xl">{t("orientation.title")}</Card.Title>
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
      </Card>
    </PageContainer>
  );
}
