"use client";

import { toUnitLess } from "@platejs/basic-styles";
import { FontSizePlugin } from "@platejs/basic-styles/react";
import type { TElement } from "platejs";
import { KEYS } from "platejs";
import { useEditorPlugin, useEditorSelector } from "platejs/react";
import { Button, ButtonGroup } from "@heroui/react";
import { Minus, Plus } from "@gravity-ui/icons";
import { ToolbarDropdown } from "./primitives/toolbar-dropdown";

const DEFAULT_FONT_SIZE = "16";

const FONT_SIZE_MAP = {
  h1: "36",
  h2: "24",
  h3: "20",
} as const;

const FONT_SIZES = [
  "8", "9", "10", "12", "14", "16", "18", "24", "30", "36", "48", "60", "72", "96",
].map(size => ({ id: size, label: size }));

export function FontSizeToolbarButton() {
  const { editor, tf } = useEditorPlugin(FontSizePlugin);

  const cursorFontSize = useEditorSelector((editor) => {
    const fontSize = editor.api.marks()?.[KEYS.fontSize];

    if (fontSize) {
      return toUnitLess(fontSize as string);
    }

    const [block] = editor.api.block<TElement>() || [];

    if (!block?.type) return DEFAULT_FONT_SIZE;

    return block.type in FONT_SIZE_MAP
      ? FONT_SIZE_MAP[block.type as keyof typeof FONT_SIZE_MAP]
      : DEFAULT_FONT_SIZE;
  }, []);

  const handleFontSizeChange = (delta: number) => {
    const newSize = Number(cursorFontSize) + delta;
    tf.fontSize.addMark(`${newSize}px`);
    editor.tf.focus();
  };

  const handleDropdownChange = (selectedKey: string) => {
    tf.fontSize.addMark(`${selectedKey}px`);
    editor.tf.focus();
  };

  return (
    <ButtonGroup size="sm" variant="tertiary">
      <Button
        isIconOnly
        onPress={() => handleFontSizeChange(-1)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <Minus />
      </Button>
      <ToolbarDropdown
        items={FONT_SIZES}
        selectedKey={cursorFontSize}
        onSelectionChange={handleDropdownChange}
        label={cursorFontSize}
        tooltip="Font Size"
        buttonProps={{ variant: "tertiary" }}
      />
      <Button
        isIconOnly
        onPress={() => handleFontSizeChange(1)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <Plus />
      </Button>
    </ButtonGroup>
  );
}
