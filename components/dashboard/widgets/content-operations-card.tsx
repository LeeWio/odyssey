"use client";

import { Button, Card, Chip } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";

import { useGetContentOperationsOverviewQuery } from "@/lib/features/dashboard";

const SEVERITY_COLOR = {
  CRITICAL: "danger",
  INFO: "default",
  WARNING: "warning",
} as const;

export function ContentOperationsCard() {
  const { data, isError, isLoading, refetch } = useGetContentOperationsOverviewQuery();
  const summary = data?.summary;
  const attention = data?.attentionItems ?? [];

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-col items-start gap-2">
        <Card.Title className="text-base">Content operations</Card.Title>
        <Card.Description>Publishing, comments, and subscribers right now.</Card.Description>
      </Card.Header>
      <Card.Content>
        {isLoading ? (
          <p className="text-muted text-sm">Loading operations.</p>
        ) : isError ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>Operations are unavailable</EmptyState.Title>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => refetch()} size="sm" variant="secondary">
                Try again
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label="Published" value={summary?.publishedPosts ?? 0} />
              <Stat label="Moments" value={summary?.moments ?? 0} />
              <Stat label="Comments waiting" value={summary?.pendingComments ?? 0} />
              <Stat label="Subscribers" value={summary?.activeSubscribers ?? 0} />
            </dl>
            {attention.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {attention.slice(0, 4).map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="text-muted text-xs">{item.description}</p>
                    </div>
                    <Chip color={SEVERITY_COLOR[item.severity]} size="sm" variant="soft">
                      {item.count}
                    </Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted text-sm">Nothing needs attention.</p>
            )}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="tabular-nums">{value.toLocaleString("en-US")}</dd>
    </div>
  );
}
