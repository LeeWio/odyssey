"use client";

import { Button, Description, FieldError, Form, Label, Modal, NumberField } from "@heroui/react";
import type { Editor, EditorEvents } from "@tiptap/core";
import { TableMap } from "@tiptap/pm/tables";
import { useCallback, useEffect, useRef, useState } from "react";
import { applyTableAction } from "../../extensions/table/actions";
import { selectedColumnWidth } from "../../extensions/table/column-widths";
import { announceTableAction, TABLE_ACTION_STATUS } from "../../extensions/table/feedback";
import { mapMenuTarget, type MenuTarget } from "./table-target";

function widthRect(target: MenuTarget) {
  const cell = target.selected.$anchorCell,
    table = cell.node(-1),
    tableStart = cell.start(-1);
  const map = TableMap.get(table);
  return {
    ...map.rectBetween(cell.pos - tableStart, target.selected.$headCell.pos - tableStart),
    table,
    tableStart,
    map,
  };
}

/** Own the selected columns while the native dialog moves focus away from the editor. */
export function TableColumnWidthDialog({
  editor,
  target,
  isOpen,
  onClose,
}: {
  editor: Editor;
  target: MenuTarget;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [info] = useState(() => selectedColumnWidth(editor, widthRect(target)));
  const [value, setValue] = useState(info.value ?? NaN);
  const [error, setError] = useState<string>();
  const current = useRef<MenuTarget | null>(target);
  const committed = useRef(value);
  const input = useRef<HTMLInputElement>(null);
  const valid = (width: number) => Number.isSafeInteger(width) && width >= info.minimum;
  const message = `Enter a whole number of at least ${info.minimum} pixels.`;

  const dismiss = useCallback(() => {
    onClose();
    requestAnimationFrame(() => {
      if (editor.isDestroyed || !editor.isEditable) return;
      const selected = current.current?.selected;
      if (
        selected &&
        selected.$anchorCell.doc === editor.state.doc &&
        !editor.state.selection.eq(selected)
      )
        editor.view.dispatch(editor.state.tr.setSelection(selected));
      editor.view.focus();
    });
  }, [editor, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (current.current?.selected.$anchorCell.doc !== editor.state.doc) {
      dismiss();
      return;
    }
    const update = ({ transaction, appendedTransactions }: EditorEvents["transaction"]) => {
      if (!current.current) return;
      const mapped = mapMenuTarget(current.current, [transaction, ...appendedTransactions], {
        dismissOnSelectionChange: false,
      });
      if (
        mapped &&
        mapped.selected.isColSelection() &&
        widthRect(mapped).right - widthRect(mapped).left === info.count
      ) {
        current.current = mapped;
        return;
      }
      current.current = null;
      queueMicrotask(() => {
        if (editor.isDestroyed) return;
        dismiss();
        editor.view.dispatch(
          editor.state.tr
            .setMeta(TABLE_ACTION_STATUS, "Column selection changed. Reopen column widths.")
            .setMeta("addToHistory", false)
        );
      });
    };
    const editable = () => {
      if (!editor.isEditable) dismiss();
    };
    editor.on("transaction", update);
    editor.on("update", editable);
    editor.on("destroy", onClose);
    return () => {
      editor.off("transaction", update);
      editor.off("update", editable);
      editor.off("destroy", onClose);
    };
  }, [editor, isOpen, info.count, dismiss, onClose]);

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) dismiss();
        }}
      >
        <Modal.Container size="xs">
          <Modal.Dialog aria-label="Column width">
            <Modal.Header>
              <Modal.Heading>Column width</Modal.Heading>
            </Modal.Header>
            <Form
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const width = committed.current;
                if (!input.current?.value.trim() || !valid(width)) {
                  setError(message);
                  return;
                }
                const selected = current.current?.selected;
                if (
                  !editor.isEditable ||
                  !selected ||
                  selected.$anchorCell.doc !== editor.state.doc
                ) {
                  dismiss();
                  return;
                }
                editor.view.dispatch(editor.state.tr.setSelection(selected));
                const action = { width };
                if (applyTableAction(editor, "column", action)) announceTableAction(editor, action);
                dismiss();
              }}
            >
              <Modal.Body>
                <NumberField
                  autoFocus
                  isRequired
                  name="column-width"
                  variant="secondary"
                  minValue={info.minimum}
                  step={1}
                  value={value}
                  formatOptions={{ useGrouping: false, maximumFractionDigits: 0 }}
                  isInvalid={error ? true : undefined}
                  validate={(width) => (valid(width) ? null : message)}
                  onChange={(next) => {
                    committed.current = next ?? NaN;
                    setValue(next ?? NaN);
                    setError(undefined);
                  }}
                >
                  <Label>Width (px)</Label>
                  <NumberField.Group>
                    <NumberField.DecrementButton />
                    <NumberField.Input
                      ref={input}
                      placeholder={info.value === undefined ? "Mixed" : undefined}
                    />
                    <NumberField.IncrementButton />
                  </NumberField.Group>
                  <Description>
                    {info.value === undefined ? "Selected columns have different widths. " : ""}
                    Applies to {info.count} selected {info.count === 1 ? "column" : "columns"}.
                    Minimum {info.minimum} px. Arrow keys adjust by 1 px.
                  </Description>
                  <FieldError>{error}</FieldError>
                </NumberField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={dismiss}>
                  Cancel
                </Button>
                <Button type="submit">Apply</Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
