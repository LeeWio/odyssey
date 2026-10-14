"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import {
  ARTICLE_ACTION_MOBILE_DISTANCES,
  ARTICLE_ACTION_VISIBILITY_CONFIG,
  createArticleActionScrollMemory,
  decideArticleActionVisibility,
  type ArticleActionDirection,
  type ArticleActionScrollMemory,
  type ArticleActionVisibilityState,
  type ArticleActionZone,
} from "./visibility";

export interface VisibilityOptions {
  articleEndRef: RefObject<HTMLElement | null>;
  actionBarRef: RefObject<HTMLElement | null>;
  isEngaged: boolean;
  isFocusWithin?: boolean;
}

interface PublishedVisibility {
  isOpen: boolean;
  zone: ArticleActionZone;
  direction: ArticleActionDirection;
  progress: number;
  isInteractionLocked: boolean;
}

const INITIAL_VISIBILITY: PublishedVisibility = {
  isOpen: true,
  zone: "top",
  direction: "idle",
  progress: 0,
  isInteractionLocked: false,
};

function publishable(state: ArticleActionVisibilityState): PublishedVisibility {
  return {
    isOpen: state.isOpen,
    zone: state.zone,
    direction: state.direction,
    progress: state.progress,
    isInteractionLocked: state.isInteractionLocked,
  };
}

function sameVisibility(current: PublishedVisibility, next: PublishedVisibility) {
  return (
    current.isOpen === next.isOpen &&
    current.zone === next.zone &&
    current.direction === next.direction &&
    current.progress === next.progress &&
    current.isInteractionLocked === next.isInteractionLocked
  );
}

/**
 * Follows the page scroll with one passive listener and one animation frame.
 * Layout is read once per frame. React state changes only when the published
 * visibility fields change. Resting does not reveal the controls.
 */
export function useVisibility({
  actionBarRef,
  articleEndRef,
  isEngaged,
  isFocusWithin = false,
}: VisibilityOptions): PublishedVisibility {
  const [visibility, setVisibility] = useState<PublishedVisibility>(INITIAL_VISIBILITY);
  const isEngagedRef = useRef(isEngaged);
  const isFocusWithinRef = useRef(isFocusWithin);
  const actionBarHeightRef = useRef(0);

  useEffect(() => {
    isEngagedRef.current = isEngaged;
    isFocusWithinRef.current = isFocusWithin;
  });

  useEffect(() => {
    const actionBar = actionBarRef.current;
    if (!actionBar || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      actionBarHeightRef.current = actionBar.getBoundingClientRect().height;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(actionBar);
    return () => observer.disconnect();
  }, [actionBarRef]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    let frame = 0;
    let memory: ArticleActionScrollMemory = createArticleActionScrollMemory();
    let published = INITIAL_VISIBILITY;

    const sample = () => {
      frame = 0;
      const scroller = document.scrollingElement ?? document.documentElement;
      const scrollY = scroller.scrollTop;
      const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const articleEnd = articleEndRef.current;
      const articleEndOffset = articleEnd
        ? articleEnd.getBoundingClientRect().top - window.innerHeight
        : null;
      const distances = desktopQuery.matches ? {} : ARTICLE_ACTION_MOBILE_DISTANCES;
      const next = decideArticleActionVisibility(memory, {
        actionBarHeight: actionBarHeightRef.current,
        articleEndOffset,
        config: { ...ARTICLE_ACTION_VISIBILITY_CONFIG, ...distances },
        isInteractionLocked: isEngagedRef.current || isFocusWithinRef.current,
        maxScroll,
        scrollY,
      });
      memory = next.memory;

      const candidate = publishable(next);
      if (sameVisibility(published, candidate)) return;
      published = candidate;
      setVisibility(candidate);
    };

    const requestSample = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(sample);
    };

    requestSample();
    window.addEventListener("scroll", requestSample, { passive: true });
    window.addEventListener("resize", requestSample);
    desktopQuery.addEventListener("change", requestSample);

    return () => {
      window.removeEventListener("scroll", requestSample);
      window.removeEventListener("resize", requestSample);
      desktopQuery.removeEventListener("change", requestSample);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [actionBarRef, articleEndRef]);

  return visibility;
}
