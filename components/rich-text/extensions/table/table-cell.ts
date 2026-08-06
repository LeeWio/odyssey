import { TableCell as TiptapTableCell } from "@tiptap/extension-table";

export const TableCell = TiptapTableCell.configure({
  HTMLAttributes: {
    class:
      "border-separator relative min-w-[1em] border  align-top [&>:first-child]:mt-0 [&>:last-child]:mb-0",
  },
});

export default TableCell;
