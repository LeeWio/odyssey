import { useRichTextEditor } from "@heroui-pro/react";
import type { Node } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import { useCallback } from "react";

/**
 * Hook to define actions for the ContentItemMenu.
 */
export const useContentItemActions = (currentNode: Node | null, currentNodePos: number) => {
  const { editor } = useRichTextEditor();

  const deleteNode = useCallback(() => {
    if (!editor || currentNodePos === -1) return;
    editor.chain().focus().setNodeSelection(currentNodePos).deleteSelection().run();
  }, [editor, currentNodePos]);

  const copyNodeToClipboard = useCallback(async () => {
    if (!editor || currentNodePos === -1 || !currentNode) return;

    editor.chain().focus().setMeta("hideDragHandle", true).setNodeSelection(currentNodePos).run();

    try {
      const html = editor.getHTML();
      const text = editor.getText();

      const data = [
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ];

      await navigator.clipboard.write(data);
    } catch (err) {
      console.error("Failed to copy using Clipboard API, falling back...", err);
      const text = editor.getText();
      await navigator.clipboard.writeText(text);
    }
  }, [editor, currentNode, currentNodePos]);

  const duplicateNode = useCallback(() => {
    if (!editor || currentNodePos === -1 || !currentNode) return;
    editor
      .chain()
      .focus()
      .insertContentAt(currentNodePos + currentNode.nodeSize, currentNode.toJSON())
      .run();
  }, [editor, currentNode, currentNodePos]);

  const addBefore = useCallback(() => {
    if (!editor || currentNodePos === -1) return;
    editor
      .chain()
      .focus()
      .insertContentAt(currentNodePos, {
        type: "paragraph",
        content: [{ type: "text", text: "/" }],
      })
      .setTextSelection(currentNodePos + 2)
      .run();
  }, [editor, currentNodePos]);

  const addBelow = useCallback(() => {
    if (!editor || currentNodePos === -1 || !currentNode) return;
    const pos = currentNodePos + currentNode.nodeSize;
    editor
      .chain()
      .focus()
      .insertContentAt(pos, {
        type: "paragraph",
        content: [{ type: "text", text: "/" }],
      })
      .setTextSelection(pos + 2)
      .run();
  }, [editor, currentNode, currentNodePos]);

  const resetTextFormatting = useCallback(() => {
    if (!editor || currentNodePos === -1) return;

    const chain = editor.chain().focus();
    chain.setNodeSelection(currentNodePos).unsetAllMarks();

    if (currentNode?.type.name !== "paragraph") {
      chain.setParagraph();
    }

    chain.run();
  }, [editor, currentNodePos, currentNode?.type.name]);

  const setTextAlign = useCallback(
    (alignment: string) => {
      if (!editor || currentNodePos === -1) return;
      editor.chain().focus().setNodeSelection(currentNodePos).setTextAlign(alignment).run();
    },
    [editor, currentNodePos]
  );

  const toggleNodeType = useCallback(
    (type: string, options?: Record<string, unknown>) => {
      if (!editor || currentNodePos === -1) return;
      const chain = editor.chain().focus().setNodeSelection(currentNodePos);

      switch (type) {
        case "paragraph":
          chain.setParagraph().run();
          break;
        case "heading":
          chain.toggleHeading({ level: options?.level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
          break;
        case "bulletList":
          chain.toggleBulletList().run();
          break;
        case "orderedList":
          chain.toggleOrderedList().run();
          break;
        case "blockquote":
          chain.toggleBlockquote().run();
          break;
        case "codeBlock":
          chain.toggleCodeBlock().run();
          break;
      }
    },
    [editor, currentNodePos]
  );

  const moveNodeUp = useCallback(() => {
    if (!editor || currentNodePos === -1 || !currentNode) return;
    const resolvedPosition = editor.state.doc.resolve(currentNodePos);
    const index = resolvedPosition.index();
    if (index === 0) return;

    const previousNode = resolvedPosition.parent.child(index - 1);
    const nextPosition = currentNodePos - previousNode.nodeSize;
    const transaction = editor.state.tr;

    transaction.delete(currentNodePos, currentNodePos + currentNode.nodeSize);
    transaction.insert(nextPosition, currentNode);
    transaction.setSelection(NodeSelection.create(transaction.doc, nextPosition));

    editor.view.dispatch(transaction.scrollIntoView());
  }, [editor, currentNode, currentNodePos]);

  const moveNodeDown = useCallback(() => {
    if (!editor || currentNodePos === -1 || !currentNode) return;
    const resolvedPosition = editor.state.doc.resolve(currentNodePos);
    const index = resolvedPosition.index();
    if (index >= resolvedPosition.parent.childCount - 1) return;

    const nextNode = resolvedPosition.parent.child(index + 1);
    const transaction = editor.state.tr;

    transaction.delete(currentNodePos, currentNodePos + currentNode.nodeSize);
    const nextPosition = currentNodePos + nextNode.nodeSize;
    transaction.insert(nextPosition, currentNode);
    transaction.setSelection(NodeSelection.create(transaction.doc, nextPosition));

    editor.view.dispatch(transaction.scrollIntoView());
  }, [editor, currentNode, currentNodePos]);

  // Context-Aware Table actions
  const addTableColumnBefore = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addColumnBefore().run();
  }, [editor]);

  const addTableColumnAfter = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addColumnAfter().run();
  }, [editor]);

  const deleteTableColumn = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteColumn().run();
  }, [editor]);

  const addTableRowBefore = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addRowBefore().run();
  }, [editor]);

  const addTableRowAfter = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addRowAfter().run();
  }, [editor]);

  const deleteTableRow = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteRow().run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();
  }, [editor]);

  // Context-Aware Image actions
  const updateImageAttributes = useCallback(
    (attrs: Record<string, unknown>) => {
      if (!editor || currentNodePos === -1) return;
      editor
        .chain()
        .focus()
        .setNodeSelection(currentNodePos)
        .updateAttributes("image", attrs)
        .run();
    },
    [editor, currentNodePos]
  );

  // Context-Aware Task actions
  const toggleTaskChecked = useCallback(() => {
    if (!editor || currentNodePos === -1 || !currentNode) return;
    const checked = !currentNode.attrs.checked;
    editor
      .chain()
      .focus()
      .setNodeSelection(currentNodePos)
      .updateAttributes("taskItem", { checked })
      .run();
  }, [editor, currentNode, currentNodePos]);

  return {
    deleteNode,
    copyNodeToClipboard,
    duplicateNode,
    addBefore,
    addBelow,
    resetTextFormatting,
    setTextAlign,
    toggleNodeType,
    moveNodeUp,
    moveNodeDown,
    addTableColumnBefore,
    addTableColumnAfter,
    deleteTableColumn,
    addTableRowBefore,
    addTableRowAfter,
    deleteTableRow,
    deleteTable,
    updateImageAttributes,
    toggleTaskChecked,
  };
};
