"use client";

import { ScrollShadow } from "@heroui/react";
import { Sheet } from "@heroui-pro/react";
import { useCallback, useEffect } from "react";
import { commentDebug } from "@/lib/comment-debug";
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

  useEffect(() => {
    commentDebug("sheet:open-state", { postId, isOpen });
    if (!isOpen) return;

    const frame = window.requestAnimationFrame(() => {
      const rect = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) return null;
        const bounds = element.getBoundingClientRect();
        return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
      };

      commentDebug("sheet:layout", {
        postId,
        scrollY: window.scrollY,
        htmlOverflow: document.documentElement.style.overflow,
        bodyOverflow: document.body.style.overflow,
        dialog: rect("[data-slot='sheet-dialog']"),
        header: rect("[data-slot='sheet-header']"),
        body: rect("[data-slot='sheet-body']"),
        footer: rect("[data-slot='sheet-footer']"),
      });
    });

    const mutationObserver = new MutationObserver((mutations) => {
      commentDebug("sheet:dom-mutation", {
        postId,
        mutations: mutations.map((mutation) => ({
          target: mutation.target instanceof Element ? mutation.target.tagName : "unknown",
          attribute: mutation.attributeName,
        })),
        htmlOverflow: document.documentElement.style.overflow,
        bodyOverflow: document.body.style.overflow,
      });
    });
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    const dialog = document.querySelector<HTMLElement>("[data-slot='sheet-dialog']");
    const structureObserver = dialog
      ? new MutationObserver((mutations) => {
          const relevantMutations = mutations.filter((mutation) => {
            if (mutation.type === "childList") return true;
            const target = mutation.target instanceof Element ? mutation.target : null;
            return Boolean(
              target?.matches(
                "[data-slot='sheet-dialog'], [data-slot='sheet-header'], [data-slot='sheet-body'], [data-slot='sheet-footer']"
              )
            );
          });
          if (!relevantMutations.length) return;

          commentDebug("sheet:structure-mutation", {
            postId,
            mutations: relevantMutations.map((mutation) => ({
              type: mutation.type,
              target:
                mutation.target instanceof Element
                  ? mutation.target.getAttribute("data-slot") || mutation.target.tagName
                  : "unknown",
              addedNodes: mutation.addedNodes.length,
              removedNodes: mutation.removedNodes.length,
            })),
          });
        })
      : null;
    if (dialog && structureObserver) {
      structureObserver.observe(dialog, { attributes: true, childList: true, subtree: true });
    }

    return () => {
      window.cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      structureObserver?.disconnect();
    };
  }, [isOpen, postId]);

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
          <Sheet.Dialog className="h-[min(720px,calc(100dvh-1rem))] min-h-0">
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
