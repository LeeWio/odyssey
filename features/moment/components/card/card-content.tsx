"use client";

import { Tag, TagGroup } from "@heroui/react";
import { RichTextEditor } from "@heroui-pro/react";
import BounceCards from "@/components/ui/bounce-cards";
import type { MomentTopicResponse } from "@/lib/features/moment";
import type { JSONContent } from "@tiptap/core";
import { getTransformStyles } from "../../utils/transform-styles";
import { useMemo } from "react";
import Image from "next/image";
import Stack from "../gallery/stack";

interface CardContentProps {
  momentId: string | number;
  parsedContent: JSONContent;
  imageUrls: string[];
  topics: MomentTopicResponse[];
  onCardClick?: (index: number) => void;
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
}: CardContentProps) => {
  const count = imageUrls.length;
  const cardSize = getDynamicCardSize(count);
  const containerHeight = getDynamicContainerHeight(count);

  // Deterministic, re-render-proof gallery style selection based on momentId hash
  const galleryStyle = useMemo(() => {
    const idHash =
      typeof momentId === "number"
        ? momentId
        : String(momentId)
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return idHash % 2 === 0 ? "bounce" : "stack";
  }, [momentId]);

  // Construct standard-complying next/image card nodes for Stack component
  const stackCards = useMemo(() => {
    return imageUrls.map((src, index) => (
      <div
        key={`${src}-${index}`}
        className="relative h-full w-full cursor-pointer select-none"
        onClick={() => onCardClick?.(index)}
      >
        <Image
          src={src}
          alt={`moment-image-${index}`}
          fill
          unoptimized
          className="pointer-events-none absolute inset-0 block size-full rounded-2xl object-cover"
        />
      </div>
    ));
  }, [imageUrls, onCardClick]);

  // Case 1: Stack layout (Side-by-side on wide screens, vertical on mobile)
  if (galleryStyle === "stack" && count > 0) {
    return (
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <RichTextEditor
            key={momentId}
            isReadOnly
            defaultValue={parsedContent}
            className="h-auto min-h-0 w-full"
          >
            <RichTextEditor.Shell className="h-auto min-h-0 rounded-none border-none bg-transparent p-0 shadow-none outline-none">
              <RichTextEditor.Content className="h-auto min-h-0 bg-transparent outline-none focus:outline-none [&_.ProseMirror]:h-auto [&_.ProseMirror]:min-h-0 [&_.ProseMirror]:p-0" />
            </RichTextEditor.Shell>
          </RichTextEditor>

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
        </div>

        <div className="relative flex h-[180px] w-[180px] shrink-0 items-center justify-center self-center py-2 sm:h-[150px] sm:w-[150px] sm:self-start sm:py-0">
          <Stack
            cards={stackCards}
            randomRotation={true}
            sensitivity={200}
            sendToBackOnClick={false}
          />
        </div>
      </div>
    );
  }

  // Case 2: BounceCards layout (Default Vertical Stacking)
  return (
    <div className="flex flex-col gap-3">
      <RichTextEditor
        key={momentId}
        isReadOnly
        defaultValue={parsedContent}
        className="h-auto min-h-0 w-full"
      >
        <RichTextEditor.Shell className="h-auto min-h-0 rounded-none border-none bg-transparent p-0 shadow-none outline-none">
          <RichTextEditor.Content className="h-auto min-h-0 bg-transparent outline-none focus:outline-none [&_.ProseMirror]:h-auto [&_.ProseMirror]:min-h-0 [&_.ProseMirror]:p-0" />
        </RichTextEditor.Shell>
      </RichTextEditor>

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
    </div>
  );
};
