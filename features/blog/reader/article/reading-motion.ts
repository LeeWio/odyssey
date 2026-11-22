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
const LEAD_PX = 80;
const FAST_SCROLL_WINDOW_MS = 160;
const FAST_SCROLL_DISTANCE_PX = 360;
const FAST_START_PROGRESS = 0.15;
const FAST_TIME_SCALE = 2.25;

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
  const forwardScroll: Array<{ time: number; top: number }> = [];
  let viewportTop = readingScrollOffset();
  let viewportHeight = window.innerHeight;
  const revealOpening = opening && !root.contains(document.activeElement);
  let cursor = 0;
  let lead = revealOpening && viewportTop === 0 ? LEAD_PX : 0;
  let observed: HTMLElement | undefined;
  let frame: number | undefined;
  let scheduledEnd = 0;
  let nextStartAt = 0;
  let startGap = REVEAL_GAP_MS;
  let lastStartedAt = -Infinity;
  let fastUntil = -Infinity;

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

  function play(element: HTMLElement, tall: boolean, fast: boolean) {
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
    if (fast) {
      animation.playbackRate = FAST_TIME_SCALE;
      animation.currentTime = duration * FAST_START_PROGRESS;
    }
  }

  function scrolledQuickly(previousTop: number, now: number) {
    if (viewportTop < previousTop) forwardScroll.length = 0;
    if (viewportTop <= previousTop) return false;

    while (forwardScroll[0] && now - forwardScroll[0].time > FAST_SCROLL_WINDOW_MS) {
      forwardScroll.shift();
    }
    forwardScroll.push({ time: now, top: previousTop });
    return viewportTop - forwardScroll[0]!.top >= FAST_SCROLL_DISTANCE_PX;
  }

  function advance() {
    const previousTop = viewportTop;
    const previousHeight = viewportHeight;
    viewportTop = readingScrollOffset();
    viewportHeight = window.innerHeight;
    const now = performance.now();
    if (scrolledQuickly(previousTop, now) || viewportTop >= previousTop + previousHeight) {
      if (now > fastUntil) {
        for (const animation of running) animation.updatePlaybackRate(FAST_TIME_SCALE);
      }
      fastUntil = now + FAST_SCROLL_WINDOW_MS;
    }
    if (viewportTop > previousTop) lead = LEAD_PX;

    const fast = now <= fastUntil;
    const limit = viewportHeight + (fast ? 0 : lead);
    const ready: Array<{ index: number; tall: boolean }> = [];
    let end = cursor;
    for (; end < units.length; end += 1) {
      const rect = units[end]!.getBoundingClientRect();
      if (rect.top > limit) break;
      if (rect.width && rect.height && rect.bottom > 0) {
        ready.push({ index: end, tall: rect.height > viewportHeight * 2 });
      }
    }

    const first = ready[0];
    showThrough(first?.index ?? end);
    if (!first) {
      scheduledEnd = cursor;
      watch(units[cursor]);
      return;
    }

    const openingAtTop = revealOpening && viewportTop === 0;
    const gap = openingAtTop
      ? REVEAL_GAP_MS
      : Math.min(REVEAL_GAP_MS, VISIBLE_REVEAL_WINDOW_MS / Math.max(1, ready.length - 1));

    if (fast) {
      // A rapidly moving viewport can carry a short paragraph away in one frame.
      startGap = 0;
      nextStartAt = now;
    } else if (cursor >= scheduledEnd) {
      startGap = gap;
      nextStartAt = Math.max(now, lastStartedAt + startGap);
    } else if (end !== scheduledEnd && gap < startGap) {
      startGap = gap;
      nextStartAt = Math.min(nextStartAt, lastStartedAt + startGap);
    }
    scheduledEnd = end;

    // A single frame loop advances the document cursor. New arrivals can shorten a pending
    // interval while blocks already waiting keep their place in the sequence.
    watch();
    for (const { index, tall } of ready) {
      if (now < nextStartAt) {
        showThrough(index);
        schedule();
        return;
      }
      showThrough(index + 1);
      play(units[index]!, tall, fast);
      lastStartedAt = now;
      nextStartAt = openingAtTop ? now + startGap : nextStartAt + startGap;
    }
    showThrough(end);
    watch(units[cursor]);
  }

  function cancelRunning() {
    for (const animation of running) animation.cancel();
    running.clear();
  }

  function settleThrough(limit: number) {
    lastStartedAt = -Infinity;
    lead = 0;
    cancelRunning();
    showThrough(firstBeyond(limit));
    scheduledEnd = cursor;
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
    cursor = firstBeyond(viewportHeight);
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
