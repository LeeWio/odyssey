import { useRichTextEditor } from "@heroui-pro/react/rich-text-editor";
import type { SingleCommands } from "@tiptap/core";
import { LINE_HEIGHT_BLOCKS } from "../../../extensions/text-style-kit";
import type { TypographyPreset } from "../typography-presets";

function setBlockLineHeight(commands: SingleCommands, lineHeight: string | null) {
  const blocksUpdated = LINE_HEIGHT_BLOCKS.map((type) =>
    commands.updateAttributes(type, { lineHeight })
  ).some(Boolean);

  return blocksUpdated || !lineHeight || commands.setLineHeight(lineHeight);
}

export function useRichTextCommands() {
  const { editor } = useRichTextEditor();

  return {
    subscript: () => editor?.chain().focus().toggleSubscript().run(),
    superscript: () => editor?.chain().focus().toggleSuperscript().run(),

    // Alignment
    alignLeft: () => editor?.chain().focus().setTextAlign("left").run(),
    alignCenter: () => editor?.chain().focus().setTextAlign("center").run(),
    alignRight: () => editor?.chain().focus().setTextAlign("right").run(),
    alignJustify: () => editor?.chain().focus().setTextAlign("justify").run(),

    // Font family & Font size
    setFontFamily: (fontFamily: string) =>
      (fontFamily
        ? editor?.chain().setFontFamily(fontFamily)
        : editor?.chain().unsetFontFamily()
      )?.run(),
    setFontSize: (fontSize: string) => editor?.chain().setFontSize(fontSize).run(),
    unsetFontSize: () => editor?.chain().focus().unsetFontSize().run(),
    setLineHeight: (lineHeight: string) =>
      editor
        ?.chain()
        .unsetLineHeight()
        .command(({ commands }) => setBlockLineHeight(commands, lineHeight || null))
        .run(),
    applyTypographyPreset: ({ fontFamily, fontSize, lineHeight }: TypographyPreset) =>
      editor
        ?.chain()
        .setMark("textStyle", { fontFamily, fontSize, lineHeight: null })
        .removeEmptyTextStyle()
        .command(({ commands }) => setBlockLineHeight(commands, lineHeight))
        .run(),
    setTextColor: (color: string) => editor?.chain().setColor(color).run(),
    unsetTextColor: () => editor?.chain().focus().unsetColor().run(),
    setBackgroundColor: (color: string) => editor?.chain().setBackgroundColor(color).run(),
    unsetBackgroundColor: () => editor?.chain().focus().unsetBackgroundColor().run(),
    convertSelectionToInlineMath: () => {
      if (!editor || editor.state.selection.empty) return false;

      const { from, to } = editor.state.selection;
      const latex = editor.state.doc.textBetween(from, to, " ").trim();

      if (!latex) return false;

      return editor.chain().focus().deleteSelection().insertInlineMath({ latex }).run();
    },
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
