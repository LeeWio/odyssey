import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

export function startHomeSmoothScroll(prevent: (node: HTMLElement) => boolean) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  const lenis = new Lenis({
    anchors: true,
    lerp: 0.1,
    prevent,
    smoothWheel: true,
    syncTouch: false,
    stopInertiaOnNavigate: true,
  });

  const tick = (time: number) => {
    lenis.raf(time * 1000);
  };

  lenis.on("scroll", () => {
    ScrollTrigger.update();
  });
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.destroy();
  };
}
