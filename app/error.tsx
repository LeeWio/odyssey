"use client";

import { Button } from "@heroui/react";
import { useEffect } from "react";
import { RouteLinkButton, RouteState } from "@/components/system/route-state";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service

    console.error(error);
  }, [error]);

  return (
    <RouteState
      kind="error"
      title="Something went wrong."
      description="The page could not finish loading. Try again, or return home if the problem continues."
      actions={
        <>
          <Button onPress={reset}>Try again</Button>
          <RouteLinkButton href="/" variant="secondary">
            Back home
          </RouteLinkButton>
        </>
      }
    />
  );
}
