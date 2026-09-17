import {
  Attachment,
  Audio,
  Column,
  Columns,
  DetailsKit,
  Emoji,
  Indent,
  Image,
  ImageUpload,
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
import { createMediaFileHandler } from "./FileHandler";
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

  // Clone module-level extensions so each editor gets isolated plugin state.
  // Matches the tiptap-templates pattern of building kits via a factory call.
  return [
    ...DetailsKit.map((extension) => extension.configure({})),
    (emojiSuggestion ? Emoji : EmojiBase).configure({}),
    Image.configure({}),
    ImageUpload,
    Audio.configure({}),
    Attachment.configure({}),
    Youtube.configure({}),
    ...(fileHandler ? [createMediaFileHandler()] : []),
    Mathematics.configure({}),
    Mention.configure({}),
    Typography.configure({}),
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
    Subscript.configure({}),
    Superscript.configure({}),
    TextAlign.configure({}),
    TextStyleKit.configure({}),
    Indent.configure({}),
    Column.configure({}),
    Columns.configure({}),
    ...(markdown
      ? [
          Markdown.configure({
            markedOptions: {
              gfm: true,
            },
          }),
        ]
      : []),
    TableKit.configure({}),
    createTableOfContents(tableOfContents),
  ];
}

/** Default options for read-only surfaces (schema shared, edit plugins off). */
export const READER_EXTENSION_KIT_OPTIONS: ExtensionKitOptions = {
  emojiSuggestion: false,
  fileHandler: false,
  findAndReplace: false,
  markdown: false,
};

/**
 * Build a fresh read-oriented kit. Never reuse the returned array across
 * editor instances — TipTap extensions hold per-editor state.
 */
export function createReaderExtensionKit(options: ExtensionKitOptions = {}) {
  return createExtensionKit({
    ...READER_EXTENSION_KIT_OPTIONS,
    ...options,
  });
}

/**
 * Extensions used by non-editor content conversion helpers.
 * RichTextEditor injects these base extensions itself at runtime.
 */
export function createConversionExtensions() {
  return [StarterKit.configure({ heading: { levels: [1, 2, 3] } }), ...createExtensionKit()];
}
