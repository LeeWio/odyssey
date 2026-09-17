"use client";

import dynamic from "next/dynamic";
import { Tag, TagGroup } from "@heroui/react";
import { RemoteMedia } from "@/components/ui/remote-media";
import Stack from "../gallery/stack";
import type { MomentTopicResponse } from "@/lib/features/moment";
import type { JSONContent } from "@tiptap/core";
import { getTransformStyles } from "../../utils/transform-styles";
import { useMemo } from "react";
import { StockTrendCard } from "@/components/stock/stock-trend-card";
import { isDocumentEmpty, jsonContentToPlainText } from "../../utils/content-parser";

const BounceCards = dynamic(() => import("@/components/ui/bounce-cards"), {
  ssr: false,
  loading: () => <div className="bg-surface-secondary min-h-40 w-full rounded-2xl" aria-hidden />,
});

interface CardContentProps {
  momentId: string | number;
  parsedContent: JSONContent;
  imageUrls: string[];
  topics: MomentTopicResponse[];
  onCardClick?: (index: number) => void;
  stockSymbol?: string;
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

function MomentPlainText({ content }: { content: JSONContent }) {
  if (isDocumentEmpty(content)) return null;
  return (
    <div className="text-foreground text-sm leading-relaxed break-all whitespace-pre-wrap">
      {jsonContentToPlainText(content)}
    </div>
  );
}

export const CardContent = ({
  parsedContent,
  imageUrls,
  topics,
  onCardClick,
  stockSymbol,
}: CardContentProps) => {
  const count = imageUrls.length;
  const cardSize = getDynamicCardSize(count);
  const containerHeight = getDynamicContainerHeight(count);

  const isStackLayout = count > 3;

  // Memoize cards array to maintain stable reference, preventing the Stack component's internal
  // state and drag cycling from being reset on every parent re-render.
  const stackCards = useMemo(() => {
    if (!isStackLayout) return [];
    return imageUrls.map((url, idx) => (
      <div
        key={idx}
        className="border-default-200/60 bg-background h-full w-full cursor-pointer overflow-hidden rounded-2xl border shadow-sm"
        onClick={() => onCardClick?.(idx)}
      >
        <RemoteMedia
          src={url}
          alt={`moment-img-${idx}`}
          className="pointer-events-none h-full w-full object-cover"
        />
      </div>
    ));
  }, [imageUrls, isStackLayout, onCardClick]);

  if (isStackLayout) {
    const isTextEmpty = isDocumentEmpty(parsedContent);

    if (isTextEmpty) {
      return (
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full justify-center py-2">
            <div className="h-28 w-28 shrink-0 sm:h-32 sm:w-32">
              <Stack randomRotation sendToBackOnClick={false} cards={stackCards} />
            </div>
          </div>

          {topics.length > 0 && (
            <TagGroup aria-label="Topics" size="sm" selectionMode="none">
              <TagGroup.List className="flex flex-wrap justify-center gap-1.5">
                {topics.map((topic) => (
                  <Tag key={topic.id} id={topic.id} textValue={topic.slug}>
                    #{topic.slug}
                  </Tag>
                ))}
              </TagGroup.List>
            </TagGroup>
          )}

          {stockSymbol && (
            <div className="flex w-full justify-center">
              <StockTrendCard symbol={stockSymbol} variant="transparent" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex w-full flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <MomentPlainText content={parsedContent} />

          {topics.length > 0 && (
            <TagGroup aria-label="Topics" size="sm" selectionMode="none">
              <TagGroup.List className="flex flex-wrap gap-1.5">
                {topics.map((topic) => (
                  <Tag key={topic.id} id={topic.id} textValue={topic.slug}>
                    #{topic.slug}
                  </Tag>
                ))}
              </TagGroup.List>
            </TagGroup>
          )}

          {stockSymbol && <StockTrendCard symbol={stockSymbol} variant="transparent" />}
        </div>

        <div className="h-28 w-28 shrink-0 sm:h-32 sm:w-32">
          <Stack
            autoplay={true}
            pauseOnHover={true}
            randomRotation
            sendToBackOnClick={false}
            cards={stackCards}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <MomentPlainText content={parsedContent} />

      {topics.length > 0 && (
        <TagGroup aria-label="Topics" size="sm" selectionMode="none">
          <TagGroup.List className="flex flex-wrap gap-1.5">
            {topics.map((topic) => (
              <Tag key={topic.id} id={topic.id} textValue={topic.slug}>
                #{topic.slug}
              </Tag>
            ))}
          </TagGroup.List>
        </TagGroup>
      )}

      {count > 0 && (
        <div className="flex w-full justify-center">
          <BounceCards
            images={imageUrls}
            cardSize={cardSize}
            containerWidth={280}
            containerHeight={containerHeight}
            animationDelay={0.2}
            animationStagger={0.045}
            transformStyles={getTransformStyles(count)}
            enableHover={true}
            onCardClick={onCardClick}
          />
        </div>
      )}

      {stockSymbol && <StockTrendCard symbol={stockSymbol} variant="transparent" />}
    </div>
  );
};
