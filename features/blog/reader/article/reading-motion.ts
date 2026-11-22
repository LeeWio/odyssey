import { READING_JUMP_EVENT, readingScrollOffset } from "@/lib/reading-scroll";
import { readingRevealProfiles } from "./reading-reveal-keyframes";

const READING_UNITS = [
  "p:not(:empty)",
  "h1, h2, h3, h4, h5, h6",
  "li, blockquote, tr, details",
  "figure, audio, video, hr, a[download]",
  "[data-reading-code], [data-type='block-math'], [data-type='columns']",
].join(", ");

const PENDING = "data-reading-pending";
const REVEAL_GAP_MS = 90;
const VISIBLE_REVEAL_WINDOW_MS = 270;
// Leave room for the first line to move up into view even if scrolling stops here.
const REVEAL_INSET_PX = 16;

export function bindReadingMotion(root: HTMLElement, opening: boolean) {
  if (!("IntersectionObserver" in window) || typeof root.animate !== "function") return;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (preference.matches) return;

  const units = Array.from(root.querySelectorAll<HTMLElement>(READING_UNITS)).filter((element) => {
    const parentUnit = element.parentElement?.closest(READING_UNITS);
    return !parentUnit || !root.contains(parentUnit);
  });
  if (!units.length) return;

  const profiles = readingRevealProfiles();
  const running = new Set<Animation>();
  const revealOpening = opening && !root.contains(document.activeElement);
  let openingTop = revealOpening ? readingScrollOffset() : undefined;
  let openingGap: number | undefined;
  let nextOpeningStart = 0;
  let cursor = 0;
  let observed: HTMLElement | undefined;
  let frame: number | undefined;
  let staggerTimer: number | undefined;

  // Catch layout changes that bring a block into view while the reader is stationary.
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some(({ target, isIntersecting }) => target === observed && isIntersecting)) {
        schedule();
      }
    },
    { rootMargin: `0px 0px -${REVEAL_INSET_PX}px 0px` }
  );

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
    window.clearTimeout(staggerTimer);
    staggerTimer = undefined;
    frame ??= requestAnimationFrame(() => {
      frame = undefined;
      advance();
    });
  }

  function play(element: HTMLElement, tall: boolean) {
    const { duration, keyframes } = tall
      ? profiles.tall
      : element.matches("figure")
        ? profiles.image
        : profiles.text;
    const animation = element.animate(keyframes, { duration, fill: "both" });
    running.add(animation);
    animation.onfinish = () => {
      running.delete(animation);
      animation.cancel();
    };
  }

  function advance() {
    if (openingTop !== undefined && readingScrollOffset() !== openingTop) openingTop = undefined;
    const staggerOpening = openingTop !== undefined;
    const viewportHeight = window.innerHeight;
    const limit = viewportHeight - (staggerOpening ? 0 : REVEAL_INSET_PX);
    const ready: Array<{ index: number; tall: boolean }> = [];
    let end = cursor;
    for (; end < units.length; end += 1) {
      const rect = units[end]!.getBoundingClientRect();
      if (rect.top > limit || rect.top >= viewportHeight) break;
      if (rect.width && rect.height && rect.bottom > 0) {
        ready.push({ index: end, tall: rect.height > viewportHeight * 2 });
      }
    }

    const now = performance.now();
    if (staggerOpening && openingGap === undefined) {
      openingGap =
        openingTop === 0
          ? REVEAL_GAP_MS
          : Math.min(REVEAL_GAP_MS, VISIBLE_REVEAL_WINDOW_MS / Math.max(1, ready.length - 1));
      nextOpeningStart = now;
    }

    // Only the initial viewport uses a timed queue. Mark and start new scroll
    // arrivals together, in document order, after all geometry reads are done.
    for (const { index, tall } of ready) {
      if (staggerOpening && now < nextOpeningStart) {
        showThrough(index);
        staggerTimer = window.setTimeout(schedule, nextOpeningStart - now);
        return;
      }
      showThrough(index + 1);
      play(units[index]!, tall);
      if (staggerOpening) {
        nextOpeningStart = (openingTop === 0 ? now : nextOpeningStart) + openingGap!;
      }
    }
    showThrough(end);
    openingTop = undefined;
    watch(units[cursor]);
  }

  function cancelRunning() {
    for (const animation of running) animation.cancel();
    running.clear();
  }

  function settleThrough(limit: number) {
    window.clearTimeout(staggerTimer);
    staggerTimer = undefined;
    openingTop = undefined;
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
    window.clearTimeout(staggerTimer);
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

  if (revealOpening) {
    while (units[cursor] && units[cursor]!.getBoundingClientRect().bottom <= 0) cursor += 1;
  } else {
    // A timed-out or interrupted startup leaves already painted content readable.
    cursor = firstBeyond(window.innerHeight);
  }
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
