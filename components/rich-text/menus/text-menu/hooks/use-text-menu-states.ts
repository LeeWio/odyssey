import { useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react/rich-text-editor";
import { useCallback } from "react";
import { isCustomNodeSelected } from "@/components/rich-text/utils/is-custom-node-selected";
import { isTextSelected } from "@/components/rich-text/utils/is-text-selected";
import type { ShouldShowProps } from "../../types";
import { getSelectionTypography } from "../typography-presets";

export const useTextMenuStates = () => {
  const { editor, isReadOnly } = useRichTextEditor();

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
        typographyPreset: null,
        textColor: "",
        backgroundColor: "",
        canIndent: false,
        canOutdent: false,
      };
    }

    const hasListContext = ctx.editor.isActive("bulletList") || ctx.editor.isActive("orderedList");

    const canIndent = hasListContext
      ? ctx.editor.can().sinkListItem("listItem")
      : ctx.editor.can().indent();

    const canOutdent = hasListContext
      ? ctx.editor.can().liftListItem("listItem")
      : ctx.editor.can().outdent();

    return {
      subscript: ctx.editor.isActive("subscript"),
      superscript: ctx.editor.isActive("superscript"),
      alignLeft: ctx.editor.isActive({ textAlign: "left" }),
      alignCenter: ctx.editor.isActive({ textAlign: "center" }),
      alignRight: ctx.editor.isActive({ textAlign: "right" }),
      alignJustify: ctx.editor.isActive({ textAlign: "justify" }),
      fontFamily: ctx.editor.getAttributes("textStyle").fontFamily || "",
      fontSize: ctx.editor.getAttributes("textStyle").fontSize || "",
      ...getSelectionTypography(ctx.editor.state),
      textColor: ctx.editor.getAttributes("textStyle").color || "",
      backgroundColor: ctx.editor.getAttributes("textStyle").backgroundColor || "",
      canIndent,
      canOutdent,
    };
  });

  const shouldShow = useCallback(
    ({ view }: ShouldShowProps) => {
      if (!editor || isReadOnly || !view || view.isDestroyed || editor.view.dragging) {
        return false;
      }

      return isTextSelected({ editor }) && !isCustomNodeSelected(editor);
    },
    [editor, isReadOnly]
  );

  return {
    shouldShow,
    ...states,
  };
};
