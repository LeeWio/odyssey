"use client";

import { RichTextEditor } from "@heroui-pro/react";
import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import type { Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/react";
import { useId, useMemo, useState } from "react";
import { selectRichTextState } from "@/lib/features";
import { useAppSelector } from "@/lib/hooks";
import { FixedToolbar } from "./toolbar/fixed-toolbar";
import { SuggestionToolbar } from "./toolbar/suggestion-toolbar";
import { ExtensionKit, createExtensionKit } from "./extensions/extension-kit";
import { ColumnsMenu } from "./menus/columns-menu/columns-menu";
import { ImageMenu } from "./menus/image-menu/image-menu";
import { LinkMenu } from "./menus/link-menu/link-menu";
import { MathMenu } from "./menus/math-menu";
import { TableMenu } from "./menus/table-menu/table-menu";
import { TextMenu } from "./menus/text-menu/text-menu";
import { RichTextTableOfContents } from "./table-of-contents";
import { EditorFooter } from "./editor-footer";
import { ContentItemMenu } from "./menus/content-item-menu";
import { MediaInsertDialog } from "./media-insert-dialog";

export interface RichTextProps {
  content?: JSONContent;
  isDisabled?: boolean;
  onContentError?: (error: Error) => void;
  onReady?: (editor: Editor) => void;
  onUpdate?: (editor: Editor) => void;
  showTableOfContents?: boolean;
}

export function RichText({
  content,
  isDisabled = false,
  onContentError,
  onReady,
  onUpdate,
  showTableOfContents = false,
}: RichTextProps) {
  const { initialValue, isReadOnly } = useAppSelector(selectRichTextState);
  const scrollContainerId = useId();
  const [tableOfContentsItems, setTableOfContentsItems] = useState<TableOfContentData>([]);
  const extensions = useMemo(
    () =>
      showTableOfContents
        ? createExtensionKit({
            tableOfContents: {
              onUpdate: setTableOfContentsItems,
              scrollParent: () => document.getElementById(scrollContainerId) ?? window,
            },
          })
        : ExtensionKit,
    [scrollContainerId, showTableOfContents]
  );

  const defaultValue = content || initialValue || undefined;

  return (
    <RichTextEditor
      extensions={extensions}
      editorOptions={{
        autofocus: true,
        enableContentCheck: true,
        onCreate: ({ editor }) => {
          onReady?.(editor);
        },
        onContentError: ({ error }) => {
          onContentError?.(error);
        },
        onUpdate: ({ editor }) => {
          onUpdate?.(editor);
        },
      }}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      defaultValue={defaultValue}
      className="flex h-full w-full flex-col overflow-hidden"
    >
      <RichTextEditor.Shell className="relative flex h-full flex-1 flex-col overflow-hidden border-none bg-transparent">
        <FixedToolbar />
        <TextMenu />
        <LinkMenu />
        <ImageMenu />
        <TableMenu />
        <MathMenu />
        <ColumnsMenu />
        <ContentItemMenu />
        <MediaInsertDialog />
        <RichTextEditor.Content
          id={scrollContainerId}
          className="[&_.ProseMirror-selectednode]:outline-accent/40 min-h-0 flex-1 scrollbar-none overflow-y-auto outline-none focus:outline-none [&_.ProseMirror-selectednode]:rounded-md [&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-offset-2 [&.resize-cursor]:cursor-col-resize"
        />
        {showTableOfContents && (
          <RichTextTableOfContents
            items={tableOfContentsItems}
            maxHeadingLevel={2}
            position="container"
            scrollMode="editor"
            triggerMode="press"
            updateLocationHash={false}
          />
        )}
        <SuggestionToolbar />
        <EditorFooter />
      </RichTextEditor.Shell>
    </RichTextEditor>
  );
}
