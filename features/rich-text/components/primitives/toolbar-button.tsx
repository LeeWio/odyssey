"use client";

import React, { forwardRef } from "react";
import { Button, Tooltip, type ButtonProps } from "@heroui/react";

export interface ToolbarButtonProps extends ButtonProps {
  /**
   * Optional tooltip text to display on hover.
   */
  tooltip?: React.ReactNode;
}

/**
 * A specialized button for toolbars that wraps HeroUI's Button with a Tooltip.
 * It automatically handles onMouseDown to prevent the editor from losing focus.
 */
export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ children, tooltip, ...props }, ref) => {
    const button = (
      <Button
        ref={ref}
        isIconOnly
        size="sm"
        variant="ghost"
        // Prevent loss of focus in the editor when clicking the toolbar
        onMouseDown={(e) => {
          e.preventDefault();
          props.onMouseDown?.(e);
        }}
        {...props}
      >
        {children}
      </Button>
    );

    if (!tooltip) return button;

    return (
      <Tooltip delay={0}>
        <Tooltip.Trigger>{button}</Tooltip.Trigger>
        <Tooltip.Content showArrow>
          {tooltip}
        </Tooltip.Content>
      </Tooltip>
    );
  },
);

ToolbarButton.displayName = "ToolbarButton";
