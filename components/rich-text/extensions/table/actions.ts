import { setSelectedColumnWidths } from "./column-widths";
import type { Editor } from "@tiptap/core";
import { closeHistory } from "@tiptap/pm/history";
import { Fragment, type Node, type ResolvedPos } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  CellSelection,
  columnIsHeader,
  deleteCellSelection,
  deleteColumn,
  deleteRow,
  deleteTable,
  mergeCells,
  rowIsHeader,
  selectedRect,
  splitCell,
  TableMap,
  tableNodeTypes,
  type TableRect,
} from "@tiptap/pm/tables";

type Axis = "row" | "column";
export type TableTargetKind = Axis | "cell";
type FormatAction = {
  attribute: "align" | "verticalAlign" | "cellTextColor" | "cellBackgroundColor";
  value: string | null;
};
export type TableAction =
  | FormatAction
  | "header"
  | "move-before"
  | "move-after"
  | "insert-before"
  | "insert-after"
  | "clear"
  | "duplicate"
  | "delete"
  | "delete-table"
  | "sort-asc"
  | "sort-desc"
  | "merge"
  | "split"
  | "distribute-columns"
  | "reset-column-widths"
  | "fit-columns";

type Band = { start: number; end: number };
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

// Image uploads keep the active request in their node view, including when fileKey is null.
// Audio and attachment uploads use an editor-local uploadId until the file is committed.
const containsUpload = new WeakMap<Node, boolean>();
function hasUpload(node: Node): boolean {
  const cached = containsUpload.get(node);
  if (cached !== undefined) return cached;
  const pending =
    node.type.name === "imageUpload" ||
    typeof node.attrs.uploadId === "string" ||
    node.children.some(hasUpload);
  containsUpload.set(node, pending);
  return pending;
}

function indexes(start: number, end: number) {
  return Array.from({ length: end - start }, (_, i) => i + start);
}

function spanCrossesBoundary(map: TableMap, axis: Axis, index: number) {
  const stride = axis === "row" ? map.width : 1;
  const size = axis === "row" ? map.width : map.height;
  for (let i = 0; i < size; i++) {
    const slot = axis === "row" ? index * map.width + i : i * map.width + index;
    if (map.map[slot] === map.map[slot - stride]) return true;
  }
  return false;
}

/** The smallest complete group that can be moved or copied without cutting a merged cell. */
export function tableAxisRange(map: TableMap, axis: Axis, index: number): Band {
  const count = axis === "row" ? map.height : map.width;
  let start = index;
  let end = index + 1;
  while (start > 0 && spanCrossesBoundary(map, axis, start)) start--;
  while (end < count && spanCrossesBoundary(map, axis, end)) end++;
  return { start, end };
}

export function axisSelection(
  doc: Node,
  tableStart: number,
  map: TableMap,
  axis: Axis,
  band: Band
) {
  const first = axis === "row" ? band.start * map.width : band.start;
  const last =
    axis === "row" ? band.end * map.width - 1 : (map.height - 1) * map.width + band.end - 1;
  return CellSelection.create(doc, tableStart + map.map[first], tableStart + map.map[last]);
}

