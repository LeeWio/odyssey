"use client";

import { RichTextEditor, useRichTextEditor } from "@heroui-pro/react/rich-text-editor";
import type { ComponentProps } from "react";
import { useCallback } from "react";

type BubbleMenuProps = Omit<ComponentProps<typeof RichTextEditor.BubbleMenu>, "appendTo">;

export function BubbleMenu({ className, ...props }: BubbleMenuProps) {
  const { editor } = useRichTextEditor();
  const appendTo = useCallback(() => {
    // Keep the menu in the modal's focus scope, outside its glass backdrop root.
    return editor?.view.dom.closest<HTMLElement>("[data-slot='modal-container']") ?? document.body;
  }, [editor]);

  return (
    <RichTextEditor.BubbleMenu
      {...props}
      appendTo={appendTo}
      className={className ? `pointer-events-auto ${className}` : "pointer-events-auto"}
    />
  );
}
