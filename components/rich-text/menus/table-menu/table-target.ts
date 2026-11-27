import type { Transaction } from "@tiptap/pm/state";
import { CellSelection, inSameTable, pointsAtCell, TableMap } from "@tiptap/pm/tables";
import type { TableTargetKind } from "../../extensions/table/actions";

export interface MenuTarget {
  kind: TableTargetKind;
  selected: CellSelection;
  // A column handle may be over the second track of a spanning cell. Remember the
  // cell and track offset so inserting another column before it maps the sort key too.
  column?: { cell: number; offset: number; index: number };
}

export function mapMenuTarget(target: MenuTarget, transactions: readonly Transaction[]) {
  let { selected, column } = target;
  for (const tr of transactions) {
    if (tr.docChanged) {
      const { $anchorCell, $headCell } = selected;
      if (
        [$anchorCell.before(-1), $anchorCell.pos, $headCell.pos].some(
          (pos) => tr.mapping.mapResult(pos, 1).deleted
        )
      )
        return null;
      const mapped = selected.map(tr.doc, tr.mapping);
      if (!(mapped instanceof CellSelection)) return null;
      selected = mapped;
      if (column) {
        const cell = tr.mapping.mapResult(column.cell);
        if (cell.deleted) return null;
        const $cell = tr.doc.resolve(cell.pos);
        if (!pointsAtCell($cell) || !inSameTable(selected.$anchorCell, $cell)) return null;
        const map = TableMap.get(selected.$anchorCell.node(-1));
        const rect = map.findCell(cell.pos - selected.$anchorCell.start(-1));
        if (rect.left + column.offset >= rect.right) return null;
        column = { cell: cell.pos, offset: column.offset, index: rect.left + column.offset };
      }
    }
    if (tr.selectionSet && !selected.eq(tr.selection)) return null;
  }
  return selected === target.selected && column === target.column
    ? target
    : { kind: target.kind, selected, column };
}
