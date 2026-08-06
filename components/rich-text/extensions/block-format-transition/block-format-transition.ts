import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode, ResolvedPos } from "@tiptap/pm/model";
import type { Selection, Transaction } from "@tiptap/pm/state";

const ANIMATION_DURATION_MS = 200;
const ANIMATION_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

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

function readTypography(element: HTMLElement): TypographySnapshot {
  const style = getComputedStyle(element);

  return {
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    letterSpacing: normalizeLetterSpacing(style.letterSpacing),
    lineHeight: style.lineHeight,
  };
}

function shouldReduceMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  editorElementAt: (position: number) => Node | null
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

      if (!(element instanceof HTMLElement)) {
        return null;
      }

      return {
        expectedFormat: nextFormat,
        from: readTypography(element),
        nextPosition,
      };
    })
    .filter((transition): transition is BlockTransition => transition !== null);
}

export const BlockFormatTransition = Extension.create({
  name: "blockFormatTransition",
  priority: 1000,

  dispatchTransaction({ transaction, next }) {
    if (
      typeof window === "undefined" ||
      shouldReduceMotion() ||
      document.visibilityState === "hidden"
    ) {
      next(transaction);
      return;
    }

    const transitions = collectBlockTransitions(
      transaction,
      this.editor.state.selection,
      (position) => this.editor.view.nodeDOM(position)
    );

    next(transaction);

    transitions.forEach(({ expectedFormat, from, nextPosition }) => {
      const nextElement = this.editor.view.nodeDOM(nextPosition);
      const nextNode = this.editor.state.doc.nodeAt(nextPosition);

      if (
        !(nextElement instanceof HTMLElement) ||
        getFormatSignature(nextNode) !== expectedFormat
      ) {
        return;
      }

      const to = readTypography(nextElement);

      nextElement.getAnimations().forEach((animation) => animation.cancel());
      nextElement.animate([toKeyframe(from), toKeyframe(to)], {
        duration: ANIMATION_DURATION_MS,
        easing: ANIMATION_EASING,
      });
    });
  },
});

export default BlockFormatTransition;
