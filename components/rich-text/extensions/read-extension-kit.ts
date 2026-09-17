import {
  Attachment,
  Audio,
  Column,
  Columns,
  DetailsKit,
  Indent,
  Image,
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
import TiptapEmoji from "@tiptap/extension-emoji";

import { TaskItemNodeView } from "./task-list/task-item-node-view";

import "katex/dist/katex.min.css";

const HeroUITaskItem = TaskItem.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemNodeView, {
      as: "li",
      className: "flex items-start gap-2",
    });
  },
});

/** Emoji node without suggestion UI — enough for read-only rendering. */
const ReadEmoji = TiptapEmoji.configure({
  enableEmoticons: false,
  forceFallbackImages: false,
});

export interface ReadExtensionKitOptions {
  tableOfContents?: Partial<TableOfContentsOptions>;
}

/**
 * Schema + node views needed to render published documents.
 * Kept in a separate module so article routes do not pull edit-only TipTap deps.
 */
export function createReadExtensionKit(options: ReadExtensionKitOptions = {}) {
  return [
    ...DetailsKit,
    ReadEmoji,
    Image,
    Audio,
    Attachment,
    Youtube,
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
    Subscript,
    Superscript,
    TextAlign,
    TextStyleKit,
    Indent,
    Column,
    Columns,
    TableKit,
    createTableOfContents(options.tableOfContents),
  ];
}

export const ReadExtensionKit = createReadExtensionKit();
