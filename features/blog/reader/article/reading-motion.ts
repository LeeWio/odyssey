import { EASE_OUT_CSS } from "@/lib/motion/ease";

const READING_UNITS = [
  "p:not(:empty)",
  "h1, h2, h3, h4, h5, h6",
  "li, blockquote, tr, details",
  "figure, audio, video, hr, a[download]",
  "[data-reading-code], [data-type='block-math'], [data-type='columns']",
].join(", ");

const PENDING = "data-reading-pending";
const REVEAL_GAP_MS = 90;
const LEAD_PX = 80;
const JUMP_SETTLE_MS = 160;
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
  let cursor = 0;
  let observed: HTMLElement | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastStartedAt = -Infinity;
  let lastScrollY = window.scrollY;
  let lastScrollAt = performance.now();
  let quietUntil = -Infinity;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some(({ target, isIntersecting }) => target === observed && isIntersecting)) {
        advance();
      }
    },
    { rootMargin: `0px 0px ${LEAD_PX}px` }
  );

  function watch(element?: HTMLElement) {
    if (element === observed) return;
    if (observed) observer.unobserve(observed);
    observed = element;
    if (observed) observer.observe(observed);
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
    if (timer !== undefined) return;
    const viewportHeight = window.innerHeight;
    const limit = viewportHeight + LEAD_PX;
    const now = performance.now();
    const quiet = now < quietUntil;

    const start = cursor;
    let next: HTMLElement | undefined;
    let delay = 0;
    let toPlay: HTMLElement | undefined;

    while ((next = units[cursor])) {
      const rect = next.getBoundingClientRect();
      if (rect.top > limit) break;

      if (
        quiet ||
        !rect.width ||
        !rect.height ||
        rect.bottom <= 0 ||
        rect.height > viewportHeight * 2
      ) {
        cursor += 1;
        continue;
      }

      delay = lastStartedAt + REVEAL_GAP_MS - now;
      if (delay > 0 && rect.top >= 0) break;

      cursor += 1;
      toPlay = next;
      next = units[cursor];
      break;
    }

    for (let index = start; index < cursor; index += 1) units[index]!.removeAttribute(PENDING);
    if (toPlay) play(toPlay, now);

    if (next && (toPlay || delay > 0)) {
      watch();
      timer = setTimeout(
        () => {
          timer = undefined;
          advance();
        },
        toPlay ? REVEAL_GAP_MS : delay
      );
    } else {
      watch(next);
    }
  }

  function cancelRunning() {
    for (const animation of running) animation.cancel();
    running.clear();
  }

  function skipVisible() {
    clearTimeout(timer);
    timer = undefined;
    quietUntil = performance.now() + JUMP_SETTLE_MS;
    lastStartedAt = -Infinity;
    cancelRunning();
    advance();
  }

  function onScroll() {
    const now = performance.now();
    const distance = Math.abs(window.scrollY - lastScrollY);
    const jump = distance > Math.max(96, Math.min(now - lastScrollAt, 32) * 3);
    lastScrollY = window.scrollY;
    lastScrollAt = now;
    if (jump) skipVisible();
    else if (now < quietUntil) advance();
  }

  function dispose() {
    clearTimeout(timer);
    observer.disconnect();
    cancelRunning();
    for (let index = cursor; index < units.length; index += 1) {
      units[index]!.removeAttribute(PENDING);
    }
    root.removeEventListener("focusin", skipVisible);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("hashchange", skipVisible);
    window.removeEventListener("resize", advance);
    preference.removeEventListener("change", onPreference);
  }

  function onPreference() {
    if (preference.matches) dispose();
  }

  for (const unit of units) unit.setAttribute(PENDING, "");
  if (
    !opening ||
    window.location.hash ||
    window.scrollY !== 0 ||
    root.contains(document.activeElement)
  ) {
    skipVisible();
  } else {
    advance();
  }

  root.addEventListener("focusin", skipVisible);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("hashchange", skipVisible);
  window.addEventListener("resize", advance, { passive: true });
  preference.addEventListener("change", onPreference);
  return dispose;
}
