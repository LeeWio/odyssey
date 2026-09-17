import {
  Attachment,
  Audio,
  Column,
  Columns,
  DetailsKit,
  Emoji,
  Indent,
  Image,
  MediaFileHandler,
  Mathematics,
  Mention,
  Subscript,
  Superscript,
  TableKit,
  TextAlign,
  TextStyleKit,
  Typography,
  Youtube,
  createTableOfContents,
} from ".";
import type { TableOfContentsOptions } from "@tiptap/extension-table-of-contents";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FindAndReplace } from "@tiptap/extension-find-and-replace";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";

import { EmojiBase } from "./emoji/emoji-base";
import { TaskItemNodeView } from "./task-list/task-item-node-view";

const HeroUITaskItem = TaskItem.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemNodeView, {
      as: "li",
      className: "flex items-start gap-2",
    });
  },
});

export interface ExtensionKitOptions {
  tableOfContents?: Partial<TableOfContentsOptions>;
  /** Inline emoji suggestion picker. Default true for the editor. */
  emojiSuggestion?: boolean;
  /** Drag/drop and paste file handler. Default true for the editor. */
  fileHandler?: boolean;
  /** Find-and-replace plugin. Default true for the editor. */
  findAndReplace?: boolean;
  /** Markdown import/export extension. Default true for the editor. */
  markdown?: boolean;
}

/**
 * Single TipTap extension factory for reading and editing.
 * Turn off edit-only plugins for read surfaces; schema nodes stay shared.
 */
export function createExtensionKit(options: ExtensionKitOptions = {}) {
  const {
    tableOfContents,
    emojiSuggestion = true,
    fileHandler = true,
    findAndReplace = true,
    markdown = true,
  } = options;

  return [
    ...DetailsKit,
    emojiSuggestion ? Emoji : EmojiBase,
    Image,
    Audio,
    Attachment,
    Youtube,
    ...(fileHandler ? [MediaFileHandler] : []),
    Mathematics,
    Mention,
    Typography,
    TaskList.configure({
      HTMLAttributes: {
        class: "odyssey-task-list my-3 list-none space-y-1 pl-0",
      },
    }),
    HeroUITaskItem.configure({
      nested: true,
      HTMLAttributes: {
        class: "odyssey-task-item",
      },
      a11y: {
        checkboxLabel: (node, checked) =>
          `${checked ? "Mark incomplete" : "Mark complete"}: ${node.textContent || "empty task"}`,
      },
    }),
    ...(findAndReplace
      ? [
          FindAndReplace.configure({
            searchDebounceMs: 0,
          }),
        ]
      : []),
    Subscript,
    Superscript,
    TextAlign,
    TextStyleKit,
    Indent,
    Column,
    Columns,
    ...(markdown
      ? [
          Markdown.configure({
            markedOptions: {
              gfm: true,
            },
          }),
        ]
      : []),
    TableKit,
    createTableOfContents(tableOfContents),
  ];
}

/** Default editable kit. */
export const ExtensionKit = createExtensionKit();

/**
 * Read-oriented kit: same schema nodes, without edit-only plugins.
 * Prefer this from article readers while still sharing createExtensionKit.
 */
export const ReaderExtensionKit = createExtensionKit({
  emojiSuggestion: false,
  fileHandler: false,
  findAndReplace: false,
  markdown: false,
});

/**
 * Extensions used by non-editor content conversion helpers.
 * RichTextEditor injects these base extensions itself at runtime.
 */
export function createConversionExtensions() {
  return [StarterKit.configure({ heading: { levels: [1, 2, 3] } }), ...createExtensionKit()];
}
