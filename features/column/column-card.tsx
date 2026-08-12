"use client";

import { Card, Chip, Typography } from "@heroui/react";
import { ArrowRight, Book } from "@gravity-ui/icons";
import Image from "next/image";
import Link from "next/link";
import { getSmartColorTone, SmartColorSurface } from "@/components/background/smart-color-surface";
import type { ColumnResponse } from "@/lib/features/column";

export function ColumnCard({ column }: { column: ColumnResponse }) {
  const visual = column.coverImage ? (
    <Image
      alt={`${column.name} cover`}
      className="object-cover transition-transform duration-500 group-hover:scale-105"
      fill
      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
      src={column.coverImage}
    />
  ) : (
    <SmartColorSurface
      className="h-full"
      seed={`column-${column.slug}`}
      tone={getSmartColorTone({ title: column.name })}
    >
      <Book aria-hidden="true" className="absolute right-6 bottom-5 size-16 text-white/28" />
    </SmartColorSurface>
  );

  return (
    <Link className="group block h-full no-underline" href={`/columns/${column.slug}`}>
      <Card
        variant="secondary"
        className="h-full overflow-hidden p-0 transition-transform duration-200 group-hover:-translate-y-1"
      >
        <div className="relative aspect-[16/9] overflow-hidden">{visual}</div>
        <Card.Header className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <Chip size="sm" variant="soft">
              Column
            </Chip>
            <span className="text-muted text-xs tabular-nums">{column.postsCount} essays</span>
          </div>
          <Card.Title>{column.name}</Card.Title>
          {column.description ? <Card.Description>{column.description}</Card.Description> : null}
        </Card.Header>
        <Card.Footer className="mt-auto justify-between">
          <Typography color="muted" type="body-xs">
            Curated reading path
          </Typography>
          <ArrowRight
            aria-hidden="true"
            className="text-muted size-4 transition-transform duration-200 group-hover:translate-x-1"
          />
        </Card.Footer>
      </Card>
    </Link>
  );
}
