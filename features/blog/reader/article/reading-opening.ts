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
  if (!root || location.hash) return;

  const navigation = performance.getEntriesByType("navigation")[0]?.type;
  if (navigation === "back_forward") return;
  if (navigation === "reload") {
    let saved;
    try {
      saved = JSON.parse(sessionStorage.getItem(${JSON.stringify(READING_SCROLL_KEY)}));
    } catch {}
    if (saved?.path === location.pathname && Number.isFinite(saved.y) && saved.y > 0) {
      if (scrollY !== 0) return;

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
      return;
    }
  }

  if (scrollY !== 0 || !("IntersectionObserver" in window) || typeof root.animate !== "function") return;
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

  addEventListener("scroll", () => { if (scrollY !== 0) release(); }, { ...options, passive: true });
  addEventListener("hashchange", release, options);
  addEventListener("pagehide", release, options);
  root.addEventListener("focusin", release, options);
  root.addEventListener("${READING_OPENING_SETTLED}", release, options);
  motion.addEventListener("change", release, options);
  root.setAttribute("${READING_OPENING_ATTRIBUTE}", "");
})();`;
