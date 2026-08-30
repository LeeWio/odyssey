"use client";

import {
  ArrowRight,
  Calendar,
  Check,
  CircleExclamation,
  Clock,
  FileText,
  ArrowsRotateLeft,
  Sparkles,
} from "@gravity-ui/icons";
import { Button, Card, Chip, Link, Skeleton, Typography } from "@heroui/react";
import { EmptyState, KPI, KPIGroup, Timeline, Widget } from "@heroui-pro/react";
import {
  type ContentOperationsOverview,
  type ContentWorkflowResponse,
  useGetContentOperationsOverviewQuery,
  useGetContentWorkflowQuery,
} from "@/lib/features/dashboard";

const STATUS_LABELS: Record<string, string> = {
  ARCHIVED: "Archived",
  DRAFT: "Draft",
  PENDING_REVIEW: "In review",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  SCHEDULED: "Scheduled",
};

const STATUS_COLORS: Record<string, "accent" | "success" | "warning" | "danger" | "default"> = {
  ARCHIVED: "default",
  DRAFT: "accent",
  PENDING_REVIEW: "warning",
  PUBLISHED: "success",
  REJECTED: "danger",
  SCHEDULED: "accent",
};

export function DashboardPage() {
  const { data, isError, isFetching, isLoading, refetch } = useGetContentOperationsOverviewQuery();
  const workflow = useGetContentWorkflowQuery();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 pt-8 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Chip className="w-fit" color="accent" size="sm" variant="soft">
            Content workspace
          </Chip>
          <div>
            <Typography type="h1" weight="bold" className="text-3xl tracking-[-0.04em]">
              Content operations
            </Typography>
            <Typography type="body" color="muted" className="mt-2 max-w-xl">
              A clear view of what is published, what is moving, and what needs your attention.
            </Typography>
          </div>
        </div>
        <Button
          isPending={isFetching && !isLoading}
          onPress={() => void refetch()}
          variant="tertiary"
        >
          <ArrowsRotateLeft className="size-4" />
          Refresh
        </Button>
      </header>

      {isError ? (
        <EmptyState className="bg-surface-secondary w-full rounded-2xl">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <CircleExclamation />
            </EmptyState.Media>
            <EmptyState.Title>Content overview is unavailable</EmptyState.Title>
            <EmptyState.Description>
              We could not load the latest workspace snapshot. Your content is safe.
            </EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button onPress={() => void refetch()} variant="secondary">
              Try again
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        <>
          <SummaryWidget data={data?.summary} isLoading={isLoading} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_1.4fr]">
            <WorkflowWidget
              data={workflow.data}
              isError={workflow.isError}
              isLoading={workflow.isLoading}
              onRetry={() => void workflow.refetch()}
            />
            <EditorialQueueWidget items={data?.editorialQueue ?? []} isLoading={isLoading} />
          </div>
          <ActivityWidget items={data?.recentActivity ?? []} isLoading={isLoading} />
        </>
      )}
    </div>
  );
}

function SummaryWidget({
  data,
  isLoading,
}: {
  data?: ContentOperationsOverview["summary"];
  isLoading: boolean;
}) {
  const stats = [
    {
      label: "Published",
      value: data?.publishedPosts ?? 0,
      icon: FileText,
      status: "success" as const,
    },
    { label: "Drafts", value: data?.drafts ?? 0, icon: Clock, status: "warning" as const },
    { label: "Scheduled", value: data?.scheduled ?? 0, icon: Calendar, status: "success" as const },
    { label: "Moments", value: data?.moments ?? 0, icon: Sparkles, status: "warning" as const },
    {
      label: "Needs attention",
      value: (data?.pendingComments ?? 0) + (data?.pendingReview ?? 0),
      icon: CircleExclamation,
      status: "danger" as const,
    },
  ];

  return (
    <Widget>
      <Widget.Header>
        <div>
          <Widget.Title>Content pulse</Widget.Title>
          <Widget.Description>Current workspace state</Widget.Description>
        </div>
      </Widget.Header>
      <Widget.Content>
        <KPIGroup className="bg-transparent shadow-none">
          {stats.map((stat, index) => (
            <div className="contents" key={stat.label}>
              {index > 0 ? <KPIGroup.Separator /> : null}
              <KPI>
                <KPI.Header className="flex-row items-center justify-between">
                  <KPI.Title>{stat.label}</KPI.Title>
                  <KPI.Icon aria-hidden="true" status={stat.status}>
                    <stat.icon />
                  </KPI.Icon>
                </KPI.Header>
                <KPI.Content>
                  {isLoading ? (
                    <Skeleton className="h-8 w-14 rounded-lg" />
                  ) : (
                    <KPI.Value value={stat.value} />
                  )}
                </KPI.Content>
              </KPI>
            </div>
          ))}
        </KPIGroup>
      </Widget.Content>
    </Widget>
  );
}

