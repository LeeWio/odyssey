"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react";
import { ChevronDown, Heading1, Heading2, Heading3, Text } from "@gravity-ui/icons";
import type { ComponentType, SVGProps } from "react";

const BLOCK_TYPES = [
  { id: "paragraph", label: "Text", icon: Text },
  { id: "heading-1", label: "Heading 1", icon: Heading1 },
  { id: "heading-2", label: "Heading 2", icon: Heading2 },
  { id: "heading-3", label: "Heading 3", icon: Heading3 },
] as const;

type BlockType = (typeof BLOCK_TYPES)[number]["id"];

function BlockTypeIcon({ icon: Icon }: { icon: ComponentType<SVGProps<SVGSVGElement>> }) {
  return <Icon aria-hidden="true" className="size-4 shrink-0" />;
}

export function BlockTypeSelector() {
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  const activeBlock = useRichTextEditorState((ctx): BlockType => {
    if (!ctx.editor) return "paragraph";

    if (ctx.editor.isActive("heading", { level: 1 })) return "heading-1";
    if (ctx.editor.isActive("heading", { level: 2 })) return "heading-2";
    if (ctx.editor.isActive("heading", { level: 3 })) return "heading-3";

    return "paragraph";
  });

  const normalizedActiveBlock = activeBlock ?? "paragraph";
  const activeItem =
    BLOCK_TYPES.find((item) => item.id === normalizedActiveBlock) ?? BLOCK_TYPES[0];

  const setBlockType = (key: React.Key) => {
    if (!editor) return;

    const blockType = String(key) as BlockType;
    const chain = editor.chain().focus();

    if (blockType === "paragraph") {
      chain.setParagraph().run();
      return;
    }

    const level = Number(blockType.slice(-1)) as 1 | 2 | 3;
    chain.setHeading({ level }).run();
  };

  return (
    <Dropdown>
      <Button
        aria-label={`Block type: ${activeItem.label}`}
        className="min-w-32 justify-between"
        isDisabled={isDisabled || isReadOnly}
        size="sm"
        variant="ghost"
      >
        <span className="flex items-center gap-2">
          <BlockTypeIcon icon={activeItem.icon} />
          <span className="text-xs">{activeItem.label}</span>
        </span>
        <ChevronDown aria-hidden="true" className="text-muted size-3.5" />
      </Button>
      <Dropdown.Popover className="min-w-52" placement="bottom start">
        <Dropdown.Menu
          aria-label="Choose block type"
          selectedKeys={new Set([normalizedActiveBlock])}
          selectionMode="single"
          onAction={setBlockType}
        >
          {BLOCK_TYPES.map((item) => (
            <Dropdown.Item id={item.id} key={item.id} textValue={item.label}>
              <BlockTypeIcon icon={item.icon} />
              <Label className="flex-1">{item.label}</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
