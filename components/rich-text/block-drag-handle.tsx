"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { useRichTextEditor } from "@heroui-pro/react";
import DragHandle from "@tiptap/extension-drag-handle-react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeSelection, Selection } from "@tiptap/pm/state";
import { ArrowDown, ArrowUp, Copy, Grip, TrashBin } from "@gravity-ui/icons";
import { useMemo, useState } from "react";

interface ActiveBlock {
  node: ProseMirrorNode;
  position: number;
}

type BlockAction = "copy" | "delete" | "move-down" | "move-up";

const NESTED_DRAG_OPTIONS = {
  edgeDetection: "left",
} as const;

function getSiblingAvailability(activeBlock: ActiveBlock | null, document: ProseMirrorNode) {
  if (!activeBlock) {
    return { canMoveDown: false, canMoveUp: false };
  }

  const resolvedPosition = document.resolve(activeBlock.position);
  const index = resolvedPosition.index();

  return {
    canMoveDown: index < resolvedPosition.parent.childCount - 1,
    canMoveUp: index > 0,
  };
}

export function BlockDragHandle() {
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  const [activeBlock, setActiveBlock] = useState<ActiveBlock | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const siblingAvailability = useMemo(
    () =>
      editor
        ? getSiblingAvailability(activeBlock, editor.state.doc)
        : { canMoveDown: false, canMoveUp: false },
    [activeBlock, editor]
  );

  if (!editor || isDisabled || isReadOnly) return null;

  const selectBlock = () => {
    if (!activeBlock) return false;

    return editor.chain().focus().setNodeSelection(activeBlock.position).run();
  };

  const handleOpenChange = (nextIsOpen: boolean) => {
    setIsMenuOpen(nextIsOpen);

    if (nextIsOpen) {
      selectBlock();
      editor.commands.setMeta("lockDragHandle", true);
    } else {
      editor.commands.setMeta("lockDragHandle", false);
    }
  };

  const runAction = (action: BlockAction) => {
    if (!activeBlock) return;

    const { node, position } = activeBlock;
    const transaction = editor.state.tr;
    let nextPosition = position;
    let nextAnnouncement = "";

    if (action === "copy") {
      nextPosition = position + node.nodeSize;
      transaction.insert(nextPosition, node.copy(node.content));
      transaction.setSelection(NodeSelection.create(transaction.doc, nextPosition));
      nextAnnouncement = "Block duplicated";
    } else if (action === "delete") {
      transaction.delete(position, position + node.nodeSize);
      const selectionPosition = Math.min(position, transaction.doc.content.size);

      transaction.setSelection(Selection.near(transaction.doc.resolve(selectionPosition)));
      nextAnnouncement = "Block deleted";
    } else {
      const resolvedPosition = editor.state.doc.resolve(position);
      const index = resolvedPosition.index();

      if (action === "move-up") {
        if (index === 0) return;

        const previousNode = resolvedPosition.parent.child(index - 1);

        nextPosition = position - previousNode.nodeSize;
        transaction.delete(position, position + node.nodeSize);
        transaction.insert(nextPosition, node);
        nextAnnouncement = "Block moved up";
      } else {
        if (index >= resolvedPosition.parent.childCount - 1) return;

        const nextNode = resolvedPosition.parent.child(index + 1);

        transaction.delete(position, position + node.nodeSize);
        nextPosition = position + nextNode.nodeSize;
        transaction.insert(nextPosition, node);
        nextAnnouncement = "Block moved down";
      }

      transaction.setSelection(NodeSelection.create(transaction.doc, nextPosition));
    }

    editor.view.dispatch(transaction.scrollIntoView());
    editor.view.focus();
    setAnnouncement(nextAnnouncement);
    setIsMenuOpen(false);
    editor.commands.setMeta("lockDragHandle", false);

    if (action === "delete") {
      setActiveBlock(null);
    } else {
      setActiveBlock({ node, position: nextPosition });
    }
  };

  return (
    <>
      <DragHandle
        className="odyssey-block-drag-handle"
        editor={editor}
        nested={NESTED_DRAG_OPTIONS}
        onElementDragStart={() => selectBlock()}
        onNodeChange={({ node, pos }) => {
          if (!node || pos < 0) {
            if (!isMenuOpen) setActiveBlock(null);
            return;
          }

          setActiveBlock({ node, position: pos });
        }}
      >
        <Dropdown isOpen={isMenuOpen} onOpenChange={handleOpenChange}>
          <Button
            aria-label="Block actions"
            className="cursor-grab active:cursor-grabbing"
            isIconOnly
            size="sm"
            variant="tertiary"
            onPress={selectBlock}
          >
            <Grip aria-hidden="true" className="size-4" />
          </Button>
          <Dropdown.Popover placement="bottom start">
            <Dropdown.Menu
              aria-label="Block actions"
              onAction={(key) => runAction(String(key) as BlockAction)}
            >
              <Dropdown.Item
                id="move-up"
                isDisabled={!siblingAvailability.canMoveUp}
                textValue="Move up"
              >
                <ArrowUp aria-hidden="true" className="size-4" />
                <Label>Move up</Label>
              </Dropdown.Item>
              <Dropdown.Item
                id="move-down"
                isDisabled={!siblingAvailability.canMoveDown}
                textValue="Move down"
              >
                <ArrowDown aria-hidden="true" className="size-4" />
                <Label>Move down</Label>
              </Dropdown.Item>
              <Dropdown.Item id="copy" textValue="Duplicate block">
                <Copy aria-hidden="true" className="size-4" />
                <Label>Duplicate</Label>
              </Dropdown.Item>
              <Dropdown.Item id="delete" textValue="Delete block" variant="danger">
                <TrashBin aria-hidden="true" className="size-4" />
                <Label>Delete</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </DragHandle>
      <span aria-live="polite" className="sr-only" role="status">
        {announcement}
      </span>
    </>
  );
}
