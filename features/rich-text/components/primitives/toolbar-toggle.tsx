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
  ({ children, tooltip, isSelected, ...props }, ref) => {
    const button = (
      <ToggleButton
        ref={ref as React.Ref<HTMLButtonElement>}
        isIconOnly
        size="sm"
        variant="ghost"
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
        <Tooltip.Trigger>{button}</Tooltip.Trigger>
        <Tooltip.Content showArrow className="px-2 py-1 text-sm">
          {tooltip}
        </Tooltip.Content>
      </Tooltip>
    );
  },
);

ToolbarToggle.displayName = "ToolbarToggle";