/** Expand a cell range to whole, merge-safe bands without losing its multi-band target. */
export function tableBandSelection(
  $cell: ResolvedPos,
  axis: Axis,
  index: number,
  active: CellSelection | null = null,
  extend = false
) {
  const table = $cell.node(-1);
  const start = $cell.start(-1);
  const map = TableMap.get(table);
  const target = tableAxisRange(map, axis, index);
  let band = target;
  let reverse = false;
  if (active && active.$anchorCell.node(-1) === table && active.$anchorCell.start(-1) === start) {
    const rect = map.rectBetween(active.$anchorCell.pos - start, active.$headCell.pos - start);
    const first = axis === "row" ? rect.top : rect.left;
    const last = axis === "row" ? rect.bottom : rect.right;
    if (extend) {
      const anchor = map.findCell(active.$anchorCell.pos - start);
      const anchorIndex = axis === "row" ? anchor.top : anchor.left;
      const origin = tableAxisRange(map, axis, anchorIndex);
      band = { start: Math.min(origin.start, target.start), end: Math.max(origin.end, target.end) };
      reverse = index < anchorIndex;
    } else if (
      index >= first &&
      index < last &&
      !(axis === "row"
        ? active.isColSelection() && !active.isRowSelection()
        : active.isRowSelection() && !active.isColSelection())
    ) {
      band = {
        start: tableAxisRange(map, axis, first).start,
        end: tableAxisRange(map, axis, last - 1).end,
      };
    }
  }
  const selected = axisSelection($cell.doc, start, map, axis, band);
  return reverse ? new CellSelection(selected.$headCell, selected.$anchorCell) : selected;
}

function applyAxisOrder(
  editor: Editor,
  rect: TableRect,
  axis: Axis,
  order: number[],
  selectionAxis: Axis,
  band: Band
) {
  const { table, tableStart, map } = rect;
  const rows =
    axis === "row"
      ? order.map((row) => table.child(row))
      : table.children.map((row, y) => {
          const cells: Node[] = [];
          for (const x of order) {
            const i = y * map.width + x;
            const pos = map.map[i];
            // A spanning cell is physically stored only at its top-left coordinate.
            if (x > 0 && map.map[i - 1] === pos) continue;
            if (y > 0 && map.map[i - map.width] === pos) continue;
            cells.push(table.nodeAt(pos)!);
          }
          return row.copy(Fragment.from(cells));
        });
  const updated = table.copy(Fragment.from(rows));
  const tr = editor.state.tr.replaceWith(
    tableStart,
    tableStart + table.content.size,
    updated.content
  );
  tr.setSelection(axisSelection(tr.doc, tableStart, TableMap.get(updated), selectionAxis, band));
  editor.view.dispatch(closeHistory(tr));
}

function selectedBand(rect: TableRect, axis: Axis): Band {
  const start = axis === "row" ? rect.top : rect.left;
  const end = axis === "row" ? rect.bottom : rect.right;
  return {
    start: tableAxisRange(rect.map, axis, start).start,
    end: tableAxisRange(rect.map, axis, end - 1).end,
  };
}

function isAxisSelection(selection: CellSelection, axis: Axis) {
  return axis === "row" ? selection.isRowSelection() : selection.isColSelection();
}

export function moveTableAxisTo(editor: Editor, axis: Axis, to: number, execute = true) {
  const { selection } = editor.state;
  if (
    !editor.isEditable ||
    !(selection instanceof CellSelection) ||
    !isAxisSelection(selection, axis)
  ) {
    return false;
  }
  const rect = selectedRect(editor.state);
  if (hasUpload(rect.table)) return false;
  const { start, end } = selectedBand(rect, axis);
  const size = axis === "row" ? rect.map.height : rect.map.width;
  if (!Number.isInteger(to) || to < 0 || to >= size || (to >= start && to < end)) return false;
  if (execute) {
    const destination = tableAxisRange(rect.map, axis, to);
    const insertAt = to < start ? destination.start : destination.end - (end - start);
    const order = [...indexes(0, start), ...indexes(end, size)];
    order.splice(insertAt, 0, ...indexes(start, end));
    applyAxisOrder(editor, rect, axis, order, axis, {
      start: insertAt,
      end: insertAt + end - start,
    });
  }
  return true;
}

