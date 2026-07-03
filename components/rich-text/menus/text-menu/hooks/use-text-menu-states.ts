import { isCustomNodeSelected } from "@/components/rich-text/utils/is-custom-node-selected";
import { isTextSelected } from "@/components/rich-text/utils/is-text-selected";
import { useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react";
import { EditorState } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { Editor } from "@tiptap/react";
import { useCallback } from "react";

export interface ShouldShowProps {
  editor: Editor;
  element: HTMLElement;
  view: EditorView;
  state: EditorState;
  oldState?: EditorState;
  from: number;
  to: number;
}

export const useTextMenuStates = () => {
  const { editor } = useRichTextEditor();

  const states = useRichTextEditorState((ctx) => {
    if (!ctx.editor) {
      return {
        subscript: false,
        superscript: false,
        alignLeft: false,
        alignCenter: false,
        alignRight: false,
        alignJustify: false,
        fontFamily: "",
        fontSize: "",
        lineHeight: "",
        textColor: "",
        backgroundColor: "",
        canIndent: false,
        canOutdent: false,
        indent: 0,
      };
    }

    const hasListContext = ctx.editor.isActive("bulletList") || ctx.editor.isActive("orderedList");

    const canIndent = hasListContext
      ? ctx.editor.can().sinkListItem("listItem")
      : ctx.editor.can().indent();

    const canOutdent = hasListContext
      ? ctx.editor.can().liftListItem("listItem")
      : ctx.editor.can().outdent();

    const indent =
      ctx.editor.getAttributes("paragraph").indent ||
      ctx.editor.getAttributes("heading").indent ||
      0;

    return {
      subscript: ctx.editor.isActive("subscript"),
      superscript: ctx.editor.isActive("superscript"),
      alignLeft: ctx.editor.isActive({ textAlign: "left" }),
      alignCenter: ctx.editor.isActive({ textAlign: "center" }),
      alignRight: ctx.editor.isActive({ textAlign: "right" }),
      alignJustify: ctx.editor.isActive({ textAlign: "justify" }),
      fontFamily: ctx.editor.getAttributes("textStyle").fontFamily || "",
      fontSize: ctx.editor.getAttributes("textStyle").fontSize || "",
      lineHeight: ctx.editor.getAttributes("textStyle").lineHeight || "",
      textColor: ctx.editor.getAttributes("textStyle").color || "",
      backgroundColor: ctx.editor.getAttributes("textStyle").backgroundColor || "",
      canIndent,
      canOutdent,
      indent,
    };
  });

  const shouldShow = useCallback(
    ({ view, from }: ShouldShowProps) => {
      if (!editor || !view || view.isDestroyed || editor.view.dragging) {
        return false;
      }

      try {
        const domAtPos = view.domAtPos(from || 0).node as HTMLElement;
        const nodeDOM = view.nodeDOM(from || 0) as HTMLElement;
        const node = nodeDOM || domAtPos;

        // Avoid showing text menu when a custom node is already handled by another menu
        if (node && isCustomNodeSelected(editor, node)) {
          return false;
        }
      } catch (error) {
        // Safe fallback when ProseMirror's docView is null during unmounting or state updates
        return false;
      }

      return isTextSelected({ editor });
    },
    [editor]
  );

  return {
    shouldShow,
    ...states,
  };
};
