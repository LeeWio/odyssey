"use client";

import { useRichTextEditor } from "@heroui-pro/react/rich-text-editor";
import { toast } from "@heroui/react";
import type { EditorEvents } from "@tiptap/core";
import { useEffect, useState } from "react";
import { TABLE_PASTE_REJECTED, type TablePasteFailure } from "../../extensions/table/clipboard";
import {
  TABLE_ACTION_STATUS,
  tablePasteFailureMessage,
  tableSelectionStatus,
} from "../../extensions/table/feedback";

/** Editor-owned feedback: pure table plugins never import a UI library. */
export function TableFeedback() {
  const { editor } = useRichTextEditor();
  const [feedback, setFeedback] = useState({ text: "", rejected: false });
  useEffect(() => {
    if (!editor) return;
    let previousSelection = tableSelectionStatus(editor.state);
    let previousRejection = "";
    const publish = (text: string, rejected: boolean) =>
      setFeedback((current) =>
        current.text === text && current.rejected === rejected ? current : { text, rejected }
      );
    const update = ({ transaction }: EditorEvents["transaction"]) => {
      const rejection = transaction.getMeta(TABLE_PASTE_REJECTED) as TablePasteFailure | undefined;
      const action = transaction.getMeta(TABLE_ACTION_STATUS) as string | undefined;
      const selected = tableSelectionStatus(editor.state);
      if (rejection) {
        const text = tablePasteFailureMessage(rejection);
        publish(text, true);
        if (text !== previousRejection) toast.warning(text);
        previousRejection = text;
      } else if (action) publish(action, false);
      else if (selected !== previousSelection || transaction.docChanged) {
        setFeedback((current) =>
          current.rejected && !transaction.docChanged
            ? current
            : current.text === selected && !current.rejected
              ? current
              : { text: selected, rejected: false }
        );
      }
      if (transaction.docChanged) previousRejection = "";
      previousSelection = selected;
    };
    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);
  return (
    <p
      role="status"
      aria-label="Table status"
      aria-live="polite"
      aria-atomic="true"
      className={feedback.rejected ? "text-muted px-3 py-2 text-sm" : "sr-only"}
    >
      {feedback.text}
    </p>
  );
}
