"use client";

import { Alert, Button } from "@heroui/react";
import { useTranslations } from "next-intl";

export function SectionLoadError({
  subject,
  isRetrying,
  hasContent,
  onRetry,
}: {
  subject: "writing" | "moments";
  isRetrying: boolean;
  hasContent: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations("Home");
  const subjectLabel = t(`errors.${subject}`);

  return (
    <Alert role="status" status="warning" className="mb-4" aria-busy={isRetrying}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          {hasContent
            ? t("errors.refresh", { subject: subjectLabel })
            : t("errors.load", { subject: subjectLabel })}
        </Alert.Title>
        <Alert.Description>
          {hasContent ? t("errors.browseBelow") : t("errors.tryLater")}
        </Alert.Description>
        <Button
          aria-label={t("errors.retryLabel", { subject: subjectLabel })}
          className="mt-3 self-start"
          size="sm"
          variant="secondary"
          isPending={isRetrying}
          isDisabled={isRetrying}
          onPress={onRetry}
        >
          {isRetrying ? t("errors.trying") : t("errors.retry")}
        </Button>
      </Alert.Content>
    </Alert>
  );
}
