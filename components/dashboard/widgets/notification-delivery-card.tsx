"use client";

import { Button, Card, Chip } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { useRouter } from "next/navigation";

import { useGetNotificationDeliveryOverviewQuery } from "@/lib/features/notification/notification-delivery-api";

const DELIVERY_LABELS = {
  QUEUED: "Queued",
  SENDING: "Sending",
  FAILED: "Failed",
  DELIVERED: "Delivered",
  ABANDONED: "Abandoned",
} as const;

export function NotificationDeliveryCard() {
  const router = useRouter();
  const query = useGetNotificationDeliveryOverviewQuery(undefined, {
    pollingInterval: 30_000,
    refetchOnFocus: true,
  });
  const counts = query.data?.counts ?? {};
  const failed = (counts.FAILED ?? 0) + (counts.ABANDONED ?? 0);

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-col items-start gap-2">
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            <Card.Title className="text-base">Notification delivery</Card.Title>
            <Card.Description>Operational status for account email delivery.</Card.Description>
          </div>
          {query.data ? (
            <Chip color={failed > 0 ? "warning" : "success"} size="sm" variant="soft">
              {failed > 0 ? `${failed} need attention` : "Healthy"}
            </Chip>
          ) : null}
        </div>
      </Card.Header>
      <Card.Content>
        {query.isLoading ? (
          <p className="text-muted text-sm">Loading delivery status.</p>
        ) : query.isError || !query.data ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>Delivery status is unavailable</EmptyState.Title>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => query.refetch()} size="sm" variant="secondary">
                Try again
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label="Pending" value={query.data.pending} />
              <Stat label="Overdue" value={query.data.overdue} />
              <Stat label="Failed" value={failed} />
              <Stat label="Delivered" value={counts.DELIVERED ?? 0} />
            </dl>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DELIVERY_LABELS).map(([status, label]) => (
                <Chip key={status} size="sm" variant="soft">
                  {label}: {counts[status] ?? 0}
                </Chip>
              ))}
            </div>
            <Button
              className="self-start"
              size="sm"
              variant="ghost"
              onPress={() => router.push("/notifications")}
            >
              Open notifications
            </Button>
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
