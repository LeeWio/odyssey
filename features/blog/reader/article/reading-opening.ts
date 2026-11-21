import { READING_SCROLL_KEY } from "@/lib/reading-scroll";

export const READING_OPENING_ATTRIBUTE = "data-reading-opening";
export const READING_OPENING_SETTLED = "odyssey:reading-opening-settled";

export const READING_OPENING_SCRIPT = `(() => {
  const root = document.currentScript?.parentElement;
  if (!root || location.hash || scrollY !== 0 ||
      !("IntersectionObserver" in window) || typeof root.animate !== "function") return;

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches) return;

  const navigation = performance.getEntriesByType("navigation")[0]?.type;
  if (navigation === "back_forward") return;
  if (navigation === "reload") {
    try {
      const saved = JSON.parse(sessionStorage.getItem(${JSON.stringify(READING_SCROLL_KEY)}));
      if (saved?.path === location.pathname && Number.isFinite(saved.y) && saved.y > 0) return;
    } catch {}
  }

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
