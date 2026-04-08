"use client";

import React, { ReactNode } from "react";
import {
  Button,
  ToggleButton,
  Tooltip,
  ColorPicker,
  ColorArea,
  ColorSlider,
  Dropdown,
  type ButtonProps,
  type ToggleButtonProps,
} from "@heroui/react";
import { useMarkToolbarButton, useMarkToolbarButtonState } from "platejs/react";

export const ToolbarButton = React.forwardRef<
  HTMLButtonElement,
  (ButtonProps | ToggleButtonProps) & {
    tooltip?: string;
    isSelected?: boolean;
    children: ReactNode;
  }
>(({ children, tooltip, isSelected, ...props }, ref) => {
  const isToggle = typeof isSelected === "boolean";

  const buttonContent = isToggle ? (
    <ToggleButton {...(props as ToggleButtonProps)} ref={ref} isSelected={isSelected} isIconOnly>
      {children}
    </ToggleButton>
  ) : (
    <Button {...(props as ButtonProps)} ref={ref} isIconOnly>
      {children}
    </Button>
  );

  if (!tooltip) return buttonContent;

  return (
    <Tooltip delay={0}>
      {buttonContent}
      <Tooltip.Content className="px-2 py-1 text-sm">{tooltip}</Tooltip.Content>
    </Tooltip>
  );
});

ToolbarButton.displayName = "ToolbarButton";

export function MarkToolbarButton({
  clear,
  nodeType,
  icon,
  tooltip,
  ...props
}: {
  nodeType: string;
  clear?: string[] | string;
  icon?: ReactNode;
  tooltip?: string;
}) {
  const state = useMarkToolbarButtonState({ clear, nodeType });
  const { props: plateProps } = useMarkToolbarButton(state);

  return (
    <ToolbarButton
      {...props}
      tooltip={tooltip}
      onPress={plateProps.onClick}
      isSelected={plateProps.pressed}
      onMouseDown={plateProps.onMouseDown}
    >
      {icon}
    </ToolbarButton>
  );
}

/**
 * 颜色选择器按钮 (ToolbarColorPicker)
 */
export function ToolbarColorPicker({
  tooltip,
  icon: Icon,
  value,
  onChange,
}: {
  tooltip: string;
  icon: React.ElementType;
  value?: string;
  onChange?: (color: string) => void;
}) {
  return (
    <ColorPicker value={value} onChange={(c) => onChange?.(c.toString("hex"))}>
      <Tooltip delay={0}>
        <Tooltip.Trigger>
          <ColorPicker.Trigger className="hover:bg-default-100 h-8 min-w-8 gap-0.5 rounded-md border-none bg-transparent px-1">
            <div className="flex flex-col items-center">
              <Icon className="size-4" />
              <div
                className="mt-0.5 h-0.5 w-4 rounded-full"
                style={{ backgroundColor: value || "currentColor" }}
              />
            </div>
            <ChevronDown className="size-3 opacity-50" />
          </ColorPicker.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Content className="px-2 py-1 text-sm">{tooltip}</Tooltip.Content>
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

/**
 * 下拉菜单按钮 (ToolbarDropdown)
 */
export function ToolbarDropdown({
  tooltip,
  label,
  items,
  onAction,
}: {
  tooltip: string;
  label: React.ReactNode;
  items: { id: string; label: string; icon?: React.ElementType }[];
  onAction: (key: string) => void;
}) {
  return (
    <Dropdown>
      <Tooltip delay={0}>
        <Tooltip.Trigger>
          <Dropdown.Trigger>
            <Button size="sm" variant="ghost" className="h-8 gap-1 px-2">
              {label}
              <ChevronDown className="size-3 opacity-50" />
            </Button>
          </Dropdown.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Content className="px-2 py-1 text-sm">{tooltip}</Tooltip.Content>
      </Tooltip>
      <Dropdown.Popover className="min-w-[150px] rounded-xl border p-1 shadow-xl">
        <Dropdown.Menu onAction={(key) => onAction(key as string)}>
          {items.map((item) => (
            <Dropdown.Item key={item.id} id={item.id} textValue={item.label}>
              <div className="flex items-center gap-2">
                {item.icon && <item.icon className="text-muted-foreground size-4" />}
                <span>{item.label}</span>
              </div>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
