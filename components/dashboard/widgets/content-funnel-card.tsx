"use client";

import { Button, Card, ProgressBar } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";

import { useGetContentFunnelQuery } from "@/lib/features/dashboard";

export function ContentFunnelCard() {
  const { data, isError, isLoading, refetch } = useGetContentFunnelQuery(30);
  const steps = data
    ? [
        { count: data.impressions, label: "Impressions" },
        { count: data.clicks, label: "Clicks" },
        { count: data.readers25Percent, label: "Read 25%" },
        { count: data.readers50Percent, label: "Read 50%" },
        { count: data.readers75Percent, label: "Read 75%" },
        { count: data.completedReads, label: "Finished" },
      ]
    : [];
  const widest = Math.max(1, ...steps.map((step) => step.count));

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-col items-start gap-1">
        <Card.Title className="text-base">Content funnel</Card.Title>
        <Card.Description>
          Last 30 days. Click-through {formatRate(data?.clickThroughRate)} · completion{" "}
          {formatRate(data?.completionRate)}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {isLoading ? (
          <p className="text-muted text-sm">Loading the funnel.</p>
        ) : isError ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>Funnel is unavailable</EmptyState.Title>
              <EmptyState.Description>The content funnel request failed.</EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => refetch()} size="sm" variant="secondary">
                Try again
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {steps.map((step) => (
              <li key={step.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{step.label}</span>
                  <span className="tabular-nums">{step.count.toLocaleString("en-US")}</span>
                </div>
                <ProgressBar aria-label={step.label} maxValue={widest} size="sm" value={step.count}>
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              </li>
            ))}
            <li className="text-muted flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>Likes {data?.likes.toLocaleString("en-US")}</span>
              <span>Favorites {data?.favorites.toLocaleString("en-US")}</span>
              <span>Subscriptions {data?.verifiedSubscriptions.toLocaleString("en-US")}</span>
              <span>Returning {data?.returningVisitors.toLocaleString("en-US")}</span>
            </li>
          </ul>
        )}
      </Card.Content>
    </Card>
  );
}

function formatRate(value: number | undefined) {
  return `${(value ?? 0).toFixed(1)}%`;
}
