"use client";

import { announceTableAction } from "../../extensions/table/feedback";

import { useRichTextEditor } from "@heroui-pro/react/rich-text-editor";
import type { Editor, EditorEvents } from "@tiptap/core";
import { CellSelection, columnResizingPluginKey, inSameTable } from "@tiptap/pm/tables";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal, flushSync } from "react-dom";
import {
  applyTableAction,
  moveTableAxisTo,
  type TableAction,
  type TableTargetKind,
} from "../../extensions/table/actions";
import { TableColumnWidthDialog } from "./table-column-width-dialog";
import { TableActionList } from "./table-action-list";
import { TableActionHandle, TableAppendHandle } from "./table-handle";
import { mapMenuTarget, type MenuTarget } from "./table-target";
import {
  activeCells,
  revealSelectionGrip,
  cellAtElement,
  selectBand,
  tableLayout,
  tableLayoutReader,
  type Axis,
  type Box,
  type Point,
  type TableLayout,
} from "./table-geometry";

import { scrollTableVertically, tableScrollEdge as scrollEdge } from "./table-drag-scroll";
type TableGesture = {
  kind: TableTargetKind;
  pointerId: number;
  start: Point;
  origin: TableLayout;
  selected: CellSelection;
  moving: boolean;
  destination: number | null;
  scrollTime: number;
};

function select(editor: Editor, selected: CellSelection) {
  if (!editor.state.selection.eq(selected))
    editor.view.dispatch(editor.state.tr.setSelection(selected));
}

