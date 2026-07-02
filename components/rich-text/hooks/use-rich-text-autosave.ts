import { useState } from "react";
import { useAutosavePostMutation } from "@/lib/features/post/post-api";
import { useDebouncedCallback } from "use-debounce";
import type { JSONContent } from "@tiptap/react";

export function useRichTextAutosave(
  identifier: string,
  initialValue?: JSONContent,
  onChange?: (value: JSONContent) => void
) {
  const [currentContent, setCurrentContent] = useState<JSONContent | undefined>(initialValue);

  const [
    autosavePost,
    { isLoading: isAutosaving, isSuccess: isAutosaveSuccess, isError: isAutosaveError },
  ] = useAutosavePostMutation();

  const debouncedAutosave = useDebouncedCallback((contentJSON: JSONContent) => {
    autosavePost({ identifier, content: contentJSON });
  }, 1000);

  const handleValueChange = (nextValue: JSONContent) => {
    setCurrentContent(nextValue);
    onChange?.(nextValue);
    debouncedAutosave(nextValue);
  };

  return {
    currentContent,
    handleValueChange,
    isAutosaving,
    isAutosaveSuccess,
    isAutosaveError,
  };
}
export type RichTextAutosaveResult = ReturnType<typeof useRichTextAutosave>;
