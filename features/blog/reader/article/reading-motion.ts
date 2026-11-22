import { EASE_OUT_CSS } from "@/lib/motion/ease";
import { READING_JUMP_EVENT, readingScrollOffset } from "@/lib/reading-scroll";

const READING_UNITS = [
  "p:not(:empty)",
  "h1, h2, h3, h4, h5, h6",
  "li, blockquote, tr, details",
  "figure, audio, video, hr, a[download]",
  "[data-reading-code], [data-type='block-math'], [data-type='columns']",
].join(", ");

const PENDING = "data-reading-pending";
const REVEAL_GAP_MS = 90;
const MIN_REVEAL_GAP_MS = 16;
const VISIBLE_REVEAL_WINDOW_MS = REVEAL_GAP_MS * 4;
const LEAD_PX = 80;
const TEXT_REVEAL = {
  duration: 680,
  filter: ["blur(8px)", "blur(0px)"],
  transform: ["translate3d(0, 18px, 0) scale(0.99)", "translate3d(0, 0, 0) scale(1)"],
};
const IMAGE_REVEAL = {
  duration: 780,
  filter: ["blur(6px)", "blur(0px)"],
  transform: ["scale(1.025)", "scale(1)"],
};

export function bindReadingMotion(root: HTMLElement, opening: boolean) {
  if (!("IntersectionObserver" in window) || typeof root.animate !== "function") return;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (preference.matches) return;

  const units = Array.from(root.querySelectorAll<HTMLElement>(READING_UNITS)).filter((element) => {
    const parentUnit = element.parentElement?.closest(READING_UNITS);
    return !parentUnit || !root.contains(parentUnit);
  });
  if (!units.length) return;

  const running = new Set<Animation>();
  let viewportTop = readingScrollOffset();
  let viewportHeight = window.innerHeight;
  const revealOpening =
    opening && !window.location.hash && viewportTop === 0 && !root.contains(document.activeElement);
  let cursor = 0;
  let lead = revealOpening ? LEAD_PX : 0;
  let observed: HTMLElement | undefined;
  let frame: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastStartedAt = -Infinity;

  // Catch layout changes that bring a block into view while the reader is stationary.
  const observer = new IntersectionObserver((entries) => {
    if (entries.some(({ target, isIntersecting }) => target === observed && isIntersecting)) {
      schedule();
    }
  });

  function watch(element?: HTMLElement) {
    if (element === observed) return;
    if (observed) observer.unobserve(observed);
    observed = element;
    if (observed) observer.observe(observed);
  }

  function firstBeyond(limit: number) {
    let index = cursor;
    while (units[index] && units[index]!.getBoundingClientRect().top <= limit) index += 1;
    return index;
  }

  function showThrough(end: number) {
    while (cursor < end) units[cursor++]!.removeAttribute(PENDING);
  }

  function schedule() {
    frame ??= requestAnimationFrame(() => {
      frame = undefined;
      advance();
    });
  }

  function play(element: HTMLElement, now: number) {
    lastStartedAt = now;
    const { duration, filter, transform } = element.matches("figure") ? IMAGE_REVEAL : TEXT_REVEAL;
    const animation = element.animate(
      { opacity: [0, 1], filter, transform },
      { duration, easing: EASE_OUT_CSS, fill: "both" }
    );
    running.add(animation);
    animation.onfinish = () => {
      running.delete(animation);
      animation.cancel();
    };
  }

  function advance() {
    const previousTop = viewportTop;
    const previousHeight = viewportHeight;
    viewportTop = readingScrollOffset();
    viewportHeight = window.innerHeight;
    if (
      viewportTop !== previousTop &&
      (viewportTop >= previousTop + previousHeight || viewportTop + viewportHeight <= previousTop)
    ) {
      settleThrough(viewportHeight);
      return;
    }
    if (viewportTop > previousTop) lead = LEAD_PX;
    clearTimeout(timer);
    timer = undefined;

    const limit = viewportHeight + lead;
    const now = performance.now();
    let end = cursor;
    let next: HTMLElement | undefined;
    let delay = 0;
    let gap = REVEAL_GAP_MS;
    let toPlay: HTMLElement | undefined;

    while ((next = units[end])) {
      const rect = next.getBoundingClientRect();
      if (rect.top > limit) break;

      if (!rect.width || !rect.height || rect.bottom <= 0 || rect.height > viewportHeight * 2) {
        end += 1;
        continue;
      }

      if (!revealOpening || viewportTop !== 0) {
        // Speed up the sequence as more pending blocks enter the viewport.
        const visibleWaiting = Math.max(1, firstBeyond(viewportHeight) - end);
        gap = Math.max(
          MIN_REVEAL_GAP_MS,
          Math.min(REVEAL_GAP_MS, VISIBLE_REVEAL_WINDOW_MS / visibleWaiting)
        );
      }
      delay = lastStartedAt + gap - now;
      if (delay > 0) break;

      toPlay = next;
      next = units[++end];
      break;
    }

    showThrough(end);
    if (toPlay) play(toPlay, now);

    if (next && (toPlay || delay > 0)) {
      watch();
      timer = setTimeout(
        () => {
          timer = undefined;
          advance();
        },
        toPlay ? gap : delay
      );
    } else {
      watch(next);
    }
  }

  function cancelRunning() {
    for (const animation of running) animation.cancel();
    running.clear();
  }

  function settleThrough(limit: number) {
    clearTimeout(timer);
    timer = undefined;
    lastStartedAt = -Infinity;
    lead = 0;
    cancelRunning();
    showThrough(firstBeyond(limit));
    watch(units[cursor]);
  }

  function onHashChange() {
    settleThrough(window.innerHeight);
  }

  function onFocus(event: FocusEvent) {
    const unit = event.target instanceof Element ? event.target.closest(`[${PENDING}]`) : null;
    settleThrough(Math.max(window.innerHeight, unit?.getBoundingClientRect().top ?? 0));
  }

  function onReadingJump(event: CustomEvent<number>) {
    settleThrough(window.innerHeight + event.detail - readingScrollOffset());
  }

  function dispose() {
    if (frame !== undefined) cancelAnimationFrame(frame);
    clearTimeout(timer);
    watch();
    observer.disconnect();
    cancelRunning();
    showThrough(units.length);
    root.removeEventListener("focusin", onFocus);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("hashchange", onHashChange);
    window.removeEventListener(READING_JUMP_EVENT, onReadingJump);
    window.removeEventListener("resize", schedule);
    preference.removeEventListener("change", onPreference);
  }

  function onPreference() {
    if (preference.matches) dispose();
  }

  // Content already painted by the server stays readable when the opening was skipped.
  if (!revealOpening) cursor = firstBeyond(viewportHeight);
  for (let index = cursor; index < units.length; index += 1) {
    units[index]!.setAttribute(PENDING, "");
  }
  if (revealOpening) advance();
  else watch(units[cursor]);

  root.addEventListener("focusin", onFocus);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("hashchange", onHashChange);
  window.addEventListener(READING_JUMP_EVENT, onReadingJump);
  window.addEventListener("resize", schedule, { passive: true });
  preference.addEventListener("change", onPreference);
  return dispose;
}
