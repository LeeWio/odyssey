import { RichTextEditor, useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react";
import { LinkMenuPreview } from "./link-menu-preview";
import { useCallback, useState } from "react";
import { Link as LinkExtension } from "@/components/rich-text/extensions";
import { LinkMenuEdit } from "./link-menu-edit";

export function LinkMenu() {
  const { editor } = useRichTextEditor();

  const [mode, setMode] = useState<"preview" | "edit">("preview");

  const shouldShow = useCallback(() => {
    if (!editor) return false;
    return editor.isActive(LinkExtension.name) && editor.isEditable;
  }, [editor]);

  const handleEdit = () => setMode("edit");
  const handleClose = () => {};

  const handleCancel = () => {
    setMode("preview");
    handleClose();
  };

  return (
    <RichTextEditor.BubbleMenu
      pluginKey="link-menu"
      className="rounded-2xl p-0"
      shouldShow={shouldShow}
      options={{
        onHide: () => setMode("preview"),
      }}
      appendTo={() =>
        (document.querySelector("[data-slot='modal-dialog']") as HTMLElement) || document.body
      }
    >
      {mode === "preview" ? (
        <div className="popover__dialog rich-text-editor__link-popover-content p-0">
          <LinkMenuPreview onEdit={handleEdit} />
        </div>
      ) : (
        <div className="popover__dialog rich-text-editor__link-popover-content p-3">
          <LinkMenuEdit onCancel={handleCancel} />
        </div>
      )}
    </RichTextEditor.BubbleMenu>
  );
}
