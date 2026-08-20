"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { useRichTextEditor } from "@heroui-pro/react";
import DragHandle from "@tiptap/extension-drag-handle-react";
import { ArrowDown, ArrowUp, Copy, Grip, TrashBin } from "@gravity-ui/icons";
import { useState } from "react";
import { useContentItemState } from "./hooks/use-content-item-state";
import { useContentItemActions } from "./hooks/use-content-item-actions";

const NESTED_DRAG_OPTIONS = {
  edgeDetection: "left",
} as const;

export function ContentItemMenu() {
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  const [announcement, setAnnouncement] = useState("");

  const { activeBlock, setActiveBlock, isMenuOpen, setIsMenuOpen, siblingAvailability } =
    useContentItemState();

  const actions = useContentItemActions(activeBlock?.node ?? null, activeBlock?.position ?? -1);

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

  const runAction = (action: "copy" | "delete" | "move-up" | "move-down") => {
    if (!activeBlock) return;

    if (action === "copy") {
      actions.duplicateNode();
      setAnnouncement("Block duplicated");
    } else if (action === "delete") {
      actions.deleteNode();
      setAnnouncement("Block deleted");
      setActiveBlock(null);
    } else if (action === "move-up") {
      actions.moveNodeUp();
      setAnnouncement("Block moved up");
    } else if (action === "move-down") {
      actions.moveNodeDown();
      setAnnouncement("Block moved down");
    }

    setIsMenuOpen(false);
    editor.commands.setMeta("lockDragHandle", false);
  };

  return (
    <>
      <DragHandle
        className="-translate-1 translate-x-1.5 transition-[top,left,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:transition-none data-[dragging=true]:transition-none"
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
        <Dropdown trigger="longPress" isOpen={isMenuOpen} onOpenChange={handleOpenChange}>
          <Button
            aria-label="Block actions"
            className="cursor-grab active:cursor-grabbing"
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={selectBlock}
          >
            <Grip aria-hidden="true" className="size-4" />
          </Button>
          <Dropdown.Popover placement="bottom start">
            <Dropdown.Menu
              aria-label="Block actions"
              onAction={(key) => runAction(key as "copy" | "delete" | "move-up" | "move-down")}
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
