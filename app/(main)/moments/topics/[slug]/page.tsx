"use client";

import { EmptyState, NumberValue } from "@heroui-pro/react";
import { Button, Link, Skeleton, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";

import { MomentCard } from "@/features/moment/components/card";
import { usePublishedMoments } from "@/lib/features/moment";

export default function MomentTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const topic = decodeURIComponent(slug);
  const t = useTranslations("Moments");
  const locale = useLocale();
  const catalog = usePublishedMoments();
  const moments = catalog.moments.filter((moment) =>
    moment.topics.some((item) => item.slug === topic)
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-24 sm:px-10 sm:py-32">
      <header className="flex flex-col gap-2">
        <Link className="text-sm no-underline" href="/moments/topics">
          {t("allTopics")}
        </Link>
        <Typography type="h1" weight="semibold">
          #{topic}
        </Typography>
        <p className="text-muted text-sm tabular-nums">
          <NumberValue locale={locale} value={moments.length}>
            {(formatted) => t("topicNotes", { count: formatted })}
          </NumberValue>
        </p>
      </header>

      {catalog.isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-2xl" />
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
      ) : moments.length === 0 ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("topicMissing")}</EmptyState.Title>
          </EmptyState.Header>
          <EmptyState.Content>
            <Link href="/moments/topics">{t("allTopics")}</Link>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {moments.map((moment) => (
            <MomentCard key={moment.id} moment={moment} />
          ))}
        </div>
      )}
    </div>
  );
}
