import { LineHeightPlugin } from "@platejs/basic-styles/react";
import { useEditorRef, useSelectionFragmentProp } from "platejs/react";

import { Dropdown, Label } from "@heroui/react";
import { ArrowsExpandVertical } from "@gravity-ui/icons";
import React from "react";
import { ToolbarDropdown } from "../toolbar-kit";

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
    <ToolbarDropdown
      label={
        <div className="flex items-center gap-1">
          <ArrowsExpandVertical/>
          <span>{value || "1.5"}</span>
        </div>
      }
      tooltip="Line Height"
      buttonProps={{ variant: "tertiary" }}
    >
      <Dropdown.Popover>
        <Dropdown.Menu
          disallowEmptySelection
          selectionMode="single"
          selectedKeys={new Set([String(value) || ""])}
          onSelectionChange={(keys) => {
            const size = Array.from(keys)[0] as string;
            editor.getTransforms(LineHeightPlugin).lineHeight.setNodes(Number(size));
            editor.tf.focus();
          }}
        >
          {LINE_HEIGHTS.map((item) => (
            <Dropdown.Item key={item.id} id={item.id} textValue={item.label} >
              <Label>{item.label}</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </ToolbarDropdown>
  );
});

LineHeightToolbarButton.displayName = "LineHeightToolbarButton";
