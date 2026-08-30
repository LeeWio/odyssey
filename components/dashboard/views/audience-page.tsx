"use client";

import { ArrowRotateLeft, Envelope, Persons } from "@gravity-ui/icons";
import { EmptyState } from "@heroui-pro/react";
import { Button, Card, Chip, SearchField, Skeleton, Table, Typography } from "@heroui/react";
import { useDeferredValue, useState } from "react";

import {
  type SubscriberStatus,
  useGetNewsletterAudienceOverviewQuery,
  useGetNewsletterDeliveryDetailsQuery,
  useGetRecentNewsletterDeliveriesQuery,
  useGetNewsletterSubscribersQuery,
} from "@/lib/features/newsletter-audience";
import { useRelativeTime } from "@/lib/relative-time";

const PAGE_SIZE = 20;

const STATUS_FILTERS: Array<{ label: string; value?: SubscriberStatus }> = [
  { label: "All" },
  { label: "Active", value: "ACTIVE" },
  { label: "Pending", value: "PENDING" },
  { label: "Unsubscribed", value: "UNSUBSCRIBED" },
];

const STATUS_PRESENTATION: Record<
  SubscriberStatus,
  { color: "danger" | "success" | "warning"; label: string }
> = {
  ACTIVE: { color: "success", label: "Active" },
  PENDING: { color: "warning", label: "Pending" },
  UNSUBSCRIBED: { color: "danger", label: "Unsubscribed" },
};

const DELIVERY_STATUS_PRESENTATION: Record<
  string,
  { color: "accent" | "danger" | "success" | "warning"; label: string }
> = {
  QUEUING: { color: "accent", label: "Queueing" },
  PROCESSING: { color: "accent", label: "Processing" },
  QUEUED: { color: "accent", label: "Queued" },
  DELIVERED: { color: "success", label: "Delivered" },
  FAILED: { color: "danger", label: "Failed" },
  ABANDONED: { color: "danger", label: "Abandoned" },
  COMPLETED_WITH_FAILURES: { color: "warning", label: "Completed with failures" },
  SKIPPED: { color: "warning", label: "Skipped" },
};

function DeliveryStatus({ status }: { status: string }) {
  const presentation = DELIVERY_STATUS_PRESENTATION[status] ?? {
    color: "accent" as const,
    label: status,
  };

  return (
    <Chip color={presentation.color} size="sm" variant="soft">
      {presentation.label}
    </Chip>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="secondary">
      <Card.Header>
        <Card.Description>{label}</Card.Description>
        <Card.Title className="text-3xl tabular-nums">{value.toLocaleString("en-US")}</Card.Title>
      </Card.Header>
    </Card>
  );
}

function AudienceSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-28 rounded-2xl" />
      ))}
    </div>
  );
}

