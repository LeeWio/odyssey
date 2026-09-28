"use client";

import { EmptyState, NumberValue } from "@heroui-pro/react";
import { Button, Card, Link, Skeleton, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import { collectMomentTopics, usePublishedMoments } from "@/lib/features/moment";

export default function MomentTopicsPage() {
  const t = useTranslations("Moments");
  const locale = useLocale();
  const catalog = usePublishedMoments();
  const topics = collectMomentTopics(catalog.moments);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-24 sm:px-10 sm:py-32">
      <header className="flex max-w-2xl flex-col gap-2">
        <Link className="text-sm no-underline" href="/moments">
          {t("backToMoments")}
        </Link>
        <Typography type="h1" weight="semibold">
          {t("topicsTitle")}
        </Typography>
        <Typography color="muted">{t("topicsDescription")}</Typography>
      </header>

      {catalog.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : catalog.isError ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("unavailable")}</EmptyState.Title>
            <EmptyState.Description>{t("unavailableHint")}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button size="sm" variant="secondary" onPress={catalog.retry}>
              {t("tryAgain")}
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : topics.length === 0 ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("empty")}</EmptyState.Title>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <li key={topic.slug}>
              <Card className="h-full">
                <Card.Header>
                  <Card.Title>
                    <Link
                      className="text-foreground no-underline"
                      href={`/moments/topics/${encodeURIComponent(topic.slug)}`}
                    >
                      #{topic.slug}
                    </Link>
                  </Card.Title>
                  <Card.Description>
                    <NumberValue locale={locale} value={topic.count}>
                      {(formatted) => t("topicNotes", { count: formatted })}
                    </NumberValue>
                  </Card.Description>
                </Card.Header>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
