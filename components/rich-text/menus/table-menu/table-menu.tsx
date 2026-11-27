"use client";

import { Ellipsis, EllipsisVertical, Grip, Plus } from "@gravity-ui/icons";
import { useRichTextEditor } from "@heroui-pro/react/rich-text-editor";
import { Button, Dropdown } from "@heroui/react";
import type { Editor, EditorEvents } from "@tiptap/core";
import { CellSelection, inSameTable } from "@tiptap/pm/tables";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  applyTableAction,
  moveTableAxisTo,
  type TableAction,
  type TableTargetKind,
} from "../../extensions/table/actions";
import { TableActionList } from "./table-action-list";
import { mapMenuTarget, type MenuTarget } from "./table-target";
import {
  activeCells,
  cellAtElement,
  selectBand,
  tableLayout,
  type Axis,
  type Box,
  type Point,
  type TableLayout,
} from "./table-geometry";

const labels = { row: "Row actions", column: "Column actions", cell: "Cell actions" } as const;
const icons = { row: EllipsisVertical, column: Ellipsis, cell: Grip };
type TableGesture = {
  kind: TableTargetKind;
  pointerId: number;
  start: Point;
  selected: CellSelection;
  moving: boolean;
  destination: number | null;
};

function select(editor: Editor, selected: CellSelection) {
  if (!editor.state.selection.eq(selected))
    editor.view.dispatch(editor.state.tr.setSelection(selected));
}

