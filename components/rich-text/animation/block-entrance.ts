import type { Editor, EditorEvents } from "@tiptap/core";
import type { Node as DocumentNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { gsap } from "gsap";

// Layout containers stay visible. Their reading units animate independently.
const GROUPED_BLOCKS = new Set(["listItem", "taskItem", "tableRow", "blockquote", "details"]);

export function collectEntranceTargets(view: EditorView) {
  const targets: { element: HTMLElement; node: DocumentNode }[] = [];
  view.state.doc.descendants((node, position) => {
    if (!node.isBlock) return false;
    if (!node.isTextblock && !node.isAtom && !GROUPED_BLOCKS.has(node.type.name)) return;
    if (node.isTextblock && node.content.size === 0) return false;

    const element = view.nodeDOM(position);
    // An opaque NodeView may not expose its children. Never fall back to a
    // parent DOM node, which could accidentally hide the entire document.
    if (element instanceof HTMLElement) targets.push({ element, node });
    return false;
  });
  return targets;
}

interface EntranceOptions {
  duration: number;
  stagger: number;
}

export function startBlockEntrance(editor: Editor, { duration, stagger }: EntranceOptions) {
  const root = editor.view.dom;
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealed = new WeakSet<DocumentNode>();
  const revealedElements = new WeakSet<HTMLElement>();
  const records = new Map<
    HTMLElement,
    {
      node: DocumentNode;
      context: gsap.Context;
      order: number;
      playing: boolean;
    }
  >();
  let disposed = false;
  let scheduled = false;

  const finish = (element: HTMLElement) => {
    const record = records.get(element);
    if (!record) return;
    revealed.add(record.node);
    revealedElements.add(element);
    observer.unobserve(element);
    // Revert only GSAP's changes, including on detached nodes. Keep authored
    // styles such as column widths and media dimensions intact.
    record.context.revert();
    records.delete(element);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (disposed) return;
      const entering = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target as HTMLElement)
        .filter((element) => records.has(element) && !records.get(element)!.playing)
        .sort((a, b) => records.get(a)!.order - records.get(b)!.order)
        .map((element) => ({ element, y: Number(gsap.getProperty(element, "y")) || 0 }));

      entering.forEach(({ element, y }, index) => {
        const record = records.get(element)!;
        record.playing = true;
        revealed.add(record.node);
        revealedElements.add(element);
        observer.unobserve(element);
        record.context.add(() => {
          gsap.fromTo(
            element,
            { opacity: 0, y: y + 8 },
            {
              opacity: 1,
              y,
              duration: Math.max(0, duration) / 1000,
              delay: Math.min(index * Math.max(0, stagger), 240) / 1000,
              ease: "power2.out",
              onComplete: () => finish(element),
            }
          );
        });
      });
    },
    { root: null, threshold: 0 }
  );

  const scan = () => {
    if (disposed || editor.isDestroyed) return;
    const targets = collectEntranceTargets(editor.view);
    const current = new Set(targets.map(({ element }) => element));
    for (const element of records.keys()) {
      if (!current.has(element)) finish(element);
    }
    targets.forEach(({ element, node }, order) => {
      if (media.matches || editor.isEditable) {
        finish(element);
        revealed.add(node);
        revealedElements.add(element);
        return;
      }
      const existing = records.get(element);
      if (existing) {
        existing.node = node;
        existing.order = order;
        return;
      }
      if (revealed.has(node) || revealedElements.has(element)) return;
      const context = gsap.context(() => gsap.set(element, { opacity: 0 }), root);
      records.set(element, { node, context, order, playing: false });
      observer.observe(element);
    });
  };

  const scheduleScan = () => {
    if (disposed || scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      scan();
    });
  };
  const onTransaction = ({ transaction }: EditorEvents["transaction"]) => {
    if (transaction.docChanged) scheduleScan();
  };
  const onFocus = (event: FocusEvent) => {
    if (!(event.target instanceof Node)) return;
    // Keyboard navigation must never land on visually hidden content.
    for (const element of records.keys()) if (element.contains(event.target)) finish(element);
  };
  const mutations = new MutationObserver(scheduleScan);
  // React NodeViews can mount after EditorContent. Observe structure only:
  // GSAP's style changes must never trigger a scan.
  mutations.observe(root, { childList: true, subtree: true });
  media.addEventListener("change", scan);
  root.addEventListener("focusin", onFocus);
  editor.on("transaction", onTransaction);
  scan();

  return () => {
    disposed = true;
    mutations.disconnect();
    observer.disconnect();
    media.removeEventListener("change", scan);
    root.removeEventListener("focusin", onFocus);
    editor.off("transaction", onTransaction);
    for (const element of records.keys()) finish(element);
  };
}
