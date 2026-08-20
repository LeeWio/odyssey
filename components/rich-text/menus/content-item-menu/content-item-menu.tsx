"use client";

import { Button, Dropdown, Label, Header } from "@heroui/react";
import { useRichTextEditor } from "@heroui-pro/react";
import DragHandle from "@tiptap/extension-drag-handle-react";
import { ArrowDown, ArrowUp, Copy, Grip, TrashBin } from "@gravity-ui/icons";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";
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

  // Context-Aware Node Detection with defensive RangeError boundaries
  const isImageNode = activeBlock?.node.type.name === "image";

  const isTableNode = useMemo(() => {
    if (!editor || !activeBlock) return false;
    if (activeBlock.node.type.name === "table") return true;

    try {
      const resolved = editor.state.doc.resolve(activeBlock.position);
      for (let depth = resolved.depth; depth > 0; depth -= 1) {
        if (resolved.node(depth).type.name === "table") {
          return true;
        }
      }
    } catch {
      // Defensive fallback
    }
    return false;
  }, [editor, activeBlock]);

  const isTaskNode = useMemo(() => {
    if (!editor || !activeBlock) return false;
    if (activeBlock.node.type.name === "taskItem") return true;

    try {
      const resolved = editor.state.doc.resolve(activeBlock.position);
      for (let depth = resolved.depth; depth > 0; depth -= 1) {
        if (resolved.node(depth).type.name === "taskItem") {
          return true;
        }
      }
    } catch {
      // Defensive fallback
    }
    return false;
  }, [editor, activeBlock]);

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

  const runAction = (action: string) => {
    if (!activeBlock) return;

    if (
      action === "copy" ||
      action === "delete" ||
      action === "move-up" ||
      action === "move-down"
    ) {
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
    }

    // Context Table Actions
    else if (action === "table-add-col-before") {
      actions.addTableColumnBefore();
      setAnnouncement("Column added left");
    } else if (action === "table-add-col-after") {
      actions.addTableColumnAfter();
      setAnnouncement("Column added right");
    } else if (action === "table-add-row-before") {
      actions.addTableRowBefore();
      setAnnouncement("Row added above");
    } else if (action === "table-add-row-after") {
      actions.addTableRowAfter();
      setAnnouncement("Row added below");
    } else if (action === "table-delete-col") {
      actions.deleteTableColumn();
      setAnnouncement("Column deleted");
    } else if (action === "table-delete-row") {
      actions.deleteTableRow();
      setAnnouncement("Row deleted");
    } else if (action === "table-delete") {
      actions.deleteTable();
      setAnnouncement("Table deleted");
      setActiveBlock(null);
    }

    // Context Image Actions
    else if (action === "image-align-left") {
      actions.updateImageAttributes({ alignment: "left" });
      setAnnouncement("Aligned image left");
    } else if (action === "image-align-center") {
      actions.updateImageAttributes({ alignment: "center" });
      setAnnouncement("Aligned image center");
    } else if (action === "image-align-right") {
      actions.updateImageAttributes({ alignment: "right" });
      setAnnouncement("Aligned image right");
    } else if (action === "image-caption") {
      const currentCaption = activeBlock.node.attrs.caption || "";
      const caption = prompt("Enter image caption:", currentCaption);
      if (caption !== null) {
        actions.updateImageAttributes({ caption });
        setAnnouncement("Image caption updated");
      }
    } else if (action === "image-download") {
      const src = activeBlock.node.attrs.src;
      const alt = activeBlock.node.attrs.alt;
      if (src) {
        const link = document.createElement("a");
        link.href = src;
        link.download = alt || "download";
        link.click();
        setAnnouncement("Downloading image");
      }
    }

    // Context Task Actions
    else if (action === "task-toggle") {
      actions.toggleTaskChecked();
      setAnnouncement("Task checkbox toggled");
    }

    setIsMenuOpen(false);
    editor.commands.setMeta("lockDragHandle", false);
  };

  const handleTurnInto = (key: string) => {
    if (!activeBlock) return;

    if (key === "paragraph") {
      actions.toggleNodeType("paragraph");
      setAnnouncement("Converted to Paragraph");
    } else if (key === "heading-1") {
      actions.toggleNodeType("heading", { level: 1 });
      setAnnouncement("Converted to Heading 1");
    } else if (key === "heading-2") {
      actions.toggleNodeType("heading", { level: 2 });
      setAnnouncement("Converted to Heading 2");
    } else if (key === "heading-3") {
      actions.toggleNodeType("heading", { level: 3 });
      setAnnouncement("Converted to Heading 3");
    } else if (key === "bullet-list") {
      actions.toggleNodeType("bulletList");
      setAnnouncement("Converted to Bullet list");
    } else if (key === "ordered-list") {
      actions.toggleNodeType("orderedList");
      setAnnouncement("Converted to Ordered list");
    } else if (key === "blockquote") {
      actions.toggleNodeType("blockquote");
      setAnnouncement("Converted to Blockquote");
    } else if (key === "code-block") {
      actions.toggleNodeType("codeBlock");
      setAnnouncement("Converted to Code block");
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
            <Dropdown.Menu aria-label="Block actions" onAction={(key) => runAction(String(key))}>
              {/* Context-Aware Section: Table */}
              {isTableNode && (
                <Dropdown.Section>
                  <Header>Table Actions</Header>
                  <Dropdown.Item id="table-add-col-before" textValue="Insert Column Left">
                    <Icon icon="gravity-ui:layout-columns" className="text-muted size-4 shrink-0" />
                    <Label>Insert Column Left</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="table-add-col-after" textValue="Insert Column Right">
                    <Icon icon="gravity-ui:layout-columns" className="text-muted size-4 shrink-0" />
                    <Label>Insert Column Right</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="table-add-row-before" textValue="Insert Row Above">
                    <Icon icon="gravity-ui:layout-rows" className="text-muted size-4 shrink-0" />
                    <Label>Insert Row Above</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="table-add-row-after" textValue="Insert Row Below">
                    <Icon icon="gravity-ui:layout-rows" className="text-muted size-4 shrink-0" />
                    <Label>Insert Row Below</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="table-delete-col" textValue="Delete Column">
                    <Icon icon="gravity-ui:minus" className="text-muted size-4 shrink-0" />
                    <Label>Delete Column</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="table-delete-row" textValue="Delete Row">
                    <Icon icon="gravity-ui:minus" className="text-muted size-4 shrink-0" />
                    <Label>Delete Row</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="table-delete" textValue="Delete Table" variant="danger">
                    <TrashBin className="text-danger size-4 shrink-0" />
                    <Label>Delete Table</Label>
                  </Dropdown.Item>
                </Dropdown.Section>
              )}

              {/* Context-Aware Section: Image */}
              {isImageNode && (
                <Dropdown.Section>
                  <Header>Image Actions</Header>
                  <Dropdown.Item id="image-align-left" textValue="Align Left">
                    <Icon icon="gravity-ui:align-left" className="text-muted size-4 shrink-0" />
                    <Label>Align Left</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="image-align-center" textValue="Align Center">
                    <Icon icon="gravity-ui:align-center" className="text-muted size-4 shrink-0" />
                    <Label>Align Center</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="image-align-right" textValue="Align Right">
                    <Icon icon="gravity-ui:align-right" className="text-muted size-4 shrink-0" />
                    <Label>Align Right</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="image-caption" textValue="Edit Caption">
                    <Icon icon="gravity-ui:quote-open" className="text-muted size-4 shrink-0" />
                    <Label>Edit Caption</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="image-download" textValue="Download Image">
                    <Icon
                      icon="gravity-ui:arrow-down-to-line"
                      className="text-muted size-4 shrink-0"
                    />
                    <Label>Download Image</Label>
                  </Dropdown.Item>
                </Dropdown.Section>
              )}

              {/* Context-Aware Section: Task Item */}
              {isTaskNode && (
                <Dropdown.Section>
                  <Header>Task Actions</Header>
                  <Dropdown.Item id="task-toggle" textValue="Toggle Completed">
                    <Icon icon="gravity-ui:circle-check" className="text-muted size-4 shrink-0" />
                    <Label>Toggle Completed</Label>
                  </Dropdown.Item>
                </Dropdown.Section>
              )}

              {/* General Section */}
              <Dropdown.Section>
                <Header>Block Actions</Header>
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

                <Dropdown.SubmenuTrigger>
                  <Dropdown.Item id="turn-into" textValue="Turn into">
                    <Icon icon="gravity-ui:arrow-loop-right" className="size-4 shrink-0" />
                    <Label>Turn into</Label>
                    <Dropdown.SubmenuIndicator />
                  </Dropdown.Item>
                  <Dropdown.Popover>
                    <Dropdown.Menu
                      aria-label="Turn into options"
                      onAction={(key) => handleTurnInto(String(key))}
                    >
                      <Dropdown.Item id="paragraph" textValue="Paragraph">
                        <Icon icon="gravity-ui:text" className="text-muted size-4 shrink-0" />
                        <Label>Paragraph</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="heading-1" textValue="Heading 1">
                        <Icon icon="gravity-ui:heading-1" className="text-muted size-4 shrink-0" />
                        <Label>Heading 1</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="heading-2" textValue="Heading 2">
                        <Icon icon="gravity-ui:heading-2" className="text-muted size-4 shrink-0" />
                        <Label>Heading 2</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="heading-3" textValue="Heading 3">
                        <Icon icon="gravity-ui:heading-3" className="text-muted size-4 shrink-0" />
                        <Label>Heading 3</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="bullet-list" textValue="Bullet list">
                        <Icon
                          icon="gravity-ui:list-bullet"
                          className="text-muted size-4 shrink-0"
                        />
                        <Label>Bullet list</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="ordered-list" textValue="Ordered list">
                        <Icon
                          icon="gravity-ui:list-ordered"
                          className="text-muted size-4 shrink-0"
                        />
                        <Label>Ordered list</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="blockquote" textValue="Blockquote">
                        <Icon icon="gravity-ui:quote-open" className="text-muted size-4 shrink-0" />
                        <Label>Blockquote</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="code-block" textValue="Code block">
                        <Icon icon="gravity-ui:code" className="text-muted size-4 shrink-0" />
                        <Label>Code block</Label>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown.SubmenuTrigger>

                <Dropdown.Item id="copy" textValue="Duplicate block">
                  <Copy aria-hidden="true" className="size-4" />
                  <Label>Duplicate</Label>
                </Dropdown.Item>
                <Dropdown.Item id="delete" textValue="Delete block" variant="danger">
                  <TrashBin aria-hidden="true" className="size-4" />
                  <Label>Delete</Label>
                </Dropdown.Item>
              </Dropdown.Section>
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
