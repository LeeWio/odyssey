"use client";

import { BlogFeed } from "@/features/blog";
import Grainient from "@/components/background/grainient";
import { Avatar, Button, Card, Chip, Skeleton, Typography } from "@heroui/react";
import { Carousel } from "@heroui-pro/react/carousel";
import { useGetPublicPostsQuery, type PostResponse } from "@/features/blog/api/blog-api";
import Link from "next/link";
import { Eye, Heart } from "@gravity-ui/icons";
import { Icon } from "@iconify/react";
import { useState } from "react";

// Generates deterministic grainient settings based on post slug or title
function getGrainientProps(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash = hash >>> 0;

  const warpStrength = 0.6 + ((hash % 10) / 10) * 1.0;
  const warpFrequency = 3.0 + ((hash % 13) / 13) * 5.0;
  const warpSpeed = 0.8 + ((hash % 7) / 7) * 1.5;
  const blendAngle = hash % 360;
  const rotationAmount = 180.0 + ((hash % 15) / 15) * 400.0;
  const zoom = 0.7 + ((hash % 8) / 8) * 0.4;

  return {
    warpStrength,
    warpFrequency,
    warpSpeed,
    blendAngle,
    rotationAmount,
    zoom,
  };
}

function formatDate(value?: string | null) {
  if (!value) return "Recently published";

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getDisplayAuthor(value?: string | null) {
  const author = value?.trim();
  if (!author || /^(anonymous|john doe|jane doe)$/i.test(author)) return "Odyssey";
  return author;
}

function InProgressCard({ post }: { post: PostResponse }) {
  const grainientProps = getGrainientProps(post.slug || post.title || String(post.id));
  const categoryName = post.category?.name || "Studies";

  return (
    <Card className="relative isolate w-full overflow-hidden border-none transition-all duration-300 ease-out group-hover:scale-[1.01] hover:shadow-xl active:scale-[0.98]">
      <Grainient
        {...grainientProps}
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
        contrast={1.12}
        grainAmount={0.02}
        saturation={1.08}
        timeSpeed={0.16}
      />

      <Card.Header className="relative z-10 flex h-full flex-row items-center justify-between gap-3">
        <Chip variant="soft" size="sm" color="default">
          {categoryName}
        </Chip>
      </Card.Header>
      <Card.Footer className="z-10 flex flex-row justify-between gap-2">
        <div className="flex flex-row items-center justify-center gap-2">
          <Avatar size="sm">
            {post.authorAvatar ? (
              <Avatar.Image alt={post.authorName || "Author Avatar"} src={post.authorAvatar} />
            ) : null}
            <Avatar.Fallback>
              {post.authorName ? post.authorName.slice(0, 2).toUpperCase() : "OD"}
            </Avatar.Fallback>
          </Avatar>

          <div className="flex flex-col items-start justify-center">
            <Typography weight="bold" type="body-sm" align="start" className="leading-none">
              {getDisplayAuthor(post.authorName)}
            </Typography>
            <Typography weight="normal" type="body-xs" color="muted" align="start">
              @{post.authorName ? post.authorName.toLowerCase().replace(/\s+/g, "") : "odyssey"}
            </Typography>
          </div>
        </div>
      </Card.Footer>

      {/* <div className="relative z-10 flex h-full flex-col justify-between p-6 min-h-95">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white/80 text-[11px] font-medium backdrop-blur-md bg-white/10 dark:bg-black/20 px-3 py-1 rounded-full border border-white/10 dark:border-white/5">
            <span className="flex items-center gap-1">
              <Eye aria-hidden="true" className="size-3" />
              {post.views?.toLocaleString("en-US") || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart aria-hidden="true" className="size-3" />
              {post.likesCount || 0}
            </span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2.5">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug group-hover:text-white/90 transition-colors">
            {post.title}
          </h3>
          {post.summary ? (
            <p className="text-white/70 text-xs sm:text-sm line-clamp-2 leading-relaxed font-light">
              {post.summary}
            </p>
          ) : null}
          <div className="mt-3 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
            <span>{getDisplayAuthor(post.authorName)}</span>
            <span>{formatDate(post.createdAt || post.publishedAt)}</span>
          </div>
        </div>
      </div> */}
    </Card>
  );
}

function InProgressCardSkeleton() {
  return (
    <Card className="bg-default-100 relative flex min-h-95 w-full animate-pulse flex-col justify-between overflow-hidden rounded-3xl border-none p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <div className="mt-auto flex flex-col gap-3">
        <Skeleton className="h-7 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded-lg" />
        <div className="border-default-200 mt-4 flex items-center justify-between border-t pt-4">
          <Skeleton className="h-3.5 w-16 rounded-lg" />
          <Skeleton className="h-3.5 w-20 rounded-lg" />
        </div>
      </div>
    </Card>
  );
}

export default function SingleIndexPage() {
  const { data, isLoading } = useGetPublicPostsQuery({ page: 0, size: 8 });
  const posts = data?.list ?? [];

  return (
    <>
      <BlogFeed />

      <section className="bg-background w-full px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-foreground/55 mb-2 text-xs font-medium tracking-[0.18em] uppercase">
                Experiments
              </p>
              <h2 className="text-foreground text-3xl font-semibold tracking-tight">In Progress</h2>
            </div>
            <span className="text-foreground/45 hidden text-sm sm:block">
              {isLoading
                ? "Loading active studies..."
                : `${posts.length.toString().padStart(2, "0")} active studies`}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <InProgressCardSkeleton key={i} />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <Carousel.Content>
                {posts.map((post) => (
                  <Carousel.Item
                    key={post.id}
                    className="basis-full p-2.5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <InProgressCard post={post} />
                  </Carousel.Item>
                ))}
              </Carousel.Content>
              <Carousel.Previous />
              <Carousel.Next />
              <Carousel.Dots className="mt-6" />
            </Carousel>
          ) : (
            <div className="text-foreground/45 py-12 text-center">No active studies found.</div>
          )}
        </div>
      </section>
    </>
  );
}