function TableControls({ editor }: { editor: Editor }) {
  const [layout, setLayout] = useState<TableLayout | null>(null);
  const [openTarget, setOpenTarget] = useState<MenuTarget | null>(null);
  const kind = openTarget?.kind;
  const [guide, setGuide] = useState<Box | null>(null);
  const menu = useRef<MenuTarget | null>(null);
  const hovering = useRef<{ element: Element; point: Point } | null>(null);
  const gesture = useRef<TableGesture | null>(null);
  const controls = useRef<HTMLDivElement>(null);
  const rowButton = useRef<HTMLButtonElement>(null);
  const frame = useRef(0);
  const portal =
    editor.view.dom.closest<HTMLElement>("[data-slot='modal-container']") ?? document.body;

  const close = useCallback(() => {
    menu.current = null;
    setOpenTarget(null);
  }, []);

  const refresh = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      if (editor.isDestroyed) return;
      const { view } = editor;
      const hover = hovering.current;
      const pointerCell = hover ? cellAtElement(view, hover.element) : null;
      const focused = view.hasFocus() || controls.current?.contains(document.activeElement);
      const active =
        menu.current?.selected ??
        (focused || pointerCell || gesture.current ? activeCells(view) : null);
      const cell = pointerCell ?? active?.$headCell;
      const next = cell && tableLayout(view, cell, active, pointerCell ? hover?.point : undefined);
      setLayout(next ?? null);
      if (menu.current && !next?.boxes[menu.current.kind]) close();
    });
  }, [close, editor]);

  const open = useCallback(
    (targetKind: TableTargetKind, selected: CellSelection, anchor?: TableLayout) => {
      if (editor.isDestroyed || !editor.isEditable || selected.$anchorCell.doc !== editor.state.doc)
        return;
      select(editor, selected);
      const column =
        targetKind === "column" && anchor
          ? {
              cell: anchor.$cell.pos,
              index: anchor.column,
              offset:
                anchor.column - anchor.map.colCount(anchor.$cell.pos - anchor.$cell.start(-1)),
            }
          : undefined;
      menu.current = { kind: targetKind, selected, column };
      setOpenTarget(menu.current);
      refresh();
    },
    [editor, refresh]
  );

  useEffect(() => {
    const { view } = editor;
    const scheduleHover = (event: PointerEvent) => {
      if (menu.current || gesture.current) return;
      const target = event.target;
      if (!(target instanceof Element) || controls.current?.contains(target)) return;
      const element = target.closest("td, th");
      if (element && view.dom.contains(element)) {
        const previous = hovering.current?.element;
        hovering.current = { element, point: { x: event.clientX, y: event.clientY } };
        if (
          previous !== element ||
          (element instanceof HTMLTableCellElement && (element.colSpan > 1 || element.rowSpan > 1))
        )
          refresh();
      } else if (hovering.current) {
        // Crossing the small gutter between the grid and its handles keeps the target under the pointer.
        const table = hovering.current.element.closest("table")?.getBoundingClientRect();
        if (
          table &&
          event.clientX >= table.left - 18 &&
          event.clientX <= table.right + 18 &&
          event.clientY >= table.top - 18 &&
          event.clientY <= table.bottom + 18
        )
          return;
        hovering.current = null;
        refresh();
      }
    };

    const transaction = ({
      transaction: tr,
      appendedTransactions,
    }: EditorEvents["transaction"]) => {
      const transactions = [tr, ...appendedTransactions];
      if (menu.current) {
        menu.current = mapMenuTarget(menu.current, transactions);
        setOpenTarget(menu.current);
      }
      if (gesture.current && transactions.some((step) => step.docChanged)) {
        gesture.current = null;
        setGuide(null);
      }
      refresh();
    };

    const keys = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const cellMenu = event.key === "ContextMenu" || (event.shiftKey && event.key === "F10");
      const grips = event.altKey && event.key === "F10";
      if (!cellMenu && !grips) return;
      const selected = activeCells(view);
      if (!selected) return;
      event.preventDefault();
      event.stopPropagation();
      hovering.current = null;
      if (cellMenu) open("cell", selected);
      else {
        refresh();
        requestAnimationFrame(() => rowButton.current?.focus({ preventScroll: true }));
      }
    };

    const resetHover = () => {
      hovering.current = null;
      refresh();
    };
    editor.on("transaction", transaction);
    view.dom.addEventListener("keydown", keys);
    document.addEventListener("pointermove", scheduleHover, true);
    document.addEventListener("focusin", refresh);
    // Scroll events do not bubble. Capture observes both the editor viewport and each table wrapper.
    window.addEventListener("scroll", refresh, true);
    window.addEventListener("resize", refresh);
    window.addEventListener("blur", resetHover);
    refresh();
    return () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      editor.off("transaction", transaction);
      view.dom.removeEventListener("keydown", keys);
      document.removeEventListener("pointermove", scheduleHover, true);
      document.removeEventListener("focusin", refresh);
      window.removeEventListener("scroll", refresh, true);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("blur", resetHover);
    };
  }, [editor, close, open, refresh]);

  const table = layout?.table;
  useEffect(() => {
    if (!table) return;
    const observer = new ResizeObserver(refresh);
    observer.observe(table);
    observer.observe(editor.view.dom);
    return () => observer.disconnect();
  }, [editor, table, refresh]);

  if (!layout) return null;
  const { boxes } = layout;
  const selectionFor = (targetKind: TableTargetKind) => {
    if (layout.$cell.doc !== editor.state.doc) return null;
    if (targetKind === "cell") return activeCells(editor.view);
    return selectBand(layout.$cell, targetKind, layout[targetKind]);
  };

  const startGesture = (event: ReactPointerEvent, targetKind: TableTargetKind) => {
    if (event.button !== 0 || !event.isPrimary || kind) return;
    const selected = selectionFor(targetKind);
    if (!selected) return;
    // RAC normally opens a mouse menu on pointerdown. Delay until release to distinguish drag from click.
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      kind: targetKind,
      start: { x: event.clientX, y: event.clientY },
      pointerId: event.pointerId,
      selected,
      moving: false,
      destination: null,
    };
  };

  const moveGesture = (event: ReactPointerEvent) => {
    const grip = gesture.current;
    if (!grip || event.pointerId !== grip.pointerId) return;
    const point = { x: event.clientX, y: event.clientY };
    if (!grip.moving && Math.hypot(point.x - grip.start.x, point.y - grip.start.y) < 5) return;
    grip.moving = true;
    const axis = grip.kind;
    const bounds = layout.visible;
    // A drag can stay in the outside gutter while the table is scrolled in either direction.
    // Use a visible track underneath the overlay, even if another handle covers that pixel.
    const x =
      axis === "row" ? Math.max(bounds.left + 2, Math.min(point.x, bounds.right - 2)) : point.x;
    const y =
      axis === "column" ? Math.max(bounds.top + 2, Math.min(point.y, bounds.bottom - 2)) : point.y;
    const hits = document.elementsFromPoint(x, y);
    const element = hits.find((hit) => !controls.current?.contains(hit)) ?? null;
    const target = cellAtElement(editor.view, element);
    if (!target || !inSameTable(target, grip.selected.$anchorCell)) {
      grip.destination = null;
      setGuide(null);
      return;
    }
    if (axis === "cell") {
      select(editor, new CellSelection(grip.selected.$anchorCell, target));
      return;
    }

    select(editor, grip.selected);
    const destination = tableLayout(editor.view, target, null, point);
    if (!destination) return;
    const index = destination[axis];
    const box = destination.boxes[axis];
    const accepted = moveTableAxisTo(editor, axis, index, false);
    grip.destination = accepted ? index : null;
    if (!accepted || !box) {
      setGuide(null);
      return;
    }
    const forward = index > layout[axis];
    const { left, right, top, bottom } = destination.visible;
    setGuide(
      axis === "row"
        ? { top: box.top + (forward ? box.height : 0), left, width: right - left, height: 2 }
        : { left: box.left + (forward ? box.width : 0), top, width: 2, height: bottom - top }
    );
  };

  const endGesture = (event: ReactPointerEvent) => {
    const grip = gesture.current;
    if (!grip || event.pointerId !== grip.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    gesture.current = null;
    setGuide(null);
    if (!grip.moving) open(grip.kind, grip.selected, layout);
    else {
      if (grip.kind !== "cell" && grip.destination !== null) {
        select(editor, grip.selected);
        moveTableAxisTo(editor, grip.kind, grip.destination);
      }
      editor.view.focus();
      refresh();
    }
  };

  const runAction = (action: TableAction) => {
    const target = menu.current;
    if (!target) return;
    close();
    select(editor, target.selected);
    applyTableAction(editor, target.kind, action, true, target.column?.index);
    requestAnimationFrame(() => {
      if (!editor.isDestroyed) editor.view.focus();
    });
  };

  const append = (axis: Axis) => {
    if (layout.$cell.doc !== editor.state.doc) return;
    const last = axis === "row" ? layout.map.height - 1 : layout.map.width - 1;
    select(editor, selectBand(layout.$cell, axis, last));
    applyTableAction(editor, axis, "insert-after");
    editor.view.focus();
  };

  return createPortal(
    <div ref={controls} className="pointer-events-none fixed inset-0 z-40" data-table-controls="">
      {layout.outline && (
        <div
          aria-hidden="true"
          className="border-accent absolute border-2"
          style={layout.outline}
        />
      )}
      {guide && <div aria-hidden="true" className="bg-accent absolute" style={guide} />}
      {(["row", "column", "cell"] as const).map((targetKind) => {
        const box = boxes[targetKind];
        if (!box) return null;
        const Icon = icons[targetKind];
        return (
          <div
            key={targetKind}
            className="pointer-events-auto absolute touch-none"
            style={box}
            title={labels[targetKind]}
            onPointerDownCapture={(event) => startGesture(event, targetKind)}
            onPointerMove={moveGesture}
            onPointerUp={endGesture}
            onLostPointerCapture={() => {
              gesture.current = null;
              setGuide(null);
            }}
          >
            <Dropdown
              isOpen={kind === targetKind}
              onOpenChange={(next) => {
                if (!next) {
                  if (menu.current?.kind === targetKind) close();
                  return;
                }
                const selected = selectionFor(targetKind);
                if (selected) open(targetKind, selected, layout);
              }}
            >
              <Button
                ref={targetKind === "row" ? rowButton : undefined}
                aria-label={labels[targetKind]}
                aria-keyshortcuts={
                  targetKind === "row" ? "Alt+F10" : targetKind === "cell" ? "Shift+F10" : undefined
                }
                isIconOnly
                size="sm"
                variant={kind === targetKind || targetKind === "cell" ? "primary" : "secondary"}
                className="h-full! w-full! min-w-0! cursor-grab touch-none p-0! active:cursor-grabbing"
              >
                <Icon aria-hidden="true" className="size-3" />
              </Button>
              <Dropdown.Popover
                placement="bottom start"
                offset={4}
                className="rich-text-editor__bubble-menu pointer-events-auto overflow-y-auto overscroll-contain"
                UNSTABLE_portalContainer={portal}
              >
                <TableActionList
                  editor={editor}
                  kind={targetKind}
                  sortColumn={openTarget?.column?.index}
                  onAction={runAction}
                  onClose={close}
                />
              </Dropdown.Popover>
            </Dropdown>
          </div>
        );
      })}
      {(["row", "column"] as const).map((axis) => {
        const box = axis === "row" ? boxes.addRow : boxes.addColumn;
        if (!box) return null;
        const label = axis === "row" ? "Add row below table" : "Add column to right of table";
        return (
          <Button
            key={axis}
            aria-label={label}
            variant="secondary"
            isIconOnly
            size="sm"
            className="pointer-events-auto absolute! min-w-0! p-0!"
            style={box}
            onPress={() => append(axis)}
          >
            <Plus aria-hidden="true" className="size-3" />
          </Button>
        );
      })}
    </div>,
    portal
  );
}

export function TableMenu() {
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  return editor && !editor.isDestroyed && !isDisabled && !isReadOnly ? (
    <TableControls editor={editor} />
  ) : null;
}
