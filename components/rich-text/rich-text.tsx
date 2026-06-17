"use client";

import { useAutosavePostMutation } from "@/lib/features/post/post-api";
import { RichTextEditor } from "@heroui-pro/react";
import type { JSONContent } from "@tiptap/react";
import { useDebouncedCallback } from "use-debounce";

interface RichTextProps {
  identifier: string;
  initialValue?: JSONContent;
  onChange?: (value: JSONContent) => void;
}

export function RichText({ identifier, initialValue, onChange }: RichTextProps) {
  const [autosavePost] = useAutosavePostMutation();

  const debouncedAutosave = useDebouncedCallback((contentJSON: JSONContent) => {
    autosavePost({ identifier, content: contentJSON });
  }, 1000);

  const handleValueChange = (nextValue: JSONContent) => {
    onChange?.(nextValue); // 通知父组件
    debouncedAutosave(nextValue); // 触发防抖自动保存
  };

  return (
    <RichTextEditor defaultValue={initialValue} onValueChange={handleValueChange}>
      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
