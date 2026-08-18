"use client";

import { RichTextEditor } from "@heroui-pro/react";
import BounceCards from "@/components/ui/bounce-cards";
import type { JSONContent } from "@tiptap/core";
import { getTransformStyles } from "../../utils/transform-styles";

interface CardContentProps {
  momentId: string | number;
  parsedContent: JSONContent;
  imageUrls: string[];
  onCardClick?: (index: number) => void;
}

export const CardContent = ({
  momentId,
  parsedContent,
  imageUrls,
  onCardClick,
}: CardContentProps) => {
  return (
    <div className="flex flex-col gap-3 px-4 py-1">
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

      {imageUrls.length > 0 && (
        <div className="flex w-full -translate-x-1 justify-center">
          <BounceCards
            images={imageUrls}
            cardSize={82}
            containerWidth={360}
            containerHeight={108}
            animationDelay={0.2}
            animationStagger={0.045}
            transformStyles={getTransformStyles(imageUrls.length)}
            enableHover={true}
            onCardClick={onCardClick}
          />
        </div>
      )}
    </div>
  );
};
