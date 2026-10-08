"use client";

import { EmptyState, NumberValue } from "@heroui-pro/react";
import { Button, Card, Link, Skeleton, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { PageContainer } from "@/components/layout/page-container";
import { TAXONOMY_GRID } from "../components/grid-classes";

import { useRetrieveFacetsQuery } from "@/lib/features/openapi";
import { useGetPublicTagsQuery } from "@/lib/features/tag";

export default function TagsPage() {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const tags = useGetPublicTagsQuery();
  const facets = useRetrieveFacetsQuery();
  const counts = new Map(
    (facets.data?.tags ?? []).flatMap((facet) =>
      typeof facet.id === "number" && typeof facet.count === "number"
        ? [[facet.id, facet.count] as const]
        : []
    )
  );
  const list = [...(tags.data ?? [])]
    .filter((tag) => (counts.get(tag.id) ?? 0) > 0)
    .sort(
      (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.name.localeCompare(b.name)
    );
  const isLoading = tags.isLoading || facets.isLoading;
  const isError = tags.isError || facets.isError;

  return (
    <PageContainer className="flex flex-col gap-8 pt-28 pb-24 lg:pt-32">
      <header className="flex max-w-2xl flex-col gap-2">
        <Link className="text-sm no-underline" href="/single">
          {t("title")}
        </Link>
        <Typography
          type="h1"
          weight="semibold"
          className="tracking-normal text-balance break-words"
        >
          {t("tagsTitle")}
        </Typography>
        <Typography color="muted">{t("tagsDescription")}</Typography>
      </header>

      {isLoading ? (
        <div className={TAXONOMY_GRID} aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("latestFailed")}</EmptyState.Title>
            <EmptyState.Description>{t("latestFailedHint")}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                void tags.refetch();
                void facets.refetch();
              }}
            >
              {t("tryAgain")}
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : list.length === 0 ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("emptyTitle")}</EmptyState.Title>
            <EmptyState.Description>{t("emptyDescription")}</EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        <ul className={TAXONOMY_GRID} data-testid="taxonomy-grid">
          {list.map((tag) => (
            <li key={tag.id} className="min-w-0">
              <Card className="h-full">
                <Card.Header>
                  <Card.Title>
                    <Link
                      className="text-foreground block max-w-full wrap-anywhere no-underline"
                      href={`/single/tags/${encodeURIComponent(tag.slug)}`}
                    >
                      {tag.name}
                    </Link>
                  </Card.Title>
                  <Card.Description>
                    <NumberValue locale={locale} value={counts.get(tag.id) ?? 0}>
                      {(formatted) => t("categoryEssays", { count: formatted })}
                    </NumberValue>
                  </Card.Description>
                </Card.Header>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
