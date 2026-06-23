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
    subscript: () => editor?.chain().focus().toggleSubscript().run(),
    superscript: () => editor?.chain().focus().toggleSuperscript().run(),

    // Alignment
    alignLeft: () => editor?.chain().focus().setTextAlign("left").run(),
    alignCenter: () => editor?.chain().focus().setTextAlign("center").run(),
    alignRight: () => editor?.chain().focus().setTextAlign("right").run(),
    alignJustify: () => editor?.chain().focus().setTextAlign("justify").run(),

    // Font family & Font size
    setFontFamily: (fontFamily: string) => editor?.chain().focus().setFontFamily(fontFamily).run(),
    unsetFontFamily: () => editor?.chain().focus().unsetFontFamily().run(),
    setFontSize: (fontSize: string) => editor?.chain().focus().setFontSize(fontSize).run(),
    unsetFontSize: () => editor?.chain().focus().unsetFontSize().run(),
    setLineHeight: (lineHeight: string) => editor?.chain().focus().setLineHeight(lineHeight).run(),
    unsetLineHeight: () => editor?.chain().focus().unsetLineHeight().run(),
    setTextColor: (color: string) => editor?.chain().focus().setColor(color).run(),
    unsetTextColor: () => editor?.chain().focus().unsetColor().run(),
    setBackgroundColor: (color: string) => editor?.chain().focus().setBackgroundColor(color).run(),
    unsetBackgroundColor: () => editor?.chain().focus().unsetBackgroundColor().run(),
    indent: () => {
      if (!editor) return;
      if (editor.isActive("bulletList") || editor.isActive("orderedList")) {
        return editor.chain().focus().sinkListItem("listItem").run();
      }
      return editor.chain().focus().indent().run();
    },
    outdent: () => {
      if (!editor) return;
      if (editor.isActive("bulletList") || editor.isActive("orderedList")) {
        return editor.chain().focus().liftListItem("listItem").run();
      }
      return editor.chain().focus().outdent().run();
    },
  };
}
