"use client";

import { Icon } from "@iconify/react";

import { Card, Chip, Typography } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ColumnResponse } from "@/lib/features/column";

export function ColumnCard({ column }: { column: ColumnResponse }) {
  const t = useTranslations("Columns");
  const essaysLabel = t("essays", { count: column.postsCount });
  const visual = column.coverImage ? (
    <Image
      alt={t("coverAlt", { name: column.name })}
      className="object-cover"
      fill
      sizes="(min-width: 1920px) 20vw, (min-width: 1440px) 33vw, (min-width: 820px) 50vw, 100vw"
      src={column.coverImage}
    />
  ) : null;

  return (
    <Link
      className="group focus-visible:outline-accent block h-full min-w-0 rounded-lg no-underline focus-visible:outline-2 focus-visible:outline-offset-4"
      href={`/columns/${column.slug}`}
    >
      <Card
        variant="secondary"
        className="border-separator h-full min-h-64 overflow-hidden rounded-lg border p-0"
      >
        {visual ? <div className="relative aspect-[16/9] overflow-hidden">{visual}</div> : null}
        <Card.Header className="gap-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Chip size="sm" variant="soft">
              {t(column.postsCount > 0 ? "readyToRead" : "startingSoon")}
            </Chip>
            <span className="text-muted text-xs tabular-nums">{essaysLabel}</span>
          </div>
          <Card.Title className="group-hover:text-accent text-xl tracking-normal wrap-anywhere">
            {column.name}
          </Card.Title>
          {column.description ? (
            <Card.Description className="line-clamp-3 leading-6 wrap-anywhere">
              {column.description}
            </Card.Description>
          ) : null}
        </Card.Header>
        <Card.Footer className="border-separator mt-auto justify-between gap-3 border-t px-6 py-4">
          <Typography color="muted" type="body-xs">
            {t("curatedPath")}
          </Typography>
          <Icon
            icon="gravity-ui:arrow-right"
            aria-hidden="true"
            className="text-muted size-4 transition-transform duration-200 group-hover:translate-x-1"
          />
        </Card.Footer>
      </Card>
    </Link>
  );
}
