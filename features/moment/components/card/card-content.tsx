"use client";

import { Tag, TagGroup } from "@heroui/react";
import { RichTextEditor } from "@heroui-pro/react";
import BounceCards from "@/components/ui/bounce-cards";
import Stack from "../gallery/stack";
import type { MomentTopicResponse } from "@/lib/features/moment";
import type { JSONContent } from "@tiptap/core";
import { getTransformStyles } from "../../utils/transform-styles";
import { useMemo } from "react";
import { StockTrendCard } from "@/components/stock/stock-trend-card";
import { isDocumentEmpty } from "../../utils/content-parser";

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

export const CardContent = ({
  momentId,
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
        <img
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
          {/* Centered Stack when there is no text content */}
          <div className="flex w-full justify-center py-2">
            <div className="h-28 w-28 shrink-0 sm:h-32 sm:w-32">
              <Stack randomRotation sendToBackOnClick={false} cards={stackCards} />
            </div>
          </div>

          {/* Topics Tags Group (Centered) */}
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
        {/* Left Side: Text content + tags + stock */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {!isDocumentEmpty(parsedContent) && (
            <RichTextEditor
              isReadOnly
              defaultValue={parsedContent}
              className="h-auto min-h-0 w-full min-w-0"
            >
              <RichTextEditor.Shell className="h-auto min-h-0 w-full min-w-0 rounded-none border-none bg-transparent p-0 shadow-none outline-none">
                <RichTextEditor.Content className="h-auto min-h-0 bg-transparent outline-none focus:outline-none [&_.ProseMirror]:h-auto [&_.ProseMirror]:min-h-0 [&_.ProseMirror]:p-0 [&_.ProseMirror]:break-all [&_.ProseMirror_p]:break-all" />
              </RichTextEditor.Shell>
            </RichTextEditor>
          )}

          {/* Topics Tags Group */}
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

        {/* Right Side: Stack component at the trailing end */}
        <div className="mt-2 mr-2 h-28 w-28 shrink-0 sm:h-32 sm:w-32">
          <Stack randomRotation sendToBackOnClick={false} cards={stackCards} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {!isDocumentEmpty(parsedContent) && (
        <RichTextEditor
          isReadOnly
          defaultValue={parsedContent}
          className="h-auto min-h-0 w-full min-w-0"
        >
          <RichTextEditor.Shell className="h-auto min-h-0 w-full min-w-0 rounded-none border-none bg-transparent p-0 shadow-none outline-none">
            <RichTextEditor.Content className="h-auto min-h-0 bg-transparent outline-none focus:outline-none [&_.ProseMirror]:h-auto [&_.ProseMirror]:min-h-0 [&_.ProseMirror]:p-0 [&_.ProseMirror]:break-all [&_.ProseMirror_p]:break-all" />
          </RichTextEditor.Shell>
        </RichTextEditor>
      )}

      {/* 2. Topics Tags Group */}
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