function TableControls({
  editor,
  onEditWidth,
}: {
  editor: Editor;
  onEditWidth: (target: MenuTarget) => void;
}) {
  const [layouts, setLayouts] = useState<{
    axes: TableLayout | null;
    cells: TableLayout | null;
  }>({ axes: null, cells: null });
  const { axes, cells } = layouts;
  const [openTarget, setOpenTarget] = useState<MenuTarget | null>(null);
  const kind = openTarget?.kind;
  const [guide, setGuide] = useState<Box | null>(null);
  const menu = useRef<MenuTarget | null>(null);
  const menuOwner = useId();
  const hovering = useRef<{ element: Element; point: Point } | null>(null);
  const gesture = useRef<TableGesture | null>(null);
  const controls = useRef<HTMLDivElement>(null);
  const rowButton = useRef<HTMLButtonElement>(null);
  const columnButton = useRef<HTMLButtonElement>(null);
  const cellButton = useRef<HTMLButtonElement>(null);
  const frame = useRef(0);
  const dragFrame = useRef(0);
  const portal =
    editor.view.dom.closest<HTMLElement>("[data-slot='modal-container']") ?? document.body;

  const close = useCallback(() => {
    menu.current = null;
    setOpenTarget(null);
  }, []);

  const dismiss = useCallback(() => {
    const target = menu.current;
    close();
    // Restore the model selection after the native overlay restores DOM focus.
    // Touch dismissal can otherwise collapse the editor caret to the document start.
    requestAnimationFrame(() => {
      if (editor.isDestroyed || !target || target.selected.$anchorCell.doc !== editor.state.doc)
        return;
      select(editor, target.selected);
      editor.view.focus();
    });
  }, [close, editor]);

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
      if (!editor.isEditable) {
        setLayouts({ axes: null, cells: null });
        return;
      }
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
      const updateLayout = () =>
        setLayouts((current) =>
          !axisLayout && !cellLayout && !current.axes && !current.cells
            ? current
            : { axes: axisLayout, cells: cellLayout }
        );
      // Native resizing already changed the live DOM. Commit its overlay in this
      // frame too, instead of letting React defer it until after the next paint.
      if (columnResizingPluginKey.getState(view.state)?.dragging) flushSync(updateLayout);
      else updateLayout();
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
      // Native resizing previews colgroup widths without document transactions,
      // and internal boundaries can move while the table's outer size is fixed.
      if (columnResizingPluginKey.getState(view.state)?.dragging) {
        refresh();
        return;
      }
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
          event.clientX >= table.left - 24 &&
          event.clientX <= table.right + 24 &&
          event.clientY >= table.top - 24 &&
          event.clientY <= table.bottom + 24
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
        if (origin?.boxes.cell) open("cell", selected, origin);
        else if (origin) {
          revealSelectionGrip(origin);
          requestAnimationFrame(() => {
            if (editor.isDestroyed || selected.$anchorCell.doc !== editor.state.doc) return;
            const revealed = tableLayout(view, selected.$headCell, selected);
            if (revealed?.boxes.cell) open("cell", selected, revealed);
          });
        }
      } else {
        refresh();
        requestAnimationFrame(() => rowButton.current?.focus({ preventScroll: true }));
      }
    };

    const dismissRoot = (event: KeyboardEvent) => {
      if (event.key === "Escape" && gesture.current) {
        event.preventDefault();
        event.stopPropagation();
        clearGesture();
        view.focus();
        refresh();
        return;
      }
      if (event.key !== "Escape" || !menu.current || !(event.target instanceof Element)) return;
      // Native child menus own their first Escape; only dismiss this editor's root.
      const owner = event.target.closest("[data-table-menu-owner]");
      // The root can be open before its overlay has moved focus. Escape still
      // dismisses that menu instead of collapsing the editor's range underneath it.
      if (
        owner?.getAttribute("data-table-menu-owner") !== menuOwner &&
        !view.dom.contains(event.target) &&
        !controls.current?.contains(event.target) &&
        event.target !== document.body &&
        event.target !== document.documentElement
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      dismiss();
    };

    const resetHover = () => {
      clearGesture();
      hovering.current = null;
      refresh();
    };
    const editable = () => {
      if (!editor.isEditable) {
        clearGesture();
        close();
        hovering.current = null;
        setLayouts({ axes: null, cells: null });
      }
    };
    editor.on("update", editable);
    editor.on("transaction", transaction);
    view.dom.addEventListener("keydown", keys);
    document.addEventListener("keydown", dismissRoot, true);
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
      editor.off("update", editable);
      editor.off("transaction", transaction);
      view.dom.removeEventListener("keydown", keys);
      document.removeEventListener("keydown", dismissRoot, true);
      document.removeEventListener("pointermove", scheduleHover, true);
      document.removeEventListener("focusin", refresh);
      window.removeEventListener("scroll", refresh, true);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("blur", resetHover);
    };
  }, [editor, clearGesture, close, dismiss, open, refresh, menuOwner]);

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

  const selectionFor = (targetKind: TableTargetKind, origin: TableLayout, extend = false) => {
    if (origin.$cell.doc !== editor.state.doc) return null;
    if (targetKind === "cell") return activeCells(editor.view);
    return selectBand(
      origin.$cell,
      targetKind,
      origin[targetKind],
      activeCells(editor.view),
      extend
    );
  };

  const startGesture = (
    event: ReactPointerEvent,
    targetKind: TableTargetKind,
    origin: TableLayout
  ) => {
    if (event.button !== 0 || !event.isPrimary || kind || !controls.current) return;
    const selected = selectionFor(targetKind, origin, event.shiftKey);
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
      scrollTime: 0,
    };
  };

  const updateGesture = (grip: TableGesture, point: Point, now: number) => {
    if (gesture.current !== grip || editor.isDestroyed) return;
    if (!editor.isEditable) {
      clearGesture();
      return;
    }
    const { view } = editor;
    let readLayout = tableLayoutReader(view);
    let origin = readLayout(grip.origin.$cell, null);
    if (!origin) return;
    const axis = grip.kind;
    let bounds = origin.visible;
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

    const elapsed = grip.scrollTime ? now - grip.scrollTime : 16;
    // Accumulate subpixel time instead of stopping when a frame cannot move a whole scroll pixel.
    if (elapsed < 4) {
      dragFrame.current = requestAnimationFrame((time) => updateGesture(grip, point, time));
      return;
    }
    grip.scrollTime = now;
    let scrolled = axis !== "column" && scrollTableVertically(origin.table, point, elapsed);

    const scroller = origin.table.closest<HTMLElement>(".tableWrapper");
    if (scroller && axis !== "row" && scroller.scrollWidth > scroller.clientWidth) {
      const leftDistance = point.x - bounds.left;
      const rightDistance = bounds.right - point.x;
      const direction = leftDistance < scrollEdge ? -1 : rightDistance < scrollEdge ? 1 : 0;
      const offset = scroller.scrollLeft;
      if (direction) scroller.scrollLeft += direction * 9;
      if (scroller.scrollLeft !== offset) {
        scrolled = true;
      }
    }

    if (scrolled) {
      refresh();
      dragFrame.current = requestAnimationFrame((time) => updateGesture(grip, point, time));
      readLayout = tableLayoutReader(view);
      origin = readLayout(grip.origin.$cell, null);
      if (!origin) return;
      bounds = origin.visible;
    }

    // Row gutters project into the row center, away from clipped/rounded table corners.
    const x =
      axis === "row"
        ? (bounds.left + bounds.right) / 2
        : Math.max(bounds.left + 2, Math.min(point.x, bounds.right - 2));
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
    if (gesture.current !== grip || grip.selected.$anchorCell.doc !== editor.state.doc) return;
    const destination = readLayout(target, null, point);
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
    grip.scrollTime = 0;
    dragFrame.current = requestAnimationFrame((time) => updateGesture(grip, point, time));
  };

  const endGesture = (event: ReactPointerEvent) => {
    const grip = gesture.current;
    if (!grip || event.pointerId !== grip.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    if (grip.moving) {
      cancelAnimationFrame(dragFrame.current);
      updateGesture(grip, { x: event.clientX, y: event.clientY }, event.timeStamp);
    }
    clearGesture();
    if (!grip.moving) open(grip.kind, grip.selected, grip.origin);
    else {
      if (grip.kind !== "cell" && grip.destination !== null) {
        select(editor, grip.selected);
        if (moveTableAxisTo(editor, grip.kind, grip.destination))
          announceTableAction(editor, "selection-moved");
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
    const changed = applyTableAction(
      editor,
      target.kind,
      action,
      true,
      target.kind === "column" ? target.anchor?.index : undefined
    );
    if (changed) announceTableAction(editor, action);
    requestAnimationFrame(() => {
      if (!editor.isDestroyed) editor.view.focus();
    });
  };

  const append = (axis: Axis) => {
    if (!axes || axes.$cell.doc !== editor.state.doc) return;
    const last = axis === "row" ? axes.map.height - 1 : axes.map.width - 1;
    select(editor, selectBand(axes.$cell, axis, last));
    if (applyTableAction(editor, axis, "insert-after")) announceTableAction(editor, "insert-after");
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
          className="absolute overflow-hidden"
          data-table-selection-clip=""
          style={cells.outline.clip}
        >
          <div
            className="border-accent absolute box-border border-2"
            data-table-selection-outline=""
            style={cells.outline.border}
          />
        </div>
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
        return (
          <TableActionHandle
            key={targetKind}
            kind={targetKind}
            box={box}
            isOpen={kind === targetKind}
            menuOpen={!!kind}
            portal={portal}
            buttonRef={
              targetKind === "row" ? rowButton : targetKind === "column" ? columnButton : cellButton
            }
            onKeyDown={(event) => {
              if (
                kind ||
                event.altKey ||
                event.metaKey ||
                event.ctrlKey ||
                origin.$cell.doc !== editor.state.doc
              )
                return;
              if (event.key === "Escape") {
                event.preventDefault();
                editor.view.focus();
                return;
              }
              const delta =
                event.key === "ArrowDown" || event.key === "ArrowRight"
                  ? 1
                  : event.key === "ArrowUp" || event.key === "ArrowLeft"
                    ? -1
                    : 0;
              if (!delta) return;
              if (
                event.shiftKey &&
                targetKind !== "cell" &&
                (targetKind === "row"
                  ? /Arrow(Up|Down)/.test(event.key)
                  : /Arrow(Left|Right)/.test(event.key))
              ) {
                event.preventDefault();
                event.stopPropagation();
                const current = activeCells(editor.view);
                if (!current) return;
                const anchor = origin.map.findCell(
                  current.$anchorCell.pos - origin.$cell.start(-1)
                );
                const opposite =
                  targetKind === "row"
                    ? current.isColSelection() && !current.isRowSelection()
                    : current.isRowSelection() && !current.isColSelection();
                const ownsAxis =
                  targetKind === "row" ? current.isRowSelection() : current.isColSelection();
                const active = ownsAxis
                  ? current
                  : selectBand(
                      origin.$cell,
                      targetKind,
                      opposite
                        ? targetKind === "row"
                          ? anchor.top
                          : anchor.left
                        : origin[targetKind],
                      opposite ? null : current
                    );
                const head = origin.map.findCell(active.$headCell.pos - origin.$cell.start(-1));
                const index =
                  targetKind === "row"
                    ? delta > 0
                      ? head.bottom
                      : head.top - 1
                    : delta > 0
                      ? head.right
                      : head.left - 1;
                const size = targetKind === "row" ? origin.map.height : origin.map.width;
                if (index >= 0 && index < size)
                  select(editor, selectBand(origin.$cell, targetKind, index, active, true));
                refresh();
              } else if (
                !event.shiftKey &&
                (event.key === "ArrowLeft" || event.key === "ArrowRight")
              ) {
                event.preventDefault();
                event.stopPropagation();
                const buttons = [
                  rowButton.current,
                  columnButton.current,
                  cellButton.current,
                ].filter((button): button is HTMLButtonElement => !!button);
                const index = buttons.indexOf(event.currentTarget.querySelector("button")!);
                buttons[(index + delta + buttons.length) % buttons.length]?.focus({
                  preventScroll: true,
                });
              }
            }}
            onPointerDownCapture={(event) => startGesture(event, targetKind, origin)}
            onOpenChange={(next) => {
              if (!next) {
                if (menu.current?.kind === targetKind) dismiss();
                return;
              }
              const selected = selectionFor(targetKind, origin);
              if (selected) open(targetKind, selected, origin);
            }}
          >
            <TableActionList
              editor={editor}
              kind={targetKind}
              sortColumn={kind === "column" ? openTarget?.anchor?.index : undefined}
              onAction={runAction}
              ownerId={menuOwner}
              onClose={dismiss}
              onEditWidth={() => {
                const target = menu.current;
                if (!target || target.kind !== "column" || !editor.isEditable) return;
                close();
                onEditWidth(target);
              }}
            />
          </TableActionHandle>
        );
      })}
      {!kind &&
        (["row", "column"] as const).map((axis) => {
          const box = axis === "row" ? axes?.boxes.addRow : axes?.boxes.addColumn;
          if (!box) return null;
          return (
            <TableAppendHandle key={axis} axis={axis} box={box} onPress={() => append(axis)} />
          );
        })}
    </div>,
    portal
  );
}

function EditableTableMenu({ editor }: { editor: Editor }) {
  const [session, setSession] = useState<{
    id: number;
    target: MenuTarget;
    isOpen: boolean;
  } | null>(null);
  const close = useCallback(
    () => setSession((current) => (current ? { ...current, isOpen: false } : null)),
    []
  );
  if (editor.isDestroyed) return null;
  return (
    <>
      {!session?.isOpen && (
        <TableControls
          editor={editor}
          onEditWidth={(target) =>
            setSession((current) => ({ id: (current?.id ?? 0) + 1, target, isOpen: true }))
          }
        />
      )}
      {session && (
        <TableColumnWidthDialog
          key={session.id}
          editor={editor}
          target={session.target}
          isOpen={session.isOpen}
          onClose={close}
        />
      )}
    </>
  );
}

export function TableMenu() {
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  return editor && !editor.isDestroyed && !isDisabled && !isReadOnly ? (
    <EditableTableMenu editor={editor} />
  ) : null;
}
