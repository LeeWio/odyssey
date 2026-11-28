/** WebKit exposes zero-sized COL rects. Fixed-layout tracks follow the first row. */
export function tableColumnBounds(table: HTMLTableElement) {
  const elements = table.querySelector(":scope > colgroup")?.children;
  if (!elements?.length) return [];
  const measured = Array.from(elements, (col) => col.getBoundingClientRect());
  if (measured.every((col) => col.width > 0)) return measured;

  const columns: Array<{ left: number; right: number }> = [];
  for (const cell of table.rows[0]?.cells ?? []) {
    const bounds = cell.getBoundingClientRect();
    const widths = Array.from(
      { length: cell.colSpan },
      (_, index) => parseFloat((elements[columns.length + index] as HTMLElement).style.width) || 0
    );
    const total = widths.reduce((sum, width) => sum + width, 0);
    const automatic = widths.filter((width) => !width).length;
    let left = bounds.left;
    widths.forEach((width, index) => {
      const resolved = automatic
        ? width || (bounds.width - total) / automatic
        : (width * bounds.width) / total;
      const right = index === widths.length - 1 ? bounds.right : left + resolved;
      columns.push({ left, right });
      left = right;
    });
  }
  return columns;
}
