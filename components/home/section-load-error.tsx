"use client";

import { Alert, Button } from "@heroui/react";

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
  return (
    <Alert role="status" status="warning" className="mb-4" aria-busy={isRetrying}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          {hasContent ? `Couldn't refresh ${subject}.` : `Couldn't load ${subject}.`}
        </Alert.Title>
        <Alert.Description>
          {hasContent ? "You can still browse the items below." : "Please try again in a moment."}
        </Alert.Description>
        <Button
          aria-label={`Retry loading ${subject}`}
          className="mt-3 self-start"
          size="sm"
          variant="secondary"
          isPending={isRetrying}
          isDisabled={isRetrying}
          onPress={onRetry}
        >
          {isRetrying ? "Trying again…" : "Try again"}
        </Button>
      </Alert.Content>
    </Alert>
  );
}