function WorkflowWidget({
  data,
  isError,
  isLoading,
  onRetry,
}: {
  data?: ContentWorkflowResponse;
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
}) {
  return (
    <Widget>
      <Widget.Header>
        <div>
          <Widget.Title>Next actions</Widget.Title>
          <Widget.Description>Keep the editorial loop moving</Widget.Description>
        </div>
        <Chip color="accent" size="sm" variant="soft">
          {data?.summary.total ?? 0} open
        </Chip>
      </Widget.Header>
      <Widget.Content className="flex flex-col gap-3">
        {isLoading ? (
          <ListSkeleton count={4} />
        ) : isError ? (
          <EmptyState size="sm">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <CircleExclamation />
              </EmptyState.Media>
              <EmptyState.Title>Workflow is unavailable</EmptyState.Title>
              <EmptyState.Description>
                Try again to refresh the next actions.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={onRetry} size="sm" variant="secondary">
                Try again
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : data?.items.length === 0 ? (
          <EmptyState size="sm">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Check />
              </EmptyState.Media>
              <EmptyState.Title>Nothing is waiting</EmptyState.Title>
              <EmptyState.Description>
                Your publishing workflow is clear for now.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        ) : (
          data?.items.map((item) => (
            <Link className="group no-underline" href={item.href} key={item.id}>
              <Card className="group-hover:bg-surface-secondary transition-colors">
                <Card.Header className="flex-row items-start gap-3">
                  <div className="bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Card.Title className="truncate text-sm">{item.title}</Card.Title>
                      <Chip
                        color={
                          item.priority === "HIGH"
                            ? "danger"
                            : item.priority === "MEDIUM"
                              ? "warning"
                              : "default"
                        }
                        size="sm"
                        variant="soft"
                      >
                        {item.action}
                      </Chip>
                    </div>
                    <Card.Description className="mt-1 line-clamp-2">
                      {item.description}
                    </Card.Description>
                  </div>
                </Card.Header>
              </Card>
            </Link>
          ))
        )}
      </Widget.Content>
    </Widget>
  );
}

function EditorialQueueWidget({
  items,
  isLoading,
}: {
  items: ContentOperationsOverview["editorialQueue"];
  isLoading: boolean;
}) {
  return (
    <Widget>
      <Widget.Header>
        <div>
          <Widget.Title>Editorial queue</Widget.Title>
          <Widget.Description>Recently updated content</Widget.Description>
        </div>
        <Link className="text-sm no-underline" href="/posts">
          View all <ArrowRight className="ml-1 inline size-3.5" />
        </Link>
      </Widget.Header>
      <Widget.Content className="flex flex-col gap-2">
        {isLoading ? (
          <ListSkeleton count={5} />
        ) : items.length === 0 ? (
          <EmptyState size="sm">
            <EmptyState.Header>
              <EmptyState.Title>No content in the queue</EmptyState.Title>
              <EmptyState.Description>
                New drafts and updates will appear here.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        ) : (
          items.map((item) => (
            <Link
              className="group hover:bg-surface-secondary flex items-center gap-3 rounded-xl p-2 no-underline transition-colors"
              href={item.href}
              key={item.id}
            >
              <div className="bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-lg">
                {item.type === "MOMENT" ? (
                  <Sparkles className="size-4" />
                ) : (
                  <FileText className="size-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-muted mt-1 truncate text-xs">
                  {item.excerpt || "No summary yet"}
                </p>
              </div>
              {item.status ? (
                <Chip color={STATUS_COLORS[item.status] ?? "default"} size="sm" variant="soft">
                  {STATUS_LABELS[item.status] ?? item.status}
                </Chip>
              ) : null}
            </Link>
          ))
        )}
      </Widget.Content>
    </Widget>
  );
}

function ActivityWidget({
  items,
  isLoading,
}: {
  items: ContentOperationsOverview["recentActivity"];
  isLoading: boolean;
}) {
  return (
    <Widget>
      <Widget.Header>
        <div>
          <Widget.Title>Recent activity</Widget.Title>
          <Widget.Description>The latest movement across your content</Widget.Description>
        </div>
      </Widget.Header>
      <Widget.Content>
        {isLoading ? (
          <ListSkeleton count={4} />
        ) : items.length === 0 ? (
          <EmptyState size="sm">
            <EmptyState.Header>
              <EmptyState.Title>No recent activity</EmptyState.Title>
              <EmptyState.Description>
                Your workspace history will appear here.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        ) : (
          <Timeline size="sm">
            {items.map((item) => (
              <Timeline.Item key={item.id} status={item.type === "MOMENT" ? "current" : "success"}>
                <Timeline.Marker aria-hidden="true">
                  {item.type === "MOMENT" ? <Sparkles /> : <FileText />}
                </Timeline.Marker>
                <Timeline.Content className="gap-1">
                  <Link className="text-sm no-underline" href={item.href}>
                    {item.title}
                  </Link>
                  <Typography color="muted" type="body-xs">
                    {item.type === "MOMENT" ? "Moment" : "Post"} · {formatDate(item.occurredAt)}
                  </Typography>
                </Timeline.Content>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Widget.Content>
    </Widget>
  );
}

function ListSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, index) => (
        <div className="flex items-center gap-3" key={index}>
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "recently";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(value));
}
