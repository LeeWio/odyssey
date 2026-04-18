"use client";
import * as React from "react";
import type { TColumnElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { useDraggable, useDropLine } from "@platejs/dnd";
import { ResizableProvider } from "@platejs/resizable";
import { BlockSelectionPlugin } from "@platejs/selection/react";
import { useComposedRef } from "@udecode/cn";
import { PathApi } from "platejs";
import {
  PlateElement,
  useEditorSelector,
  useFocusedLast,
  usePluginOption,
  useReadOnly,
  useSelected,
  withHOC,
} from "platejs/react";
import { cn } from "@heroui/styles";
import { memo } from "react";
import { Button, Tooltip } from "@heroui/react";
import { GripHorizontal } from "@gravity-ui/icons";

export const ColumnElement = withHOC(
  ResizableProvider,
  function ColumnElement(props: PlateElementProps<TColumnElement>) {
    const { width } = props.element;
    const readOnly = useReadOnly();
    const isSelectionAreaVisible = usePluginOption(BlockSelectionPlugin, "isSelectionAreaVisible");

    const { isDragging, previewRef, handleRef } = useDraggable({
      element: props.element,
      orientation: "horizontal",
      type: "column",
      canDropNode: ({ dragEntry, dropEntry }) =>
        PathApi.equals(PathApi.parent(dragEntry[1]), PathApi.parent(dropEntry[1])),
    });

    return (
      <div className="group/column relative" style={{ width: width ?? "100%" }}>
        {!readOnly && !isSelectionAreaVisible && (
          <div
            ref={handleRef}
            className={cn(
              "absolute top-2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
              "pointer-events-auto flex items-center",
              "opacity-0 transition-opacity group-hover/column:opacity-100",
            )}
          >
            <ColumnDragHandle />
          </div>
        )}
        <PlateElement
          {...props}
          ref={useComposedRef(props.ref, previewRef)}
          className="h-full px-2 pt-2 group-first/column:pl-0 group-last/column:pr-0"
        >
          <div
            className={cn(
              "bg-surface-secondary relative h-full p-1.5",
              !readOnly && "border-border rounded-lg border-dashed",
              isDragging && "opacity-50",
            )}
          >
            {props.children}
            {!readOnly && !isSelectionAreaVisible && <DropLine />}
          </div>
        </PlateElement>
      </div>
    );
  },
);

const ColumnDragHandle = memo(function ColumnDragHandle() {
  return (
    <Tooltip>
      <Button variant="ghost" isIconOnly>
        <GripHorizontal
          className=""
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        />
      </Button>
      <Tooltip.Content>Drag to move column</Tooltip.Content>
    </Tooltip>
  );
});

function DropLine() {
  const { dropLine } = useDropLine({ orientation: "horizontal" });
  if (!dropLine) return null;
  return (
    <div
      className={cn(
        "slate-dropLine",
        "bg-accent/50 absolute",
        dropLine === "left" && "inset-y-0 left-[-10.5px] w-1 group-first/column:-left-1",
        dropLine === "right" && "inset-y-0 -right-2.75 w-1 group-last/column:-right-1",
      )}
    />
  );
}

export function ColumnGroupElement(props: PlateElementProps) {
  return (
    <PlateElement className="mb-2" {...props}>
      <ColumnFloatingToolbar>{props.children}</ColumnFloatingToolbar>
    </PlateElement>
  );
}

function ColumnFloatingToolbar({ children }: React.PropsWithChildren) {
  const readOnly = useReadOnly();
  const selected = useSelected();
  const isCollapsed = useEditorSelector((editor) => editor.api.isCollapsed(), []);
  const isFocusedLast = useFocusedLast();

  const open = isFocusedLast && !readOnly && selected && isCollapsed;

  return (
    <>
      <Tooltip isOpen={open}>
        <Tooltip.Trigger className="flex w-full">{children}</Tooltip.Trigger>
        <Tooltip.Content>asd</Tooltip.Content>
      </Tooltip>
    </>
  );
}
