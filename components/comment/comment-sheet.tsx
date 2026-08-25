"use client";

import { ScrollShadow } from "@heroui/react";
import { Sheet } from "@heroui-pro/react";
import { useCallback } from "react";
import { CommentHeader } from "./comment-header";
import { CommentSystem, type CommentSystemRenderParts } from "./comment-system";

interface CommentSheetProps {
  postId: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CommentSheet({ postId, isOpen, onOpenChange }: CommentSheetProps) {
  const handleRequestClose = useCallback(() => onOpenChange(false), [onOpenChange]);
  const renderContent = useCallback(
    (parts: CommentSystemRenderParts) => <CommentSheetContent {...parts} />,
    []
  );

  return (
    <Sheet
      isDetached
      isDismissable={false}
      isOpen={isOpen}
      placement="bottom"
      onOpenChange={onOpenChange}
    >
      <Sheet.Backdrop variant="blur">
        <Sheet.Content className="mx-auto w-[min(760px,calc(100vw-2rem))] max-w-none">
          <Sheet.Dialog className="h-full min-h-0">
            <Sheet.CloseTrigger />
            <CommentSystem postId={postId} onRequestClose={handleRequestClose}>
              {renderContent}
            </CommentSystem>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}

function CommentSheetContent({ totalCount, commentList, commentInput }: CommentSystemRenderParts) {
  return (
    <>
      <Sheet.Header>
        <CommentHeader inSheet totalCount={totalCount} />
      </Sheet.Header>
      <Sheet.Body className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ScrollShadow
          hideScrollBar
          className="min-h-0 flex-1 overflow-y-auto"
          orientation="vertical"
          size={32}
        >
          {commentList}
        </ScrollShadow>
      </Sheet.Body>
      <Sheet.Footer className="flex-col items-stretch">{commentInput}</Sheet.Footer>
    </>
  );
}
