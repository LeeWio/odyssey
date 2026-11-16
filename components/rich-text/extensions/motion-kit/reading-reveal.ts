import { Decoration, Extension } from "@tiptap/core";
import type { Node as DocumentNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

/** The next reading unit starts this long after the previous one has started. */
export const REVEAL_GAP_MS = 90;
const LEAD_PX = 80;

const TEXT_CLASS = "reading-reveal-text";
const IMAGE_CLASS = "reading-reveal-image";
const PENDING_CLASS = "reading-reveal-pending";

/**
 * Containers stay still. Their reading units reveal independently so a list
 * and its items do not fade as one slab.
 */
const GROUPED_BLOCKS = new Set(["listItem", "taskItem", "tableRow", "blockquote", "details"]);

type RevealPhase = "pending" | "playing" | "done";

interface RevealUnit {
  pos: number;
  image: boolean;
  phase: RevealPhase;
  element: HTMLElement | null;
}

interface MotionStorage {
  units: RevealUnit[];
  cursor: number;
  enabled: boolean;
}

declare module "@tiptap/core" {
  interface Storage {
    motionKit: MotionStorage;
  }
}

function isImage(node: DocumentNode) {
  return node.type.name === "image";
}

export function collectRevealTargets(view: EditorView): RevealUnit[] {
  const units: RevealUnit[] = [];
  view.state.doc.descendants((node, pos) => {
    if (!node.isBlock) return false;
    if (!node.isTextblock && !node.isAtom && !GROUPED_BLOCKS.has(node.type.name)) return;
    if (node.isTextblock && node.content.size === 0) return false;
    const element = view.nodeDOM(pos);
    if (element instanceof HTMLElement) {
      const rect = element.getBoundingClientRect();
      if (rect.height === 0 && rect.width > 0) return false;
    }
    units.push({
      pos,
      image: isImage(node),
      phase: "pending",
      element: element instanceof HTMLElement ? element : null,
    });
    return false;
  });
  return units;
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function revealClass(unit: RevealUnit) {
  if (unit.phase === "done") return null;
  if (unit.phase === "pending") return PENDING_CLASS;
  return unit.image ? IMAGE_CLASS : TEXT_CLASS;
}

function laidOut(rect: DOMRect) {
  return rect.width > 0 && rect.height > 0;
}

function unitElement(view: EditorView, unit: RevealUnit) {
  if (unit.element?.isConnected) return unit.element;
  const element = view.nodeDOM(unit.pos);
  unit.element = element instanceof HTMLElement ? element : null;
  return unit.element;
}

/**
 * Read-only cinematic reveal. `manual` decorations keep the sequence out of
 * the document. `updateDecorations()` is the supported refresh for external
 * state; a custom decoration transaction drops pending classes in this reader.
 */
export const MotionKit = Extension.create<Record<string, never>, MotionStorage>({
  name: "motionKit",

  addStorage() {
    return { units: [], cursor: 0, enabled: false };
  },

  addDecorations() {
    return {
      update: "manual",
      create: ({ editor, state }) => {
        const storage = editor.storage.motionKit;
        if (!storage.enabled) return [];
        const decorations = [];
        for (const unit of storage.units) {
          const node = state.doc.nodeAt(unit.pos);
          const className = revealClass(unit);
          if (!node || !className) continue;
          decorations.push(
            Decoration.Node(unit.pos, unit.pos + node.nodeSize, { class: className })
          );
        }
        return decorations;
      },
    };
  },

  onCreate() {
    const storage = this.storage;
    const editor = this.editor;
    let observer: IntersectionObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let frame = 0;
    let media: MediaQueryList | null = null;
    let playing = 0;

    const rebuild = () => {
      if (!editor.isDestroyed) editor.commands.updateDecorations("motionKit");
    };

    const finish = (unit: RevealUnit, view: EditorView) => {
      const element = unitElement(view, unit);
      if (!(element instanceof HTMLElement)) {
        unit.phase = "done";
        playing = Math.max(0, playing - 1);
        return;
      }
      element.addEventListener(
        "animationend",
        (event) => {
          if (event.target !== element) return;
          unit.phase = "done";
          playing = Math.max(0, playing - 1);
        },
        { once: true }
      );
    };

    const begin = (view: EditorView, unit: RevealUnit) => {
      playing += 1;
      unit.phase = "playing";
      storage.cursor += 1;
      rebuild();
      finish(unit, view);
      arm(view);
    };

    const currentView = () => {
      const view = editor.view;
      return view && !view.isDestroyed && view.dom.isConnected ? view : null;
    };

    const arm = (requested: EditorView) => {
      const view = currentView() ?? requested;
      if (!storage.enabled || view.isDestroyed || !view.dom.isConnected || timer !== null) return;
      let skipped = false;
      while (storage.cursor < storage.units.length) {
        const next = storage.units[storage.cursor];
        if (!next || next.phase !== "pending") {
          storage.cursor += 1;
          continue;
        }
        const element = unitElement(view, next);
        if (!element) return;
        const rect = element.getBoundingClientRect();
        if (laidOut(rect) && rect.bottom < 0) {
          next.phase = "done";
          storage.cursor += 1;
          skipped = true;
          continue;
        }
        const near = !laidOut(rect) || (rect.top < window.innerHeight + LEAD_PX && rect.bottom > 0);
        if (laidOut(rect) && !near) break;
        const caughtUp = laidOut(rect) && rect.top < 0 && rect.bottom > 0;
        if (playing === 0 || caughtUp) {
          begin(view, next);
          continue;
        }
        timer = setTimeout(() => {
          timer = null;
          const current = currentView();
          if (!current) return;
          begin(current, next);
        }, REVEAL_GAP_MS);
        break;
      }
      if (skipped) rebuild();
      watch(view);
    };

    const watch = (view: EditorView) => {
      if (!observer) return;
      observer.disconnect();
      const next = storage.units[storage.cursor];
      if (!next) return;
      const element = unitElement(view, next);
      if (element) observer.observe(element);
    };

    const bind = (view: EditorView) => {
      const shouldReveal = !editor.isEditable && !reducedMotion();
      if (storage.enabled && shouldReveal && storage.units.length > 0) return;
      observer?.disconnect();
      if (timer !== null) clearTimeout(timer);
      timer = null;
      storage.cursor = 0;
      playing = 0;
      storage.enabled = shouldReveal;
      storage.units = storage.enabled ? collectRevealTargets(view) : [];
      rebuild();
      if (!storage.enabled || typeof IntersectionObserver === "undefined") return;
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.length > 0 && entries.every((entry) => entry.isIntersecting === false)) {
            return;
          }
          const view = currentView();
          if (view) arm(view);
        },
        { root: null, rootMargin: `${LEAD_PX}px 0px`, threshold: 0 }
      );
      arm(view);
    };

    editor.on("update", ({ editor: current }) => {
      if (!current.isDestroyed && current.view.dom.isConnected) bind(current.view);
    });
    editor.on("destroy", () => {
      observer?.disconnect();
      if (timer !== null) clearTimeout(timer);
      if (frame !== 0) cancelAnimationFrame(frame);
      media?.removeEventListener("change", onMotion);
      document.removeEventListener("scroll", onScroll, { capture: true });
      storage.enabled = false;
    });

    const onMotion = () => {
      const view = currentView();
      if (view) bind(view);
    };
    const scheduleArm = () => {
      if (frame !== 0 || !storage.enabled) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const view = currentView();
        if (view) arm(view);
      });
    };
    const onScroll = () => {
      scheduleArm();
    };
    media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", onMotion);
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    if (!editor.isDestroyed && editor.view?.dom.isConnected) bind(editor.view);
    setTimeout(() => {
      if (!editor.isDestroyed && editor.view?.dom.isConnected) bind(editor.view);
    }, 0);
  },
});
