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
import { useMounted, useFullscreenDocument as useFullscreen } from "@mantine/hooks";
import type { JSONContent } from "@tiptap/react";
import { AnimatePresence, motion } from "motion/react";

export function RichTextModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsRichTextOpen);
  const draftId = useAppSelector(selectDraftIdentifier);
  const isMounted = useMounted();
  const { toggle, fullscreen } = useFullscreen();

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
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (fullscreen) {
              toggle();
            }
            dispatch(toggleRichText());
          }
        }}
      >
        <Modal.Container
          size="cover"
          className={
            fullscreen ? "m-0! h-screen! max-h-none! w-screen! max-w-none! rounded-none p-0!" : ""
          }
        >
          {isOpen && (
            <Modal.Dialog
              className={`flex flex-col overflow-hidden ${fullscreen ? "rounded-none" : ""}`}
            >
              <AnimatePresence mode="wait">
                {isFetching || !draftId ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-1 flex-col"
                  >
                    <Modal.Header className="flex flex-col gap-1">Create New Post</Modal.Header>
                    <Modal.Body className="p-0">
                      <div className="flex h-125 flex-col gap-6 p-6">
                        <Skeleton className="h-10 w-2/3" />
                        <div className="flex gap-2.5">
                          <Skeleton className="h-9 w-9" />
                          <Skeleton className="h-9 w-9" />
                          <Skeleton className="h-9 w-9" />
                          <Skeleton className="h-9 w-16" />
                          <Skeleton className="h-9 w-24" />
                        </div>
                        <Skeleton className="w-full flex-1" />
                      </div>
                    </Modal.Body>
                    <Modal.Footer>
                      <div className="flex w-full items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </Modal.Footer>
                  </motion.div>
                ) : (
                  <motion.div
                    key="editor"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="flex h-full w-full flex-1 flex-col overflow-hidden"
                  >
                    <RichText
                      key={draftId}
                      identifier={draftId}
                      initialValue={autosavedContent?.content as JSONContent | undefined}
                      isFullscreen={fullscreen}
                      onToggleFullscreen={toggle}
                      onClose={() => {
                        if (fullscreen) {
                          toggle();
                        }
                        dispatch(toggleRichText());
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Modal.Dialog>
          )}
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
