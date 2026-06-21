"use client";

import { useAutosavePostMutation } from "@/lib/features/post/post-api";
import { FloatingToc, RichTextEditor, RichTextEditorShell } from "@heroui-pro/react";
import { Button, Modal } from "@heroui/react";
import type { JSONContent } from "@tiptap/react";
import { useDebouncedCallback } from "use-debounce";
import { TextMenu } from "./menus/text-menu/text-menu";
import { ExtensionKit } from "./extensions/extension-kit";
import { FixedToolbar } from "./toolbar/fixed-toolbar";
import { SuggestionToolbar } from "./toolbar/suggestion-toolbar";
import { LinkMenu } from "./menus/link-menu/link-menu";
import { useState } from "react";

interface RichTextProps {
  identifier: string;
  initialValue?: JSONContent;
  onChange?: (value: JSONContent) => void;
}

export function RichText({ identifier, initialValue, onChange }: RichTextProps) {
  // 1. 获取 RTK Query Mutation 状态以追踪自动保存进度
  const [autosavePost, { isLoading, isSuccess, isError }] = useAutosavePostMutation();
  const debouncedAutosave = useDebouncedCallback((contentJSON: JSONContent) => {
    autosavePost({ identifier, content: contentJSON });
  }, 1000);

  const handleValueChange = (nextValue: JSONContent) => {
    onChange?.(nextValue); // 通知父组件
    debouncedAutosave(nextValue); // 触发防抖自动保存
  };

  return (
    <Modal.Dialog>
      <RichTextEditor
        extensions={ExtensionKit}
        className="flex h-full flex-1 flex-col"
        defaultValue={initialValue}
        onValueChange={handleValueChange}
      >
        <Modal.Header>
          <FixedToolbar />
          <SuggestionToolbar />
          <TextMenu />
          <LinkMenu />
        </Modal.Header>
        <Modal.Body className="relative flex-1 overflow-y-auto">
          <RichTextEditor.Content />
        </Modal.Body>
        <Modal.Footer>
          <RichTextEditor.Footer className="flex items-center justify-between">
            <div className="text-default-400 flex items-center gap-2 text-xs select-none">
              {isLoading && (
                <>
                  <span className="bg-warning h-2 w-2 animate-pulse rounded-full" />
                  <span>Saving draft...</span>
                </>
              )}
              {isSuccess && !isLoading && (
                <>
                  <span className="text-success h-2.5 w-2.5">✓</span>
                  <span className="text-success-600">Draft saved</span>
                </>
              )}
              {isError && (
                <>
                  <span className="bg-danger h-2 w-2 rounded-full" />
                  <span className="text-danger-500">Failed to save draft</span>
                </>
              )}
              {!isLoading && !isSuccess && !isError && (
                <>
                  <span className="bg-default-300 h-2 w-2 rounded-full" />
                  <span>Ready</span>
                </>
              )}
            </div>
            <RichTextEditor.CharacterCount showWords />
          </RichTextEditor.Footer>
        </Modal.Footer>
      </RichTextEditor>
    </Modal.Dialog>
  );
}
