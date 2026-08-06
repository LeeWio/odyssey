"use client";

import React, { useState } from "react";
import { Popover, Button, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, useReducedMotion } from "motion/react";

const MAX_ROWS = 10;
const MAX_COLS = 10;

const CELL_SIZE = 20;
const GRID_GAP = 4;
const GRID_PADDING = 4;

interface TableSelectorProps {
  onSelect?: (rows: number, cols: number) => void;
}

export function TableSelector({ onSelect }: TableSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredGrid, setHoveredGrid] = useState({
    rows: 0,
    cols: 0,
  });

  const [isPressing, setIsPressing] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const isSelecting = hoveredGrid.rows > 0 && hoveredGrid.cols > 0;

  const selectionWidth =
    hoveredGrid.cols * CELL_SIZE + Math.max(hoveredGrid.cols - 1, 0) * GRID_GAP;

  const selectionHeight =
    hoveredGrid.rows * CELL_SIZE + Math.max(hoveredGrid.rows - 1, 0) * GRID_GAP;

  const handleMouseEnter = (row: number, col: number) => {
    setHoveredGrid({
      rows: row + 1,
      cols: col + 1,
    });
  };

  const handleMouseLeave = () => {
    setHoveredGrid({
      rows: 0,
      cols: 0,
    });
  };

  const handleClick = (row: number, col: number) => {
    setIsOpen(false);

    requestAnimationFrame(() => {
      onSelect?.(row + 1, col + 1);
    });
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Tooltip delay={0}>
        <Button aria-label="Insert table" isIconOnly size="sm" variant="ghost">
          <Icon icon="gravity-ui:layout-header-cells-large-fill" className="h-4 w-4" />
        </Button>

        <Tooltip.Content>Insert table</Tooltip.Content>
      </Tooltip>

      <Popover.Content isNonModal>
        <Popover.Dialog className="space-y-3">
          <Popover.Arrow />

          <Popover.Heading className="overflow-hidden text-sm font-medium">
            <motion.div
              className="flex h-5 flex-col"
              animate={{
                y: isSelecting ? -20 : 0,
              }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 500,
                      damping: 38,
                      mass: 0.6,
                    }
              }
            >
              <span className="flex h-5 shrink-0 items-center">Insert table</span>

              <span className="flex h-5 shrink-0 items-center tabular-nums">
                {hoveredGrid.cols} × {hoveredGrid.rows} table
              </span>
            </motion.div>
          </Popover.Heading>

          <motion.div
            className="relative grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${MAX_COLS}, ${CELL_SIZE}px)`,
            }}
            animate={{
              scale: isPressing ? 0.985 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 600,
              damping: 35,
            }}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute"
              initial={false}
              animate={{
                width: isSelecting ? selectionWidth : 0,
                height: isSelecting ? selectionHeight : 0,
                opacity: isSelecting ? 1 : 0,
              }}
              style={{
                left: GRID_PADDING,
                top: GRID_PADDING,
                transformOrigin: "top left",
              }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 520,
                      damping: 42,
                      mass: 0.7,
                    }
              }
            />

            {Array.from({ length: MAX_ROWS }).map((_, row) =>
              Array.from({ length: MAX_COLS }).map((_, col) => {
                const isActive = row < hoveredGrid.rows && col < hoveredGrid.cols;

                return (
                  <motion.button
                    key={`${row}-${col}`}
                    type="button"
                    aria-label={`Insert ${col + 1} by ${row + 1} table`}
                    className={[
                      "relative z-10 h-5 w-5 rounded-sm border",
                      "focus-visible:ring-primary outline-none focus-visible:ring-2",
                      isActive ? "border-accent/55" : "border-border/60 bg-surface/40",
                    ].join(" ")}
                    animate={{
                      backgroundColor: isActive ? "rgba(var(--accent), 0.08)" : "rgba(0, 0, 0, 0)",
                    }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.12,
                    }}
                    onMouseEnter={() => handleMouseEnter(row, col)}
                    onPointerDown={() => setIsPressing(true)}
                    onPointerUp={() => setIsPressing(false)}
                    onPointerCancel={() => setIsPressing(false)}
                    onClick={() => handleClick(row, col)}
                  />
                );
              })
            )}
          </motion.div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
