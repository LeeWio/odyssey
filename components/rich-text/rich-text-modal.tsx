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
import { useMounted } from "@/hooks/use-mounted";
import type { JSONContent } from "@tiptap/react";

export function RichTextModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsRichTextOpen);
  const draftId = useAppSelector(selectDraftIdentifier);
  const isMounted = useMounted();

  // 1. 只有在弹窗打开且客户端已挂载、并且没有 Draft ID 时，才生成并分发 UUID，彻底避免 SSR 水合警告
  useEffect(() => {
    if (isOpen && !draftId && isMounted) {
      dispatch(setDraftIdentifier(uuidv4()));
    }
  }, [isOpen, draftId, isMounted, dispatch]);

  // 2. 只有在弹窗打开、Draft ID 就绪且挂载后才拉取草稿，避免无效/抢跑请求
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
          {(isFetching || !draftId) && isOpen ? (
            <Modal.Dialog>
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
            </Modal.Dialog>
          ) : (
            isOpen &&
            draftId && (
              <RichText
                key={draftId}
                identifier={draftId}
                initialValue={autosavedContent?.content as JSONContent | undefined}
              />
            )
          )}
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
