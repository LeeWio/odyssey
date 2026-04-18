"use client";

import React from "react";
import { Popover, Toolbar, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import {
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight,
  Ellipsis,
} from "@gravity-ui/icons";
import { TextAlignPlugin, type Alignment } from "@platejs/basic-styles/react";
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

  const value =
    useSelectionFragmentProp({
      defaultValue: "start",
      getProp: (node) => node.align,
    }) ?? "left";

  return (
    <Popover>
      <Popover.Trigger>
        <ToolbarButton tooltip="Align">
          <Ellipsis />
        </ToolbarButton>
      </Popover.Trigger>

      <Popover.Content className="p-1">
        <Toolbar isAttached>
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
              >
                <Icon />
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Toolbar>
      </Popover.Content>
    </Popover>
  );
}
