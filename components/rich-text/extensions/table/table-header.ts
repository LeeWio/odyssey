import { TableHeader as TiptapTableHeader } from "@tiptap/extension-table";

export const TableHeader = TiptapTableHeader.configure({
  HTMLAttributes: {
    class:
      "border-separator relative min-w-[1em] border  text-left align-top font-semibold [&>:first-child]:mt-0 [&>:last-child]:mb-0",
  },
});

export default TableHeader;
