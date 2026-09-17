"use client";

import { Button, Label, Popover, Surface, Tooltip, cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useReducedMotion } from "motion/react";
import { useState } from "react";

const MAX_ROWS = 10;
const MAX_COLS = 10;

const CELL_SIZE = 20;
const GRID_GAP = 4;

interface TableSelectorProps {
  onSelect?: (rows: number, cols: number) => void;
}

export function TableSelector({ onSelect }: TableSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredGrid, setHoveredGrid] = useState({
    rows: 0,
    cols: 0,
  });
  const shouldReduceMotion = useReducedMotion();

  const isSelecting = hoveredGrid.rows > 0 && hoveredGrid.cols > 0;

  const selectionWidth =
    hoveredGrid.cols * CELL_SIZE + Math.max(hoveredGrid.cols - 1, 0) * GRID_GAP;

  const selectionHeight =
    hoveredGrid.rows * CELL_SIZE + Math.max(hoveredGrid.rows - 1, 0) * GRID_GAP;

  const handleMouseEnter = (row: number, col: number) => {
    setHoveredGrid((current) => {
      const rows = row + 1;
      const cols = col + 1;

      if (current.rows === rows && current.cols === cols) return current;

      return { rows, cols };
    });
  };

  const handleMouseLeave = () => {
    setHoveredGrid({
      rows: 0,
      cols: 0,
    });
  };

  const handleSelect = (rows: number, cols: number) => {
    setIsOpen(false);
    setHoveredGrid({ rows: 0, cols: 0 });

    requestAnimationFrame(() => {
      onSelect?.(rows, cols);
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);

    if (!nextOpen) {
      setHoveredGrid({ rows: 0, cols: 0 });
    }
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Tooltip delay={0}>
        <Button aria-label="Insert table" isIconOnly size="sm" variant="ghost">
          <Icon icon="gravity-ui:layout-header-cells-large-fill" className="h-4 w-4" />
        </Button>
        <Tooltip.Content>Insert table</Tooltip.Content>
      </Tooltip>

      <Popover.Content isNonModal placement="bottom">
        <Popover.Dialog className="w-max space-y-3">
          <Popover.Arrow />

          <Popover.Heading className="relative h-5 min-w-[9rem] overflow-hidden text-sm font-medium">
            <Label
              className={cn(
                "absolute inset-0 flex items-center transition-opacity duration-150",
                isSelecting ? "pointer-events-none opacity-0" : "opacity-100",
                shouldReduceMotion && "transition-none"
              )}
            >
              Insert table
            </Label>
            <Label
              aria-live="polite"
              className={cn(
                "absolute inset-0 flex items-center tabular-nums transition-opacity duration-150",
                isSelecting ? "opacity-100" : "pointer-events-none opacity-0",
                shouldReduceMotion && "transition-none"
              )}
            >
              {hoveredGrid.cols} × {hoveredGrid.rows} table
            </Label>
          </Popover.Heading>

          <Surface
            aria-label="Table size grid"
            className="relative grid gap-1"
            role="grid"
            style={{
              gridTemplateColumns: `repeat(${MAX_COLS}, ${CELL_SIZE}px)`,
            }}
            variant="transparent"
            onMouseLeave={handleMouseLeave}
          >
            <Surface
              aria-hidden="true"
              className={cn(
                "bg-accent-soft pointer-events-none absolute z-0 rounded-sm",
                shouldReduceMotion
                  ? null
                  : "transition-[width,height,opacity] duration-150 ease-out"
              )}
              style={{
                left: 0,
                top: 0,
                width: isSelecting ? selectionWidth : 0,
                height: isSelecting ? selectionHeight : 0,
                opacity: isSelecting ? 1 : 0,
                transformOrigin: "top left",
              }}
              variant="transparent"
            >
              {null}
            </Surface>

            {Array.from({ length: MAX_ROWS }).map((_, row) =>
              Array.from({ length: MAX_COLS }).map((_, col) => {
                const rows = row + 1;
                const cols = col + 1;
                const isActive = row < hoveredGrid.rows && col < hoveredGrid.cols;

                return (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    aria-label={`Insert ${cols} by ${rows} table`}
                    className={cn(
                      "relative z-10 size-5 rounded-sm border outline-none",
                      "cursor-[var(--cursor-interactive)]",
                      "focus-visible:ring-focus focus-visible:ring-2",
                      isActive
                        ? "border-accent/55 bg-accent-soft"
                        : "border-border/60 bg-surface/40"
                    )}
                    data-cols={cols}
                    data-rows={rows}
                    onClick={() => handleSelect(rows, cols)}
                    onMouseEnter={() => handleMouseEnter(row, col)}
                  />
                );
              })
            )}
          </Surface>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
