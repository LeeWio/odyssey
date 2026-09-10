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
}

export function createExtensionKit(options: ExtensionKitOptions = {}) {
  return [
    ...DetailsKit,
    Emoji,
    Image,
    Audio,
    Attachment,
    Youtube,
    MediaFileHandler,
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
    FindAndReplace.configure({
      searchDebounceMs: 0,
    }),
    Subscript,
    Superscript,
    TextAlign,
    TextStyleKit,
    Indent,
    Column,
    Columns,
    Markdown.configure({
      markedOptions: {
        gfm: true,
      },
    }),
    TableKit,
    createTableOfContents(options.tableOfContents),
  ];
}

export const ExtensionKit = createExtensionKit();

/**
 * Extensions used by non-editor content conversion helpers.
 * RichTextEditor injects these base extensions itself at runtime.
 */
export function createConversionExtensions() {
  return [StarterKit.configure({ heading: { levels: [1, 2, 3] } }), ...createExtensionKit()];
}
