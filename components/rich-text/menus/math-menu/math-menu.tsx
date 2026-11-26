"use client";

import { useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react/rich-text-editor";
import { isNodeSelection } from "@tiptap/core";
import { useCallback } from "react";
import { MathEditorPanel, type MathKind } from "../../mathematics/math-editor-popover";
import type { ShouldShowProps } from "../types";
import { BubbleMenu } from "../bubble-menu";

interface MathSelectionState {
  kind: MathKind | null;
  latex: string;
}

const EMPTY_MATH_SELECTION: MathSelectionState = {
  kind: null,
  latex: "",
};

const mathMenuPosition = { shift: { crossAxis: true, padding: 12 } };

export function MathMenu() {
  const { editor, isReadOnly } = useRichTextEditor();
  const mathSelection =
    useRichTextEditorState(
      ({ editor: currentEditor }) => {
        const { selection } = currentEditor.state;

        if (!isNodeSelection(selection)) return EMPTY_MATH_SELECTION;

        const kind: MathKind | null =
          selection.node.type.name === "inlineMath"
            ? "inline"
            : selection.node.type.name === "blockMath"
              ? "block"
              : null;

        return {
          kind,
          latex:
            kind && typeof selection.node.attrs.latex === "string"
              ? selection.node.attrs.latex
              : "",
        };
      },
      (previous, next) => previous?.kind === next?.kind && previous?.latex === next?.latex
    ) ?? EMPTY_MATH_SELECTION;

  const shouldShow = useCallback(
    ({ editor: currentEditor, state }: ShouldShowProps) => {
      if (isReadOnly || !currentEditor.isEditable || currentEditor.view.dragging) {
        return false;
      }

      const { selection } = state;

      return (
        isNodeSelection(selection) && ["inlineMath", "blockMath"].includes(selection.node.type.name)
      );
    },
    [isReadOnly]
  );

  return (
    <BubbleMenu
      aria-label="Formula actions"
      options={mathMenuPosition}
      pluginKey="math-menu"
      shouldShow={shouldShow}
    >
      {mathSelection.kind && (
        <div className="flex max-h-[calc(100dvh-2rem)] w-88 max-w-[calc(100dvw-2rem)] flex-col gap-3 overflow-y-auto p-2">
          <h2 className="text-base font-semibold">
            {mathSelection.kind === "inline" ? "Edit inline formula" : "Edit block formula"}
          </h2>
          <MathEditorPanel
            key={`${mathSelection.kind}:${mathSelection.latex}`}
            allowKindChange={false}
            autoFocus={false}
            initialKind={mathSelection.kind}
            initialLatex={mathSelection.latex}
            submitLabel="Update"
            onDelete={() => editor?.chain().focus().deleteSelection().run()}
            onSubmit={({ kind, latex }) => {
              if (!editor) return false;

              return kind === "inline"
                ? editor.chain().focus().updateInlineMath({ latex }).run()
                : editor.chain().focus().updateBlockMath({ latex }).run();
            }}
          />
        </div>
      )}
    </BubbleMenu>
  );
}
