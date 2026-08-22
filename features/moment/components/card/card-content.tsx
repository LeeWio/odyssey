"use client";

import { Tag, TagGroup } from "@heroui/react";
import { RichTextEditor } from "@heroui-pro/react";
import BounceCards from "@/components/ui/bounce-cards";
import type { MomentTopicResponse } from "@/lib/features/moment";
import type { JSONContent } from "@tiptap/core";
import { getTransformStyles } from "../../utils/transform-styles";
import { useMemo } from "react";
import { StockTrendCard } from "@/components/stock/stock-trend-card";

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

  return (
    <div className="flex w-full flex-col gap-3">
      <RichTextEditor
        isReadOnly
        defaultValue={parsedContent}
        className="h-auto min-h-0 w-full min-w-0"
      >
        <RichTextEditor.Shell className="h-auto min-h-0 w-full min-w-0 rounded-none border-none bg-transparent p-0 shadow-none outline-none">
          <RichTextEditor.Content className="h-auto min-h-0 bg-transparent outline-none focus:outline-none [&_.ProseMirror]:h-auto [&_.ProseMirror]:min-h-0 [&_.ProseMirror]:p-0 [&_.ProseMirror]:break-all [&_.ProseMirror_p]:break-all" />
        </RichTextEditor.Shell>
      </RichTextEditor>

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
        <div className="flex w-full -translate-x-1 justify-center">
          <BounceCards
            images={imageUrls}
            cardSize={cardSize}
            containerWidth={360}
            containerHeight={containerHeight}
            animationDelay={0.2}
            animationStagger={0.045}
            transformStyles={getTransformStyles(count)}
            enableHover={true}
            onCardClick={onCardClick}
          />
        </div>
      )}

      {stockSymbol && <StockTrendCard symbol={stockSymbol} />}
    </div>
  );
};
