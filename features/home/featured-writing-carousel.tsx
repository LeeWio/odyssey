"use client";

import { Icon } from "@iconify/react";
import { Carousel } from "@heroui-pro/react/carousel";
import { Card, Chip, Link } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import type { PostDigestResponse } from "@/lib/features/post";
import { HOME_CAROUSEL_SLIDE } from "./layout";

const FEATURED_WASHES = [
  "bg-[radial-gradient(circle_at_20%_15%,#d7c4a3_0%,#8e7358_46%,#2c3338_100%)]",
  "bg-[radial-gradient(circle_at_80%_10%,#b7c7be_0%,#5d7a78_48%,#243038_100%)]",
  "bg-[radial-gradient(circle_at_30%_80%,#e2c2a4_0%,#a56b58_46%,#2a2428_100%)]",
  "bg-[radial-gradient(circle_at_70%_30%,#c9d3c2_0%,#6d7f72_50%,#1e2826_100%)]",
] as const;

const formatDate = (date: string | null | undefined, locale: string, fallback: string) => {
  if (!date) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

function FeaturedArticle({
  title,
  summary,
  slug,
  category,
  publishedAt,
  index,
}: {
  title: string;
  summary: string;
  slug: string;
  category: string;
  publishedAt?: string | null;
  index: number;
}) {
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <Card className="group relative h-full overflow-hidden" variant="transparent">
      <div
        aria-hidden="true"
        className={`absolute inset-0 ${FEATURED_WASHES[index % FEATURED_WASHES.length]}`}
      />
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative z-10 flex h-full flex-col">
        <Card.Header>
          <div className="flex items-center justify-between gap-3">
            <Chip color="accent" size="sm" variant="soft">
              {category}
            </Chip>
            <Chip size="sm" variant="soft">
              <Icon icon="gravity-ui:calendar" aria-hidden="true" className="size-3" />
              {formatDate(publishedAt, locale, t("writing.recently"))}
            </Chip>
          </div>
        </Card.Header>
        <Card.Content className="flex-1">
          <Card.Title className="group-hover:text-accent line-clamp-2 text-xl tracking-normal transition-colors">
            {title}
          </Card.Title>
          <Card.Description className="line-clamp-2 leading-6">{summary}</Card.Description>
        </Card.Content>
        <Card.Footer className="mt-auto">
          <Link href={`/single/${slug}`} className="text-sm no-underline">
            {t("writing.readEssay")}
            <Link.Icon aria-hidden="true">
              <Icon icon="gravity-ui:arrow-up-right" />
            </Link.Icon>
          </Link>
        </Card.Footer>
      </div>
    </Card>
  );
}

export function FeaturedWritingCarousel({ posts }: { posts: readonly PostDigestResponse[] }) {
  const t = useTranslations("Home");

  return (
    <Carousel opts={{ align: "start", loop: false }}>
      <Carousel.Content className="-ml-4 items-stretch">
        {posts.map((post, index) => (
          <Carousel.Item
            key={post.id}
            className={HOME_CAROUSEL_SLIDE}
            data-testid="home-writing-slide"
          >
            <div className="aspect-[16/10] min-h-64 w-full">
              <FeaturedArticle
                title={post.title}
                summary={post.summary || t("writing.fallbackSummary")}
                slug={post.slug}
                category={post.category?.name ?? t("writing.fallbackCategory")}
                publishedAt={post.publishedAt}
                index={index}
              />
            </div>
          </Carousel.Item>
        ))}
      </Carousel.Content>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Carousel.Previous />
        <Carousel.Dots />
        <Carousel.Next />
      </div>
    </Carousel>
  );
}
