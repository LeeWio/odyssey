"use client";

import { Button, ProgressCircle, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useScrollIntoView } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

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
  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLElement>({
    duration: readingReturnDuration(progress),
    easing: easeOutCubic,
  });

  useEffect(() => {
    // The title sits in the middle of the opening screen. Returning to the title
    // leaves that screen partly above the viewport.
    targetRef.current = document.body;
  });

  return (
    <Tooltip delay={100}>
      <Button
        isIconOnly
        aria-label={t("scrollToTop", { progress })}
        size="sm"
        variant="ghost"
        onPress={() => scrollIntoView({ alignment: "start" })}
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

/** A short read returns quickly. A long read gets more time, without becoming a tour. */
function readingReturnDuration(progress: number) {
  return Math.min(900, Math.max(420, progress * 9));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}
