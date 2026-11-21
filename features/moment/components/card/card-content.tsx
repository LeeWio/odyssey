"use client";

import dynamic from "next/dynamic";
import { Button, Link, Skeleton, Tag, TagGroup } from "@heroui/react";
import type { MomentTopicResponse } from "@/lib/features/moment";
import type { JSONContent } from "@tiptap/core";
import { getTransformStyles } from "../../utils/transform-styles";
import { MomentContent } from "../moment-content";
import { useTranslations } from "next-intl";
import { NaturalImage } from "./natural-image";
import { motion } from "motion/react";
import { momentLayoutTransition, useMomentMotion } from "../feed-motion";
import { DeferredContent } from "@/components/layout/deferred-content";

const CircularGallery = dynamic(() => import("@/components/ui/circular-gallery"), {
  ssr: false,
  loading: GalleryPlaceholder,
});

function GalleryPlaceholder() {
  return <Skeleton className="h-full w-full" aria-hidden />;
}

const BounceCards = dynamic(() => import("@/components/ui/bounce-cards"), {
  ssr: false,
  loading: () => <div className="bg-surface-secondary min-h-40 w-full rounded-2xl" aria-hidden />,
});

const StockTrendCard = dynamic(
  () => import("../stock/stock-trend-card").then((mod) => mod.StockTrendCard),
  {
    ssr: false,
    loading: () => <div className="bg-surface-secondary h-24 w-full rounded-2xl" aria-hidden />,
  }
);

export interface MomentImagePreview {
  url: string;
  originalUrl?: string;
  alt?: string | null;
  width?: number;
  height?: number;
}

interface CardContentProps {
  parsedContent: JSONContent;
  images: MomentImagePreview[];
  mediaLayout?: "stacked" | "natural";
  topics: MomentTopicResponse[];
  onCardClick?: (index: number) => void;
  stockSymbol?: string;
  linkTopics?: boolean;
}

function TopicTag({ id, link, slug }: { id: number; link: boolean; slug: string }) {
  return (
    <Tag id={id} textValue={slug}>
      {link ? (
        <Link
          className="text-foreground no-underline"
          href={`/moments/topics/${encodeURIComponent(slug)}`}
        >
          {slug}
        </Link>
      ) : (
        slug
      )}
    </Tag>
  );
}

const getDynamicCardSize = (count: number) => {
  if (count === 1) return 240;
  if (count === 2) return 130;
  if (count === 3) return 110;
  if (count === 4) return 94;
  return 82;
};

const getDynamicContainerHeight = (count: number) => {
  if (count === 1) return 240;
  if (count === 2) return 140;
  if (count === 3) return 120;
  if (count === 4) return 110;
  return 108;
};

export const CardContent = ({
  parsedContent,
  images,
  mediaLayout = "stacked",
  topics,
  onCardClick,
  stockSymbol,
  linkTopics = true,
}: CardContentProps) => {
  const t = useTranslations("Moments");
  const { enabled, reduced } = useMomentMotion();
  const count = images.length;

  return (
    <motion.div
      className="flex w-full flex-col gap-3"
      layout={enabled ? "position" : undefined}
      transition={{ layout: reduced ? { duration: 0 } : momentLayoutTransition }}
    >
      <MomentContent content={parsedContent} />

      {topics.length > 0 && (
        <TagGroup aria-label={t("topics")} size="sm" selectionMode="none">
          <TagGroup.List className="flex flex-wrap gap-1.5">
            {topics.map((topic) => (
              <TopicTag key={topic.id} id={topic.id} link={linkTopics} slug={topic.slug} />
            ))}
          </TagGroup.List>
        </TagGroup>
      )}

      {count >= 4 && onCardClick ? (
        <DeferredContent className="h-80 w-full" fallback={<GalleryPlaceholder />}>
          <CircularGallery
            expandOnOpen
            items={images.map(({ url, originalUrl, alt }) => ({
              image: url,
              originalImage: originalUrl,
              alt: alt || t("imageAlt"),
            }))}
          />
        </DeferredContent>
      ) : count > 0 && (mediaLayout === "natural" || !onCardClick) ? (
        <div
          className={count >= 4 ? "grid min-w-0 grid-cols-2 gap-3" : "flex min-w-0 flex-col gap-3"}
        >
          {images.map(({ url, alt, width, height }, index) => {
            const image = (
              <NaturalImage
                src={url}
                alt={alt || t("imageAlt")}
                width={width}
                height={height}
                interactive={Boolean(onCardClick)}
                bounded={count === 1}
              />
            );

            return onCardClick ? (
              <Button
                key={`${url}-${index}`}
                aria-label={t("openImage", { index: index + 1, total: count })}
                className="block h-auto w-full min-w-0 overflow-visible"
                variant="ghost"
                onPress={() => onCardClick(index)}
              >
                {image}
              </Button>
            ) : (
              <div key={`${url}-${index}`}>{image}</div>
            );
          })}
        </div>
      ) : count > 0 ? (
        <div className="flex w-full justify-center">
          <BounceCards
            images={images.map(({ url }) => url)}
            cardSize={getDynamicCardSize(count)}
            containerWidth={280}
            containerHeight={getDynamicContainerHeight(count)}
            animationDelay={0.2}
            animationStagger={0.045}
            transformStyles={getTransformStyles(count)}
            enableHover={true}
            onCardClick={onCardClick}
          />
        </div>
      ) : null}

      {stockSymbol && <StockTrendCard symbol={stockSymbol} variant="transparent" />}
    </motion.div>
  );
};
