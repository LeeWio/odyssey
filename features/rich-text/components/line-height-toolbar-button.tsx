import { LineHeightPlugin } from "@platejs/basic-styles/react";
import { useEditorRef, useSelectionFragmentProp } from "platejs/react";

import { Dropdown, Button, Label } from "@heroui/react";
import { ChevronDown, ArrowsExpandVertical } from "@gravity-ui/icons";
import React from "react";

const LINE_HEIGHTS = [
  { id: "1", label: "Single" },
  { id: "1.15", label: "1.15" },
  { id: "1.5", label: "1.5" },
  { id: "2", label: "Double" },
  { id: "2.5", label: "2.5" },
  { id: "3", label: "3" },
];

export const LineHeightToolbarButton = React.memo(() => {
  const editor = useEditorRef();
  const { defaultNodeValue } = editor.getInjectProps(LineHeightPlugin);
  const value = useSelectionFragmentProp({
    defaultValue: defaultNodeValue,
    getProp: (node) => node.lineHeight,
  });

  return (
    <Dropdown>
      <Button size="sm" variant="tertiary">
        <ArrowsExpandVertical />
        {value || "1.5"}
        <ChevronDown />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          selectionMode="single"
          selectedKeys={new Set([value || ""])}
          onSelectionChange={(keys) => {
            const size = Array.from(keys)[0] as string;
            editor.getTransforms(LineHeightPlugin).lineHeight.setNodes(Number(size));
            editor.tf.focus();
          }}
        >
          {LINE_HEIGHTS.map((item) => (
            <Dropdown.Item key={item.id} id={item.id} textValue={item.label}>
              <Label>{item.label}</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
});

LineHeightToolbarButton.displayName = "LineHeightToolbarButton";
