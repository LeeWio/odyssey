"use client";

import React, { forwardRef } from "react";
import { ToggleButton, Tooltip, type ToggleButtonProps } from "@heroui/react";

export interface ToolbarToggleProps extends ToggleButtonProps {
  /**
   * Optional tooltip text to display on hover.
   */
  tooltip?: React.ReactNode;
}

/**
 * A specialized toggle button for toolbars that wraps HeroUI's ToggleButton with a Tooltip.
 * Maps 'isSelected' state to visual highlights.
 */
export const ToolbarToggle = forwardRef<HTMLButtonElement, ToolbarToggleProps>(
  ({ children, tooltip, isSelected, size = "sm", variant = "default", isIconOnly = true, ...props }, ref) => {
    const button = (
      <ToggleButton
        ref={ref as React.Ref<HTMLButtonElement>}
        size={size}
        variant={variant}
        isIconOnly={isIconOnly}
        isSelected={isSelected}
        // Prevent loss of focus in the editor when clicking the toolbar
        onMouseDown={(e) => {
          e.preventDefault();
          props.onMouseDown?.(e);
        }}
        {...props}
      >
        {children}
      </ToggleButton>
    );

    if (!tooltip) return button;

    return (
      <Tooltip delay={0}>
        {button}
        <Tooltip.Content showArrow className="px-2 py-1 text-sm">
          {tooltip}
        </Tooltip.Content>
      </Tooltip>
    );
  },
);

ToolbarToggle.displayName = "ToolbarToggle";
