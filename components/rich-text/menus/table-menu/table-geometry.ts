import type { ResolvedPos } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import { cellAround, CellSelection, inSameTable, TableMap } from "@tiptap/pm/tables";
import type { EditorView } from "@tiptap/pm/view";
import {
  axisSelection,
  tableAxisRange,
  type TableTargetKind,
} from "../../extensions/table/actions";

export type Axis = Exclude<TableTargetKind, "cell">;
export type Box = { left: number; top: number; width: number; height: number };
export type Point = { x: number; y: number };

export function activeCells(view: EditorView) {
  const selection = view.state.selection;
  if (selection instanceof CellSelection) return selection;
  if (!(selection instanceof TextSelection) || !selection.empty) return null;
  const $cell = cellAround(selection.$from);
  return $cell && new CellSelection($cell);
}

export function cellAtElement(view: EditorView, target: Element | null) {
  const cell = target?.closest("td, th");
  if (!cell || !view.dom.contains(cell)) return null;
  const $cell = view.state.doc.resolve(view.posAtDOM(cell, 0) - 1);
  return $cell.parent.type.spec.tableRole === "row" ? $cell : null;
}

function grid($cell: ResolvedPos) {
  return TableMap.get($cell.node(-1));
}

export function selectBand($cell: ResolvedPos, kind: Axis, index: number) {
  const map = grid($cell);
  return axisSelection($cell.doc, $cell.start(-1), map, kind, tableAxisRange(map, kind, index));
}

function selectionBox(table: HTMLTableElement, columns: HTMLCollection, selection: CellSelection) {
  const { $anchorCell, $headCell } = selection;
  const map = grid($anchorCell);
  const base = $anchorCell.start(-1);
  const rect = map.rectBetween($anchorCell.pos - base, $headCell.pos - base);
  return {
    left: columns[rect.left].getBoundingClientRect().left,
    top: table.rows[rect.top].getBoundingClientRect().top,
    right: columns[rect.right - 1].getBoundingClientRect().right,
    bottom: table.rows[rect.bottom - 1].getBoundingClientRect().bottom,
  };
}

function clipped(left: number, top: number, right: number, bottom: number): Box | null {
  if (right <= left || bottom <= top) return null;
  return { left, top, width: right - left, height: bottom - top };
}

export function tableLayout(
  view: EditorView,
  $cell: ResolvedPos,
  active: CellSelection | null,
  point?: Point,
  track?: { axis: Axis; index: number }
) {
  const element = view.nodeDOM($cell.pos);
  const table = element instanceof Element ? element.closest("table") : null;
  if (!table) return null;
  const viewport =
    view.dom.closest("[data-slot='rich-text-editor-content']")?.getBoundingClientRect() ??
    view.dom.getBoundingClientRect();
  const wrapper = table.closest(".tableWrapper")?.getBoundingClientRect() ?? viewport;
  const bounds = table.getBoundingClientRect();
  const left = Math.max(0, bounds.left, wrapper.left, viewport.left);
  const right = Math.min(innerWidth, bounds.right, wrapper.right, viewport.right);
  const top = Math.max(0, bounds.top, viewport.top);
  const bottom = Math.min(innerHeight, bounds.bottom, viewport.bottom);
  if (left >= right || top >= bottom) return null;

  const map = grid($cell);
  const cellRect = map.findCell($cell.pos - $cell.start(-1));
  let row = cellRect.top;
  let column = cellRect.left;
  // COL and TR expose the actual grid tracks, including lines hidden inside a spanning cell.
  const columns = table.querySelector(":scope > colgroup")?.children;
  if (point) {
    while (row + 1 < cellRect.bottom && table.rows[row].getBoundingClientRect().bottom <= point.y)
      row++;
    while (
      columns &&
      column + 1 < cellRect.right &&
      columns[column]?.getBoundingClientRect().right <= point.x
    )
      column++;
  }
  if (track?.axis === "row") row = track.index;
  if (track?.axis === "column") column = track.index;
  const rowRect = table.rows[row]?.getBoundingClientRect();
  const colRect = columns?.[column]?.getBoundingClientRect();
  if (!rowRect || !colRect || !columns) return null;

  const strip = 14;
  // prosemirror-tables hit-tests 5px inside a 5px resize track to resolve the cell.
  const resizeLane = 11;
  const rowLeft = Math.max(viewport.left, left - strip - 2);
  const colTop = Math.max(viewport.top, top - strip - 2);
  const rowBox = clipped(
    rowLeft,
    Math.max(top, rowRect.top),
    rowLeft + strip,
    Math.min(bottom, rowRect.bottom)
  );
  const columnBox = clipped(
    Math.max(left, colRect.left),
    colTop,
    Math.min(right, colRect.right),
    colTop + strip
  );
  // If the viewport clips the outside gutter, put the add button inside the grid
  // with a clear lane at its edge for ProseMirror's last-column resize handle.
  const outsideRight = Math.min(viewport.right, innerWidth) - right;
  const addRight = outsideRight >= strip + 2 ? right + strip + 2 : right - resizeLane;
  const addBottom = Math.min(viewport.bottom, innerHeight, bottom + strip + 2);
  const addColumn =
    bounds.right <= right + 1 ? clipped(addRight - strip, top, addRight, bottom) : null;
  const addRow =
    bounds.bottom <= bottom + 1 ? clipped(left, addBottom - strip, right, addBottom) : null;

  const selected =
    active && inSameTable(active.$anchorCell, $cell) ? selectionBox(table, columns, active) : null;
  const outline =
    selected &&
    clipped(
      Math.max(left, selected.left),
      Math.max(top, selected.top),
      Math.min(right, selected.right),
      Math.min(bottom, selected.bottom)
    );
  // Keep the native column-resize track free, even on the currently active cell.
  const gripSize = 16;
  const cell =
    outline && outline.width >= gripSize + resizeLane && outline.height >= gripSize
      ? {
          left: outline.left + outline.width - gripSize - resizeLane,
          top: outline.top + (outline.height - gripSize) / 2,
          width: gripSize,
          height: gripSize,
        }
      : null;
  return {
    $cell,
    row,
    column,
    map,
    table,
    outline: view.state.selection instanceof CellSelection ? outline : null,
    visible: { left, right, top, bottom },
    boxes: { row: rowBox, column: columnBox, cell, addRow, addColumn },
  };
}

export type TableLayout = NonNullable<ReturnType<typeof tableLayout>>;
