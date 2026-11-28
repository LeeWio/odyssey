import { tableColumnBounds } from "../../extensions/table/column-layout";
import type { ResolvedPos } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import { cellAround, CellSelection, inSameTable, TableMap } from "@tiptap/pm/tables";
import type { EditorView } from "@tiptap/pm/view";
import { tableBandSelection, type TableTargetKind } from "../../extensions/table/actions";

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

export function selectBand(
  $cell: ResolvedPos,
  kind: Axis,
  index: number,
  active: CellSelection | null = null,
  extend = false
) {
  return tableBandSelection($cell, kind, index, active, extend);
}

function selectionBox(
  table: HTMLTableElement,
  columns: Array<{ left: number; right: number }>,
  selection: CellSelection
) {
  const { $anchorCell, $headCell } = selection;
  const map = grid($anchorCell);
  const base = $anchorCell.start(-1);
  const rect = map.rectBetween($anchorCell.pos - base, $headCell.pos - base);
  const bounds = table.getBoundingClientRect();
  return {
    left: columns[rect.left].left,
    top: table.rows[rect.top].getBoundingClientRect().top,
    right: columns[rect.right - 1].right,
    bottom: table.rows[rect.bottom - 1].getBoundingClientRect().bottom,
    corners: {
      topLeft: rect.top === 0 && rect.left === 0,
      topRight: rect.top === 0 && rect.right === map.width,
      bottomLeft: rect.bottom === map.height && rect.left === 0,
      bottomRight: rect.bottom === map.height && rect.right === map.width,
    },
    // The wrapper owns the outside 1px border; the grid owns internal borders.
    outer: {
      left: rect.left === 0 ? bounds.left - 0.5 : undefined,
      top: rect.top === 0 ? bounds.top - 0.5 : undefined,
      right: rect.right === map.width ? bounds.right + 0.5 : undefined,
      bottom: rect.bottom === map.height ? bounds.bottom + 0.5 : undefined,
    },
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
  const wrapperElement = table.closest(".tableWrapper");
  const wrapper = wrapperElement?.getBoundingClientRect() ?? viewport;
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
  const columns = tableColumnBounds(table);
  if (point) {
    while (row + 1 < cellRect.bottom && table.rows[row].getBoundingClientRect().bottom <= point.y)
      row++;
    while (columns && column + 1 < cellRect.right && columns[column]?.right <= point.x) column++;
  }
  if (track?.axis === "row") row = track.index;
  if (track?.axis === "column") column = track.index;
  const rowRect = table.rows[row]?.getBoundingClientRect();
  const colRect = columns[column];
  if (!rowRect || !colRect || !columns) return null;

  const strip = 16;
  const gap = 4;
  const gutter = {
    left: wrapper.left - gap - strip,
    top: wrapper.top - gap - strip,
    right: wrapper.right + gap,
    bottom: wrapper.bottom + gap,
  };
  const rowBox =
    gutter.left >= Math.max(0, viewport.left)
      ? clipped(
          gutter.left,
          Math.max(top, rowRect.top),
          gutter.left + strip,
          Math.min(bottom, rowRect.bottom)
        )
      : null;
  const columnBox =
    gutter.top >= Math.max(0, viewport.top)
      ? clipped(
          Math.max(left, colRect.left),
          gutter.top,
          Math.min(right, colRect.right),
          gutter.top + strip
        )
      : null;
  const addColumn =
    bounds.right <= right + 1 && gutter.right + strip <= Math.min(viewport.right, innerWidth)
      ? clipped(gutter.right, top, gutter.right + strip, bottom)
      : null;
  const addRow =
    bounds.bottom <= bottom + 1 && gutter.bottom + strip <= Math.min(viewport.bottom, innerHeight)
      ? clipped(left, gutter.bottom, right, gutter.bottom + strip)
      : null;

  const wrapperStyle = wrapperElement ? getComputedStyle(wrapperElement) : null;
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
  // The grip belongs to the actual selection edge, never a synthetic clipped edge.
  const gripSize = 16;
  const edge = selected ? (selected.outer.right ?? selected.right) : 0;
  const middle = selected ? (selected.top + selected.bottom) / 2 : 0;
  const cell =
    selected &&
    outline &&
    edge - gripSize / 2 >= Math.max(0, viewport.left) &&
    edge + gripSize / 2 <= Math.min(innerWidth, viewport.right) &&
    edge <= wrapper.right &&
    edge >= wrapper.left &&
    middle - gripSize / 2 >= top &&
    middle + gripSize / 2 <= bottom
      ? { left: edge - gripSize / 2, top: middle - gripSize / 2, width: gripSize, height: gripSize }
      : null;

  return {
    $cell,
    row,
    column,
    map,
    table,
    outline:
      selected && outline
        ? {
            clip: {
              left: wrapper.left,
              top: wrapper.top,
              width: wrapper.width,
              height: wrapper.height,
              borderRadius: wrapperStyle?.borderRadius ?? "0px",
              clipPath: `inset(${Math.max(0, -wrapper.top, viewport.top - wrapper.top)}px ${Math.max(0, wrapper.right - innerWidth, wrapper.right - viewport.right)}px ${Math.max(0, wrapper.bottom - innerHeight, wrapper.bottom - viewport.bottom)}px ${Math.max(0, -wrapper.left, viewport.left - wrapper.left)}px)`,
            },
            border: selectionBorder(selected, wrapperStyle, wrapper),
          }
        : null,
    gripAnchor: selected ? { x: edge, y: middle } : null,
    visible: { left, right, top, bottom },
    boxes: { row: rowBox, column: columnBox, cell, addRow, addColumn },
  };
}

export type TableLayout = NonNullable<ReturnType<typeof tableLayout>>;

/** Center the highlight on the existing grid lines, without shrinking a clipped selection. */
function selectionBorder(
  selected: NonNullable<ReturnType<typeof selectionBox>>,
  style: CSSStyleDeclaration | null,
  wrapper: DOMRect
) {
  const left = selected.outer.left ?? selected.left;
  const top = selected.outer.top ?? selected.top;
  const right = selected.outer.right ?? selected.right;
  const bottom = selected.outer.bottom ?? selected.bottom;
  return {
    left: left - wrapper.left - 1,
    top: top - wrapper.top - 1,
    width: right - left + 2,
    height: bottom - top + 2,
    borderTopLeftRadius: selected.corners.topLeft ? style?.borderTopLeftRadius : 0,
    borderTopRightRadius: selected.corners.topRight ? style?.borderTopRightRadius : 0,
    borderBottomLeftRadius: selected.corners.bottomLeft ? style?.borderBottomLeftRadius : 0,
    borderBottomRightRadius: selected.corners.bottomRight ? style?.borderBottomRightRadius : 0,
  };
}

/** Keyboard invocation reveals the real grip instead of moving it to a clipped edge. */
export function revealSelectionGrip(layout: TableLayout) {
  if (!layout.gripAnchor) return;
  const point = { ...layout.gripAnchor };
  for (
    let node = layout.table.parentElement;
    node && node !== document.body;
    node = node.parentElement
  ) {
    const bounds = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    if (/auto|scroll/.test(style.overflowX) && node.scrollWidth > node.clientWidth) {
      const before = node.scrollLeft;
      const delta =
        point.x < bounds.left + 1
          ? point.x - bounds.left - 1
          : point.x > bounds.right - 1
            ? point.x - bounds.right + 1
            : 0;
      node.scrollLeft += delta;
      point.x -= node.scrollLeft - before;
    }
    if (/auto|scroll/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
      const before = node.scrollTop;
      const delta =
        point.y < bounds.top + 8
          ? point.y - bounds.top - 8
          : point.y > bounds.bottom - 8
            ? point.y - bounds.bottom + 8
            : 0;
      node.scrollTop += delta;
      point.y -= node.scrollTop - before;
    }
  }
  if (point.y < 8) window.scrollBy(0, point.y - 8);
  else if (point.y > innerHeight - 8) window.scrollBy(0, point.y - innerHeight + 8);
}
