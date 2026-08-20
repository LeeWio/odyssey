import { mergeAttributes, Node, type JSONContent, type MarkdownToken } from "@tiptap/core";
import { Fragment, type Node as ProseMirrorNode, type NodeType } from "@tiptap/pm/model";
import { NodeSelection, Selection, type EditorState, type Transaction } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import {
  areEqualColumnWidths,
  createEqualColumnWidths,
  getColumnGridTemplate,
  isValidColumnWidths,
  normalizeColumnWidths,
  parseColumnWidths,
  serializeColumnWidths,
} from "./column-widths";
import { ColumnsNodeView } from "./columns-node-view";

export interface ColumnsOptions {
  HTMLAttributes: Record<string, unknown>;
}

interface ColumnsContext {
  columnIndex: number;
  node: ProseMirrorNode;
  pos: number;
}

function findColumnsContext(
  doc: ProseMirrorNode,
  selection: Selection,
  columnsType: NodeType
): ColumnsContext | null {
  if (selection instanceof NodeSelection && selection.node.type === columnsType) {
    return {
      columnIndex: 0,
      node: selection.node,
      pos: selection.from,
    };
  }

  const { $from } = selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);

    if (node.type === columnsType) {
      return {
        columnIndex: $from.index(depth),
        node,
        pos: $from.before(depth),
      };
    }
  }

  const nodeAtSelection = doc.nodeAt(selection.from);

  if (nodeAtSelection?.type === columnsType) {
    return {
      columnIndex: 0,
      node: nodeAtSelection,
      pos: selection.from,
    };
  }

  return null;
}

export function getColumnCountAtSelection(state: EditorState): 2 | 3 | null {
  const columnsType = state.schema.nodes.columns;

  if (!columnsType) {
    return null;
  }

  const context = findColumnsContext(state.doc, state.selection, columnsType);
  const count = context?.node.childCount;

  return count === 2 || count === 3 ? count : null;
}

export function getColumnWidthsAtSelection(state: EditorState): number[] | null {
  const columnsType = state.schema.nodes.columns;

  if (!columnsType) {
    return null;
  }

  const context = findColumnsContext(state.doc, state.selection, columnsType);

  return context ? normalizeColumnWidths(context.node.attrs.widths, context.node.childCount) : null;
}

function isEmptyPlaceholderColumn(column: ProseMirrorNode): boolean {
  return (
    column.childCount === 1 && column.firstChild?.isTextblock === true && column.content.size === 2
  );
}

function moveToAdjacentColumn(
  state: EditorState,
  dispatch: ((tr: Transaction) => void) | undefined,
  offset: -1 | 1,
  onlyFromEmptyColumn = false
) {
  const columnsType = state.schema.nodes.columns;

  if (!columnsType) return false;

  const context = findColumnsContext(state.doc, state.selection, columnsType);

  if (!context || state.selection instanceof NodeSelection) return false;

  const currentColumn = context.node.child(context.columnIndex);
  const targetIndex = context.columnIndex + offset;

  if (
    (onlyFromEmptyColumn && !isEmptyPlaceholderColumn(currentColumn)) ||
    targetIndex < 0 ||
    targetIndex >= context.node.childCount
  ) {
    return false;
  }

  if (dispatch) {
    let targetPosition = context.pos + 2;

    for (let index = 0; index < targetIndex; index += 1) {
      targetPosition += context.node.child(index).nodeSize;
    }

    dispatch(
      state.tr.setSelection(Selection.near(state.doc.resolve(targetPosition), 1)).scrollIntoView()
    );
  }

  return true;
}

