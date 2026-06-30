import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columns: {
      setColumns: (count?: number) => ReturnType;
    };
  }
}

export const Columns = Node.create({
  name: "columns",

  group: "block",

  content: "column{2,3}",

  isolating: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="columns"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "columns",
        class: "flex flex-col md:flex-row gap-4 w-full my-4 transition-all duration-300",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setColumns:
        (count: number = 2) =>
        ({ commands }) => {
          const columnsCount = Math.max(2, Math.min(3, count));

          const columnNode = {
            type: "column",
            content: [
              {
                type: "paragraph",
              },
            ],
          };

          const columnsNode = {
            type: "columns",
            content: Array.from({ length: columnsCount }, () => columnNode),
          };

          return commands.insertContent(columnsNode);
        },
    };
  },
});

export default Columns;
