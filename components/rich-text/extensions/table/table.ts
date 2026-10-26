import { TableKit as TiptapTableKit, TableView as TiptapTableView } from "@tiptap/extension-table";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { CellSelection } from "@tiptap/pm/tables";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";

class TableView extends TiptapTableView {
  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    view?: EditorView,
    HTMLAttributes: Record<string, unknown> = {}
  ) {
    super(node, cellMinWidth, view, HTMLAttributes);
    // 3.32.0 still builds the resize view as View(node, cellMinWidth, editorView)
    // and drops HTMLAttributes. Apply them here until the reference View: null ships.
    const className = HTMLAttributes.class;
    if (!this.table.className && typeof className === "string") {
      this.table.className = className;
    }
  }
}

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

export const TableKit = TiptapTableKit.extend({
  addExtensions() {
    return (this.parent?.() ?? []).map((extension) => {
      if (extension.name !== "table") return extension;

      return extension.extend({
        addProseMirrorPlugins() {
          return [
            ...(this.parent?.() ?? []),
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
    cellMinWidth: 100,
    handleWidth: 5,
    resizable: true,
    renderWrapper: true,
    View: TableView,
  },
  tableRow: {},
  tableHeader: {
    HTMLAttributes: {
      class: "text-left align-top",
    },
  },
  tableCell: {
    HTMLAttributes: {
      class: "align-top",
    },
  },
});

export default TableKit;
