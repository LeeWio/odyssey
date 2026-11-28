import { closeHistory } from "@tiptap/pm/history";
import { Fragment, Slice, type Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  CellSelection,
  cellAround,
  inSameTable,
  handlePaste,
  isInTable,
  selectedRect,
  TableMap,
  tableNodeTypes,
} from "@tiptap/pm/tables";
import type { EditorView } from "@tiptap/pm/view";

const maxCells = 10_000;
const maxTextLength = 1_000_000;

/** Spreadsheet TSV: quoted fields can contain tabs, line breaks, and doubled quotes. */
export function parseTableText(text: string): string[][] | null {
  if (!text || text.length > maxTextLength) return null;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let closed = false;
  let cells = 0;
  const pushField = () => {
    row.push(field);
    field = "";
    closed = false;
    return ++cells <= maxCells;
  };
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          quoted = false;
          closed = true;
        }
      } else if (char === "\r") {
        field += "\n";
        if (text[index + 1] === "\n") index++;
      } else field += char;
      continue;
    }
    if (char === '"' && !field && !closed) {
      quoted = true;
      continue;
    }
    if (char === "\t" || char === "\n" || char === "\r") {
      if (!pushField()) return null;
      if (char !== "\t") {
        rows.push(row);
        row = [];
        if (char === "\r" && text[index + 1] === "\n") index++;
      }
    } else {
      if (closed) return null;
      field += char;
    }
  }
  if (quoted) return null;
  // A final row delimiter terminates the last record; it does not add a blank record.
  if (row.length || field || closed || !rows.length) {
    if (!pushField()) return null;
    rows.push(row);
  }
  const width = Math.max(...rows.map((record) => record.length));
  if (width * rows.length > maxCells) return null;
  return rows.map((record) => Array.from({ length: width }, (_, col) => record[col] ?? ""));
}

function quoteField(text: string) {
  return /[\t\r\n"]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeTableSelection(selection: CellSelection) {
  const table = selection.$anchorCell.node(-1);
  const map = TableMap.get(table);
  const start = selection.$anchorCell.start(-1);
  const rect = map.rectBetween(selection.$anchorCell.pos - start, selection.$headCell.pos - start);
  const seen = new Set<number>();
  const rows: string[] = [];
  for (let row = rect.top; row < rect.bottom; row++) {
    const fields: string[] = [];
    for (let col = rect.left; col < rect.right; col++) {
      const offset = map.map[row * map.width + col];
      const cell = table.nodeAt(offset)!;
      fields.push(
        seen.has(offset) ? "" : quoteField(cell.textBetween(0, cell.content.size, "\n", "\n"))
      );
      seen.add(offset);
    }
    rows.push(fields.join("\t"));
  }
  return rows.join("\n");
}

function spreadsheetSlice(view: EditorView, values: string[][]) {
  const rect = selectedRect(view.state);
  const { table, map, top, left } = rect;
  const types = tableNodeTypes(view.state.schema);
  const selected = view.state.selection instanceof CellSelection;
  const height = selected ? rect.bottom - top : values.length;
  const width = selected ? rect.right - left : values[0].length;
  if (height * width > maxCells) return null;
  if (Math.max(map.width, left + width) * Math.max(map.height, top + height) > maxCells)
    return null;
  const rows: ProseMirrorNode[] = [];
  for (let row = 0; row < height; row++) {
    const cells: ProseMirrorNode[] = [];
    for (let col = 0; col < width; col++) {
      const y = top + row;
      const x = left + col;
      const sourceCol = Math.min(x, map.width - 1);
      const offset = map.map[Math.min(y, map.height - 1) * map.width + sourceCol];
      const target = table.nodeAt(offset)!;
      const targetLeft = map.colCount(offset);
      const columnWidth = x < map.width ? target.attrs.colwidth?.[sourceCol - targetLeft] : null;
      const type = x >= map.width && y >= map.height ? types.cell : target.type;
      const paragraphs = values[row % values.length][col % values[0].length]
        .split("\n")
        .map((line) =>
          view.state.schema.nodes.paragraph.create(null, line ? view.state.schema.text(line) : null)
        );
      cells.push(
        type.create(
          { ...target.attrs, colspan: 1, rowspan: 1, colwidth: columnWidth ? [columnWidth] : null },
          paragraphs
        )
      );
    }
    rows.push(types.row.create(null, cells));
  }
  return new Slice(Fragment.from(types.table.create(null, rows)), 0, 0);
}

/** Plain spreadsheets get grid semantics; rich HTML keeps ProseMirror's native paste. */
export function pasteTableText(view: EditorView, event: ClipboardEvent) {
  if (!view.editable || !isInTable(view.state) || !event.clipboardData) return false;
  const selection = view.state.selection;
  if (!(selection instanceof CellSelection)) {
    const from = cellAround(selection.$from);
    const to = cellAround(selection.$to);
    if (!from || !to || !inSameTable(from, to) || selection.$from.parent.type.spec.code)
      return false;
  }
  if (event.clipboardData.getData("text/html")) return false;
  const text = event.clipboardData.getData("text/plain");
  if (
    !text.includes("\t") &&
    !(view.state.selection instanceof CellSelection && /[\r\n]/.test(text))
  )
    return false;
  const values = parseTableText(text);
  if (!values) return false;
  const slice = spreadsheetSlice(view, values);
  if (!slice) return false;
  // Isolate the one native document transaction from adjacent typing and formatting.
  view.dispatch(closeHistory(view.state.tr));
  const pasted = handlePaste(view, event, slice);
  if (pasted) view.dispatch(closeHistory(view.state.tr));
  return pasted;
}

export function tableClipboardPlugin() {
  return new Plugin({
    key: new PluginKey("table-spreadsheet-clipboard"),
    props: {
      handlePaste: pasteTableText,
      // A falsy result delegates all non-cell text selections to the next serializer.
      clipboardTextSerializer: (_, view) =>
        view.state.selection instanceof CellSelection
          ? serializeTableSelection(view.state.selection)
          : "",
    },
  });
}
