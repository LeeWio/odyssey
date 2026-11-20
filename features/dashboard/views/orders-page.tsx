"use client";

import { Button } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";

export function OrdersPage({ onOpenAudience }: { onOpenAudience: () => void }) {
  return (
    <section
      aria-labelledby="orders-heading"
      className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-5 py-16"
    >
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.Title id="orders-heading">No order ledger</EmptyState.Title>
          <EmptyState.Description>
            Nexus does not store customer orders. Subscriber counts and newsletter deliveries live
            with the audience.
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button onPress={onOpenAudience} variant="secondary">
            Open audience
          </Button>
        </EmptyState.Content>
      </EmptyState>
    </section>
  );
}
