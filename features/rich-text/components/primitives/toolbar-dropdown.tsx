"use client";

import React from "react";
import { Button, Dropdown, Tooltip, type ButtonProps, type DropdownProps } from "@heroui/react";
import { ChevronDown } from "@gravity-ui/icons";

export interface ToolbarDropdownProps extends Omit<DropdownProps, "children"> {
  /**
   * Tooltip for the trigger.
   */
  tooltip?: string;
  /**
   * Label for the trigger.
   */
  label?: React.ReactNode;
  /**
   * Props for the trigger button.
   */
  buttonProps?: ButtonProps;
  /**
   * The dropdown content (usually Dropdown.Popover -> Dropdown.Menu).
   */
  children: React.ReactNode;
}

/**
 * A compositional dropdown for toolbars.
 */
export function ToolbarDropdown({
  tooltip,
  label,
  buttonProps,
  children,
  ...props
}: ToolbarDropdownProps) {
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
      {trigger}
      <Tooltip.Content showArrow className="px-2 py-1 text-sm">
        {tooltip}
      </Tooltip.Content>
    </Tooltip>
  ) : (
    <Dropdown.Trigger>{trigger}</Dropdown.Trigger>
  );

  return (
    <Dropdown {...props}>
      {menuTrigger}
      {children}
    </Dropdown>
  );
}