function exitColumns(
  state: EditorState,
  dispatch: ((tr: Transaction) => void) | undefined
): boolean {
  const { selection } = state;
  const columnsType = state.schema.nodes.columns;

  if (!columnsType || !selection.empty) {
    return false;
  }

  const context = findColumnsContext(state.doc, selection, columnsType);

  if (!context) {
    return false;
  }

  const { $from } = selection;
  const isLastColumn = context.columnIndex === context.node.childCount - 1;

  if (!isLastColumn) {
    return false;
  }

  const currentColumn = context.node.child(context.columnIndex);
  const currentBlock = $from.parent;

  if (
    currentBlock.isTextblock &&
    currentBlock.content.size === 0 &&
    currentColumn.lastChild === currentBlock
  ) {
    if (dispatch) {
      const { tr } = state;
      const defaultBlockType =
        state.schema.nodes.paragraph || state.schema.nodes.column.contentMatch.defaultType;

      if (!defaultBlockType) return false;

      const newBlock = defaultBlockType.createAndFill();
      if (!newBlock) return false;

      const insertPos = context.pos + context.node.nodeSize;
      tr.insert(insertPos, newBlock);

      let selectionPos = insertPos + 1;

      if (currentColumn.childCount > 1) {
        const fromBefore = $from.before();
        const fromAfter = $from.after();
        tr.delete(fromBefore, fromAfter);
        selectionPos -= fromAfter - fromBefore;
      }

      tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), 1));
      tr.scrollIntoView();
      dispatch(tr);
    }
    return true;
  }

  return false;
}

function setSelectionInsideColumns(
  tr: Transaction,
  columnsPos: number,
  columnsNode: ProseMirrorNode,
  preferredPosition: number,
  bias: -1 | 1 = 1
) {
  const minPosition = columnsPos + 2;
  const maxPosition = columnsPos + columnsNode.nodeSize - 2;
  const position = Math.max(minPosition, Math.min(preferredPosition, maxPosition));

  tr.setSelection(Selection.near(tr.doc.resolve(position), bias));
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columns: {
      insertColumns: (count?: 2 | 3) => ReturnType;
      setColumns: (count?: 2 | 3) => ReturnType;
      setColumnCount: (count: 2 | 3) => ReturnType;
      setColumnWidths: (widths: number[]) => ReturnType;
      resetColumnWidths: () => ReturnType;
      unsetColumns: () => ReturnType;
    };
  }
}

