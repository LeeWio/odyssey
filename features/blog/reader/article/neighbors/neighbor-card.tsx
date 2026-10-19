"use client";

import { ArrowLeft, ArrowRight } from "@gravity-ui/icons";
import { Card, Skeleton } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import type { ArticleNeighbor } from "./neighbor";

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function NeighborCard({
  direction,
  isLoading = false,
  neighbor,
}: {
  direction: "next" | "previous";
  isLoading?: boolean;
  neighbor: ArticleNeighbor | null;
}) {
  const locale = useLocale();
  const t = useTranslations("Article");
  const isNext = direction === "next";
  const label = isNext ? t("next") : t("previous");
  const published = formatDate(neighbor?.publishedAt, locale);
  const align = isNext ? "w-full sm:items-end sm:text-end" : "w-full";

  if (isLoading) {
    return (
      <Card
        aria-busy="true"
        aria-label={label}
        className="h-full min-h-28 w-full"
        variant="secondary"
      >
        <Card.Header className={align}>
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="mt-3 h-5 w-4/5 rounded" />
        </Card.Header>
      </Card>
    );
  }

  if (!neighbor) {
    return (
      <Card className={`h-full w-full ${isNext ? "sm:items-end" : ""}`} variant="secondary">
        <Card.Header className={align}>
          <Card.Description>{label}</Card.Description>
          <Card.Title className="text-muted text-base font-normal">{t("nothingNearby")}</Card.Title>
        </Card.Header>
      </Card>
    );
  }

  const Icon = isNext ? ArrowRight : ArrowLeft;

  return (
    <a href={`/single/${encodeURIComponent(neighbor.slug)}`}>
      <Card className={`h-full w-full ${isNext ? "sm:items-end" : ""}`}>
        <Card.Header className={`gap-2 ${align}`}>
          <Card.Description
            className={`flex items-center gap-1.5 ${isNext ? "sm:flex-row-reverse" : ""}`}
          >
            <Icon aria-hidden="true" className="size-3.5" />
            {label}
          </Card.Description>
          <Card.Title className="line-clamp-3 text-lg leading-snug text-balance wrap-break-word">
            {neighbor.title}
          </Card.Title>
        </Card.Header>
        {published ? (
          <Card.Footer className={isNext ? "sm:justify-end" : undefined}>
            <time className="text-muted text-xs" dateTime={neighbor.publishedAt ?? undefined}>
              {published}
            </time>
          </Card.Footer>
        ) : null}
      </Card>
    </a>
  );
}
