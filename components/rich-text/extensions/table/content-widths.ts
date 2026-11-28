import type { Editor } from "@tiptap/core";
import type { TableRect } from "@tiptap/pm/tables";

/** Measure intrinsic cell content in an inert sibling, outside the editor's DOM observer. */
export function contentColumnWidths(
  editor: Editor,
  rect: TableRect,
  current: number[],
  minimum: number
): number[] | null {
  const source = editor.view.nodeDOM(rect.tableStart - 1);
  const table =
    source instanceof Element
      ? source.matches("table")
        ? source
        : source.querySelector("table")
      : null;
  if (!table || !editor.view.dom.parentElement) return null;
  const root = editor.view.dom.cloneNode(false) as HTMLElement;
  root.removeAttribute("id");
  root.classList.remove("ProseMirror-hideselection", "ProseMirror-focused");
  root.removeAttribute("role");
  root.removeAttribute("aria-label");
  root.removeAttribute("data-table-cell-selection");
  root.contentEditable = "false";
  root.setAttribute("aria-hidden", "true");
  root.dataset.tableContentMeasure = "";
  root.inert = true;
  Object.assign(root.style, {
    position: "fixed",
    left: "-100000px",
    top: "0",
    visibility: "hidden",
    pointerEvents: "none",
  });
  root.style.setProperty("width", "max-content", "important");
  root.style.setProperty("max-width", "none", "important");
  const wrapper = document.createElement("div");
  wrapper.className = "tableWrapper";
  wrapper.style.setProperty("max-width", "none", "important");
  wrapper.style.setProperty("overflow", "visible", "important");
  const measure = table.cloneNode(false) as HTMLElement;
  for (const [key, value] of Object.entries({
    display: "block",
    width: "max-content",
    maxWidth: "none",
    minWidth: "0",
  }))
    measure.style.setProperty(
      key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
      value,
      "important"
    );
  const body = document.createElement("tbody");
  body.style.display = "block";
  measure.append(body);
  wrapper.append(measure);
  root.append(wrapper);
  const cells: Array<{ element: HTMLElement; left: number; right: number }> = [];
  const seen = new Set<number>();
  for (let row = 0; row < rect.map.height; row++)
    for (let col = rect.left; col < rect.right; col++) {
      const offset = rect.map.map[row * rect.map.width + col];
      if (seen.has(offset)) continue;
      seen.add(offset);
      const dom = editor.view.nodeDOM(rect.tableStart + offset);
      if (!(dom instanceof HTMLElement)) continue;
      let left = col;
      while (left > 0 && rect.map.map[row * rect.map.width + left - 1] === offset) left--;
      const element = dom.cloneNode(true) as HTMLElement;
      element.classList.remove("selectedCell", "table-cell-active");
      element.removeAttribute("colspan");
      element.removeAttribute("rowspan");
      element.removeAttribute("colwidth");
      element.removeAttribute("id");
      // Inert does not stop an iframe/media URL from loading. Measure an existing
      // media box without mounting a second player or triggering another request.
      const media = dom.querySelectorAll("img,iframe,video,audio");
      element.querySelectorAll("img,iframe,video,audio").forEach((clone, index) => {
        const placeholder = document.createElement("span");
        placeholder.style.display = "inline-block";
        placeholder.style.width = `${media[index].getBoundingClientRect().width}px`;
        clone.replaceWith(placeholder);
      });
      element.querySelectorAll("[id]").forEach((child) => child.removeAttribute("id"));
      element.querySelectorAll(".column-resize-handle").forEach((child) => child.remove());
      for (const [key, value] of Object.entries({
        display: "block",
        width: "max-content",
        maxWidth: "none",
        minWidth: "0",
      }))
        element.style.setProperty(
          key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
          value,
          "important"
        );
      const tr = document.createElement("tr");
      tr.style.display = "block";
      tr.append(element);
      body.append(tr);
      cells.push({ element, left, right: left + rect.table.nodeAt(offset)!.attrs.colspan });
    }
  editor.view.dom.parentElement.append(root);
  try {
    const maximum = Math.max(minimum, Math.min(600, table.parentElement?.clientWidth || 600));
    const result = Array(rect.right - rect.left).fill(minimum) as number[];
    let measured = false;
    for (const { element, left, right } of cells) {
      const intrinsic = element.getBoundingClientRect().width;
      if (!intrinsic) continue;
      measured = true;
      const from = Math.max(left, rect.left),
        to = Math.min(right, rect.right);
      let outside = 0;
      for (let col = left; col < right; col++) if (col < from || col >= to) outside += current[col];
      const width = Math.min(
        maximum,
        Math.max(minimum, Math.ceil((intrinsic - outside) / (to - from)))
      );
      for (let col = from; col < to; col++)
        result[col - rect.left] = Math.max(result[col - rect.left], width);
    }
    return measured ? result : null;
  } finally {
    root.remove();
  }
}
