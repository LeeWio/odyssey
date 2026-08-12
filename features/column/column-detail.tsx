"use client";

import { ArrowLeft, ArrowRight, BookOpen, Eye } from "@gravity-ui/icons";
import {
  Card,
  Chip,
  Link as HeroLink,
  Skeleton,
  Typography,
  buttonVariants,
  cn,
} from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { getSmartColorTone, SmartColorSurface } from "@/components/background/smart-color-surface";
import { useGetPublicColumnBySlugQuery } from "@/lib/features/column";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ColumnDetail({ slug }: { slug: string }) {
  const { data: column, error, isLoading } = useGetPublicColumnBySlugQuery(slug);

  if (isLoading) {
    return (
      <div className="bg-background min-h-[100dvh] px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
        <div className="mx-auto max-w-6xl space-y-8">
          <Skeleton className="h-12 w-32 rounded-lg" />
          <Skeleton className="aspect-[21/9] w-full rounded-2xl" />
          <div className="grid gap-4">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !column) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center px-6">
        <Card variant="secondary" className="max-w-md items-start gap-5 p-7">
          <Card.Header>
            <Card.Title>Column not found</Card.Title>
            <Card.Description>
              The reading path may be unpublished or its address has changed.
            </Card.Description>
          </Card.Header>
          <HeroLink
            className={cn(buttonVariants({ size: "sm", variant: "secondary" }), "no-underline")}
            href="/columns"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            All columns
          </HeroLink>
        </Card>
      </div>
    );
  }

  const cover = column.coverImage ? (
    <Image
      alt={`${column.name} cover`}
      className="object-cover"
      fill
      priority
      sizes="(max-width: 1023px) 100vw, 1152px"
      src={column.coverImage}
    />
  ) : (
    <SmartColorSurface
      className="h-full"
      seed={`column-${column.slug}`}
      tone={getSmartColorTone({ title: column.name })}
    />
  );

  return (
    <div className="bg-background min-h-[100dvh] px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        <HeroLink
          className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "mb-8 no-underline")}
          href="/columns"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All columns
        </HeroLink>

        <header className="relative isolate min-h-[360px] overflow-hidden rounded-2xl text-white sm:min-h-[420px]">
          <div className="absolute inset-0">{cover}</div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(10_14_24/0.1),rgb(10_14_24/0.82))]" />
          <div className="relative flex min-h-[360px] max-w-3xl flex-col justify-end gap-5 p-7 sm:min-h-[420px] sm:p-10 lg:p-14">
            <Chip className="w-fit bg-white/14 text-white" size="sm" variant="soft">
              Editorial column
            </Chip>
            <Typography type="h1" weight="bold" className="leading-[1.02] text-balance text-white">
              {column.name}
            </Typography>
            {column.description ? (
              <Typography className="max-w-2xl text-white/78" type="body">
                {column.description}
              </Typography>
            ) : null}
            <div className="flex items-center gap-2 text-sm text-white/72">
              <BookOpen aria-hidden="true" className="size-4" />
              {column.postsCount} {column.postsCount === 1 ? "essay" : "essays"}
            </div>
          </div>
        </header>

        <section aria-labelledby="column-essays" className="mt-14 max-w-4xl">
          <Typography id="column-essays" type="h2" weight="semibold">
            In this column
          </Typography>
          <div className="divide-default-200 border-default-200 mt-6 divide-y border-y">
            {column.posts.map((post, index) => (
              <Link
                key={post.id}
                className="group flex gap-5 py-6 no-underline sm:items-start"
                href={`/single/${post.slug}`}
              >
                <span className="text-muted mt-1 font-mono text-sm tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <Typography
                    className="group-hover:text-accent text-lg font-semibold transition-colors"
                    type="h3"
                  >
                    {post.title}
                  </Typography>
                  {post.summary ? (
                    <Typography className="text-muted mt-2 line-clamp-2" type="body-sm">
                      {post.summary}
                    </Typography>
                  ) : null}
                  <div className="text-muted mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span>{formatDate(post.publishedAt || "")}</span>
                    <span className="flex items-center gap-1">
                      <Eye aria-hidden="true" className="size-3.5" />
                      {post.views.toLocaleString("en-US")}
                    </span>
                  </div>
                </div>
                <ArrowRight
                  aria-hidden="true"
                  className="text-muted mt-1 size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
