"use client";

import { Button, ProgressCircle, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function BackAction() {
  const t = useTranslations("Article");
  const router = useRouter();

  return (
    <Tooltip delay={100}>
      <Button
        isIconOnly
        aria-label={t("back")}
        size="sm"
        variant="ghost"
        onPress={() => router.back()}
      >
        <Icon className="size-4" icon="gravity-ui:arrow-left" />
      </Button>
      <Tooltip.Content>{t("back")}</Tooltip.Content>
    </Tooltip>
  );
}

export function LibraryAction() {
  const t = useTranslations("Article");
  const router = useRouter();

  return (
    <Tooltip delay={100}>
      <Button
        isIconOnly
        aria-label={t("readingLibrary")}
        size="sm"
        variant="ghost"
        onPress={() => router.push("/library")}
      >
        <Icon icon="gravity-ui:book-open" />
      </Button>
      <Tooltip.Content>{t("readingLibrary")}</Tooltip.Content>
    </Tooltip>
  );
}

export function ProgressAction({ progress }: { progress: number }) {
  const t = useTranslations("Article");

  return (
    <Tooltip delay={100}>
      <Button
        isIconOnly
        aria-label={t("scrollToTop", { progress })}
        size="sm"
        variant="ghost"
        onPress={() =>
          window.scrollTo({
            top: 0,
            behavior: "auto",
          })
        }
      >
        <ProgressCircle
          aria-hidden="true"
          className="pointer-events-none"
          color="default"
          maxValue={100}
          size="sm"
          value={progress}
        >
          <ProgressCircle.Track>
            <ProgressCircle.TrackCircle />
            <ProgressCircle.FillCircle />
          </ProgressCircle.Track>
        </ProgressCircle>
      </Button>
      <Tooltip.Content>{t("percentRead", { progress })}</Tooltip.Content>
    </Tooltip>
  );
}
