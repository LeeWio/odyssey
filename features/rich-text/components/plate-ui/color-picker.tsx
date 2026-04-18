"use client";

import React from "react";
import { ColorPicker, ColorArea, ColorSlider, Tooltip } from "@heroui/react";
import { ChevronDown } from "@gravity-ui/icons";

export interface ToolbarColorPickerProps {
  tooltip: string;
  icon: React.ElementType;
  value?: string;
  onChange?: (color: string) => void;
}

/**
 * A specialized color picker for toolbars.
 */
export function ToolbarColorPicker({
  tooltip,
  icon: Icon,
  value,
  onChange,
}: ToolbarColorPickerProps) {
  const trigger = (
    <ColorPicker.Trigger
      className="hover:bg-default-100 h-8 min-w-8 gap-0.5 rounded-md border-none bg-transparent px-1"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex flex-col items-center">
        <Icon className="size-4" />
        <div
          className="mt-0.5 h-0.5 w-4 rounded-full"
          style={{ backgroundColor: value || "currentColor" }}
        />
      </div>
      <ChevronDown className="size-3 opacity-50" />
    </ColorPicker.Trigger>
  );

  return (
    <ColorPicker value={value} onChange={(c) => onChange?.(c.toString("hex"))}>
      <Tooltip delay={0}>
        <Tooltip.Trigger>{trigger}</Tooltip.Trigger>
        <Tooltip.Content showArrow className="px-2 py-1 text-sm">
          {tooltip}
        </Tooltip.Content>
      </Tooltip>
      <ColorPicker.Popover className="rounded-xl border p-3 shadow-xl">
        <ColorArea colorSpace="hsb" xChannel="saturation" yChannel="brightness">
          <ColorArea.Thumb />
        </ColorArea>
        <ColorSlider className="mt-2" channel="hue" colorSpace="hsb">
          <ColorSlider.Track>
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>
      </ColorPicker.Popover>
    </ColorPicker>
  );
}
