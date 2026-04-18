"use client";

import React from "react";
import {
  Button,
  Dropdown,
  Tooltip,
  type Selection,
  type ButtonProps,
  type DropdownProps,
} from "@heroui/react";
import { ChevronDown } from "@gravity-ui/icons";

export interface ToolbarDropdownProps<T extends string> extends Omit<DropdownProps, "children"> {
  /**
   * The current selected value.
   */
  selectedKey?: T;
  /**
   * Called when selection changes.
   */
  onSelectionChange?: (key: T) => void;
  /**
   * Items to display in the menu.
   */
  items: { id: T; label: string; icon?: React.ElementType; font?: string }[];
  /**
   * Tooltip for the trigger.
   */
  tooltip?: string;
  /**
   * Label for the trigger (usually the current value's label).
   */
  label?: React.ReactNode;
  /**
   * Props for the trigger button.
   */
  buttonProps?: ButtonProps;
}

/**
 * A specialized dropdown for toolbars that wraps HeroUI's Dropdown with a Tooltip.
 * It's data-driven and handles selection changes consistently.
 */
export function ToolbarDropdown<T extends string>({
  items,
  selectedKey,
  onSelectionChange,
  tooltip,
  label,
  buttonProps,
  ...props
}: ToolbarDropdownProps<T>) {
  const trigger = (
    <Button
      size="sm"
      variant="ghost"
      {...buttonProps}
      onMouseDown={(e) => {
        e.preventDefault();
        buttonProps?.onMouseDown?.(e);
      }}
    >
      {label}
      <ChevronDown />
    </Button>
  );

  const menuTrigger = tooltip ? (
    <Tooltip delay={0}>
      <Tooltip.Trigger>
        <Dropdown.Trigger>{trigger}</Dropdown.Trigger>
      </Tooltip.Trigger>
      <Tooltip.Content showArrow>
        {tooltip}
      </Tooltip.Content>
    </Tooltip>
  ) : (
    <Dropdown.Trigger>{trigger}</Dropdown.Trigger>
  );

  return (
    <Dropdown {...props}>
      {menuTrigger}
      <Dropdown.Popover>
        <Dropdown.Menu
          disallowEmptySelection
          selectionMode="single"
          selectedKeys={selectedKey ? new Set([selectedKey]) : undefined}
          onSelectionChange={(keys: Selection) => {
            const key = Array.from(keys)[0] as T;
            onSelectionChange?.(key);
          }}
        >
          {items.map((item) => (
            <Dropdown.Item key={item.id} id={item.id} textValue={item.label} className="flex items-center gap-2">
              {item.icon && <item.icon className="text-muted-foreground size-4" />}
              <span style={{ fontFamily: item.font }}>{item.label}</span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
