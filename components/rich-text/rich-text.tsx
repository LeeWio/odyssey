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
import { TextMenu } from "./menus/text-menu/text-menu";
import { RichTextTableOfContents } from "./table-of-contents";

export interface RichTextProps {
  content?: JSONContent;
  onReady?: (editor: Editor) => void;
  showTableOfContents?: boolean;
}

export function RichText({ content, onReady, showTableOfContents = false }: RichTextProps) {
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
        onCreate: ({ editor }) => {
          onReady?.(editor);
        },
      }}
      isReadOnly={isReadOnly}
      defaultValue={defaultValue}
      className="flex h-full w-full flex-col overflow-hidden"
    >
      <RichTextEditor.Shell className="relative flex h-full flex-1 flex-col overflow-hidden border-none bg-transparent">
        <FixedToolbar />
        <TextMenu />
        <ImageMenu />
        <ColumnsMenu />
        <RichTextEditor.Content
          id={scrollContainerId}
          className="min-h-0 flex-1 scrollbar-none overflow-y-auto outline-none focus:outline-none [&_.ProseMirror-selectednode]:outline-none [&.resize-cursor]:cursor-col-resize"
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

        {/* <RichTextEditor.Footer className="flex shrink-0 items-center justify-between select-none">
          <span>JSON-first editor state</span>
          <RichTextEditor.CharacterCount showWords />
        </RichTextEditor.Footer> */}
      </RichTextEditor.Shell>
    </RichTextEditor>
  );
}
