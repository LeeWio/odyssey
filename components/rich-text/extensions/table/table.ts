import { TableKit as TiptapTableKit, TableView as TiptapTableView } from "@tiptap/extension-table";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

const tableClassName =
  "w-full max-w-full table-fixed border-collapse [&_.column-resize-handle]:pointer-events-none [&_.column-resize-handle]:absolute [&_.column-resize-handle]:top-0 [&_.column-resize-handle]:right-[-2px] [&_.column-resize-handle]:bottom-[-1px] [&_.column-resize-handle]:z-[3] [&_.column-resize-handle]:w-1 [&_.column-resize-handle]:bg-accent [&_.selectedCell]:after:pointer-events-none [&_.selectedCell]:after:absolute [&_.selectedCell]:after:inset-0 [&_.selectedCell]:after:z-[2] [&_.selectedCell]:after:bg-accent/15 [&_.selectedCell]:after:content-['']";

class TableView extends TiptapTableView {
  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    view: EditorView,
    HTMLAttributes: Record<string, unknown> = {}
  ) {
    super(node, cellMinWidth, view, HTMLAttributes);

    this.dom.className = "tableWrapper w-full max-w-full overflow-x-auto";
  }
}

export const TableKit = TiptapTableKit.configure({
  table: {
    HTMLAttributes: {
      class: tableClassName,
    },
    resizable: true,
    renderWrapper: true,
    View: TableView,
  },
  tableRow: {
    HTMLAttributes: {
      class: "border-separator border-b",
    },
  },
  tableHeader: {
    HTMLAttributes: {
      class:
        "border-separator relative min-w-[1em] border text-left align-top font-semibold [&>:first-child]:mt-0 [&>:last-child]:mb-0",
    },
  },
  tableCell: {
    HTMLAttributes: {
      class:
        "border-separator relative min-w-[1em] border align-top [&>:first-child]:mt-0 [&>:last-child]:mb-0",
    },
  },
});

export default TableKit;
