"use client";

import dynamic from "next/dynamic";
import { Button, Link, Tag, TagGroup } from "@heroui/react";
import type { MomentTopicResponse } from "@/lib/features/moment";
import type { JSONContent } from "@tiptap/core";
import { getTransformStyles } from "../../utils/transform-styles";
import { MomentContent } from "../moment-content";
import { useTranslations } from "next-intl";
import { NaturalImage } from "./natural-image";
import { motion } from "motion/react";
import { momentLayoutTransition, useMomentMotion } from "../feed-motion";

const CircularGallery = dynamic(() => import("@/components/ui/circular-gallery"), { ssr: false });

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

interface CardContentProps {
  momentId: string | number;
  parsedContent: JSONContent;
  imageUrls: string[];
  imageAltTexts?: string[];
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
  imageUrls,
  imageAltTexts,
  mediaLayout = "stacked",
  topics,
  onCardClick,
  stockSymbol,
  linkTopics = true,
}: CardContentProps) => {
  const t = useTranslations("Moments");
  const { enabled, reduced } = useMomentMotion();
  const count = imageUrls.length;

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

      {count >= 4 ? (
        <div className="h-80 w-full">
          <CircularGallery
            expandOnOpen
            items={imageUrls.map((image, index) => ({
              image,
              alt: imageAltTexts?.[index] || t("imageAlt"),
            }))}
          />
        </div>
      ) : count > 0 && mediaLayout === "natural" ? (
        <div className="flex min-w-0 flex-col gap-3">
          {imageUrls.map((url, index) => {
            const image = (
              <NaturalImage
                src={url}
                alt={imageAltTexts?.[index] || t("imageAlt")}
                interactive={Boolean(onCardClick)}
              />
            );

            return onCardClick ? (
              <Button
                key={`${url}-${index}`}
                aria-label={t("openImage", { index: index + 1, total: count })}
                className="block h-auto w-full min-w-0 overflow-visible rounded-lg p-0"
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
            images={imageUrls}
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
