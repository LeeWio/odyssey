"use client";

import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { RouteLinkButton, RouteState } from "@/components/system/route-state";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("Errors");

  useEffect(() => {
    // Log the error to an error reporting service

    console.error(error);
  }, [error]);

  return (
    <RouteState
      kind="error"
      title={t("errorTitle")}
      description={t("errorDescription")}
      actions={
        <>
          <Button onPress={reset}>{t("tryAgain")}</Button>
          <RouteLinkButton href="/" variant="secondary">
            {t("backHome")}
          </RouteLinkButton>
        </>
      }
    />
  );
}
