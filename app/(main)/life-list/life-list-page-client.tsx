"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button, Skeleton, Typography } from "@heroui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeader } from "@/components/layout/page-header";
import { ProgressMeter, StatusMeter } from "@/components/life-list/progress-meter";
import {
  useGetPublicLifeListCategoriesQuery,
  useGetPublicLifeListQuery,
  type LifeListCategoryResponse,
  type LifeListPageResponse,
  type LifeListStatus,
} from "@/lib/features/life-list";

const STATUSES: LifeListStatus[] = ["planned", "in_progress", "completed", "abandoned"];

function FilterButton({
  active,
  onPress,
  children,
}: {
  active: boolean;
  onPress: () => void;
  children: string;
}) {
  return (
    <Button
      size="sm"
      variant={active ? "primary" : "tertiary"}
      onPress={onPress}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}

export function LifeListPageClient({
  initialPage,
  initialCategories,
}: {
  initialPage: LifeListPageResponse | null;
  initialCategories: LifeListCategoryResponse[];
}) {
  const t = useTranslations("LifeList");
  const [category, setCategory] = useState<string | undefined>();
  const [status, setStatus] = useState<LifeListStatus | undefined>();
  const filtered = Boolean(category || status);

  const categoriesQuery = useGetPublicLifeListCategoriesQuery(undefined, {
    skip: initialCategories.length > 0 && !filtered,
  });
  const listQuery = useGetPublicLifeListQuery(
    { category, status, page: 0, size: 100 },
    { skip: !filtered && initialPage != null }
  );

  const categories = categoriesQuery.data ?? initialCategories;
  const page = filtered ? listQuery.data : (listQuery.data ?? initialPage);
  const isLoading = filtered ? listQuery.isLoading : !page && listQuery.isLoading;
  const failed = filtered ? listQuery.isError : !page && listQuery.isError;

  const items = page?.list ?? [];
  const summary = page?.summary;

  const statusChips = useMemo(
    () =>
      STATUSES.map((value) => ({
        value,
        label: t(`status.${value}`),
      })),
    [t]
  );

  return (
    <PageFrame className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <PageHeader title={t("title")} description={t("subtitle")}>
        <Typography color="muted" className="text-sm">
          {t("pace")}
        </Typography>
        {summary ? (
          <ProgressMeter
            completed={summary.completed}
            label={t("progress", { completed: summary.completed, total: summary.total })}
            total={summary.total}
          />
        ) : null}
      </PageHeader>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("allCategories")}>
          <FilterButton active={!category} onPress={() => setCategory(undefined)}>
            {t("allCategories")}
          </FilterButton>
          {categories.map((item) => (
            <FilterButton
              key={item.id}
              active={category === item.slug}
              onPress={() => setCategory(item.slug)}
            >
              {item.name}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("allStatuses")}>
          <FilterButton active={!status} onPress={() => setStatus(undefined)}>
            {t("allStatuses")}
          </FilterButton>
          {statusChips.map((item) => (
            <FilterButton
              key={item.value}
              active={status === item.value}
              onPress={() => setStatus(item.value)}
            >
              {item.label}
            </FilterButton>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : null}

      {failed ? (
        <EmptyState>
          <EmptyState.Title>{t("loadError")}</EmptyState.Title>
        </EmptyState>
      ) : null}

      {!isLoading && !failed && items.length === 0 ? (
        <EmptyState>
          <EmptyState.Title>{filtered ? t("noResults") : t("empty")}</EmptyState.Title>
        </EmptyState>
      ) : null}

      <ol className="flex flex-col">
        {items.map((item) => (
          <li key={item.id} className="border-border border-b">
            <Link
              href={`/life-list/${item.number}`}
              className="hover:bg-default/40 focus-visible:ring-accent flex items-baseline gap-4 rounded-lg px-1 py-4 transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="text-muted w-10 shrink-0 text-sm tabular-nums">{item.number}</span>
              <span className="min-w-0 flex-1">
                <span className="text-foreground block text-base">{item.title}</span>
                {item.description ? (
                  <span className="text-muted mt-1 line-clamp-1 block text-sm">
                    {item.description}
                  </span>
                ) : null}
              </span>
              <span className="text-muted hidden shrink-0 text-sm sm:block">
                {item.category?.name}
              </span>
              <span className="hidden w-24 shrink-0 sm:block">
                <StatusMeter label={t(`status.${item.status}`)} status={item.status} />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </PageFrame>
  );
}
