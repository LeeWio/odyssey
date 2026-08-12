"use client";

import { RichTextEditor, useRichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useCallback } from "react";

import type { ShouldShowProps } from "../types";

export function TableMenu() {
  const { editor } = useRichTextEditor();

  const shouldShow = useCallback(({ editor: currentEditor, element, view }: ShouldShowProps) => {
    if (!currentEditor.isEditable || currentEditor.view.dragging || view.isDestroyed) {
      return false;
    }

    return currentEditor.isActive("table") || element.contains(document.activeElement);
  }, []);

  if (!editor) return null;

  return (
    <RichTextEditor.BubbleMenu
      aria-label="Table actions"
      pluginKey="table-menu"
      shouldShow={shouldShow}
      appendTo={() =>
        (document.querySelector("[data-slot='modal-dialog']") as HTMLElement) || document.body
      }
      toolbarProps={{ className: "max-w-[calc(100vw-1rem)] scrollbar-none overflow-x-auto" }}
    >
      <RichTextEditor.ToolbarGroup aria-label="Table structure">
        <RichTextEditor.CommandButton
          aria-label="Toggle header row"
          tooltip="Toggle header row"
          isActive={(currentEditor) => currentEditor.isActive("tableHeader")}
          isDisabled={(currentEditor) => !currentEditor.can().toggleHeaderRow()}
          onCommand={(currentEditor) => currentEditor.chain().focus().toggleHeaderRow().run()}
        >
          <Icon aria-hidden="true" icon="gravity-ui:layout-header-cells-large" />
        </RichTextEditor.CommandButton>

        <RichTextEditor.CommandButton
          aria-label="Merge or split cells"
          tooltip="Merge or split cells"
          isDisabled={(currentEditor) => !currentEditor.can().mergeOrSplit()}
          onCommand={(currentEditor) => currentEditor.chain().focus().mergeOrSplit().run()}
        >
          <Icon aria-hidden="true" icon="gravity-ui:arrow-merge" />
        </RichTextEditor.CommandButton>
      </RichTextEditor.ToolbarGroup>

      <RichTextEditor.ToolbarSeparator />

      <RichTextEditor.ToolbarGroup aria-label="Table rows">
        <RichTextEditor.CommandButton
          aria-label="Add row above"
          tooltip="Add row above"
          isDisabled={(currentEditor) => !currentEditor.can().addRowBefore()}
          onCommand={(currentEditor) => currentEditor.chain().focus().addRowBefore().run()}
        >
          <Icon aria-hidden="true" icon="gravity-ui:arrow-up" />
        </RichTextEditor.CommandButton>
        <RichTextEditor.CommandButton
          aria-label="Add row below"
          tooltip="Add row below"
          isDisabled={(currentEditor) => !currentEditor.can().addRowAfter()}
          onCommand={(currentEditor) => currentEditor.chain().focus().addRowAfter().run()}
        >
          <Icon aria-hidden="true" icon="gravity-ui:arrow-down" />
        </RichTextEditor.CommandButton>
        <RichTextEditor.CommandButton
          aria-label="Delete row"
          tooltip="Delete row"
          isDisabled={(currentEditor) => !currentEditor.can().deleteRow()}
          onCommand={(currentEditor) => currentEditor.chain().focus().deleteRow().run()}
        >
          <Icon aria-hidden="true" className="text-danger" icon="gravity-ui:minus" />
        </RichTextEditor.CommandButton>
      </RichTextEditor.ToolbarGroup>

      <RichTextEditor.ToolbarSeparator />

      <RichTextEditor.ToolbarGroup aria-label="Table columns">
        <RichTextEditor.CommandButton
          aria-label="Add column before"
          tooltip="Add column before"
          isDisabled={(currentEditor) => !currentEditor.can().addColumnBefore()}
          onCommand={(currentEditor) => currentEditor.chain().focus().addColumnBefore().run()}
        >
          <Icon aria-hidden="true" icon="gravity-ui:arrow-left" />
        </RichTextEditor.CommandButton>
        <RichTextEditor.CommandButton
          aria-label="Add column after"
          tooltip="Add column after"
          isDisabled={(currentEditor) => !currentEditor.can().addColumnAfter()}
          onCommand={(currentEditor) => currentEditor.chain().focus().addColumnAfter().run()}
        >
          <Icon aria-hidden="true" icon="gravity-ui:arrow-right" />
        </RichTextEditor.CommandButton>
        <RichTextEditor.CommandButton
          aria-label="Delete column"
          tooltip="Delete column"
          isDisabled={(currentEditor) => !currentEditor.can().deleteColumn()}
          onCommand={(currentEditor) => currentEditor.chain().focus().deleteColumn().run()}
        >
          <Icon aria-hidden="true" className="text-danger" icon="gravity-ui:minus" />
        </RichTextEditor.CommandButton>
      </RichTextEditor.ToolbarGroup>

      <RichTextEditor.ToolbarSeparator />

      <RichTextEditor.ToolbarGroup aria-label="Table removal">
        <RichTextEditor.CommandButton
          aria-label="Delete table"
          tooltip="Delete table"
          isDisabled={(currentEditor) => !currentEditor.can().deleteTable()}
          onCommand={(currentEditor) => currentEditor.chain().focus().deleteTable().run()}
        >
          <Icon aria-hidden="true" className="text-danger" icon="gravity-ui:trash-bin" />
        </RichTextEditor.CommandButton>
      </RichTextEditor.ToolbarGroup>
    </RichTextEditor.BubbleMenu>
  );
}
