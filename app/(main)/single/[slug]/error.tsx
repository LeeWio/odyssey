"use client";

import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";

export default function ArticleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Article");

  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold">{t("loadFailedTitle")}</h1>
        <p className="text-muted text-sm">{t("loadFailedDescription")}</p>
        <Button size="sm" variant="secondary" onPress={reset}>
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
}
