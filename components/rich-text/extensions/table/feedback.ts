import type { Editor } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";
import { CellSelection, selectedRect } from "@tiptap/pm/tables";
import type { TableAction } from "./actions";
import type { TablePasteFailure } from "./clipboard";

export const TABLE_ACTION_STATUS = "table-action-status";

export function tableSelectionStatus(state: EditorState): string {
  const selection = state.selection;
  if (!(selection instanceof CellSelection)) return "";
  const { top, bottom, left, right } = selectedRect(state);
  const cells = (bottom - top) * (right - left);
  if (selection.isRowSelection() && selection.isColSelection())
    return `All ${cells} cells selected, ${bottom - top} rows and ${right - left} columns.`;
  if (selection.isRowSelection())
    return `${bottom - top} ${bottom - top === 1 ? "row" : "rows"} selected, rows ${top + 1} to ${bottom}.`;
  if (selection.isColSelection())
    return `${right - left} ${right - left === 1 ? "column" : "columns"} selected, columns ${left + 1} to ${right}.`;
  return `${cells} ${cells === 1 ? "cell" : "cells"} selected, rows ${top + 1} to ${bottom}, columns ${left + 1} to ${right}.`;
}

export function tablePasteFailureMessage(failure: TablePasteFailure): string {
  switch (failure.reason) {
    case "text-limit":
      return "Table paste was not inserted. Paste at most 1,000,000 characters at a time.";
    case "cell-limit":
      return "Table paste was not inserted. Paste at most 10,000 cells and keep the resulting table within this limit.";
    case "invalid-format":
      return "Table paste was not inserted. Check the quoted fields or copy a smaller range from your spreadsheet.";
  }
}

const actionMessages: Record<Exclude<TableAction, { attribute: string }>, string> = {
  header: "Table headers updated.",
  "move-before": "Selection moved earlier.",
  "move-after": "Selection moved later.",
  "insert-before": "Table band inserted before the selection.",
  "insert-after": "Table band inserted after the selection.",
  clear: "Selected table contents cleared.",
  duplicate: "Selected table band duplicated.",
  delete: "Selected table band deleted.",
  "delete-table": "Table deleted.",
  "sort-asc": "Column sorted ascending.",
  "sort-desc": "Column sorted descending.",
  merge: "Selected cells merged.",
  split: "Cell split.",
  "distribute-columns": "Selected columns distributed evenly.",
  "reset-column-widths": "Selected column widths reset.",
  "fit-columns": "Selected columns fitted to content.",
};

export function announceTableAction(editor: Editor, action: TableAction | "selection-moved") {
  const message =
    action === "selection-moved"
      ? "Selected table band moved."
      : typeof action === "object"
        ? "Selected cell formatting updated."
        : actionMessages[action];
  editor.view.dispatch(
    editor.state.tr.setMeta(TABLE_ACTION_STATUS, message).setMeta("addToHistory", false)
  );
}
