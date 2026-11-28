import { tableSelectionHighlight } from "./selection-highlight";
import { tableResizeInteractions } from "./resize";
import { exitTable, leaveCellSelection } from "./keyboard";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { CellSelection, columnResizing, columnResizingPluginKey } from "@tiptap/pm/tables";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { tableClipboardPlugin, type TablePasteFailure } from "./clipboard";
import type { TableKitOptions as NativeTableKitOptions } from "@tiptap/extension-table";
import { TableSchemaKit } from "./table-schema";

const activeCellKey = new PluginKey("table-active-cell");

function activeCellDecoration(state: {
  doc: ProseMirrorNode;
  selection: {
    $from: {
      depth: number;
      node: (depth: number) => ProseMirrorNode;
      before: (depth: number) => number;
    };
  };
}) {
  const selection = state.selection;
  if (selection instanceof CellSelection) return DecorationSet.empty;

  const $from = selection.$from;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const role = $from.node(depth).type.spec.tableRole;
    if (role !== "cell" && role !== "header_cell") continue;

    const pos = $from.before(depth);
    const node = $from.node(depth);
    return DecorationSet.create(state.doc, [
      Decoration.node(pos, pos + node.nodeSize, { class: "table-cell-active" }),
    ]);
  }

  return DecorationSet.empty;
}

export interface TableKitOptions extends NativeTableKitOptions {
  onPasteRejected?: (failure: TablePasteFailure) => void;
}

export const TableKit = TableSchemaKit.extend<TableKitOptions>({
  addExtensions() {
    const onRejected = this.options.onPasteRejected;
    return (this.parent?.() ?? []).map((extension) => {
      if (extension.name !== "table") return extension;

      return extension.extend({
        addKeyboardShortcuts() {
          return {
            ...this.parent?.(),
            Escape: () => leaveCellSelection(this.editor),
            "Mod-Enter": () => exitTable(this.editor),
            "Mod-Shift-Enter": () => exitTable(this.editor, true),
          };
        },
        addProseMirrorPlugins() {
          const native = this.parent?.() ?? [];
          // Tiptap omits resizing when an editor starts disabled (for example,
          // while a modal loads a draft). Keep the native, editability-guarded
          // plugin registered so setEditable(true) can enable it without remounting.
          if (
            this.options.resizable &&
            !native.some((plugin) => plugin.spec.key === columnResizingPluginKey)
          )
            native.unshift(
              columnResizing({
                handleWidth: this.options.handleWidth,
                cellMinWidth: this.options.cellMinWidth,
                defaultCellMinWidth: this.options.cellMinWidth,
                View: null,
                lastColumnResizable: this.options.lastColumnResizable,
              })
            );
          return [
            tableSelectionHighlight(),
            tableResizeInteractions(this.editor),
            tableClipboardPlugin(onRejected),
            ...native,
            new Plugin({
              key: activeCellKey,
              props: {
                decorations: (state) => activeCellDecoration(state),
              },
            }),
          ];
        },
      });
    });
  },
}).configure({
  table: {
    HTMLAttributes: {
      class: "w-full max-w-full border-collapse",
    },
    handleWidth: 5,
    resizable: true,
  },
});

export default TableKit;
