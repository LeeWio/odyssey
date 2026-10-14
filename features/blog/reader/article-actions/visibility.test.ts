import { describe, expect, it } from "vitest";

import {
  ARTICLE_ACTION_VISIBILITY_CONFIG,
  createArticleActionScrollMemory,
  decideArticleActionVisibility,
  type ArticleActionSample,
  type ArticleActionScrollMemory,
} from "./visibility";

const config = ARTICLE_ACTION_VISIBILITY_CONFIG;

function sample(overrides: Partial<ArticleActionSample> = {}): ArticleActionSample {
  return {
    actionBarHeight: 48,
    articleEndOffset: 800,
    isInteractionLocked: false,
    maxScroll: 2000,
    scrollY: 400,
    ...overrides,
  };
}

function read(memory: ArticleActionScrollMemory, overrides: Partial<ArticleActionSample> = {}) {
  return decideArticleActionVisibility(memory, sample(overrides));
}

describe("article action visibility", () => {
  it("shows the initial state at the top", () => {
    const state = read(createArticleActionScrollMemory(), { scrollY: 0 });

    expect(state).toMatchObject({
      isOpen: true,
      zone: "top",
      progress: 0,
      isInteractionLocked: false,
    });
  });

  it("keeps the current state for a short downward move", () => {
    const state = read({ ...createArticleActionScrollMemory(), scrollY: 400 }, { scrollY: 420 });

    expect(state.isOpen).toBe(true);
    expect(state.memory.distance).toBe(20);
  });

  it("hides after the downward distance accumulates", () => {
    const reading = { ...createArticleActionScrollMemory(), scrollY: 400 };
    const started = read(reading, { scrollY: 440 });
    const state = read(started.memory, { scrollY: 440 + config.hideDistance });

    expect(state).toMatchObject({ isOpen: false, zone: "reading", direction: "idle" });
  });

  it("stays hidden when downward reading stops", () => {
    const hidden = read(
      { ...createArticleActionScrollMemory(), visibility: "hidden" },
      { scrollY: 500 }
    );

    expect(hidden.isOpen).toBe(false);
    expect(hidden.memory.visibility).toBe("hidden");
  });

  it("keeps a hidden bar through a short upward correction", () => {
    const hidden = {
      ...createArticleActionScrollMemory(),
      scrollY: 500,
      visibility: "hidden" as const,
    };
    const state = read(hidden, { scrollY: 500 - 20 });

    expect(state.isOpen).toBe(false);
    expect(state.direction).toBe("up");
  });

  it("returns after the upward distance accumulates", () => {
    const hidden = {
      ...createArticleActionScrollMemory(),
      scrollY: 700,
      visibility: "hidden" as const,
    };
    const started = read(hidden, { scrollY: 700 - 20 });
    const state = read(started.memory, { scrollY: 700 - 20 - config.showDistance });

    expect(state).toMatchObject({ isOpen: true, direction: "idle" });
  });

  it("hides when the article ending enters the control clearance", () => {
    const state = read(createArticleActionScrollMemory(), { articleEndOffset: 40, scrollY: 1800 });

    expect(state).toMatchObject({ isOpen: false, zone: "near-end" });
  });

  it("keeps the controls available at the ending while an interaction is locked", () => {
    const state = read(createArticleActionScrollMemory(), {
      articleEndOffset: 20,
      isInteractionLocked: true,
      scrollY: 1900,
    });

    expect(state).toMatchObject({
      isOpen: true,
      zone: "near-end",
      isInteractionLocked: true,
      direction: "idle",
    });
    expect(state.memory.distance).toBe(0);
  });

  it("hides again at the ending after the interaction unlocks", () => {
    const locked = read(createArticleActionScrollMemory(), {
      articleEndOffset: 20,
      isInteractionLocked: true,
      scrollY: 1900,
    });
    const state = read(locked.memory, { articleEndOffset: 20, scrollY: 1900 });

    expect(state).toMatchObject({ isOpen: false, zone: "near-end", isInteractionLocked: false });
  });

  it("shows again at the top after an interaction unlocks", () => {
    const locked = read(createArticleActionScrollMemory(), {
      isInteractionLocked: true,
      scrollY: 0,
    });
    const state = read(locked.memory, { scrollY: 0 });

    expect(state).toMatchObject({ isOpen: true, zone: "top" });
  });

  it("locks the controls open while focus remains inside them", () => {
    const state = read(
      { ...createArticleActionScrollMemory(), visibility: "hidden" },
      { isInteractionLocked: true, scrollY: 640 }
    );

    expect(state).toMatchObject({ isOpen: true, isInteractionLocked: true });
  });

  it("shows a short article with no progress", () => {
    const state = read(createArticleActionScrollMemory(), { maxScroll: 0, scrollY: 0 });

    expect(state).toMatchObject({ isOpen: true, progress: 0, zone: "top" });
  });

  it("resets the opposite distance when the direction reverses", () => {
    const downward = read({ ...createArticleActionScrollMemory(), scrollY: 400 }, { scrollY: 430 });
    const reversed = read(downward.memory, { scrollY: 418 });

    expect(reversed.memory).toMatchObject({ direction: "up", distance: 12 });
  });
});