export const Columns = Node.create<ColumnsOptions>({
  name: "columns",

  group: "block",

  content: "column{2,3}",

  defining: true,

  isolating: true,

  selectable: false,

  addAttributes() {
    return {
      widths: {
        default: null,
        parseHTML: (element) =>
          parseColumnWidths(element.getAttribute("data-column-widths"), element.children.length),
        renderHTML: (attributes) => {
          const count = Array.isArray(attributes.widths) ? attributes.widths.length : 2;
          const widths = normalizeColumnWidths(attributes.widths, count);

          return {
            "data-column-widths": serializeColumnWidths(widths),
            style: `--column-widths: ${getColumnGridTemplate(widths)}`,
          };
        },
      },
    };
  },

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="columns"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const widths = normalizeColumnWidths(node.attrs.widths, node.childCount);

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "columns",
        "data-column-widths": serializeColumnWidths(widths),
        class: "my-4 grid w-full gap-4 [grid-template-columns:var(--column-widths)]",
        style: `--column-widths: ${getColumnGridTemplate(widths)}`,
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnsNodeView);
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => moveToAdjacentColumn(this.editor.state, this.editor.view.dispatch, 1, true),
      "Shift-Tab": () =>
        moveToAdjacentColumn(this.editor.state, this.editor.view.dispatch, -1, true),
      "Mod-Alt-ArrowRight": () =>
        moveToAdjacentColumn(this.editor.state, this.editor.view.dispatch, 1),
      "Mod-Alt-ArrowLeft": () =>
        moveToAdjacentColumn(this.editor.state, this.editor.view.dispatch, -1),
      Enter: () => exitColumns(this.editor.state, this.editor.view.dispatch),
    };
  },

  markdownTokenName: "columns",

  markdownTokenizer: {
    name: "columns",
    level: "block",
    start: (source) => source.match(/^:::columns\b/m)?.index ?? -1,
    tokenize(source, _tokens, lexer) {
      const opening = source.match(/^:::columns(?:\s+widths=([\d.,\s-]+))?\s*\n/);

      if (!opening) return undefined;

      const remaining = source.slice(opening[0].length);
      const closing = remaining.match(/^:::endcolumns\s*$/m);

      if (!closing || closing.index === undefined) return undefined;

      const body = remaining.slice(0, closing.index);
      const sections = body.split(/^:::column\s*$/m).slice(1);

      if (sections.length !== 2 && sections.length !== 3) return undefined;

      const raw = source.slice(0, opening[0].length + closing.index + closing[0].length);
      const widths = normalizeColumnWidths(opening[1]?.split(","), sections.length);

      return {
        type: "columns",
        raw,
        widths,
        columns: sections.map((section) => lexer.blockTokens(section.trim())),
      };
    },
  },

  parseMarkdown(token, helpers) {
    const columns = (token.columns as MarkdownToken[][] | undefined) ?? [];
    const widths = normalizeColumnWidths(token.widths, columns.length);

    return helpers.createNode(
      "columns",
      { widths },
      columns.map((tokens) =>
        (() => {
          const content = helpers.parseBlockChildren?.(tokens) ?? helpers.parseChildren(tokens);

          return helpers.createNode(
            "column",
            {},
            content.length > 0 ? content : [helpers.createNode("paragraph")]
          );
        })()
      )
    );
  },

  renderMarkdown(node: JSONContent, helpers) {
    const columns = node.content ?? [];
    const widths = normalizeColumnWidths(node.attrs?.widths, columns.length);
    const renderedColumns = columns
      .map((column) => `:::column\n${helpers.renderChildren(column.content ?? [], "\n\n").trim()}`)
      .join("\n\n");

    return `:::columns widths=${serializeColumnWidths(widths)}\n${renderedColumns}\n:::endcolumns`;
  },

  addCommands() {
    return {
      insertColumns:
        (count: 2 | 3 = 2) =>
        ({ state, tr, dispatch }) => {
          if (!Number.isInteger(count) || count < 2 || count > 3) {
            return false;
          }

          const { schema } = state;
          const columnsType = schema.nodes[this.name];
          const columnType = schema.nodes.column;

          if (!columnsType || !columnType) {
            return false;
          }

          const { $from, $to } = tr.selection;

          for (let depth = $from.depth; depth > 0; depth -= 1) {
            if ($from.node(depth).type === columnsType) {
              return false;
            }
          }

          const range = $from.blockRange($to);

          if (!range) {
            return false;
          }

          const parent = $from.node(range.depth);

          if (!parent.canReplaceWith(range.startIndex, range.endIndex, columnsType)) {
            return false;
          }

          let containsColumns = false;

          tr.doc.nodesBetween(range.start, range.end, (node) => {
            if (node.type === columnsType) {
              containsColumns = true;
              return false;
            }

            return !containsColumns;
          });

          if (containsColumns) {
            return false;
          }

          const selectedContent = tr.doc.slice(range.start, range.end).content;

          if (!columnType.validContent(selectedContent)) {
            return false;
          }

          const defaultBlockType = columnType.contentMatch.defaultType;

          if (!defaultBlockType) {
            return false;
          }

          const columnNodes = [columnType.create(null, selectedContent)];

          for (let index = 1; index < count; index += 1) {
            const defaultBlock = defaultBlockType.createAndFill();

            if (!defaultBlock) {
              return false;
            }

            columnNodes.push(columnType.create(null, defaultBlock));
          }

          const columnsContent = Fragment.fromArray(columnNodes);

          if (!columnsType.validContent(columnsContent)) {
            return false;
          }

          if (dispatch) {
            const columnsNode = columnsType.create(
              { widths: createEqualColumnWidths(count) },
              columnsContent
            );

            tr.replaceRangeWith(range.start, range.end, columnsNode);
            setSelectionInsideColumns(tr, range.start, columnsNode, range.start + 2);
            tr.scrollIntoView();
          }

          return true;
        },
      setColumns:
        (count: 2 | 3 = 2) =>
        ({ commands }) =>
          commands.insertColumns(count),
      setColumnCount:
        (count: 2 | 3) =>
        ({ state, tr, dispatch }) => {
          if (!Number.isInteger(count) || count < 2 || count > 3) {
            return false;
          }

          const columnsType = state.schema.nodes[this.name];
          const columnType = state.schema.nodes.column;

          if (!columnsType || !columnType) {
            return false;
          }

          const context = findColumnsContext(tr.doc, tr.selection, columnsType);

          if (!context) {
            return false;
          }

          const currentCount = context.node.childCount;

          if (currentCount === count) {
            return true;
          }

          const columnNodes: ProseMirrorNode[] = [];

          for (let index = 0; index < Math.min(currentCount, count); index += 1) {
            let columnNode = context.node.child(index);

            if (index === count - 1 && currentCount > count) {
              let mergedContent = columnNode.content;

              for (let remainder = count; remainder < currentCount; remainder += 1) {
                const remainderNode = context.node.child(remainder);

                if (!isEmptyPlaceholderColumn(remainderNode)) {
                  if (
                    isEmptyPlaceholderColumn(columnNode) &&
                    mergedContent === columnNode.content
                  ) {
                    mergedContent = remainderNode.content;
                  } else {
                    mergedContent = mergedContent.append(remainderNode.content);
                  }
                }
              }

              columnNode = columnNode.copy(mergedContent);
            }

            columnNodes.push(columnNode);
          }

          const defaultBlockType = columnType.contentMatch.defaultType;

          if (!defaultBlockType) {
            return false;
          }

          for (let index = currentCount; index < count; index += 1) {
            const defaultBlock = defaultBlockType.createAndFill();

            if (!defaultBlock) {
              return false;
            }

            columnNodes.push(columnType.create(null, defaultBlock));
          }

          const columnsContent = Fragment.fromArray(columnNodes);

          if (!columnsType.validContent(columnsContent)) {
            return false;
          }

          if (dispatch) {
            const relativeSelection = tr.selection.from - context.pos;
            const updatedColumns = columnsType.create(
              { ...context.node.attrs, widths: createEqualColumnWidths(count) },
              columnsContent
            );
            const selectionWasRetained = context.columnIndex < count;

            tr.replaceWith(context.pos, context.pos + context.node.nodeSize, updatedColumns);
            setSelectionInsideColumns(
              tr,
              context.pos,
              updatedColumns,
              selectionWasRetained
                ? context.pos + relativeSelection
                : context.pos + updatedColumns.nodeSize - 2,
              selectionWasRetained ? 1 : -1
            );
            tr.scrollIntoView();
          }

          return true;
        },
      setColumnWidths:
        (widths: number[]) =>
        ({ state, tr, dispatch }) => {
          const columnsType = state.schema.nodes[this.name];

          if (!columnsType) return false;

          const context = findColumnsContext(tr.doc, tr.selection, columnsType);

          if (!context || !isValidColumnWidths(widths, context.node.childCount)) {
            return false;
          }

          const normalizedWidths = normalizeColumnWidths(widths, context.node.childCount);

          if (dispatch) {
            tr.setNodeMarkup(context.pos, undefined, {
              ...context.node.attrs,
              widths: normalizedWidths,
            });
          }

          return true;
        },
      resetColumnWidths:
        () =>
        ({ state, commands }) => {
          const widths = getColumnWidthsAtSelection(state);

          if (!widths) return false;
          if (areEqualColumnWidths(widths)) return true;

          return commands.setColumnWidths(createEqualColumnWidths(widths.length));
        },
      unsetColumns:
        () =>
        ({ state, tr, dispatch }) => {
          const columnsType = state.schema.nodes[this.name];

          if (!columnsType) {
            return false;
          }

          const context = findColumnsContext(tr.doc, tr.selection, columnsType);

          if (!context) {
            return false;
          }

          let content = Fragment.empty;

          context.node.forEach((columnNode) => {
            content = content.append(columnNode.content);
          });

          const $columns = tr.doc.resolve(context.pos);
          const parent = $columns.parent;
          const index = $columns.index();

          if (!parent.canReplace(index, index + 1, content)) {
            return false;
          }

          if (dispatch) {
            tr.replaceWith(context.pos, context.pos + context.node.nodeSize, content);
            tr.setSelection(Selection.near(tr.doc.resolve(context.pos), 1));
            tr.scrollIntoView();
          }

          return true;
        },
    };
  },
});

export default Columns;
