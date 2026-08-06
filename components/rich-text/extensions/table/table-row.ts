import { TableRow as TiptapTableRow } from "@tiptap/extension-table";

export const TableRow = TiptapTableRow.configure({
  HTMLAttributes: {
    class: "border-separator border-b",
  },
});

export default TableRow;