function duplicateBand(editor: Editor, rect: TableRect, axis: Axis, execute: boolean) {
  const { map, table, tableStart } = rect;
  const { start, end } = selectedBand(rect, axis);
  const area =
    axis === "row"
      ? { top: start, bottom: end, left: 0, right: map.width }
      : { top: 0, bottom: map.height, left: start, right: end };
  if (map.cellsInRect(area).some((pos) => hasUpload(table.nodeAt(pos)!))) return false;
  if (!execute) return true;

  // Insert just the copy, retaining unaffected upload views and their mapped positions.
  const tr = editor.state.tr;
  if (axis === "row") {
    const before = table.children
      .slice(0, end)
      .reduce((offset, row) => offset + row.nodeSize, tableStart);
    tr.insert(before, table.children.slice(start, end));
  } else {
    // Inserting from the last row preserves the original positions in the rows above it.
    for (let row = map.height - 1; row >= 0; row--) {
      const offsets = map.cellsInRect({ top: row, bottom: row + 1, left: start, right: end });
      if (!offsets.length) continue;
      const position = tableStart + map.positionAt(row, end, table);
      tr.insert(
        position,
        offsets.map((pos) => table.nodeAt(pos)!)
      );
    }
  }
  const updated = tr.doc.nodeAt(tableStart - 1)!;
  tr.setSelection(
    axisSelection(tr.doc, tableStart, TableMap.get(updated), axis, {
      start: end,
      end: end + end - start,
    })
  );
  editor.view.dispatch(closeHistory(tr));
  return true;
}

function sortByColumn(
  editor: Editor,
  rect: TableRect,
  descending: boolean,
  execute: boolean,
  keyColumn = rect.left
) {
  if (!Number.isInteger(keyColumn) || keyColumn < rect.left || keyColumn >= rect.right)
    return false;
  const { map, table, left } = rect;
  if (hasUpload(table)) return false;
  const order: number[] = [];
  const pending: Array<{ band: Band; key: string }> = [];
  function flush() {
    pending.sort((a, b) => {
      if (!a.key || !b.key) return Number(!a.key) - Number(!b.key);
      return collator.compare(a.key, b.key) * (descending ? -1 : 1);
    });
    for (const { band } of pending) order.push(...indexes(band.start, band.end));
    pending.length = 0;
  }
  for (let row = 0; row < map.height;) {
    const band = tableAxisRange(map, "row", row);
    const group = indexes(band.start, band.end);
    if (group.some((i) => rowIsHeader(map, table, i))) {
      flush();
      order.push(...group);
    } else {
      const cell = table.nodeAt(map.map[row * map.width + keyColumn])!;
      pending.push({ band, key: cell.textBetween(0, cell.content.size, " ").trim() });
    }
    row = band.end;
  }
  flush();
  if (order.every((row, i) => row === i)) return false;
  if (execute)
    applyAxisOrder(editor, rect, "row", order, "column", { start: left, end: rect.right });
  return true;
}

function toggleHeader(editor: Editor, rect: TableRect, kind: TableTargetKind, execute: boolean) {
  const { table, tableStart, map } = rect;
  const cells = map.cellsInRect(rect);
  const types = tableNodeTypes(editor.schema);
  const allHeaders = cells.every((pos) => table.nodeAt(pos)!.type === types.header_cell);
  if (!execute) return true;
  const toType = allHeaders ? types.cell : types.header_cell;
  const tr = editor.state.tr;
  // Retain a crossing header when disabling an axis in a mixed table.
  const preserveCrossing =
    allHeaders &&
    kind !== "cell" &&
    table.children.some((row) => row.children.some((cell) => cell.type === types.cell));
  for (const pos of cells) {
    const cell = table.nodeAt(pos)!;
    if (cell.type === toType) continue;
    if (preserveCrossing) {
      const bounds = map.findCell(pos);
      const crossing =
        kind === "row"
          ? columnIsHeader(map, table, bounds.left)
          : rowIsHeader(map, table, bounds.top);
      if (crossing) continue;
    }
    tr.setNodeMarkup(tableStart + pos, toType, cell.attrs);
  }
  if (tr.docChanged) editor.view.dispatch(closeHistory(tr));
  return true;
}

