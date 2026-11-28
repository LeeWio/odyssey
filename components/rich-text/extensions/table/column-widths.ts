import { contentColumnWidths } from "./content-widths";
import type { Editor } from "@tiptap/core";
import { closeHistory } from "@tiptap/pm/history";
import type { TableRect } from "@tiptap/pm/tables";
import { tableColumnBounds } from "./column-layout";

/** Persist logical track widths in every cell, including each merged-cell vector. */
export function setSelectedColumnWidths(
  editor: Editor,
  rect: TableRect,
  mode: "distribute" | "reset" | "fit" | number,
  execute: boolean
) {
  const { table, tableStart, map, left, right } = rect;
  const count = right - left;
  if (
    !editor.isEditable ||
    editor.state.doc.nodeAt(tableStart - 1) !== table ||
    count < 1 ||
    left < 0 ||
    right > map.width
  )
    return false;
  if (mode === "distribute" && count < 2) return false;
  const minimum =
    editor.extensionManager.extensions.find((extension) => extension.name === "table")?.options
      .cellMinWidth ?? 100;
  if (typeof mode === "number" && (!Number.isSafeInteger(mode) || mode < minimum)) return false;
  const element = editor.view.nodeDOM(tableStart - 1);
  const dom =
    element instanceof Element
      ? element.matches("table")
        ? (element as HTMLTableElement)
        : element.querySelector("table")
      : null;
  if (mode === "fit" && !execute) return !!dom;
  // Measure only an actual width command, not every menu capability query.
  const bounds = mode === "distribute" && execute && dom ? tableColumnBounds(dom) : [];
  // TableView and tableEditing use the first row as the canonical track vector.
  const stored = table.firstChild!.children.flatMap((cell) =>
    Array.from({ length: cell.attrs.colspan }, (_, index) => cell.attrs.colwidth?.[index] ?? 0)
  );
  const widths = stored.map((width, col) => {
    const measured = bounds[col] ? bounds[col].right - bounds[col].left : 0;
    return Math.max(minimum, measured > 0 ? measured : width || minimum);
  });
  const total = Math.max(
    minimum * count,
    Math.round(widths.slice(left, right).reduce((a, b) => a + b, 0))
  );
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  const target =
    typeof mode === "number"
      ? (Array(count).fill(mode) as number[])
      : mode === "fit"
        ? contentColumnWidths(editor, rect, widths, minimum)
        : Array.from({ length: count }, (_, index) =>
            mode === "reset" ? 0 : base + (index < remainder ? 1 : 0)
          );
  if (!target) return false;
  const tr = editor.state.tr;
  let changed = false;
  const seen = new Set<number>();
  for (let row = 0; row < map.height; row++) {
    for (let col = left; col < right; col++) {
      const offset = map.map[row * map.width + col];
      if (seen.has(offset)) continue;
      seen.add(offset);
      const cell = table.nodeAt(offset)!;
      let start = col;
      while (start > 0 && map.map[row * map.width + start - 1] === offset) start--;
      const next = Array.from({ length: cell.attrs.colspan }, (_, index) => {
        const logical = start + index;
        return logical >= left && logical < right
          ? target[logical - left]
          : (cell.attrs.colwidth?.[index] ?? 0);
      });
      const value = next.some(Boolean) ? next : null;
      const previous = cell.attrs.colwidth as number[] | null;
      if (
        value === null
          ? previous === null
          : previous?.length === value.length &&
            value.every((width, index) => width === previous[index])
      )
        continue;
      changed = true;
      if (execute) tr.setNodeAttribute(tableStart + offset, "colwidth", value);
    }
  }
  if (changed && execute) editor.view.dispatch(closeHistory(tr));
  return changed;
}

/** Read once when opening the width editor; do not measure while querying menu capabilities. */
export function selectedColumnWidth(editor: Editor, rect: TableRect) {
  const minimum =
    editor.extensionManager.extensions.find((extension) => extension.name === "table")?.options
      .cellMinWidth ?? 100;
  const stored = rect.table.firstChild!.children.flatMap((cell) =>
    Array.from({ length: cell.attrs.colspan }, (_, index) => cell.attrs.colwidth?.[index] ?? 0)
  );
  const node = editor.view.nodeDOM(rect.tableStart - 1);
  const table =
    node instanceof Element
      ? node.matches("table")
        ? (node as HTMLTableElement)
        : node.querySelector("table")
      : null;
  const needsMeasurement = stored.slice(rect.left, rect.right).some((width) => !width);
  const bounds = table && needsMeasurement ? tableColumnBounds(table) : [];
  const widths = stored
    .slice(rect.left, rect.right)
    .map(
      (width, i) =>
        width ||
        Math.max(
          minimum,
          Math.round(
            bounds[rect.left + i]
              ? bounds[rect.left + i].right - bounds[rect.left + i].left
              : minimum
          )
        )
    );
  return {
    minimum,
    count: widths.length,
    value: widths.every((width) => width === widths[0]) ? widths[0] : undefined,
  };
}
