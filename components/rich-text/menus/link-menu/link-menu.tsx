import { Surface } from "@heroui/react";
import { RichTextEditor, useRichTextEditor } from "@heroui-pro/react/rich-text-editor";
import { useCallback, useState } from "react";
import { LinkMenuEdit } from "./link-menu-edit";
import { LinkMenuPreview } from "./link-menu-preview";

export function LinkMenu() {
  const { editor, isReadOnly } = useRichTextEditor();

  const [mode, setMode] = useState<"preview" | "edit">("preview");

  const shouldShow = useCallback(() => {
    if (!editor || isReadOnly || !editor.isEditable) return false;
    return editor.isActive("link");
  }, [editor, isReadOnly]);

  const handleEdit = () => setMode("edit");
  const handleCancel = () => setMode("preview");

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
        <Surface className="p-0" variant="transparent">
          <LinkMenuPreview onEdit={handleEdit} />
        </Surface>
      ) : (
        <Surface className="flex flex-col gap-3 p-3" variant="transparent">
          <LinkMenuEdit onCancel={handleCancel} />
        </Surface>
      )}
    </RichTextEditor.BubbleMenu>
  );
}
