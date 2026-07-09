import { useState } from "react";
import { useAutosavePostMutation } from "@/lib/features/post/post-api";
import { useDebouncedCallback } from "use-debounce";
import type { JSONContent } from "@tiptap/react";
import type { RichTextEditorValueChangeDetails } from "@heroui-pro/react";
import { normalizeJSONContent } from "../utils/document-normalizer";

export function useRichTextAutosave(
  identifier: string,
  initialValue?: JSONContent,
  onChange?: (value: JSONContent, details: RichTextEditorValueChangeDetails) => void
) {
  // Guard the initialValue at mount to guarantee 100% valid state
  const [currentContent, setCurrentContent] = useState<JSONContent>(() =>
    normalizeJSONContent(initialValue)
  );

  const [currentDetails, setCurrentDetails] = useState<RichTextEditorValueChangeDetails | null>(
    null
  );

  const [
    autosavePost,
    { isLoading: isAutosaving, isSuccess: isAutosaveSuccess, isError: isAutosaveError },
  ] = useAutosavePostMutation();

  const debouncedAutosave = useDebouncedCallback((contentJSON: JSONContent) => {
    autosavePost({ identifier, content: contentJSON });
  }, 1000);

  // Core onValueChange handler accepting full Tiptap metadata details
  const handleValueChange = (nextValue: JSONContent, details: RichTextEditorValueChangeDetails) => {
    const normalized = normalizeJSONContent(nextValue);
    setCurrentContent(normalized);
    setCurrentDetails(details);
    onChange?.(normalized, details);
    debouncedAutosave(normalized);
  };

  return {
    currentContent,
    currentDetails,
    handleValueChange,
    isAutosaving,
    isAutosaveSuccess,
    isAutosaveError,
  };
}
export type RichTextAutosaveResult = ReturnType<typeof useRichTextAutosave>;
