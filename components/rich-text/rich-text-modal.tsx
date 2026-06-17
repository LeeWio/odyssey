"use client";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  selectIsRichTextOpen,
  toggleRichText,
  selectDraftIdentifier,
  setDraftIdentifier,
} from "@/lib/features/ui/ui-slice";
import { useGetAutosaveQuery } from "@/lib/features/post/post-api";
import { Modal } from "@heroui/react";
import { useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { RichText } from "./rich-text";
import type { JSONContent } from "@tiptap/react";

export function RichTextModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsRichTextOpen);
  const draftId = useAppSelector(selectDraftIdentifier);

  // 保证 identifier 的稳定性和持久化
  const identifier = useMemo(() => draftId || uuidv4(), [draftId]);

  useEffect(() => {
    if (!draftId) {
      dispatch(setDraftIdentifier(identifier));
    }
  }, [draftId, identifier, dispatch]);

  // 从服务端拉取草稿内容
  const { data: autosavedContent, isFetching } = useGetAutosaveQuery(identifier, {
    // 只有当弹窗打开并且 identifier 存在时才拉取数据
    skip: !isOpen || !identifier,
  });

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            dispatch(toggleRichText());
          }
        }}
      >
        <Modal.Container size="cover" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="flex flex-col gap-1">Create New Post</Modal.Header>
            <Modal.Body className="p-0">
              {!isFetching && isOpen && (
                <RichText
                  key={identifier}
                  identifier={identifier}
                  initialValue={autosavedContent?.content as JSONContent | undefined}
                />
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
