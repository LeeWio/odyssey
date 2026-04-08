"use client";

import type { Selection } from "@heroui/react";

import { toUnitLess } from "@platejs/basic-styles";
import { FontSizePlugin } from "@platejs/basic-styles/react";
import type { TElement } from "platejs";
import { KEYS } from "platejs";
import { useEditorPlugin, useEditorSelector } from "platejs/react";
import { useState } from "react";

import { Button, ButtonGroup, Dropdown, Label } from "@heroui/react";

import { Minus, Plus } from "@gravity-ui/icons";

const DEFAULT_FONT_SIZE = "16";

const FONT_SIZE_MAP = {
  h1: "36",
  h2: "24",
  h3: "20",
} as const;

const FONT_SIZES = [
  "8",
  "9",
  "10",
  "12",
  "14",
  "16",
  "18",
  "24",
  "30",
  "36",
  "48",
  "60",
  "72",
  "96",
] as const;

export function FontSizeToolbarButton() {
  const [inputValue, setInputValue] = useState(DEFAULT_FONT_SIZE);
  const [isFocused, setIsFocused] = useState(false);
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

  const handleInputChange = () => {
    const newSize = toUnitLess(inputValue);

    if (Number.parseInt(newSize, 10) < 1 || Number.parseInt(newSize, 10) > 100) {
      editor.tf.focus();

      return;
    }
    if (newSize !== toUnitLess(cursorFontSize)) {
      tf.fontSize.addMark(`${newSize}px`);
    }

    editor.tf.focus();
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Number(displayValue) + delta;
    tf.fontSize.addMark(`${newSize}px`);
    editor.tf.focus();
  };

  const displayValue = isFocused ? inputValue : cursorFontSize;

  const handleDropdownChange = (keys: Selection) => {
    const selectedKey = Array.from(keys)[0];
    if (typeof selectedKey === "string") {
      tf.fontSize.addMark(`${selectedKey}px`);
      editor.tf.focus();
    }
  };

  return (
    <ButtonGroup size="sm" variant="tertiary">
      <Button isIconOnly onPress={() => handleFontSizeChange(-1)}>
        <Minus />
      </Button>
      <Dropdown>
        <Button aria-label="font size" variant="tertiary" size="sm">
          {displayValue}
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu
            selectedKeys={new Set([displayValue || ""])}
            selectionMode="single"
            onSelectionChange={handleDropdownChange}
          >
            <Dropdown.Section>
              {FONT_SIZES.map((size) => (
                <Dropdown.Item id={size} textValue={size} key={size}>
                  <Dropdown.ItemIndicator />
                  <Label>{size}</Label>
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <Button isIconOnly onPress={() => handleFontSizeChange(1)}>
        <Plus />
      </Button>
    </ButtonGroup>
  );
}
