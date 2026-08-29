"use client";

import { Card, Chip, Typography } from "@heroui/react";
import { ArrowRight, Book } from "@gravity-ui/icons";
import Image from "next/image";
import Link from "next/link";
import Grainient from "@/components/background/grainient";
import type { ColumnResponse } from "@/lib/features/column";

function getGrainientProps(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash = hash >>> 0;

  const warpStrength = 0.5 + ((hash % 10) / 10) * 1.5;
  const warpFrequency = 3.0 + ((hash % 13) / 13) * 6.0;
  const warpSpeed = 1.0 + ((hash % 7) / 7) * 2.0;
  const blendAngle = hash % 360;
  const rotationAmount = 200.0 + ((hash % 15) / 15) * 600.0;
  const zoom = 0.6 + ((hash % 8) / 8) * 0.6;

  return {
    warpStrength,
    warpFrequency,
    warpSpeed,
    blendAngle,
    rotationAmount,
    zoom,
    grainAmount: 0,
    timeSpeed: 0.12,
  };
}

export function ColumnCard({ column }: { column: ColumnResponse }) {
  const essaysLabel = `${column.postsCount} ${column.postsCount === 1 ? "essay" : "essays"}`;
  const visual = column.coverImage ? (
    <Image
      alt={`${column.name} cover`}
      className="object-cover transition-transform duration-500 group-hover:scale-105"
      fill
      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
      src={column.coverImage}
    />
  ) : (
    <div className="relative h-full w-full">
      <Grainient {...getGrainientProps(column.name)} className="absolute inset-0" />
      <Book aria-hidden="true" className="absolute right-6 bottom-5 z-10 size-16 text-white/28" />
    </div>
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
            <span className="text-muted text-xs tabular-nums">{essaysLabel}</span>
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
