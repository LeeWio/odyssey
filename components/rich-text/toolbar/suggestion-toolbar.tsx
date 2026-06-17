import type { RichTextEditorSuggestionItem } from "@heroui-pro/react";

import { RichTextEditor, filterRichTextEditorSuggestionItems } from "@heroui-pro/react";
import { Calendar, CirclePlus, Heading1, ListUl, QuoteOpen, Sparkles } from "@gravity-ui/icons";

const iconClassName = "";

const getSlashItems = ({ query }: { query: string }): RichTextEditorSuggestionItem[] =>
  filterRichTextEditorSuggestionItems(
    [
      {
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
        },
        icon: <Heading1 className={iconClassName} />,
        keywords: ["title", "h1"],
        title: "Heading 1",
      },
      {
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
        icon: <ListUl className={iconClassName} />,
        keywords: ["list", "bullet"],
        title: "Bulleted list",
      },
      {
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
        icon: <QuoteOpen className={iconClassName} />,
        keywords: ["quote", "note"],
        title: "Blockquote",
      },
      {
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              content: [
                {
                  content: [{ text: "Action item: ", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "blockquote",
            })
            .run();
        },
        icon: <Sparkles className={iconClassName} />,
        keywords: ["todo", "action", "custom"],
        title: "Action callout",
      },
    ],
    query
  );

export function SuggestionToolbar() {
  return <RichTextEditor.SuggestionMenu char="/" items={getSlashItems} />;
}
