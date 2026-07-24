"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { Icon } from "@iconify/react";
import { memo } from "react";

interface LineHeightPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const LINE_HEIGHTS = [
  { id: "1", label: "Single" },
  { id: "1.15", label: "1.15" },
  { id: "1.5", label: "1.5" },
  { id: "2", label: "Double" },
  { id: "2.5", label: "2.5" },
  { id: "3", label: "3" },
];

export const LineHeightPicker = memo(function LineHeightPicker({
  value,
  onChange,
}: LineHeightPickerProps) {
  const currentLineHeight =
    LINE_HEIGHTS.find((lh) => lh.id === value) ||
    LINE_HEIGHTS.find((lh) => lh.id === "1.15") ||
    LINE_HEIGHTS[0];

  return (
    <Dropdown>
      <Button size="sm" variant="ghost" aria-label="Line height">
        <span className="truncate">{currentLineHeight.label}</span>
        <Icon icon="gravity-ui:chevron-down" className="text-default-400" />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          onAction={(key) => {
            onChange(key as string);
          }}
          selectedKeys={new Set([currentLineHeight.id])}
          selectionMode="single"
        >
          {LINE_HEIGHTS.map((item) => (
            <Dropdown.Item id={item.id} key={item.id} textValue={item.label}>
              <Label className="font-normal">{item.label}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
});

LineHeightPicker.displayName = "LineHeightPicker";
