"use client";

import type { Selection } from "@heroui/react";

import { FontFamilyPlugin } from "@platejs/basic-styles/react";
import { KEYS } from "platejs";
import { useEditorPlugin, useEditorSelector } from "platejs/react";
import { useEffect, useState } from "react";

import { Button, Dropdown } from "@heroui/react";
import { ChevronDown } from "@gravity-ui/icons";

const DEFAULT_FONT_FAMILY = "Default";

const FONT_FAMILIES = [
  { id: "Default", label: "Default", font: "inherit" },
  { id: "Inter", label: "Sans Serif", font: "Inter, ui-sans-serif, system-ui" },
  { id: "Arial", label: "Arial", font: "Arial, Helvetica, sans-serif" },
  { id: "Helvetica", label: "Helvetica", font: "Helvetica, Arial, sans-serif" },
  { id: "Verdana", label: "Verdana", font: "Verdana, Geneva, sans-serif" },
  { id: "Georgia", label: "Serif", font: "Georgia, ui-serif, serif" },
  { id: "Times New Roman", label: "Times New Roman", font: "'Times New Roman', Times, serif" },
  {
    id: "Palatino",
    label: "Palatino",
    font: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  },
  { id: "JetBrains Mono", label: "Monospace", font: "'JetBrains Mono', ui-monospace, monospace" },
  { id: "Courier New", label: "Typewriter", font: "'Courier New', Courier, monospace" },
  { id: "Comic Sans MS", label: "Handwritten", font: "'Comic Sans MS', cursive, sans-serif" },
  {
    id: "Impact",
    label: "Display",
    font: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
  },
];

export function FontFamilyToolbarButton() {
  const { editor, tf } = useEditorPlugin(FontFamilyPlugin);

  const cursorFontFamily = useEditorSelector((editor) => {
    const fontFamily = editor.api.marks()?.[KEYS.fontFamily];
    return (fontFamily as string) || DEFAULT_FONT_FAMILY;
  }, []);

  const handleDropdownChange = (keys: Selection) => {
    const selectedKey = Array.from(keys)[0];
    if (typeof selectedKey === "string") {
      if (selectedKey === "Default") {
        editor.tf.removeMarks([KEYS.fontFamily]);
      } else {
        tf.fontFamily.addMark(selectedKey);
      }
      editor.tf.focus();
    }
  };

  const currentFont =
    FONT_FAMILIES.find((f) => f.font === cursorFontFamily) ||
    FONT_FAMILIES.find((f) => f.id === "Default");
  const currentFontName = currentFont?.label || DEFAULT_FONT_FAMILY;
  const currentSelectedKey =
    currentFont?.font === "inherit" ? "Default" : currentFont?.font || "Default";

  return (
    <Dropdown>
      <Button aria-label="Font Family" variant="tertiary" size="sm">
        {currentFontName}
        <ChevronDown className="size-4 opacity-50" />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          selectedKeys={new Set([currentSelectedKey])}
          selectionMode="single"
          onSelectionChange={handleDropdownChange}
        >
          <Dropdown.Section>
            {FONT_FAMILIES.map((font) => (
              <Dropdown.Item
                id={font.font === "inherit" ? "Default" : font.font}
                textValue={font.label}
                key={font.id}
              >
                <Dropdown.ItemIndicator />
                <span style={{ fontFamily: font.font }}>{font.label}</span>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
