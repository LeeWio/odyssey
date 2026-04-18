"use client";

import { useQuickEditor } from "@/hooks/use-quick-editor";
import { QuickEditorModal } from "./quick-editor-modal";

export function GlobalOverlay() {
  const quickEditorState = useQuickEditor();

  return (
    <>
      <QuickEditorModal state={quickEditorState} />
      {/* Future global overlays can be added here */}
    </>
  );
}
