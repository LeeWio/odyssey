"use client";

import { Popover, Toolbar, ToggleButton, ToggleButtonGroup } from "@heroui/react";

import {
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight,
  Ellipsis,
} from "@gravity-ui/icons";

import { TextAlignPlugin } from "@platejs/basic-styles/react";
import { useEditorPlugin, useSelectionFragmentProp } from "platejs/react";

import { ToolbarButton } from "./toolbar-kit";
import { Alignment } from "@platejs/basic-styles";

const items = [
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
      <ToolbarButton size="sm" variant="tertiary" tooltip="Align">
        <Ellipsis />
      </ToolbarButton>

      <Popover.Content className="p-1">
        <Toolbar isAttached>
          <ToggleButtonGroup>
            {items.map(({ icon: Icon, value: itemValue }) => (
              <ToggleButton
                key={itemValue}
                isIconOnly
                aria-label={itemValue}
                isSelected={value === itemValue}
                onPress={() => {
                  tf.textAlign.setNodes(itemValue as Alignment);
                  editor.tf.focus();
                }}
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
