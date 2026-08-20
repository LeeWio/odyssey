"use client";

import { RichTextEditor } from "@heroui-pro/react";
import type { RichTextEditorValueChangeDetails } from "@heroui-pro/react";
import type { JSONContent } from "@tiptap/core";

interface PublisherEditorProps {
  value: JSONContent | undefined;
  onValueChange: (value: JSONContent, details: RichTextEditorValueChangeDetails) => void;
  maxLength?: number;
}

export const PublisherEditor = ({ value, onValueChange, maxLength }: PublisherEditorProps) => {
  return (
    <RichTextEditor
      value={value}
      onValueChange={onValueChange}
      maxLength={maxLength}
      placeholder="Share a moment..."
    >
      <RichTextEditor.Shell className="w-full min-w-0 rounded-none border-none bg-transparent shadow-none outline-none">
        <RichTextEditor.Content className="text-foreground max-h-75 min-h-30 w-full min-w-0 overflow-y-auto outline-none focus:outline-none [&_.ProseMirror]:p-0 [&_.ProseMirror]:text-left [&_.ProseMirror]:break-all [&_.ProseMirror_p]:break-all" />
      </RichTextEditor.Shell>
    </RichTextEditor>
  );
};
