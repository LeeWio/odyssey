import { useRichTextEditor } from "@heroui-pro/react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { useMemo, useState } from "react";

interface ActiveBlock {
  node: ProseMirrorNode;
  position: number;
}

function getSiblingAvailability(activeBlock: ActiveBlock | null, document: ProseMirrorNode) {
  if (!activeBlock) {
    return { canMoveDown: false, canMoveUp: false };
  }

  const resolvedPosition = document.resolve(activeBlock.position);
  const index = resolvedPosition.index();

  return {
    canMoveDown: index < resolvedPosition.parent.childCount - 1,
    canMoveUp: index > 0,
  };
}

export const useContentItemState = () => {
  const { editor } = useRichTextEditor();
  const [activeBlock, setActiveBlock] = useState<ActiveBlock | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const siblingAvailability = useMemo(
    () =>
      editor
        ? getSiblingAvailability(activeBlock, editor.state.doc)
        : { canMoveDown: false, canMoveUp: false },
    [activeBlock, editor]
  );

  return {
    activeBlock,
    setActiveBlock,
    isMenuOpen,
    setIsMenuOpen,
    siblingAvailability,
  };
};
