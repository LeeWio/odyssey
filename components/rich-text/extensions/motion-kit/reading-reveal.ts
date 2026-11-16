import { Extension } from "@tiptap/core";
import type { Node as DocumentNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

/** The next reading unit starts this long after the previous one has started. */
const GAP_MS = 70;
const TEXT_DURATION_MS = 560;
const IMAGE_DURATION_MS = 640;

const TEXT_CLASS = "reading-reveal-text";
const IMAGE_CLASS = "reading-reveal-image";
const PENDING_CLASS = "reading-reveal-pending";

/**
 * Containers stay still. Their reading units reveal independently so a list
 * and its items do not fade as one slab.
 */
const GROUPED_BLOCKS = new Set(["listItem", "taskItem", "tableRow", "blockquote", "details"]);

interface RevealTarget {
  pos: number;
  node: DocumentNode;
  element: HTMLElement;
  image: boolean;
}

export const readingRevealKey = new PluginKey("readingReveal");

function isImage(node: DocumentNode) {
  return node.type.name === "image";
}

export function collectRevealTargets(view: EditorView): RevealTarget[] {
  const targets: RevealTarget[] = [];
  view.state.doc.descendants((node, pos) => {
    if (!node.isBlock) return false;
    if (!node.isTextblock && !node.isAtom && !GROUPED_BLOCKS.has(node.type.name)) return;
    if (node.isTextblock && node.content.size === 0) return false;

    const element = view.nodeDOM(pos);
    if (!(element instanceof HTMLElement)) return false;
    // A laid-out document can contain zero-height nodes. They intersect the
    // whole page and would steal a stagger slot. jsdom has no layout.
    const rootHeight = view.dom.getBoundingClientRect().height;
    if (rootHeight > 0 && element.getBoundingClientRect().height === 0) return false;
    targets.push({ pos, node, element: revealElement(element), image: isImage(node) });
    return false;
  });
  return targets;
}

/** Node views can use `display: contents`, which leaves the wrapper unpositioned. */
function revealElement(element: HTMLElement) {
  const content = element.querySelector("[data-node-view-content-react]");
  return content instanceof HTMLElement ? content : element;
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Cinematic reveal for the read-only article body. Classes are written on the
 * block DOM because the reader suppresses decoration redraws. Off-screen
 * Unplayed blocks stay in their layout but are not shown until their turn.
 * A played element never plays again.
 */
export const MotionKit = Extension.create({
  name: "motionKit",

  addProseMirrorPlugins() {
    const editor = this.editor;
    const played = new WeakSet<HTMLElement>();
    let lastStartedAt = 0;
    let frame = 0;
    let loopStarted = false;
    const cleanups = new Set<ReturnType<typeof setTimeout>>();
    let media: MediaQueryList | null = null;
    let currentView: EditorView | null = null;

    const clearPlaying = (element: HTMLElement) => {
      element.classList.remove(TEXT_CLASS, IMAGE_CLASS, PENDING_CLASS);
    };

    const markPending = (view: EditorView) => {
      if (reducedMotion()) return;
      for (const target of collectRevealTargets(view)) {
        if (played.has(target.element) || target.element.classList.contains(TEXT_CLASS)) continue;
        if (target.element.classList.contains(IMAGE_CLASS)) continue;
        target.element.classList.add(PENDING_CLASS);
      }
    };

    const inZone = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      if (rect.height === 0) return rect.width === 0;
      return rect.top < window.innerHeight + 80 && rect.bottom > 0;
    };

    const startNext = (view: EditorView) => {
      const now = performance.now();
      if (lastStartedAt !== 0 && now - lastStartedAt < GAP_MS) return;
      const next = collectRevealTargets(view).find(
        (target) => !played.has(target.element) && inZone(target.element)
      );
      if (!next) return;
      played.add(next.element);
      lastStartedAt = now;
      next.element.classList.remove(PENDING_CLASS);
      next.element.classList.add(next.image ? IMAGE_CLASS : TEXT_CLASS);
      const cleanup = setTimeout(
        () => {
          cleanups.delete(cleanup);
          clearPlaying(next.element);
        },
        (next.image ? IMAGE_DURATION_MS : TEXT_DURATION_MS) + 40
      );
      cleanups.add(cleanup);
    };

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const view = currentView;
      if (!view || view.isDestroyed || editor.isEditable || reducedMotion()) return;
      markPending(view);
      const now = performance.now();
      const due = lastStartedAt === 0 ? 1 : Math.floor((now - lastStartedAt) / GAP_MS);
      for (let step = 0; step < due; step += 1) startNext(view);
    };

    return [
      new Plugin({
        key: readingRevealKey,
        view(view) {
          currentView = view;
          media = window.matchMedia("(prefers-reduced-motion: reduce)");
          const onMotion = () => {
            if (!reducedMotion()) return;
            for (const element of view.dom.querySelectorAll(
              `.${TEXT_CLASS}, .${IMAGE_CLASS}, .${PENDING_CLASS}`
            )) {
              if (element instanceof HTMLElement) clearPlaying(element);
            }
          };
          media.addEventListener("change", onMotion);
          if (!loopStarted) {
            loopStarted = true;
            frame = requestAnimationFrame(tick);
          }
          const onScroll = () => {
            const active = currentView;
            if (!active || active.isDestroyed) return;
            const now = performance.now();
            const due = lastStartedAt === 0 ? 1 : Math.floor((now - lastStartedAt) / GAP_MS);
            for (let step = 0; step < due; step += 1) startNext(active);
          };
          document.addEventListener("scroll", onScroll, { capture: true, passive: true });

          return {
            update(next) {
              currentView = next;
            },
            destroy() {
              currentView = null;
              loopStarted = false;
              cancelAnimationFrame(frame);
              document.removeEventListener("scroll", onScroll, { capture: true });
              media?.removeEventListener("change", onMotion);
              for (const cleanup of cleanups) clearTimeout(cleanup);
              cleanups.clear();
            },
          };
        },
      }),
    ];
  },
});
