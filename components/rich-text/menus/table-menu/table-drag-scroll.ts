import type { Point } from "./table-geometry";

export const tableScrollEdge = 28;

/** Client boxes exclude scrollbars and borders; every clipping ancestor limits hit testing. */
export function tableVerticalViewport(table: HTMLTableElement) {
  let top = 0;
  let bottom = innerHeight;
  let scroller: HTMLElement | null = null;
  for (let node = table.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (!/auto|scroll|hidden|clip/.test(style.overflowY)) continue;
    const rect = node.getBoundingClientRect();
    top = Math.max(top, rect.top + node.clientTop);
    bottom = Math.min(bottom, rect.top + node.clientTop + node.clientHeight);
    if (!scroller && /auto|scroll/.test(style.overflowY) && node.scrollHeight > node.clientHeight)
      scroller = node;
  }
  return { top, bottom, scroller };
}

/** Pixels per second; stop at the boundary of the edge zone and ramp toward its edge. */
export function tableEdgeVelocity(point: number, start: number, end: number) {
  if (end <= start) return 0;
  const edge = Math.min(tableScrollEdge, (end - start) / 2);
  if (point < start + edge) return -540 * Math.min(1, (start + edge - point) / edge);
  if (point > end - edge) return 540 * Math.min(1, (point - end + edge) / edge);
  return 0;
}

/** Scroll only the owning viewport, never chain an exhausted modal scrollport to the page. */
export function scrollTableVertically(table: HTMLTableElement, point: Point, elapsed: number) {
  const viewport = tableVerticalViewport(table);
  const bounds = table.getBoundingClientRect();
  const top = Math.max(viewport.top, bounds.top);
  const bottom = Math.min(viewport.bottom, bounds.bottom);
  let delta = (tableEdgeVelocity(point.y, top, bottom) * Math.min(32, Math.max(0, elapsed))) / 1000;
  delta = Math.max(
    Math.min(0, bounds.top - top),
    Math.min(delta, Math.max(0, bounds.bottom - bottom))
  );
  if (!delta) return false;
  const scroller = viewport.scroller;
  if (scroller) {
    const before = scroller.scrollTop;
    scroller.scrollTop += delta;
    return scroller.scrollTop !== before;
  }
  if (
    [document.body, document.documentElement].some((node) =>
      /hidden|clip/.test(getComputedStyle(node).overflowY)
    )
  )
    return false;
  const before = window.scrollY;
  window.scrollBy(0, delta);
  return window.scrollY !== before;
}
