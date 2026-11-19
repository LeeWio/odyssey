"use client";

import { Button } from "@heroui/react";
import { RichTextModal } from "@/components/rich-text/rich-text-modal";
import { openRichText } from "@/lib/features/ui";
import { useAppDispatch } from "@/lib/hooks";

export function RichTextModalTestClient({ postId }: { postId?: string }) {
  const dispatch = useAppDispatch();

  return (
    <>
      <Button onPress={() => dispatch(openRichText({ activeId: postId ?? "glass-regression" }))}>
        Open editor
      </Button>
      <RichTextModal />
    </>
  );
}
