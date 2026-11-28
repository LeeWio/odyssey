import type { Transaction } from "@tiptap/pm/state";
import { CellSelection, inSameTable, pointsAtCell, TableMap } from "@tiptap/pm/tables";
import type { TableTargetKind } from "../../extensions/table/actions";

export interface MenuTarget {
  kind: TableTargetKind;
  selected: CellSelection;
  // Preserve the exact track of a spanning cell when the document changes.
  anchor?: { cell: number; offset: number; index: number };
}

export function mapMenuTarget(target: MenuTarget, transactions: readonly Transaction[]) {
  let { selected, anchor } = target;
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
      if (anchor) {
        const cell = tr.mapping.mapResult(anchor.cell);
        if (cell.deleted) return null;
        const $cell = tr.doc.resolve(cell.pos);
        if (!pointsAtCell($cell) || !inSameTable(selected.$anchorCell, $cell)) return null;
        const map = TableMap.get(selected.$anchorCell.node(-1));
        const rect = map.findCell(cell.pos - selected.$anchorCell.start(-1));
        const row = target.kind === "row";
        const index = (row ? rect.top : rect.left) + anchor.offset;
        if (index >= (row ? rect.bottom : rect.right)) return null;
        anchor = { cell: cell.pos, offset: anchor.offset, index };
      }
    }
    if (tr.selectionSet && !selected.eq(tr.selection)) return null;
  }
  return selected === target.selected && anchor === target.anchor
    ? target
    : { kind: target.kind, selected, anchor };
}
