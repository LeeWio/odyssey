"use client";

import { memo } from "react";
import { Dropdown, Button, Label } from "@heroui/react";
import { Icon } from "@iconify/react";

interface FontFamilyPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Inter", value: "Inter" },
  { label: "Arial", value: "Arial" },
  { label: "Comic Sans MS", value: "Comic Sans MS, Comic Sans" },
  { label: "Courier New", value: "Courier New" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Verdana", value: "Verdana" },
  { label: "Monospace", value: "monospace" },
  { label: "Serif", value: "serif" },
];

export const FontFamilyPicker = memo(function FontFamilyPicker({
  value,
  onChange,
}: FontFamilyPickerProps) {
  const currentFamily =
    FONT_FAMILIES.find((f) => f.value.toLowerCase() === value.toLowerCase()) || FONT_FAMILIES[0];

  return (
    <Dropdown>
      <Button size="sm" variant="ghost" aria-label="Font family">
        <span className="truncate">{currentFamily.label}</span>
        <Icon icon="gravity-ui:chevron-down" className="text-default-400" />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          onAction={(key) => {
            onChange(key as string);
          }}
          selectedKeys={new Set([currentFamily.value])}
          selectionMode="single"
        >
          {FONT_FAMILIES.map((family) => (
            <Dropdown.Item id={family.value} key={family.value} textValue={family.label}>
              <Label
                className={family.value ? `font-normal` : "font-normal"}
                style={{ fontFamily: family.value }}
              >
                {family.label}
              </Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
});

FontFamilyPicker.displayName = "FontFamilyPicker";
