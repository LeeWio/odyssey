"use client";

import React from "react";
import { Popover, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import {
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight,
  Ellipsis,
} from "@gravity-ui/icons";
import { TextAlignPlugin } from "@platejs/basic-styles/react";
import { type Alignment } from "@platejs/basic-styles";
import { useEditorPlugin, useSelectionFragmentProp } from "platejs/react";
import { ToolbarButton } from "../primitives/toolbar-button";

const alignmentItems = [
  { icon: TextAlignLeft, value: "left" },
  { icon: TextAlignCenter, value: "center" },
  { icon: TextAlignRight, value: "right" },
  { icon: TextAlignJustify, value: "justify" },
];

export function AlignToolbarButton() {
  const { editor, tf } = useEditorPlugin(TextAlignPlugin);

  let value =
    useSelectionFragmentProp({
      defaultValue: "left",
      getProp: (node) => node.align,
    }) ?? "left";

  if (value === "start") value = "left";
  if (value === "end") value = "right";

  return (
    <Popover>
      <Popover.Trigger>
        <ToolbarButton tooltip="Align">
          <Ellipsis />
        </ToolbarButton>
      </Popover.Trigger>

      <Popover.Content className="p-1">
        <ToggleButtonGroup
          selectedKeys={new Set([value])}
          onSelectionChange={(keys) => {
            const selectedValue = Array.from(keys)[0] as Alignment;
            if (selectedValue) {
              tf.textAlign.setNodes(selectedValue);
              editor.tf.focus();
            }
          }}
        >
          {alignmentItems.map(({ icon: Icon, value: itemValue }) => (
            <ToggleButton
              key={itemValue}
              id={itemValue}
              isIconOnly
              aria-label={itemValue}
              variant="ghost"
              size="sm"
            >
              <Icon />
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Popover.Content>
    </Popover>
  );
}
