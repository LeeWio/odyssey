import {
  Attachment,
  Audio,
  Columns,
  DetailsKit,
  Emoji,
  Image,
  ImageUpload,
  MotionKit,
  TableKit,
  createTableOfContents,
} from ".";
import { FileHandler } from "./FileHandler";
import type { AnyExtension } from "@tiptap/core";
import type { TableOfContentsOptions } from "@tiptap/extension-table-of-contents";
import { TaskItem } from "@tiptap/extension-list";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FindAndReplace } from "@tiptap/extension-find-and-replace";
import { Markdown } from "@tiptap/markdown";

import { createDocumentExtensions, createDocumentStarterKit } from "./reading-schema";
import { TaskItemNodeView } from "./task-list/task-item-node-view";

const HeroUITaskItem = TaskItem.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemNodeView, {
      as: "li",
      className: "flex items-start gap-2",
      attrs: ({ node }) => ({
        "data-type": "taskItem",
        "data-checked": String(Boolean(node.attrs.checked)),
      }),
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

  // The interactive replacements extend the same node definitions used by SSR.
  const nodeViews: AnyExtension[] = [
    Image,
    ImageUpload,
    Audio,
    Attachment,
    Columns,
    TableKit,
    HeroUITaskItem.configure({
      nested: true,
      a11y: {
        checkboxLabel: (node, checked) =>
          `${checked ? "Mark incomplete" : "Mark complete"}: ${node.textContent || "empty task"}`,
      },
    }),
    ...(emojiSuggestion ? [Emoji] : []),
  ];
  const replacements = new Map(nodeViews.map((extension) => [extension.name, extension]));
  const schema = createDocumentExtensions().map((extension) =>
    (replacements.get(extension.name) ?? extension).configure({})
  );

  return [
    ...schema,
    ...DetailsKit.filter((extension) => !schema.some(({ name }) => name === extension.name)).map(
      (extension) => extension.configure({})
    ),
    ...(fileHandler ? [FileHandler.configure({})] : []),
    ...(findAndReplace ? [FindAndReplace.configure({ searchDebounceMs: 0 })] : []),
    ...(markdown ? [Markdown.configure({ markedOptions: { gfm: true } })] : []),
    ...createTableOfContents(tableOfContents),
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
  const extensions = createExtensionKit({
    ...READER_EXTENSION_KIT_OPTIONS,
    ...options,
  });

  return [...extensions, MotionKit];
}

/**
 * Extensions used by non-editor content conversion helpers.
 * RichTextEditor injects these base extensions itself at runtime.
 */
export function createConversionExtensions() {
  return [createDocumentStarterKit(), ...createDocumentExtensions()];
}
