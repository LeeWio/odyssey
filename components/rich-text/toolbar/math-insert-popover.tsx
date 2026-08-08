"use client";

import { Button, Tooltip } from "@heroui/react";
import { useRichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { MathEditorPopover } from "../mathematics/math-editor-popover";

export function MathInsertPopover() {
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  const isUnavailable = !editor || isDisabled || isReadOnly;

  return (
    <MathEditorPopover
      submitLabel="Insert"
      title="Insert formula"
      onSubmit={({ kind, latex }) => {
        if (!editor || isUnavailable) return false;

        return kind === "inline"
          ? editor.chain().focus().insertInlineMath({ latex }).run()
          : editor.chain().focus().insertBlockMath({ latex }).run();
      }}
    >
      <Tooltip delay={0}>
        <Button
          aria-label="Insert formula"
          isDisabled={isUnavailable}
          isIconOnly
          size="sm"
          variant="ghost"
        >
          <Icon aria-hidden="true" className="size-4" icon="gravity-ui:function" />
        </Button>
        <Tooltip.Content>Insert formula</Tooltip.Content>
      </Tooltip>
    </MathEditorPopover>
  );
}
