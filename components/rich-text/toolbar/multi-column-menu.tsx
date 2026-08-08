"use client";

import { Button, Dropdown, Label, Tooltip } from "@heroui/react";
import { useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { areEqualColumnWidths } from "../extensions/multi-column/column-widths";
import {
  getColumnCountAtSelection,
  getColumnWidthsAtSelection,
} from "../extensions/multi-column/columns";

interface MultiColumnCommandState {
  canRemove: boolean;
  canResetWidths: boolean;
  canUseTwoColumns: boolean;
  canUseThreeColumns: boolean;
  columnCount: 2 | 3 | null;
}

const EMPTY_COMMAND_STATE: MultiColumnCommandState = {
  canRemove: false,
  canResetWidths: false,
  canUseTwoColumns: false,
  canUseThreeColumns: false,
  columnCount: null,
};

export function MultiColumnMenu() {
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  const commandState =
    useRichTextEditorState(
      ({ editor: currentEditor }) => {
        const columnCount = getColumnCountAtSelection(currentEditor.state);
        const columnWidths = getColumnWidthsAtSelection(currentEditor.state);

        return {
          canRemove: currentEditor.can().unsetColumns(),
          canResetWidths:
            Boolean(columnWidths && !areEqualColumnWidths(columnWidths)) &&
            currentEditor.can().resetColumnWidths(),
          canUseTwoColumns: columnCount
            ? currentEditor.can().setColumnCount(2)
            : currentEditor.can().insertColumns(2),
          canUseThreeColumns: columnCount
            ? currentEditor.can().setColumnCount(3)
            : currentEditor.can().insertColumns(3),
          columnCount,
        };
      },
      (previous, next) =>
        previous?.canRemove === next?.canRemove &&
        previous?.canResetWidths === next?.canResetWidths &&
        previous?.canUseTwoColumns === next?.canUseTwoColumns &&
        previous?.canUseThreeColumns === next?.canUseThreeColumns &&
        previous?.columnCount === next?.columnCount
    ) ?? EMPTY_COMMAND_STATE;

  const unavailableKeys = [
    ...(!commandState.canUseTwoColumns ? ["cols-2"] : []),
    ...(!commandState.canUseThreeColumns ? ["cols-3"] : []),
    ...(!commandState.canResetWidths ? ["equal-widths"] : []),
    ...(!commandState.canRemove ? ["remove-columns"] : []),
  ];

  const applyColumnCount = (count: 2 | 3) => {
    if (!editor || isDisabled || isReadOnly) {
      return;
    }

    if (commandState.columnCount) {
      editor.chain().focus().setColumnCount(count).run();
      return;
    }

    editor.chain().focus().insertColumns(count).run();
  };

  const removeColumns = () => {
    if (!editor || isDisabled || isReadOnly) {
      return;
    }

    editor.chain().focus().unsetColumns().run();
  };

  const resetColumnWidths = () => {
    if (!editor || isDisabled || isReadOnly) return;

    editor.chain().focus().resetColumnWidths().run();
  };

  return (
    <Dropdown>
      <Tooltip delay={0}>
        <Button
          aria-label="Multi-column layout"
          isDisabled={!editor || isDisabled || isReadOnly}
          isIconOnly
          size="sm"
          variant={commandState.columnCount ? "secondary" : "ghost"}
        >
          <Icon aria-hidden="true" className="size-4" icon="lucide:columns" />
        </Button>
        <Tooltip.Content>Multi-column layout</Tooltip.Content>
      </Tooltip>

      <Dropdown.Popover>
        <Dropdown.Menu
          aria-label="Multi-column layout"
          disabledKeys={unavailableKeys}
          onAction={(key) => {
            if (key === "cols-2") applyColumnCount(2);
            if (key === "cols-3") applyColumnCount(3);
            if (key === "equal-widths") resetColumnWidths();
            if (key === "remove-columns") removeColumns();
          }}
        >
          <Dropdown.Item id="cols-2" textValue="2 columns">
            <Icon
              aria-hidden="true"
              className="text-muted size-4"
              data-slot="icon"
              icon="lucide:columns-2"
            />
            <Label>2 Columns</Label>
            {commandState.columnCount === 2 && (
              <>
                <Icon aria-hidden="true" className="ms-auto size-4" icon="gravity-ui:check" />
                <span className="sr-only">Current layout</span>
              </>
            )}
          </Dropdown.Item>
          <Dropdown.Item id="cols-3" textValue="3 columns">
            <Icon
              aria-hidden="true"
              className="text-muted size-4"
              data-slot="icon"
              icon="lucide:columns-3"
            />
            <Label>3 Columns</Label>
            {commandState.columnCount === 3 && (
              <>
                <Icon aria-hidden="true" className="ms-auto size-4" icon="gravity-ui:check" />
                <span className="sr-only">Current layout</span>
              </>
            )}
          </Dropdown.Item>
          <Dropdown.Item id="equal-widths" textValue="Equal column widths">
            <Icon
              aria-hidden="true"
              className="text-muted size-4"
              data-slot="icon"
              icon="lucide:equal"
            />
            <Label>Equal Widths</Label>
          </Dropdown.Item>
          <Dropdown.Item id="remove-columns" textValue="Remove columns">
            <Icon
              aria-hidden="true"
              className="text-muted size-4"
              data-slot="icon"
              icon="gravity-ui:xmark"
            />
            <Label>Remove Columns</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
