"use client";

import { Button, Chip, Spinner } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";

import { useListWebhooksQuery } from "@/lib/features/openapi/openapi-api";

type Webhook = {
  id?: number;
  name?: string;
  url?: string;
  events?: string[];
  isActive?: boolean;
};

export function WebhooksPage() {
  const query = useListWebhooksQuery();
  const hooks = (Array.isArray(query.data) ? query.data : []) as Webhook[];

  return (
    <section
      aria-labelledby="webhooks-heading"
      className="mx-auto flex max-w-5xl flex-col gap-4 px-5 pt-8 pb-10"
    >
      <div className="flex flex-col gap-1">
        <h1 id="webhooks-heading" className="text-foreground text-2xl font-semibold">
          Webhooks
        </h1>
        <p className="text-muted text-sm">
          Delivery targets stored by the admin webhook API. This list does not create, test, or
          delete them.
        </p>
      </div>

      {query.isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : query.isError ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>Webhooks are unavailable</EmptyState.Title>
            <EmptyState.Description>The webhook list did not load.</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button onPress={() => query.refetch()} variant="secondary">
              Try again
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : hooks.length === 0 ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>No webhooks</EmptyState.Title>
            <EmptyState.Description>
              The admin API returned an empty webhook list.
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        <ul className="divide-separator border-separator divide-y rounded-2xl border">
          {hooks.map((hook) => (
            <li key={hook.id ?? hook.url} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{hook.name || "Webhook"}</span>
                <Chip color={hook.isActive ? "success" : "default"} size="sm" variant="soft">
                  {hook.isActive ? "Active" : "Paused"}
                </Chip>
              </div>
              <p className="text-muted truncate text-xs">{hook.url}</p>
              {hook.events && hook.events.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {hook.events.map((event) => (
                    <Chip key={event} size="sm" variant="tertiary">
                      {event}
                    </Chip>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
