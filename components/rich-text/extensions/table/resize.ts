import type { Editor } from "@tiptap/core";
import { closeHistory } from "@tiptap/pm/history";
import { Plugin } from "@tiptap/pm/state";
import { columnResizingPluginKey, TableMap } from "@tiptap/pm/tables";
import { setSelectedColumnWidths } from "./column-widths";
import { TABLE_ACTION_STATUS } from "./feedback";

export function resizeColumnTarget(editor: Editor) {
  const state = columnResizingPluginKey.getState(editor.state);
  if (!state || state.activeHandle < 0) return null;
  const $cell = editor.state.doc.resolve(state.activeHandle);
  if (
    !$cell.nodeAfter ||
    ($cell.nodeAfter.type.spec.tableRole !== "cell" &&
      $cell.nodeAfter.type.spec.tableRole !== "header_cell")
  )
    return null;
  const table = $cell.node(-1),
    map = TableMap.get(table),
    tableStart = $cell.start(-1);
  const left = map.colCount($cell.pos - tableStart) + $cell.nodeAfter.attrs.colspan - 1;
  return {
    table,
    map,
    tableStart,
    left,
    right: left + 1,
    top: 0,
    bottom: map.height,
    handle: state.activeHandle,
  };
}

/** Native resizing stays authoritative. A click without a drag must not freeze automatic widths. */
export function tableResizeInteractions(editor: Editor) {
  let moved = false;
  return new Plugin({
    filterTransaction(tr, state) {
      const resize = columnResizingPluginKey.getState(state);
      if (!resize?.dragging || resize.activeHandle < 0 || moved || !tr.docChanged || !tr.isGeneric)
        return true;
      const drag = resize.dragging;
      const $handle = state.doc.resolve(resize.activeHandle);
      const table = $handle.node(-1),
        map = TableMap.get(table),
        start = $handle.start(-1);
      const column = map.colCount($handle.pos - start) + $handle.nodeAfter!.attrs.colspan - 1;
      const onlyNativeWidth = tr.steps.every((step, index) => {
        if (!("from" in step) || typeof step.from !== "number") return false;
        const before = tr.docs[index].nodeAt(step.from),
          after = (tr.docs[index + 1] ?? tr.doc).nodeAt(step.from);
        if (
          !before ||
          !after ||
          !["cell", "header_cell"].includes(before.type.spec.tableRole) ||
          before.type !== after.type ||
          !before.content.eq(after.content)
        )
          return false;
        const { colwidth: oldWidth, ...oldAttrs } = before.attrs;
        const { colwidth: newWidth, ...newAttrs } = after.attrs;
        return (
          JSON.stringify(oldAttrs) === JSON.stringify(newAttrs) &&
          JSON.stringify(before.marks) === JSON.stringify(after.marks) &&
          step.from >= start &&
          step.from < start + table.content.size &&
          (() => {
            const left = map.colCount(step.from - start),
              index = column - left;
            return (
              index >= 0 &&
              index < before.attrs.colspan &&
              newWidth?.length === before.attrs.colspan &&
              newWidth[index] === drag.startWidth &&
              newWidth.every(
                (width: number, slot: number) => slot === index || width === (oldWidth?.[slot] ?? 0)
              )
            );
          })()
        );
      });
      return !onlyNativeWidth;
    },
    appendTransaction(transactions, previous, state) {
      const resize = columnResizingPluginKey.getState(state);
      // Async content changes invalidate a live DOM preview; native mouseup must
      // not write through a deleted/moved cell. A finished native width write is safe too.
      if (resize?.dragging && transactions.some((tr) => tr.docChanged)) {
        const tr = closeHistory(state.tr)
          .setMeta(columnResizingPluginKey, { setDragging: null })
          .setMeta("addToHistory", false);
        const old = columnResizingPluginKey.getState(previous);
        const before = old && old.activeHandle >= 0 ? previous.doc.nodeAt(old.activeHandle) : null;
        const after = resize.activeHandle >= 0 ? state.doc.nodeAt(resize.activeHandle) : null;
        if (
          before &&
          after &&
          before.type === after.type &&
          before.content.eq(after.content) &&
          transactions.some((step) => step.docChanged && step.isGeneric) &&
          JSON.stringify(before.attrs.colwidth) !== JSON.stringify(after.attrs.colwidth)
        ) {
          const width = after.attrs.colwidth?.at(-1);
          if (typeof width === "number")
            tr.setMeta(TABLE_ACTION_STATUS, `Column width set to ${width} pixels.`);
        }
        return tr;
      }
      return null;
    },
    props: {
      handleDOMEvents: {
        mousedown(view, event) {
          const resize = columnResizingPluginKey.getState(view.state);
          if (view.editable && event.button === 0 && resize && resize.activeHandle >= 0) {
            moved = false;
            view.dispatch(closeHistory(view.state.tr));
          }
          return false;
        },
        dblclick(view, event) {
          if (!view.editable || event.button !== 0) return false;
          const target = resizeColumnTarget(editor);
          if (!target) return false;
          const cell = view.nodeDOM(target.handle);
          if (!(cell instanceof Element)) return false;
          if (Math.abs(cell.getBoundingClientRect().right - event.clientX) > 5) return false;
          event.preventDefault();
          if (setSelectedColumnWidths(editor, target, "reset", true))
            view.dispatch(
              view.state.tr
                .setMeta(TABLE_ACTION_STATUS, `Column ${target.left + 1} width reset.`)
                .setMeta("addToHistory", false)
            );
          return true;
        },
      },
    },
    view(view) {
      const win = view.dom.ownerDocument.defaultView!;
      const move = (event: MouseEvent) => {
        const drag = columnResizingPluginKey.getState(view.state)?.dragging;
        if (drag && event.clientX !== drag.startX) moved = true;
      };
      win.addEventListener("mousemove", move);
      return {
        destroy() {
          win.removeEventListener("mousemove", move);
        },
      };
    },
  });
}
