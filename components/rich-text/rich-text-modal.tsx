"use client";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  selectIsRichTextOpen,
  toggleRichText,
  selectDraftIdentifier,
  setDraftIdentifier,
} from "@/lib/features/ui/ui-slice";
import { useGetAutosaveQuery } from "@/lib/features/post/post-api";
import { Modal, Skeleton } from "@heroui/react";
import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { RichText } from "./rich-text";
import { useMounted, useFullscreenElement as useFullscreen } from "@mantine/hooks";
import type { JSONContent } from "@tiptap/react";

export function RichTextModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsRichTextOpen);
  const draftId = useAppSelector(selectDraftIdentifier);
  const isMounted = useMounted();
  const { ref, toggle, fullscreen } = useFullscreen();

  // 1. Generate unique draft ID on client side when modal is opened
  useEffect(() => {
    if (isOpen && !draftId && isMounted) {
      dispatch(setDraftIdentifier(uuidv4()));
    }
  }, [isOpen, draftId, isMounted, dispatch]);

  // 2. Query autosaved content once draft ID is ready
  const { data: autosavedContent, isFetching } = useGetAutosaveQuery(draftId as string, {
    skip: !isOpen || !draftId || !isMounted,
  });

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={true}
        onOpenChange={(open) => {
          if (!open) {
            dispatch(toggleRichText());
          }
        }}
      >
        <Modal.Container size="cover">
          {isOpen && (
            <Modal.Dialog className="flex h-[95vh] max-h-[95vh] w-[98vw] max-w-none flex-col overflow-hidden">
              {isFetching || !draftId ? (
                <>
                  <Modal.Header className="flex flex-col gap-1">Create New Post</Modal.Header>
                  <Modal.Body className="p-0">
                    <div className="flex h-125 flex-col gap-6 p-6">
                      <Skeleton className="bg-default-100 h-10 w-2/3 rounded-lg" />
                      <div className="flex gap-2.5">
                        <Skeleton className="bg-default-100 h-9 w-9 rounded-lg" />
                        <Skeleton className="bg-default-100 h-9 w-9 rounded-lg" />
                        <Skeleton className="bg-default-100 h-9 w-9 rounded-lg" />
                        <Skeleton className="bg-default-100 h-9 w-16 rounded-lg" />
                        <Skeleton className="bg-default-100 h-9 w-24 rounded-lg" />
                      </div>
                      <Skeleton className="bg-default-100 w-full flex-1 rounded-xl" />
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    <div className="flex w-full items-center justify-between">
                      <Skeleton className="bg-default-100 h-6 w-32 rounded-md" />
                      <Skeleton className="bg-default-100 h-6 w-24 rounded-md" />
                    </div>
                  </Modal.Footer>
                </>
              ) : (
                <div
                  ref={ref}
                  className={`flex h-full w-full flex-1 flex-col overflow-hidden ${
                    fullscreen ? "bg-background p-4" : ""
                  }`}
                >
                  <RichText
                    key={draftId}
                    identifier={draftId}
                    initialValue={autosavedContent?.content as JSONContent | undefined}
                    isFullscreen={fullscreen}
                    onToggleFullscreen={toggle}
                  />
                </div>
              )}
            </Modal.Dialog>
          )}
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
