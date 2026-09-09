import { useRichTextEditorState } from "@heroui-pro/react/rich-text-editor";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { useState } from "react";

interface ActiveBlock {
  node: ProseMirrorNode;
  position: number;
}

const EMPTY_SIBLING_AVAILABILITY = { canMoveDown: false, canMoveUp: false };

function getSiblingAvailability(activeBlock: ActiveBlock | null, document: ProseMirrorNode) {
  if (!activeBlock) return EMPTY_SIBLING_AVAILABILITY;

  try {
    const resolvedPosition = document.resolve(activeBlock.position);
    const index = resolvedPosition.index();

    return {
      canMoveDown: index < resolvedPosition.parent.childCount - 1,
      canMoveUp: index > 0,
    };
  } catch {
    return EMPTY_SIBLING_AVAILABILITY;
  }
}

export const useContentItemState = () => {
  const [activeBlock, setActiveBlock] = useState<ActiveBlock | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const siblingAvailability =
    useRichTextEditorState(
      ({ editor }) => getSiblingAvailability(activeBlock, editor.state.doc),
      (previous, next) =>
        previous?.canMoveDown === next?.canMoveDown && previous?.canMoveUp === next?.canMoveUp
    ) ?? EMPTY_SIBLING_AVAILABILITY;

  return {
    activeBlock,
    setActiveBlock,
    isMenuOpen,
    setIsMenuOpen,
    siblingAvailability,
  };
};
