import { isCustomNodeSelected } from "@/components/rich-text/utils/is-custom-node-selected";
import { isTextSelected } from "@/components/rich-text/utils/is-text-selected";
import { EditorState } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { Editor } from "@tiptap/react";
import { useCallback } from "react";

export interface ShouldShowProps {
  editor: Editor;
  element: HTMLElement;
  view: EditorView;
  state: EditorState;
  oldState?: EditorState;
  from: number;
  to: number;
}

export const useTextMenuStates = (editor: Editor | null) => {
  const shouldShow = useCallback(
    ({ view, from }: ShouldShowProps) => {
      if (!editor || !view || editor.view.dragging) {
        return false;
      }

      const domAtPos = view.domAtPos(from || 0).node as HTMLElement;
      const nodeDOM = view.nodeDOM(from || 0) as HTMLElement;
      const node = nodeDOM || domAtPos;

      // Avoid showing text menu when a custom node is already handled by another menu
      if (isCustomNodeSelected(editor, node)) {
        return false;
      }

      return isTextSelected({ editor });
    },
    [editor]
  );

  return {
    shouldShow,
  };
};
