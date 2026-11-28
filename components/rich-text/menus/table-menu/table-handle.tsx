"use client";

import { Ellipsis, EllipsisVertical, Grip, Plus } from "@gravity-ui/icons";
import { Button, Dropdown, Tooltip } from "@heroui/react";
import type { PointerEventHandler, ReactNode, Ref } from "react";
import type { TableTargetKind } from "../../extensions/table/actions";
import type { Axis, Box } from "./table-geometry";

const labels = { row: "Row actions", column: "Column actions", cell: "Cell actions" } as const;
const icons = { row: EllipsisVertical, column: Ellipsis, cell: Grip };
const hints = {
  row: "Row actions. Drag to reorder; Shift-click to extend selection.",
  column: "Column actions. Drag to reorder; Shift-click to extend selection.",
  cell: "Cell actions. Drag to select a range.",
};
const hitArea = "before:absolute before:-inset-1 before:content-['']";

/** Shared visual and accessible handle contract; selection and gestures stay in the controller. */
export function TableActionHandle({
  kind,
  box,
  isOpen,
  menuOpen,
  onOpenChange,
  onPointerDownCapture,
  buttonRef,
  portal,
  children,
}: {
  kind: TableTargetKind;
  box: Box;
  isOpen: boolean;
  menuOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPointerDownCapture: PointerEventHandler<HTMLDivElement>;
  buttonRef?: Ref<HTMLButtonElement>;
  portal: HTMLElement;
  children: ReactNode;
}) {
  const Icon = icons[kind];
  return (
    <div
      className={`pointer-events-auto absolute flex touch-none ${kind === "cell" ? "z-10" : ""}`}
      style={box}
      onPointerDownCapture={onPointerDownCapture}
    >
      <Tooltip isDisabled={menuOpen}>
        <Dropdown isOpen={isOpen} onOpenChange={onOpenChange}>
          <Button
            ref={buttonRef}
            aria-label={labels[kind]}
            aria-keyshortcuts={
              kind === "row" ? "Alt+F10" : kind === "cell" ? "Shift+F10" : undefined
            }
            isIconOnly
            size="sm"
            variant="secondary"
            className={`${hitArea} h-full! w-full! min-w-0! cursor-grab touch-none p-0! active:cursor-grabbing`}
          >
            <Icon aria-hidden="true" className="m-0! size-3!" />
          </Button>
          <Dropdown.Popover
            placement="bottom start"
            offset={4}
            className="rich-text-editor__bubble-menu pointer-events-auto overflow-y-auto overscroll-contain data-[exiting=true]:pointer-events-none"
            UNSTABLE_portalContainer={portal}
          >
            {children}
          </Dropdown.Popover>
        </Dropdown>
        <Tooltip.Content placement={kind === "row" ? "left" : kind === "column" ? "top" : "right"}>
          {hints[kind]}
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
}

export function TableAppendHandle({
  axis,
  box,
  onPress,
}: {
  axis: Axis;
  box: Box;
  onPress: () => void;
}) {
  const label = axis === "row" ? "Add row below table" : "Add column to right of table";
  return (
    <Tooltip>
      <Button
        aria-label={label}
        variant="secondary"
        isIconOnly
        size="sm"
        className={`${hitArea} pointer-events-auto absolute! min-w-0! p-0!`}
        style={box}
        onPress={onPress}
      >
        <Plus aria-hidden="true" className="m-0! size-3!" />
      </Button>
      <Tooltip.Content placement={axis === "row" ? "bottom" : "right"}>{label}</Tooltip.Content>
    </Tooltip>
  );
}
