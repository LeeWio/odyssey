import { Plugin } from "@tiptap/pm/state";
import { CellSelection } from "@tiptap/pm/tables";

/** Keep native cell selection semantics, using cell-local highlight inheritance for its visuals. */
class TableRangeSelection extends CellSelection {
  visible = true;
}

export function tableSelectionHighlight() {
  return new Plugin({
    props: {
      attributes: (state): Record<string, string> =>
        state.selection instanceof CellSelection ? { "data-table-cell-selection": "" } : {},
    },
    appendTransaction(_transactions, _previous, state) {
      const selected = state.selection;
      if (!(selected instanceof CellSelection) || selected instanceof TableRangeSelection)
        return null;
      // Public Selection.visible avoids the native wildcard ::selection rule and its
      // whole-editor style invalidation. CSS hides this range through cell-local highlight inheritance.
      return state.tr
        .setSelection(new TableRangeSelection(selected.$anchorCell, selected.$headCell))
        .setMeta("addToHistory", false);
    },
  });
}
