/** Shared page/section entrance presets used across Odyssey surfaces. */

export const pageEaseOut = [0.22, 1, 0.36, 1] as const;

export type PageRevealInViewOptions = {
  duration?: number;
  amount?: number;
  margin?: string;
};

export type PageRevealMotion = {
  initial: false | { opacity: number; y: number };
  animate?: { opacity: number; y: number };
  whileInView?: { opacity: number; y: number };
  viewport?: { once: true; amount?: number; margin?: string };
  transition: {
    duration: number;
    delay: number;
    ease: typeof pageEaseOut;
  };
};

/** Mount/entrance reveal driven by `animate`. */
export function pageReveal(
  reducedMotion: boolean,
  delay = 0,
  distance = 18,
  duration = 0.65
): PageRevealMotion {
  return {
    initial: reducedMotion ? false : { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reducedMotion ? 0 : duration,
      delay,
      ease: pageEaseOut,
    },
  };
}

/** Scroll-triggered reveal driven by `whileInView`. */
export function pageRevealInView(
  reducedMotion: boolean,
  delay = 0,
  distance = 20,
  options: PageRevealInViewOptions = {}
): PageRevealMotion {
  const { duration = 0.65, amount = 0.3, margin } = options;

  return {
    initial: reducedMotion ? false : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: margin ? { once: true, amount, margin } : { once: true, amount },
    transition: {
      duration: reducedMotion ? 0 : duration,
      delay,
      ease: pageEaseOut,
    },
  };
}

/** Bind reduced-motion once for a page or section. */
export function createPageReveal(reducedMotion: boolean, defaults: PageRevealInViewOptions = {}) {
  const defaultDuration = defaults.duration ?? 0.65;

  return {
    reveal: (delay = 0, distance = 18, duration = defaultDuration) =>
      pageReveal(reducedMotion, delay, distance, duration),
    revealInView: (delay = 0, distance = 20, options: PageRevealInViewOptions = {}) =>
      pageRevealInView(reducedMotion, delay, distance, { ...defaults, ...options }),
  };
}
