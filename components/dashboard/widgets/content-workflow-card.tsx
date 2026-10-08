"use client";

import { Button, Card, Chip } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";

import { useGetContentWorkflowQuery } from "@/lib/features/dashboard";

const PRIORITY_COLOR = {
  HIGH: "danger",
  LOW: "default",
  MEDIUM: "warning",
} as const;

export function ContentWorkflowCard() {
  const { data, isError, isLoading, refetch } = useGetContentWorkflowQuery();
  const summary = data?.summary;
  const items = data?.items ?? [];

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-col items-start gap-2">
        <Card.Title className="text-base">Editorial queue</Card.Title>
        <Card.Description>Posts waiting on a publishing decision.</Card.Description>
        {summary ? (
          <div className="flex flex-wrap gap-2">
            <Chip size="sm" variant="soft">
              Review {summary.needsReview}
            </Chip>
            <Chip size="sm" variant="soft">
              Scheduled {summary.scheduled}
            </Chip>
            <Chip size="sm" variant="soft">
              Drafts {summary.drafts}
            </Chip>
            <Chip size="sm" variant="soft">
              Rejected {summary.rejected}
            </Chip>
          </div>
        ) : null}
      </Card.Header>
      <Card.Content>
        {isLoading ? (
          <p className="text-muted text-sm">Loading the queue.</p>
        ) : isError ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>Queue is unavailable</EmptyState.Title>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => refetch()} size="sm" variant="secondary">
                Try again
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : items.length === 0 ? (
          <p className="text-muted text-sm">Nothing is waiting.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.slice(0, 6).map((item) => (
              <li key={item.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-medium">{item.title}</span>
                  <Chip color={PRIORITY_COLOR[item.priority]} size="sm" variant="soft">
                    {item.priority}
                  </Chip>
                </div>
                <p className="text-muted text-xs">
                  {item.action}
                  {item.description ? ` · ${item.description}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card.Content>
    </Card>
  );
}
