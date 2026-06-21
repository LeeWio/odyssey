import { useRichTextEditor } from "@heroui-pro/react";

export function useRichTextCommands() {
  const { editor } = useRichTextEditor();

  return {
    // Formatting
    // onBold: () => editor?.chain().focus().toggleBold().run(),
    // onItalic: () => editor?.chain().focus().toggleItalic().run(),
    // onUnderline: () => editor?.chain().focus().toggleUnderline().run(),
    // onStrike: () => editor?.chain().focus().toggleStrike().run(),
    // onCode: () => editor?.chain().focus().toggleCode().run(),
    onSubscript: () => editor?.chain().focus().toggleSubscript().run(),
    onSuperscript: () => editor?.chain().focus().toggleSuperscript().run(),

    // Alignment
    onAlignLeft: () => editor?.chain().focus().setTextAlign("left").run(),
    onAlignCenter: () => editor?.chain().focus().setTextAlign("center").run(),
    onAlignRight: () => editor?.chain().focus().setTextAlign("right").run(),
    onAlignJustify: () => editor?.chain().focus().setTextAlign("justify").run(),
  };
}