export function AudiencePage() {
  const formatRelativeTime = useRelativeTime();
  const [status, setStatus] = useState<SubscriberStatus | undefined>();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedDeliveryBatchId, setSelectedDeliveryBatchId] = useState<number>();
  const deferredQuery = useDeferredValue(query.trim());
  const overview = useGetNewsletterAudienceOverviewQuery();
  const deliveries = useGetRecentNewsletterDeliveriesQuery();
  const activeDeliveryBatchId = selectedDeliveryBatchId ?? deliveries.data?.[0]?.id;
  const deliveryDetails = useGetNewsletterDeliveryDetailsQuery(
    { batchId: activeDeliveryBatchId ?? 0, page: 0 },
    { skip: activeDeliveryBatchId === undefined }
  );
  const subscribers = useGetNewsletterSubscribersQuery({
    page,
    query: deferredQuery || undefined,
    size: PAGE_SIZE,
    status,
  });

  const selectStatus = (nextStatus?: SubscriberStatus) => {
    setStatus(nextStatus);
    setPage(0);
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(0);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 pt-8 pb-10">
      <header className="max-w-2xl">
        <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
          <Persons aria-hidden="true" className="size-4" /> Audience
        </div>
        <Typography type="h1" weight="bold" className="mt-4 text-3xl tracking-[-0.04em]">
          Newsletter audience
        </Typography>
        <Typography color="muted" type="body" className="mt-2">
          A clear view of who has opted in, who still needs to confirm, and where the list is
          growing.
        </Typography>
      </header>

      {overview.isLoading ? <AudienceSkeleton /> : null}
      {overview.data ? (
        <section aria-label="Audience overview" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Active subscribers" value={overview.data.activeSubscribers} />
          <MetricCard label="Awaiting confirmation" value={overview.data.pendingSubscribers} />
          <MetricCard label="Verified in 30 days" value={overview.data.verifiedLast30Days} />
          <MetricCard label="Unsubscribed" value={overview.data.unsubscribedSubscribers} />
        </section>
      ) : null}

      {deliveries.data?.length ? (
        <section className="flex flex-col gap-5" aria-labelledby="delivery-history-title">
          <div>
            <Typography id="delivery-history-title" type="h3" weight="semibold">
              Delivery history
            </Typography>
            <Typography color="muted" type="body-sm" className="mt-1">
              Mail is counted as delivered only after the consumer finishes sending it.
            </Typography>
          </div>
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Recent newsletter deliveries" className="min-w-[720px]">
                <Table.Header>
                  <Table.Column isRowHeader>Started</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Recipients</Table.Column>
                  <Table.Column>Delivered</Table.Column>
                  <Table.Column>Failed</Table.Column>
                  <Table.Column>Details</Table.Column>
                </Table.Header>
                <Table.Body>
                  {deliveries.data.map((delivery) => (
                    <Table.Row key={delivery.id}>
                      <Table.Cell>
                        <span className="text-sm">{formatRelativeTime(delivery.startedAt)}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <DeliveryStatus status={delivery.status} />
                      </Table.Cell>
                      <Table.Cell>
                        <span className="tabular-nums">
                          {delivery.recipientCount.toLocaleString("en-US")}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="tabular-nums">
                          {delivery.deliveredCount.toLocaleString("en-US")}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="tabular-nums">
                          {delivery.failedCount.toLocaleString("en-US")}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          size="sm"
                          variant={activeDeliveryBatchId === delivery.id ? "primary" : "ghost"}
                          onPress={() => setSelectedDeliveryBatchId(delivery.id)}
                        >
                          {activeDeliveryBatchId === delivery.id ? "Viewing" : "View"}
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>

          {deliveryDetails.isLoading ? (
            <Card variant="secondary">
              <Card.Content className="gap-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className="h-10 w-full rounded-lg" />
                ))}
              </Card.Content>
            </Card>
          ) : null}
          {deliveryDetails.data ? (
            <Card variant="secondary">
              <Card.Header>
                <Card.Title>Recipient outcomes</Card.Title>
                <Card.Description>
                  {deliveryDetails.data.total.toLocaleString("en-US")} recipients in this delivery.
                </Card.Description>
              </Card.Header>
              <Card.Content>
                <Table>
                  <Table.ScrollContainer>
                    <Table.Content
                      aria-label="Recipient delivery outcomes"
                      className="min-w-[620px]"
                    >
                      <Table.Header>
                        <Table.Column isRowHeader>Subscriber</Table.Column>
                        <Table.Column>Status</Table.Column>
                        <Table.Column>Attempts</Table.Column>
                        <Table.Column>Completed</Table.Column>
                        <Table.Column>Failure detail</Table.Column>
                      </Table.Header>
                      <Table.Body>
                        {deliveryDetails.data.list.map((delivery) => (
                          <Table.Row key={delivery.id}>
                            <Table.Cell>
                              <span className="font-medium tabular-nums">
                                #{delivery.subscriberId}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <DeliveryStatus status={delivery.status} />
                            </Table.Cell>
                            <Table.Cell>
                              <span className="tabular-nums">{delivery.attempts}</span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-muted text-sm">
                                {delivery.deliveredAt
                                  ? formatRelativeTime(delivery.deliveredAt)
                                  : "—"}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-muted block max-w-sm truncate text-sm">
                                {delivery.lastError ?? "—"}
                              </span>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              </Card.Content>
            </Card>
          ) : null}
        </section>
      ) : null}

      <section className="flex flex-col gap-5" aria-labelledby="subscriber-list-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Typography id="subscriber-list-title" type="h3" weight="semibold">
              Subscribers
            </Typography>
            <Typography color="muted" type="body-sm" className="mt-1">
              Subscription tokens are never displayed here.
            </Typography>
          </div>
          <SearchField
            className="w-full sm:w-72"
            name="subscriber-search"
            value={query}
            onChange={updateQuery}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search email" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Subscriber status filters">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.label}
              size="sm"
              variant={status === filter.value ? "primary" : "ghost"}
              onPress={() => selectStatus(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {subscribers.isLoading ? (
          <Card variant="secondary">
            <Card.Content className="gap-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-lg" />
              ))}
            </Card.Content>
          </Card>
        ) : null}
        {subscribers.isError ? (
          <EmptyState className="bg-surface-secondary rounded-2xl" size="md">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Envelope aria-hidden="true" />
              </EmptyState.Media>
              <EmptyState.Title>Audience is unavailable</EmptyState.Title>
              <EmptyState.Description>
                Try loading this list again in a moment.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button variant="outline" onPress={() => subscribers.refetch()}>
                <ArrowRotateLeft aria-hidden="true" className="size-4" /> Refresh
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : null}
        {subscribers.data ? (
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Newsletter subscribers" className="min-w-[660px]">
                <Table.Header>
                  <Table.Column isRowHeader>Email</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Subscribed</Table.Column>
                  <Table.Column>Verified</Table.Column>
                </Table.Header>
                <Table.Body>
                  {subscribers.data.list.map((subscriber) => {
                    const presentation = STATUS_PRESENTATION[subscriber.status];
                    return (
                      <Table.Row key={subscriber.id}>
                        <Table.Cell>
                          <span className="font-medium">{subscriber.email}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <Chip color={presentation.color} size="sm" variant="soft">
                            {presentation.label}
                          </Chip>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-muted text-sm">
                            {formatRelativeTime(subscriber.createdAt)}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-muted text-sm">
                            {subscriber.verifiedAt
                              ? formatRelativeTime(subscriber.verifiedAt)
                              : "—"}
                          </span>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
            <Table.Footer className="justify-between gap-4">
              <Typography color="muted" type="body-xs" className="tabular-nums">
                {subscribers.data.total.toLocaleString("en-US")} subscribers
              </Typography>
              <div className="flex items-center gap-2">
                <Button
                  isDisabled={page === 0}
                  size="sm"
                  variant="ghost"
                  onPress={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Typography color="muted" type="body-xs" className="tabular-nums">
                  {subscribers.data.page} / {Math.max(subscribers.data.totalPages, 1)}
                </Typography>
                <Button
                  isDisabled={page + 1 >= subscribers.data.totalPages}
                  size="sm"
                  variant="ghost"
                  onPress={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </Table.Footer>
          </Table>
        ) : null}
      </section>
    </div>
  );
}