function mergeSelectedCells(editor: Editor, rect: TableRect, execute: boolean) {
  // Merging remounts the child node views, aborting uploads in either source cell.
  if (rect.map.cellsInRect(rect).some((pos) => hasUpload(rect.table.nodeAt(pos)!))) return false;
  if (!execute) return mergeCells(editor.state);
  return mergeCells(editor.state, (tr) => {
    // Native merge pads extra columns with zero widths. A single-row table has no
    // other row from which tableEditing could recover a lost explicit width.
    const { map, table, left, right, top, tableStart } = rect;
    const widths = indexes(left, right).map((col) => {
      const offset = map.map[top * map.width + col];
      return table.nodeAt(offset)!.attrs.colwidth?.[col - map.colCount(offset)] ?? 0;
    });
    if (widths.some(Boolean)) {
      const pos = tableStart + map.map[top * map.width + left];
      tr.setNodeAttribute(pos, "colwidth", widths);
    }
    editor.view.dispatch(closeHistory(tr));
  });
}

export function applyTableAction(
  editor: Editor,
  kind: TableTargetKind,
  action: TableAction,
  execute = true,
  sortColumn?: number
): boolean {
  const { state } = editor;
  const { selection } = state;
  if (!editor.isEditable || !(selection instanceof CellSelection)) return false;
  if (kind !== "cell" && !isAxisSelection(selection, kind)) return false;

  const rect = selectedRect(state);
  const dispatch = execute
    ? (tr: Transaction) => editor.view.dispatch(closeHistory(tr))
    : undefined;

  if (typeof action === "object") {
    const tr = state.tr;
    let changed = false;
    selection.forEachCell((cell, pos) => {
      if (cell.attrs[action.attribute] === action.value) return;
      changed = true;
      if (execute) tr.setNodeAttribute(pos, action.attribute, action.value);
    });
    if (changed) dispatch?.(tr);
    return changed;
  }

  switch (action) {
    case "distribute-columns":
    case "reset-column-widths":
    case "fit-columns":
      return (
        kind === "column" &&
        setSelectedColumnWidths(
          editor,
          rect,
          action === "distribute-columns"
            ? "distribute"
            : action === "fit-columns"
              ? "fit"
              : "reset",
          execute
        )
      );
    case "clear":
      return deleteCellSelection(state, dispatch);
    case "merge":
      return mergeSelectedCells(editor, rect, execute);
    case "split":
      return splitCell(state, dispatch);
    case "delete-table":
      return deleteTable(state, dispatch);
    case "header":
      return toggleHeader(editor, rect, kind, execute);
    case "sort-asc":
    case "sort-desc":
      return (
        kind === "column" && sortByColumn(editor, rect, action === "sort-desc", execute, sortColumn)
      );
  }
  if (kind === "cell") return false;
  const row = kind === "row";
  switch (action) {
    case "insert-before":
      return (row ? addRowBefore : addColumnBefore)(state, dispatch);
    case "insert-after":
      return (row ? addRowAfter : addColumnAfter)(state, dispatch);
    case "delete": {
      if (
        row ? rect.bottom - rect.top === rect.map.height : rect.right - rect.left === rect.map.width
      )
        return false;
      return (row ? deleteRow : deleteColumn)(
        state,
        dispatch &&
          ((tr) => {
            const table = tr.doc.nodeAt(rect.tableStart - 1)!;
            const map = TableMap.get(table);
            const index = row
              ? Math.min(rect.top, map.height - 1)
              : Math.min(rect.left, map.width - 1);
            tr.setSelection(
              axisSelection(tr.doc, rect.tableStart, map, kind, tableAxisRange(map, kind, index))
            );
            dispatch(tr);
          })
      );
    }
    case "move-before":
    case "move-after": {
      const { start, end } = selectedBand(rect, kind);
      return moveTableAxisTo(editor, kind, action === "move-before" ? start - 1 : end, execute);
    }
    case "duplicate":
      return duplicateBand(editor, rect, kind, execute);
  }
}
