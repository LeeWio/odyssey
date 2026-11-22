import { READING_SCROLL_KEY } from "@/lib/reading-scroll";

export const READING_OPENING_ATTRIBUTE = "data-reading-opening";
export const READING_OPENING_SETTLED = "odyssey:reading-opening-settled";
const READING_RESUME_ATTRIBUTE = "data-reading-resume-y";
const READING_RESUME_SETTLED = "odyssey:reading-resume-settled";

export function restoreReloadPosition(root: HTMLElement) {
  const saved = root.getAttribute(READING_RESUME_ATTRIBUTE);
  if (!saved) return;
  root.dispatchEvent(new Event(READING_RESUME_SETTLED));
  const top = Number(saved);
  if (Number.isFinite(top) && top > 0 && window.scrollY === 0 && !window.location.hash) {
    window.scrollTo({ top, behavior: "instant" });
  }
}

export const READING_OPENING_SCRIPT = `(() => {
  const root = document.currentScript?.parentElement;
  if (!root) return;

  const navigation = performance.getEntriesByType("navigation")[0]?.type;
  const reloading = navigation === "reload";
  if (navigation === "back_forward" || (!reloading && location.hash)) return;
  if (reloading && !location.hash) {
    let saved;
    try {
      saved = JSON.parse(sessionStorage.getItem(${JSON.stringify(READING_SCROLL_KEY)}));
    } catch {}
    if (scrollY === 0 && saved?.path === location.pathname && Number.isFinite(saved.y) && saved.y > 0) {
      const listeners = new AbortController();
      const options = { signal: listeners.signal };
      function cancelResume() {
        root.removeAttribute("${READING_RESUME_ATTRIBUTE}");
        listeners.abort();
      }
      addEventListener("scroll", () => { if (scrollY !== 0) cancelResume(); }, { ...options, passive: true });
      addEventListener("wheel", cancelResume, { ...options, passive: true });
      addEventListener("touchmove", cancelResume, { ...options, passive: true });
      addEventListener("keydown", (event) => {
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) cancelResume();
      }, options);
      addEventListener("hashchange", cancelResume, options);
      addEventListener("pagehide", cancelResume, options);
      root.addEventListener("${READING_RESUME_SETTLED}", cancelResume, options);
      root.setAttribute("${READING_RESUME_ATTRIBUTE}", String(saved.y));
    }
  }

  if ((!reloading && scrollY !== 0) || !("IntersectionObserver" in window)) return;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches) return;

  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  const timer = setTimeout(release, 2200);
  function release() {
    root.removeAttribute("${READING_OPENING_ATTRIBUTE}");
    listeners.abort();
    clearTimeout(timer);
  }

  if (!reloading) {
    addEventListener("scroll", () => { if (scrollY !== 0) release(); }, { ...options, passive: true });
  }
  addEventListener("wheel", release, { ...options, passive: true });
  addEventListener("touchmove", release, { ...options, passive: true });
  addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) release();
  }, options);
  addEventListener("hashchange", release, options);
  addEventListener("pagehide", release, options);
  root.addEventListener("focusin", release, options);
  root.addEventListener("${READING_OPENING_SETTLED}", release, options);
  motion.addEventListener("change", release, options);
  root.setAttribute("${READING_OPENING_ATTRIBUTE}", "");
})();`;
