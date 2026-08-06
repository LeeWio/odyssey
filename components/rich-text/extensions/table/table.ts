import { Table as TiptapTable, TableView as TiptapTableView } from "@tiptap/extension-table";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

const tableClassName =
  "w-full max-w-full table-fixed border-collapse [&_.column-resize-handle]:pointer-events-none [&_.column-resize-handle]:absolute [&_.column-resize-handle]:top-0 [&_.column-resize-handle]:right-[-2px] [&_.column-resize-handle]:bottom-[-1px] [&_.column-resize-handle]:z-[3] [&_.column-resize-handle]:w-1 [&_.column-resize-handle]:bg-accent [&_.selectedCell]:after:pointer-events-none [&_.selectedCell]:after:absolute [&_.selectedCell]:after:inset-0 [&_.selectedCell]:after:z-[2] [&_.selectedCell]:after:bg-accent/15 [&_.selectedCell]:after:content-['']";

class TableView extends TiptapTableView {
  constructor(node: ProseMirrorNode, cellMinWidth: number, view: EditorView) {
    super(node, cellMinWidth, view, { class: tableClassName });

    this.dom.className = "tableWrapper w-full max-w-full overflow-x-auto";
  }
}

export const Table = TiptapTable.configure({
  HTMLAttributes: {
    class: tableClassName,
  },
  renderWrapper: true,
  View: TableView,
});

export default Table;
