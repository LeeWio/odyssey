/** Shared page/section entrance presets used across Odyssey surfaces. */

export const pageEaseOut = [0.22, 1, 0.36, 1] as const;

/** Alias for short icon/button transitions that share the same curve. */
export const microEaseOut = pageEaseOut;

/** Shared fade used by page changes and section presence. Exit stays shorter. */
export const pageFadeDuration = 0.24;
export const pageFadeExitDuration = 0.16;
export const sectionRevealDuration = pageFadeDuration;

/**
 * Tight spring for entrances. Most of the travel finishes inside 240ms, with a
 * small settle instead of a bounce. Exit uses the shorter fade.
 */
export const pageSpring = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.8 };

export type PageRevealInViewOptions = {
  duration?: number;
  amount?: number;
  margin?: string;
};

export type PageRevealMotion = {
  initial?: { opacity: number; y: number };
  animate?: { opacity: number; y: number };
  whileInView?: { opacity: number; y: number };
  viewport?: { once: true; amount?: number; margin?: string };
  transition:
    | {
        duration: number;
        delay: number;
        ease: typeof pageEaseOut;
      }
    | {
        type: "spring";
        stiffness: number;
        damping: number;
        mass: number;
        delay: number;
      };
};

/** Mount/entrance reveal driven by `animate`. */
export function pageReveal(
  reducedMotion: boolean,
  delay = 0,
  distance = 12,
  duration = sectionRevealDuration
): PageRevealMotion {
  return {
    initial: reducedMotion ? undefined : { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: reducedMotion
      ? { duration: 0, delay: 0, ease: pageEaseOut }
      : { ...pageSpring, delay },
  };
}

/** Scroll-triggered reveal driven by `whileInView`. */
export function pageRevealInView(
  reducedMotion: boolean,
  delay = 0,
  distance = 12,
  options: PageRevealInViewOptions = {}
): PageRevealMotion {
  const { duration = sectionRevealDuration, amount = 0.3, margin } = options;

  return {
    initial: reducedMotion ? undefined : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: margin ? { once: true, amount, margin } : { once: true, amount },
    transition: reducedMotion
      ? { duration: 0, delay: 0, ease: pageEaseOut }
      : {
          ...pageSpring,
          delay,
          ...(duration === sectionRevealDuration ? {} : { visualDuration: duration }),
        },
  };
}

export const pageEaseIn = [0.4, 0, 1, 1] as const;

export type SectionPresenceOptions = {
  amount?: number;
  delay?: number;
  distance?: number;
  duration?: number;
};

/**
 * Scroll presence for a title or list. Enter eases out; leaving reverses to a
 * shorter fade so the block can disappear without moving the page background.
 */
export function sectionPresence(reducedMotion: boolean, options: SectionPresenceOptions = {}) {
  const delay = reducedMotion ? 0 : (options.delay ?? 0);
  const duration = reducedMotion ? 0 : (options.duration ?? pageFadeDuration);
  const distance = options.distance ?? 12;

  return {
    initial: "hidden" as const,
    whileInView: "visible" as const,
    viewport: { once: false as const, amount: options.amount ?? 0.35 },
    variants: {
      hidden: {
        opacity: reducedMotion ? 1 : 0,
        y: reducedMotion ? 0 : distance,
        transition: {
          duration: reducedMotion ? 0 : pageFadeExitDuration,
          ease: pageEaseIn,
        },
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: reducedMotion
          ? { duration: 0, delay: 0, ease: pageEaseOut }
          : { ...pageSpring, delay },
      },
    },
  };
}

/** Bind reduced-motion once for a page or section. */
export function createPageReveal(reducedMotion: boolean, defaults: PageRevealInViewOptions = {}) {
  const defaultDuration = defaults.duration ?? sectionRevealDuration;

  return {
    reveal: (delay = 0, distance = 12, duration = defaultDuration) =>
      pageReveal(reducedMotion, delay, distance, duration),
    revealInView: (delay = 0, distance = 12, options: PageRevealInViewOptions = {}) =>
      pageRevealInView(reducedMotion, delay, distance, { ...defaults, ...options }),
    presence: (delay = 0, distance = 12, options: SectionPresenceOptions = {}) =>
      sectionPresence(reducedMotion, { delay, distance, ...options, ...defaults }),
  };
}
