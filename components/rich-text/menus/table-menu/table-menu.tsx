"use client";

import { Button, Dropdown, Header, Label, Tooltip } from "@heroui/react";
import {
  RichTextEditor,
  useRichTextEditor,
  useRichTextEditorState,
} from "@heroui-pro/react/rich-text-editor";
import { Icon } from "@iconify/react";
import { isInTable, CellSelection, selectionCell } from "@tiptap/pm/tables";
import { useCallback, useEffect, useRef } from "react";

import type { ShouldShowProps } from "../types";
import { BubbleMenu } from "../bubble-menu";

const sections = [
  {
    label: "Cells",
    actions: [
      { command: "selectRow", label: "Select row" },
      { command: "selectColumn", label: "Select column" },
      { command: "toggleHeaderRow", label: "Toggle header row" },
      { command: "mergeOrSplit", label: "Merge or split cells" },
    ],
  },
  {
    label: "Rows",
    actions: [
      { command: "addRowBefore", label: "Add row above" },
      { command: "addRowAfter", label: "Add row below" },
      { command: "deleteRow", label: "Delete row" },
    ],
  },
  {
    label: "Columns",
    actions: [
      { command: "addColumnBefore", label: "Add column before" },
      { command: "addColumnAfter", label: "Add column after" },
      { command: "deleteColumn", label: "Delete column" },
    ],
  },
] as const;

export function TableMenu() {
  const { editor } = useRichTextEditor();
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!editor) return;
    const element = editor.view.dom;
    const focusTableActions = (event: KeyboardEvent) => {
      if (event.key === "F10" && event.altKey && trigger.current?.isConnected) {
        event.preventDefault();
        trigger.current.focus();
      }
    };
    element.addEventListener("keydown", focusTableActions);
    return () => element.removeEventListener("keydown", focusTableActions);
  }, [editor]);
  const tableState = useRichTextEditorState(({ editor }) => {
    if (!editor || !isInTable(editor.state)) return null;
    const can = editor.can();
    return {
      cellRangeSelected: editor.state.selection instanceof CellSelection,
      disabledCommands: sections.flatMap(({ actions }) =>
        actions.flatMap(({ command }) =>
          command === "selectRow" || command === "selectColumn" || can[command]() ? [] : [command]
        )
      ),
      canDelete: can.deleteTable(),
    };
  });
  const shouldShow = useCallback(
    ({ editor, element, view }: ShouldShowProps) =>
      editor.isEditable &&
      !view.isDestroyed &&
      !view.dragging &&
      isInTable(editor.state) &&
      (editor.state.selection.empty || editor.state.selection instanceof CellSelection) &&
      (view.hasFocus() || element.contains(document.activeElement)),
    []
  );

  if (!editor) return null;

  return (
    <BubbleMenu
      aria-label="Table actions"
      pluginKey="table-menu"
      shouldShow={shouldShow}
      toolbarProps={{ className: "max-w-[calc(100vw-1rem)] scrollbar-none overflow-x-auto" }}
    >
      {tableState?.cellRangeSelected ? (
        <RichTextEditor.CommandButton
          aria-label="Merge or split cells"
          tooltip="Merge or split cells"
          isDisabled={(currentEditor) => !currentEditor.can().mergeOrSplit()}
          onCommand={(currentEditor) => currentEditor.chain().focus().mergeOrSplit().run()}
        >
          <Icon icon="gravity-ui:arrow-merge" aria-hidden="true" />
        </RichTextEditor.CommandButton>
      ) : null}
      <Dropdown>
        <Tooltip>
          <Button
            ref={trigger}
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Table options"
            aria-keyshortcuts="Alt+F10"
          >
            <Icon icon="gravity-ui:table" aria-hidden="true" />
          </Button>
          <Tooltip.Content>Table options</Tooltip.Content>
        </Tooltip>
        <Dropdown.Popover placement="bottom start">
          <Dropdown.Menu aria-label="Table options">
            {sections.map(({ label, actions }) => (
              <Dropdown.Section key={label}>
                <Header>{label}</Header>
                {actions.map(({ command, label }) => {
                  const select = command === "selectRow" || command === "selectColumn";
                  return (
                    <Dropdown.Item
                      key={command}
                      id={command}
                      textValue={label}
                      isDisabled={
                        !tableState || (!select && tableState.disabledCommands.includes(command))
                      }
                      onAction={() => {
                        if (!isInTable(editor.state)) return;
                        if (select) {
                          const cell = selectionCell(editor.state);
                          const selection =
                            command === "selectRow"
                              ? CellSelection.rowSelection(cell)
                              : CellSelection.colSelection(cell);
                          editor.view.dispatch(editor.state.tr.setSelection(selection));
                          editor.commands.focus();
                        } else {
                          editor.chain().focus()[command]().run();
                        }
                      }}
                    >
                      <Label>{label}</Label>
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Section>
            ))}
            <Dropdown.Item
              id="deleteTable"
              variant="danger"
              isDisabled={!tableState?.canDelete}
              onAction={() => editor.chain().focus().deleteTable().run()}
            >
              <Label>Delete table</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </BubbleMenu>
  );
}
