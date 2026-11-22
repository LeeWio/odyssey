/** Matches the sticky site header, so the active heading and the jump land on the same line. */
export const ARTICLE_OUTLINE_TOP_OFFSET = 112;
export const READING_SCROLL_KEY = "odyssey-reading-scroll";

export const READING_JUMP_EVENT = "odyssey:reading-jump";

declare global {
  interface WindowEventMap {
    [READING_JUMP_EVENT]: CustomEvent<number>;
  }
}

export function announceReadingJump(top: number) {
  window.dispatchEvent(new CustomEvent(READING_JUMP_EVENT, { detail: Math.max(0, top) }));
}

/** A sheet locks the page by fixing the body. The reading position then lives in `body.top`. */
export function readingScrollOffset() {
  if (typeof document === "undefined") return 0;
  const { body } = document;
  if (body.style.position === "fixed") {
    const parked = Number.parseFloat(body.style.top);
    if (Number.isFinite(parked)) return -parked;
  }
  return window.scrollY;
}
