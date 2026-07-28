"use client";

import { RichTextEditor } from "@heroui-pro/react";
import type { Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/react";
import { selectRichTextState } from "@/lib/features";
import { useAppSelector } from "@/lib/hooks";
import { FixedToolbar } from "./toolbar/fixed-toolbar";

export interface RichTextProps {
  onReady?: (editor: Editor) => void;
  content?: JSONContent;
}

export function RichText({ onReady, content }: RichTextProps) {
  const { initialValue, isReadOnly } = useAppSelector(selectRichTextState);

  const defaultValue = content || initialValue || undefined;

  return (
    <RichTextEditor
      editorOptions={{
        autofocus: true,
        onCreate: ({ editor }) => {
          onReady?.(editor);
        },
      }}
      isReadOnly={isReadOnly}
      defaultValue={defaultValue}
      className="flex h-full w-full flex-col overflow-hidden"
    >
      <RichTextEditor.Shell className="flex h-full flex-1 flex-col overflow-hidden border-none bg-transparent">
        <FixedToolbar />
        <RichTextEditor.Content className="min-h-0 flex-1 scrollbar-none overflow-y-auto outline-none focus:outline-none" />

        {/* <RichTextEditor.Footer className="flex shrink-0 items-center justify-between select-none">
          <span>JSON-first editor state</span>
          <RichTextEditor.CharacterCount showWords />
        </RichTextEditor.Footer> */}
      </RichTextEditor.Shell>
    </RichTextEditor>
  );
}
