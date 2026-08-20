"use client";

import {
  RichTextEditor,
  Segment,
  useRichTextEditor,
  useRichTextEditorState,
} from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import type { Editor } from "@tiptap/react";
import { useCallback } from "react";

import {
  getActiveColumnLayoutPreset,
  getColumnLayoutPresetWidths,
  type ColumnLayoutPreset,
} from "../../extensions/multi-column/column-widths";
import {
  getColumnCountAtSelection,
  getColumnWidthsAtSelection,
} from "../../extensions/multi-column/columns";
import type { ShouldShowProps } from "../types";

const COLUMN_LAYOUT_OPTIONS: ReadonlyArray<{
  label: string;
  preset: ColumnLayoutPreset;
}> = [
  { label: "Equal", preset: "equal" },
  { label: "Left", preset: "left" },
  { label: "Center", preset: "center" },
  { label: "Right", preset: "right" },
];

function getColumnsElement(editor: Editor) {
  const { from } = editor.state.selection;
  const domAtPosition = editor.view.domAtPos(from).node;
  const element =
    domAtPosition instanceof HTMLElement ? domAtPosition : domAtPosition.parentElement;

  return element?.closest<HTMLElement>('[data-type="columns"]') ?? null;
}

export function ColumnsMenu() {
  const { editor } = useRichTextEditor();
  const columnState = useRichTextEditorState(({ editor: currentEditor }) => {
    const count = getColumnCountAtSelection(currentEditor.state);
    const widths = getColumnWidthsAtSelection(currentEditor.state);

    return {
      activePreset: widths ? getActiveColumnLayoutPreset(widths) : null,
      count,
    };
  });

  const shouldShow = useCallback(
    ({ editor: currentEditor, element, state, view }: ShouldShowProps) => {
      if (!currentEditor.isEditable || currentEditor.view.dragging || view.isDestroyed) {
        return false;
      }

      const menuHasFocus = element.contains(document.activeElement);

      return (
        state.selection.empty &&
        (view.hasFocus() || menuHasFocus) &&
        getColumnCountAtSelection(state) !== null
      );
    },
    []
  );

  const setColumnCount = useCallback(
    (count: 2 | 3) => {
      editor?.commands.setColumnCount(count);
    },
    [editor]
  );
  const columnCount = columnState?.count ?? null;

  const setLayoutPreset = useCallback(
    (preset: ColumnLayoutPreset) => {
      if (!editor || !columnCount) return;

      const widths = getColumnLayoutPresetWidths(columnCount, preset);

      if (widths) {
        editor.commands.setColumnWidths(widths);
      }
    },
    [columnCount, editor]
  );

  if (!editor) return null;

  const availableLayoutOptions = COLUMN_LAYOUT_OPTIONS.filter(
    ({ preset }) => columnCount === 3 || preset !== "center"
  );

  return (
    <RichTextEditor.BubbleMenu
      aria-label="Column layout actions"
      pluginKey="columns-menu"
      shouldShow={shouldShow}
      appendTo={() =>
        (document.querySelector("[data-slot='modal-dialog']") as HTMLElement) || document.body
      }
      getReferencedVirtualElement={() => getColumnsElement(editor)}
    >
      <RichTextEditor.ToolbarGroup aria-label="Column layout actions">
        <Segment
          aria-label="Column count"
          selectedKey={columnCount ? String(columnCount) : null}
          size="sm"
          variant="default"
          onSelectionChange={(key) => {
            const count = Number(key);

            if (count === 2 || count === 3) setColumnCount(count);
          }}
        >
          <Segment.Item aria-label="Two columns" id="2">
            <Icon aria-hidden="true" icon="gravity-ui:layout-split-columns" />
          </Segment.Item>
          <Segment.Item aria-label="Three columns" id="3">
            <Icon aria-hidden="true" icon="gravity-ui:layout-split-columns-3" />
          </Segment.Item>
        </Segment>

        <Segment
          aria-label="Column width preset"
          selectedKey={columnState?.activePreset}
          size="sm"
          onSelectionChange={(key) => setLayoutPreset(String(key) as ColumnLayoutPreset)}
        >
          {availableLayoutOptions.map(({ label, preset }) => (
            <Segment.Item key={preset} id={preset}>
              {label}
            </Segment.Item>
          ))}
        </Segment>

        <RichTextEditor.CommandButton
          aria-label="Remove column layout"
          tooltip="Remove column layout"
          variant="danger"
          onCommand={(editor) => editor.chain().focus().unsetColumns().run()}
        >
          <Icon aria-hidden="true" icon="gravity-ui:scissors" />
        </RichTextEditor.CommandButton>
      </RichTextEditor.ToolbarGroup>
    </RichTextEditor.BubbleMenu>
  );
}
