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
const scrollEdge = 28;
type TableGesture = {
  kind: TableTargetKind;
  pointerId: number;
  start: Point;
  origin: TableLayout;
  selected: CellSelection;
  moving: boolean;
  destination: number | null;
};

function select(editor: Editor, selected: CellSelection) {
  if (!editor.state.selection.eq(selected))
    editor.view.dispatch(editor.state.tr.setSelection(selected));
}

function TableControls({ editor }: { editor: Editor }) {
  const [layouts, setLayouts] = useState<{
    axes: TableLayout | null;
    cells: TableLayout | null;
  }>({ axes: null, cells: null });
  const { axes, cells } = layouts;
  const [openTarget, setOpenTarget] = useState<MenuTarget | null>(null);
  const kind = openTarget?.kind;
  const [guide, setGuide] = useState<Box | null>(null);
  const menu = useRef<MenuTarget | null>(null);
  const hovering = useRef<{ element: Element; point: Point } | null>(null);
  const gesture = useRef<TableGesture | null>(null);
  const controls = useRef<HTMLDivElement>(null);
  const rowButton = useRef<HTMLButtonElement>(null);
  const frame = useRef(0);
  const dragFrame = useRef(0);
  const portal =
    editor.view.dom.closest<HTMLElement>("[data-slot='modal-container']") ?? document.body;

  const close = useCallback(() => {
    menu.current = null;
    setOpenTarget(null);
  }, []);

  const clearGesture = useCallback(() => {
    cancelAnimationFrame(dragFrame.current);
    gesture.current = null;
    setGuide(null);
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
      const openMenu = menu.current;
      const active =
        openMenu?.selected ??
        (focused || pointerCell || gesture.current ? activeCells(view) : null);
      const selectedCell = active?.$headCell;
      const anchor = openMenu?.anchor;
      const axisCell = anchor
        ? view.state.doc.resolve(anchor.cell)
        : (gesture.current?.origin.$cell ?? pointerCell ?? selectedCell);
      const axisLayout = axisCell
        ? tableLayout(
            view,
            axisCell,
            active,
            !anchor && !gesture.current && pointerCell ? hover?.point : undefined,
            anchor && openMenu.kind !== "cell"
              ? { axis: openMenu.kind, index: anchor.index }
              : undefined
          )
        : null;
      const cellLayout =
        active && selectedCell
          ? axisCell && inSameTable(axisCell, selectedCell)
            ? axisLayout
            : tableLayout(view, selectedCell, active)
          : null;
      setLayouts((current) =>
        !axisLayout && !cellLayout && !current.axes && !current.cells
          ? current
          : { axes: axisLayout, cells: cellLayout }
      );
      if (openMenu) {
        const position = openMenu.kind === "cell" ? cellLayout : axisLayout;
        if (!position?.boxes[openMenu.kind]) close();
      }
    });
  }, [close, editor]);

  const open = useCallback(
    (targetKind: TableTargetKind, selected: CellSelection, origin: TableLayout) => {
      if (editor.isDestroyed || !editor.isEditable || selected.$anchorCell.doc !== editor.state.doc)
        return;
      select(editor, selected);
      let anchor: MenuTarget["anchor"];
      if (targetKind !== "cell") {
        const cell = origin.$cell.pos;
        const rect = origin.map.findCell(cell - origin.$cell.start(-1));
        const index = origin[targetKind];
        anchor = { cell, index, offset: index - (targetKind === "row" ? rect.top : rect.left) };
      }
      menu.current = { kind: targetKind, selected, anchor };
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
      if (gesture.current && transactions.some((step) => step.docChanged)) clearGesture();
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
      if (cellMenu) {
        const origin = tableLayout(view, selected.$headCell, selected);
        if (origin) open("cell", selected, origin);
      } else {
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
      cancelAnimationFrame(dragFrame.current);
      frame.current = 0;
      editor.off("transaction", transaction);
      view.dom.removeEventListener("keydown", keys);
      document.removeEventListener("pointermove", scheduleHover, true);
      document.removeEventListener("focusin", refresh);
      window.removeEventListener("scroll", refresh, true);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("blur", resetHover);
    };
  }, [editor, clearGesture, open, refresh]);

  const axisTable = axes?.table;
  const activeTable = cells?.table;
  useEffect(() => {
    if (!axisTable && !activeTable) return;
    const observer = new ResizeObserver(refresh);
    if (axisTable) observer.observe(axisTable);
    if (activeTable && activeTable !== axisTable) observer.observe(activeTable);
    observer.observe(editor.view.dom);
    return () => observer.disconnect();
  }, [editor, axisTable, activeTable, refresh]);

  if (!axes && !cells) return null;

  const selectionFor = (targetKind: TableTargetKind, origin: TableLayout) => {
    if (origin.$cell.doc !== editor.state.doc) return null;
    if (targetKind === "cell") return activeCells(editor.view);
    return selectBand(origin.$cell, targetKind, origin[targetKind]);
  };

  const startGesture = (
    event: ReactPointerEvent,
    targetKind: TableTargetKind,
    origin: TableLayout
  ) => {
    if (event.button !== 0 || !event.isPrimary || kind || !controls.current) return;
    const selected = selectionFor(targetKind, origin);
    if (!selected) return;
    // Delay until release to distinguish drag from click. Keep capture on the overlay so
    // scrolling the source grip out of view does not interrupt the gesture.
    event.preventDefault();
    event.stopPropagation();
    controls.current.setPointerCapture(event.pointerId);
    gesture.current = {
      kind: targetKind,
      start: { x: event.clientX, y: event.clientY },
      pointerId: event.pointerId,
      selected,
      origin,
      moving: false,
      destination: null,
    };
  };

  const updateGesture = (grip: TableGesture, point: Point) => {
    if (gesture.current !== grip || editor.isDestroyed) return;
    const { view } = editor;
    const origin = tableLayout(view, grip.origin.$cell, null);
    if (!origin) return;
    const axis = grip.kind;
    const bounds = origin.visible;
    // A drag can stay in the gutter while the table scrolls. Keep its hit test inside
    // the visible grid, without letting movement away from the table select a cell.
    const closeToGrid =
      point.x >= bounds.left - scrollEdge &&
      point.x <= bounds.right + scrollEdge &&
      point.y >= bounds.top - scrollEdge &&
      point.y <= bounds.bottom + scrollEdge;
    grip.destination = null;
    if (!closeToGrid) {
      setGuide(null);
      return;
    }

    const scroller = origin.table.closest<HTMLElement>(".tableWrapper");
    if (scroller && axis !== "row" && scroller.scrollWidth > scroller.clientWidth) {
      const leftDistance = point.x - bounds.left;
      const rightDistance = bounds.right - point.x;
      const direction = leftDistance < scrollEdge ? -1 : rightDistance < scrollEdge ? 1 : 0;
      const offset = scroller.scrollLeft;
      if (direction) scroller.scrollLeft += direction * 9;
      if (scroller.scrollLeft !== offset) {
        refresh();
        dragFrame.current = requestAnimationFrame(() => updateGesture(grip, point));
      }
    }

    const x = Math.max(bounds.left + 2, Math.min(point.x, bounds.right - 2));
    const y = Math.max(bounds.top + 2, Math.min(point.y, bounds.bottom - 2));
    const hits = document.elementsFromPoint(x, y);
    const element = hits.find((hit) => !controls.current?.contains(hit)) ?? null;
    const target = cellAtElement(view, element);
    if (!target || !inSameTable(target, grip.selected.$anchorCell)) {
      setGuide(null);
      return;
    }
    if (axis === "cell") {
      select(editor, new CellSelection(grip.selected.$anchorCell, target));
      return;
    }

    select(editor, grip.selected);
    const destination = tableLayout(view, target, null, point);
    if (!destination) return;
    const index = destination[axis];
    const box = destination.boxes[axis];
    const accepted = moveTableAxisTo(editor, axis, index, false);
    grip.destination = accepted ? index : null;
    if (!accepted || !box) {
      setGuide(null);
      return;
    }
    const forward = index > grip.origin[axis];
    const { left, right, top, bottom } = destination.visible;
    setGuide(
      axis === "row"
        ? { top: box.top + (forward ? box.height : 0), left, width: right - left, height: 2 }
        : { left: box.left + (forward ? box.width : 0), top, width: 2, height: bottom - top }
    );
  };

  const moveGesture = (event: ReactPointerEvent) => {
    const grip = gesture.current;
    if (!grip || event.pointerId !== grip.pointerId) return;
    const point = { x: event.clientX, y: event.clientY };
    if (!grip.moving && Math.hypot(point.x - grip.start.x, point.y - grip.start.y) < 5) return;
    grip.moving = true;
    cancelAnimationFrame(dragFrame.current);
    updateGesture(grip, point);
  };

  const endGesture = (event: ReactPointerEvent) => {
    const grip = gesture.current;
    if (!grip || event.pointerId !== grip.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    clearGesture();
    if (!grip.moving) open(grip.kind, grip.selected, grip.origin);
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
    applyTableAction(
      editor,
      target.kind,
      action,
      true,
      target.kind === "column" ? target.anchor?.index : undefined
    );
    requestAnimationFrame(() => {
      if (!editor.isDestroyed) editor.view.focus();
    });
  };

  const append = (axis: Axis) => {
    if (!axes || axes.$cell.doc !== editor.state.doc) return;
    const last = axis === "row" ? axes.map.height - 1 : axes.map.width - 1;
    select(editor, selectBand(axes.$cell, axis, last));
    applyTableAction(editor, axis, "insert-after");
    editor.view.focus();
  };

  return createPortal(
    <div
      ref={controls}
      className="pointer-events-none fixed inset-0 z-40"
      data-table-controls=""
      onPointerMove={moveGesture}
      onPointerUp={endGesture}
      onPointerCancel={clearGesture}
      onLostPointerCapture={(event) => {
        if (event.target === event.currentTarget) clearGesture();
      }}
    >
      {cells?.outline && (
        <div
          aria-hidden="true"
          className="border-accent absolute border-2"
          data-table-selection-outline=""
          style={cells.outline}
        />
      )}
      {guide && <div aria-hidden="true" className="bg-accent absolute" style={guide} />}
      {(["row", "column", "cell"] as const).map((targetKind) => {
        const origin = targetKind === "cell" ? cells : axes;
        const box = origin?.boxes[targetKind];
        if (
          !origin ||
          !box ||
          (kind && kind !== "cell" && targetKind !== kind && targetKind !== "cell")
        )
          return null;
        const Icon = icons[targetKind];
        return (
          <div
            key={targetKind}
            className="pointer-events-auto absolute touch-none"
            style={box}
            title={labels[targetKind]}
            onPointerDownCapture={(event) => startGesture(event, targetKind, origin)}
          >
            <Dropdown
              isOpen={kind === targetKind}
              onOpenChange={(next) => {
                if (!next) {
                  if (menu.current?.kind === targetKind) close();
                  return;
                }
                const selected = selectionFor(targetKind, origin);
                if (selected) open(targetKind, selected, origin);
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
                className="rich-text-editor__bubble-menu pointer-events-auto overflow-y-auto overscroll-contain data-[exiting=true]:pointer-events-none"
                UNSTABLE_portalContainer={portal}
              >
                <TableActionList
                  editor={editor}
                  kind={targetKind}
                  sortColumn={kind === "column" ? openTarget?.anchor?.index : undefined}
                  onAction={runAction}
                  onClose={close}
                />
              </Dropdown.Popover>
            </Dropdown>
          </div>
        );
      })}
      {!kind &&
        (["row", "column"] as const).map((axis) => {
          const box = axis === "row" ? axes?.boxes.addRow : axes?.boxes.addColumn;
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
