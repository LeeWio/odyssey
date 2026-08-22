import {
  BlockFormatTransition,
  Attachment,
  Audio,
  CodeBlockLowlight,
  Column,
  Columns,
  DetailsKit,
  Emoji,
  Indent,
  Image,
  MediaFileHandler,
  Mathematics,
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
import { FindAndReplace } from "@tiptap/extension-find-and-replace";
import { Markdown } from "@tiptap/markdown";

export interface ExtensionKitOptions {
  tableOfContents?: Partial<TableOfContentsOptions>;
}

export function createExtensionKit(options: ExtensionKitOptions = {}) {
  return [
    BlockFormatTransition,
    CodeBlockLowlight,
    ...DetailsKit,
    Emoji,
    Image,
    Audio,
    Attachment,
    Youtube,
    MediaFileHandler,
    Mathematics,
    Typography,
    TaskList.configure({
      HTMLAttributes: {
        class: "odyssey-task-list",
      },
    }),
    TaskItem.configure({
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
