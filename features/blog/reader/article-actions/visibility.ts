/** Page position that owns the reading controls. */
export type ArticleActionZone = "top" | "reading" | "near-end";

/** Direction accumulated since the last reversal. */
export type ArticleActionDirection = "up" | "down" | "idle";

/** Whether the compact controls are on screen. */
export type ArticleActionVisibility = "visible" | "hidden";

/** Tunable distances for the reading-control state machine. */
export interface ArticleActionVisibilityConfig {
  /** Restores the initial visible state at the opening of the page. */
  topZone: number;
  /** Downward distance required before the controls leave the reading path. */
  hideDistance: number;
  /** Upward distance required before the controls return. */
  showDistance: number;
  /** Extra space kept clear beyond the measured control height. */
  endSafety: number;
}

/**
 * Desktop distances. Mobile uses the shorter pair so a thumb scroll
 * crosses the threshold without waiting for a long gesture.
 */
export const ARTICLE_ACTION_VISIBILITY_CONFIG: ArticleActionVisibilityConfig = {
  topZone: 128,
  hideDistance: 88,
  showDistance: 56,
  endSafety: 24,
};

export const ARTICLE_ACTION_MOBILE_DISTANCES = {
  hideDistance: 64,
  showDistance: 40,
} as const;

export interface ArticleActionScrollMemory {
  direction: ArticleActionDirection;
  distance: number;
  scrollY: number;
  visibility: ArticleActionVisibility;
}

export interface ArticleActionSample {
  /** A menu, sheet, dialog, share, mutation, or focus lock is active. */
  isInteractionLocked: boolean;
  /** Distance from the viewport bottom to the article ending sentinel. */
  articleEndOffset: number | null;
  /** Measured control height, used only for the ending clearance. */
  actionBarHeight: number;
  scrollY: number;
  maxScroll: number;
  config?: ArticleActionVisibilityConfig;
}

export interface ArticleActionVisibilityState {
  isOpen: boolean;
  zone: ArticleActionZone;
  direction: ArticleActionDirection;
  progress: number;
  isInteractionLocked: boolean;
  memory: ArticleActionScrollMemory;
}

export function createArticleActionScrollMemory(): ArticleActionScrollMemory {
  return { direction: "idle", distance: 0, scrollY: 0, visibility: "visible" };
}

function zoneFor({
  actionBarHeight,
  articleEndOffset,
  config,
  scrollY,
}: {
  actionBarHeight: number;
  articleEndOffset: number | null;
  config: ArticleActionVisibilityConfig;
  scrollY: number;
}): ArticleActionZone {
  if (scrollY <= config.topZone) return "top";
  const clearance = Math.max(config.endSafety, actionBarHeight + 16);
  if (articleEndOffset !== null && articleEndOffset <= clearance) return "near-end";
  return "reading";
}

function accumulate(
  memory: ArticleActionScrollMemory,
  delta: number
): Pick<ArticleActionScrollMemory, "direction" | "distance"> {
  if (delta === 0) return { direction: memory.direction, distance: memory.distance };
  const direction: ArticleActionDirection = delta > 0 ? "down" : "up";
  return {
    direction,
    distance: memory.direction === direction ? memory.distance + Math.abs(delta) : Math.abs(delta),
  };
}

/**
 * Decides the next reading-control state from one scroll sample.
 *
 * Priority is interaction, then the page opening, then the article ending,
 * then a completed upward glance, then a completed downward read.
 * Anything shorter keeps the current visibility, which is what stops a
 * trackpad from flickering the controls.
 */
export function decideArticleActionVisibility(
  memory: ArticleActionScrollMemory,
  sample: ArticleActionSample
): ArticleActionVisibilityState {
  const config = sample.config ?? ARTICLE_ACTION_VISIBILITY_CONFIG;
  const zone = zoneFor({ ...sample, config });
  const progress = sample.maxScroll > 0 ? Math.round((sample.scrollY / sample.maxScroll) * 100) : 0;
  const delta = sample.scrollY - memory.scrollY;
  const motion = sample.isInteractionLocked
    ? { direction: "idle" as const, distance: 0 }
    : accumulate(memory, delta);

  let visibility = memory.visibility;
  if (sample.isInteractionLocked || zone === "top") visibility = "visible";
  else if (zone === "near-end") visibility = "hidden";
  else if (motion.direction === "up" && motion.distance >= config.showDistance)
    visibility = "visible";
  else if (motion.direction === "down" && motion.distance >= config.hideDistance) {
    visibility = "hidden";
  }

  const consumed = visibility !== memory.visibility;
  const direction = consumed ? "idle" : motion.direction;

  return {
    isOpen: visibility === "visible",
    zone,
    direction,
    progress,
    isInteractionLocked: sample.isInteractionLocked,
    memory: {
      direction,
      distance: consumed ? 0 : motion.distance,
      scrollY: sample.scrollY,
      visibility,
    },
  };
}
