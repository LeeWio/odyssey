"use client";

import { Icon } from "@iconify/react";

import { Card, Chip, Link } from "@heroui/react";
import { Timeline } from "@heroui-pro/react";
import { useLocale, useTranslations } from "next-intl";
import { formatActivityPeriod } from "./github-activity-format";

import type { GitHubActivityResponse, GitHubRepositoryActivity } from "@/lib/features/github";

const formatDate = (value: string | null, locale: string) =>
  value
    ? new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(value))
    : undefined;

const mapRepositories = (
  repositories: GitHubRepositoryActivity[],
  label: (count: number) => string
) =>
  repositories.map((repository) => ({
    commits: label(repository.count),
    href: repository.url,
    name: repository.nameWithOwner,
  }));

export function RepositoryActivity({ activity }: { activity: GitHubActivityResponse }) {
  const locale = useLocale();
  const t = useTranslations("Home.lately");
  const repositoryActivity = [
    {
      actor: activity.actor,
      icon: "gravity-ui:code-commits",
      repositories: mapRepositories(activity.commitRepositories, (count) =>
        t("activityCommitCount", { count })
      ),
      status: "success" as const,
      title: t("activityCommittedAcross", { count: activity.commitRepositories.length }),
    },
    ...(activity.latestMergedPullRequest
      ? [
          {
            actor: activity.actor,
            date: formatDate(activity.latestMergedPullRequest.mergedAt, locale),
            icon: "gravity-ui:code-pull-request",
            pullRequest: {
              additions: activity.latestMergedPullRequest.additions,
              comments: t("activityCommentCount", {
                count: activity.latestMergedPullRequest.commentCount,
              }),
              deletions: activity.latestMergedPullRequest.deletions,
              description: activity.latestMergedPullRequest.description,
              title: activity.latestMergedPullRequest.title,
            },
            status: "current" as const,
            title: t("activityMergedPullRequest", {
              repository: activity.latestMergedPullRequest.repositoryNameWithOwner,
            }),
          },
        ]
      : []),
    {
      actor: activity.actor,
      icon: "gravity-ui:circle-plus",
      issueSummary: {
        closed: activity.closedIssues,
        open: activity.openIssues,
        total: activity.totalIssues,
      },
      repositories: mapRepositories(activity.issueRepositories, (count) =>
        t("activityIssueCount", { count })
      ),
      status: "warning" as const,
      title: t("activityOpenedIssues", {
        count: activity.totalIssues,
        repositories: activity.issueRepositories.length,
      }),
    },
    {
      actor: activity.actor,
      date: formatDate(activity.latestReviewAt, locale),
      icon: "gravity-ui:eye",
      repositories: mapRepositories(activity.reviewRepositories, (count) =>
        t("activityReviewCount", { count })
      ),
      status: "default" as const,
      title: t("activityReviewedPullRequests", {
        count: activity.totalReviews,
        repositories: activity.reviewRepositories.length,
      }),
    },
  ] as const;

  return (
    <div className="w-full max-w-155 min-w-0">
      <div className="mb-4 flex items-center gap-4">
        <h3 className="text-foreground m-0 shrink-0 text-sm font-semibold">
          {formatActivityPeriod(activity.month, locale, activity.periodLabel)}
        </h3>
        <div className="bg-separator h-px flex-1" />
      </div>

      <Timeline size="sm">
        {repositoryActivity.map((event) => {
          return (
            <Timeline.Item key={event.title} status={event.status}>
              <Timeline.Marker aria-hidden="true">
                <Icon icon={event.icon} />
              </Timeline.Marker>
              <Timeline.Content className="gap-2.5">
                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <h3 className="text-foreground m-0 text-sm leading-5 font-medium">
                      {event.title}
                    </h3>
                    <p className="text-muted m-0 text-xs leading-5">{event.actor}</p>
                  </div>
                  {"date" in event && event.date ? (
                    <time className="text-muted shrink-0 text-xs leading-5">{event.date}</time>
                  ) : null}
                </div>

                {"repositories" in event ? (
                  <div className="grid gap-1">
                    {event.repositories.map((repository) => (
                      <div
                        key={repository.name}
                        className="grid min-w-0 grid-cols-1 gap-0.5 sm:grid-cols-[minmax(0,200px)_auto] sm:items-center sm:gap-3"
                      >
                        <Link className="truncate text-xs" href={repository.href}>
                          {repository.name}
                        </Link>
                        <span className="text-muted text-xs">{repository.commits}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {"pullRequest" in event ? (
                  <Card className="w-full min-w-0 p-3">
                    <Card.Header className="gap-2.5 p-0">
                      <Icon
                        icon="gravity-ui:code-pull-request-check"
                        className="text-accent size-4 shrink-0"
                      />
                      <div className="min-w-0">
                        <Card.Title className="text-sm leading-5">
                          {event.pullRequest.title}
                        </Card.Title>
                        <Card.Description className="mt-1 text-xs leading-5">
                          {event.pullRequest.description}
                        </Card.Description>
                      </div>
                    </Card.Header>
                    <Card.Footer className="mt-3 flex flex-wrap items-center gap-2 p-0">
                      <Chip color="success" size="sm" variant="soft">
                        +{event.pullRequest.additions}
                      </Chip>
                      <Chip color="danger" size="sm" variant="soft">
                        -{event.pullRequest.deletions}
                      </Chip>
                      <div aria-hidden="true" className="flex items-center gap-0.5">
                        <span className="bg-success size-2" />
                        <span className="bg-success size-2" />
                        <span className="bg-success size-2" />
                        <span className="bg-danger size-2" />
                        <span className="bg-separator size-2" />
                      </div>
                      <span className="text-muted text-xs">- {event.pullRequest.comments}</span>
                    </Card.Footer>
                  </Card>
                ) : null}

                {"issueSummary" in event ? (
                  <div className="flex flex-wrap gap-2">
                    <Chip color="success" size="sm" variant="soft">
                      {t("activityIssueOpened", { count: event.issueSummary.total })}
                    </Chip>
                    <Chip color="accent" size="sm" variant="soft">
                      {t("activityIssueClosed", { count: event.issueSummary.closed })}
                    </Chip>
                    <Chip color="danger" size="sm" variant="soft">
                      {t("activityIssueOpen", { count: event.issueSummary.open })}
                    </Chip>
                  </div>
                ) : null}
              </Timeline.Content>
            </Timeline.Item>
          );
        })}
      </Timeline>
    </div>
  );
}
