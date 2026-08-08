import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode, ResolvedPos } from "@tiptap/pm/model";
import type { Selection, Transaction } from "@tiptap/pm/state";

export interface BlockFormatTransitionOptions {
  duration: number;
  easing: string;
}

interface BlockFormatTransitionStorage {
  activeAnimations: Set<Animation>;
  animationsByElement: WeakMap<HTMLElement, Animation>;
}

interface TypographySnapshot {
  fontSize: string;
  fontWeight: string;
  letterSpacing: string;
  lineHeight: string;
}

interface BlockTransition {
  expectedFormat: string;
  from: TypographySnapshot;
  nextPosition: number;
}

function getFormatSignature(node: ProseMirrorNode | null): string | null {
  if (!node) return null;

  if (node.type.name === "paragraph") return "paragraph";
  if (node.type.name === "heading") return `heading-${String(node.attrs.level)}`;

  return null;
}

function getNearestTextblockPosition(position: ResolvedPos): number | null {
  for (let depth = position.depth; depth > 0; depth -= 1) {
    if (position.node(depth).isTextblock) {
      return position.before(depth);
    }
  }

  return null;
}

function getSelectedTextblockPositions(document: ProseMirrorNode, selection: Selection): number[] {
  const positions = new Set<number>();
  const nearestPosition = getNearestTextblockPosition(selection.$from);

  if (nearestPosition !== null) {
    positions.add(nearestPosition);
  }

  if (!selection.empty) {
    document.nodesBetween(selection.from, selection.to, (node, position) => {
      if (node.isTextblock) {
        positions.add(position);
      }
    });
  }

  return [...positions];
}

function normalizeLetterSpacing(value: string): string {
  return value === "normal" ? "0px" : value;
}

function isHTMLElement(node: Node | null): node is HTMLElement {
  return node !== null && node.nodeType === 1;
}

function readTypography(element: HTMLElement, editorWindow: Window): TypographySnapshot {
  const style = editorWindow.getComputedStyle(element);

  return {
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    letterSpacing: normalizeLetterSpacing(style.letterSpacing),
    lineHeight: style.lineHeight,
  };
}

function shouldReduceMotion(editorWindow: Window): boolean {
  return editorWindow.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function toKeyframe(snapshot: TypographySnapshot): Keyframe {
  return {
    fontSize: snapshot.fontSize,
    fontWeight: snapshot.fontWeight,
    letterSpacing: snapshot.letterSpacing,
    lineHeight: snapshot.lineHeight,
  };
}

function collectBlockTransitions(
  transaction: Transaction,
  previousSelection: Selection,
  editorElementAt: (position: number) => Node | null,
  editorWindow: Window
): BlockTransition[] {
  return getSelectedTextblockPositions(transaction.before, previousSelection)
    .map((position): BlockTransition | null => {
      const nextPosition = transaction.mapping.map(position, -1);
      const previousNode = transaction.before.nodeAt(position);
      const nextNode = transaction.doc.nodeAt(nextPosition);
      const previousFormat = getFormatSignature(previousNode);
      const nextFormat = getFormatSignature(nextNode);

      if (!previousFormat || !nextFormat || previousFormat === nextFormat) {
        return null;
      }

      const element = editorElementAt(position);

      if (!isHTMLElement(element)) {
        return null;
      }

      return {
        expectedFormat: nextFormat,
        from: readTypography(element, editorWindow),
        nextPosition,
      };
    })
    .filter((transition): transition is BlockTransition => transition !== null);
}

export const BlockFormatTransition = Extension.create<
  BlockFormatTransitionOptions,
  BlockFormatTransitionStorage
>({
  name: "blockFormatTransition",
  priority: 1000,

  addOptions() {
    return {
      duration: 200,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    };
  },

  addStorage() {
    return {
      activeAnimations: new Set<Animation>(),
      animationsByElement: new WeakMap<HTMLElement, Animation>(),
    };
  },

  dispatchTransaction({ transaction, next }) {
    const editorDocument = this.editor.view.dom.ownerDocument;
    const editorWindow = editorDocument.defaultView;

    if (
      !transaction.docChanged ||
      !editorWindow ||
      shouldReduceMotion(editorWindow) ||
      editorDocument.visibilityState === "hidden"
    ) {
      next(transaction);
      return;
    }

    const transitions = collectBlockTransitions(
      transaction,
      this.editor.state.selection,
      (position) => this.editor.view.nodeDOM(position),
      editorWindow
    );

    next(transaction);

    transitions.forEach(({ expectedFormat, from, nextPosition }) => {
      const nextElement = this.editor.view.nodeDOM(nextPosition);
      const nextNode = this.editor.state.doc.nodeAt(nextPosition);

      if (!isHTMLElement(nextElement) || getFormatSignature(nextNode) !== expectedFormat) {
        return;
      }

      const to = readTypography(nextElement, editorWindow);
      const previousAnimation = this.storage.animationsByElement.get(nextElement);

      previousAnimation?.cancel();

      const animation = nextElement.animate([toKeyframe(from), toKeyframe(to)], {
        duration: this.options.duration,
        easing: this.options.easing,
      });

      this.storage.activeAnimations.add(animation);
      this.storage.animationsByElement.set(nextElement, animation);

      const cleanup = () => {
        this.storage.activeAnimations.delete(animation);

        if (this.storage.animationsByElement.get(nextElement) === animation) {
          this.storage.animationsByElement.delete(nextElement);
        }
      };

      animation.addEventListener("finish", cleanup, { once: true });
      animation.addEventListener("cancel", cleanup, { once: true });
    });
  },

  onDestroy() {
    this.storage.activeAnimations.forEach((animation) => animation.cancel());
    this.storage.activeAnimations.clear();
  },
});

export default BlockFormatTransition;
