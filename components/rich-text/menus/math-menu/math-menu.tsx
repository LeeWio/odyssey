"use client";

import { Surface } from "@heroui/react";
import { RichTextEditor, useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react";
import { isNodeSelection } from "@tiptap/core";
import { useCallback } from "react";
import { MathEditorPanel, type MathKind } from "../../mathematics/math-editor-popover";
import type { ShouldShowProps } from "../types";

interface MathSelectionState {
  kind: MathKind | null;
  latex: string;
}

const EMPTY_MATH_SELECTION: MathSelectionState = {
  kind: null,
  latex: "",
};

export function MathMenu() {
  const { editor } = useRichTextEditor();
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

  const shouldShow = useCallback(({ editor: currentEditor, state }: ShouldShowProps) => {
    const { selection } = state;

    return (
      currentEditor.isEditable &&
      !currentEditor.view.dragging &&
      isNodeSelection(selection) &&
      ["inlineMath", "blockMath"].includes(selection.node.type.name)
    );
  }, []);

  return (
    <RichTextEditor.BubbleMenu
      aria-label="Formula actions"
      pluginKey="math-menu"
      shouldShow={shouldShow}
      appendTo={() =>
        (document.querySelector("[data-slot='modal-dialog']") as HTMLElement) || document.body
      }
    >
      {mathSelection.kind && (
        <Surface
          aria-label="Formula editor"
          className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-3 shadow-lg"
        >
          <MathEditorPanel
            key={`${mathSelection.kind}:${mathSelection.latex}`}
            allowKindChange={false}
            autoFocus={false}
            initialKind={mathSelection.kind}
            initialLatex={mathSelection.latex}
            submitLabel="Update"
            title={mathSelection.kind === "inline" ? "Edit inline formula" : "Edit block formula"}
            onDelete={() => editor?.chain().focus().deleteSelection().run()}
            onSubmit={({ kind, latex }) => {
              if (!editor) return false;

              return kind === "inline"
                ? editor.chain().focus().updateInlineMath({ latex }).run()
                : editor.chain().focus().updateBlockMath({ latex }).run();
            }}
          />
        </Surface>
      )}
    </RichTextEditor.BubbleMenu>
  );
}
