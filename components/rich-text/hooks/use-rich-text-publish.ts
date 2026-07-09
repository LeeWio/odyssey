import { useState } from "react";
import {
  useCreatePostMutation,
  useUpdatePostMutation,
  type PostStatus,
} from "@/lib/features/post/post-api";
import { useGetCategoriesQuery } from "@/lib/features/category/category-api";
import { useGetAllTagsQuery } from "@/lib/features/tag/tag-api";
import { useAppDispatch } from "@/lib/hooks";
import { setDraftIdentifier, toggleRichText } from "@/lib/features/ui/ui-slice";
import { toast } from "@heroui/react";
import type { JSONContent } from "@tiptap/react";
import { findFirstHeading, generateSlug, extractText } from "../utils/content-extractors";
import { normalizeJSONContent } from "../utils/document-normalizer";

export function useRichTextPublish(identifier: string, currentContent: JSONContent | undefined) {
  const dispatch = useAppDispatch();

  // Settings & Forms state
  const [showSettings, setShowSettings] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<PostStatus>("PUBLISHED");

  // Query categories & tags
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: tags = [] } = useGetAllTagsQuery();

  // Mutations
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const isPublishing = isCreating || isUpdating;

  // Sync title changes to slug (only if slug was empty or automatically generated)
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugManuallyEdited) {
      setSlug(generateSlug(val));
    }
  };

  // Extract metadata when opening Publish Settings
  const handleOpenPublish = () => {
    if (currentContent) {
      if (!title) {
        const extractedTitle = findFirstHeading(currentContent);
        if (extractedTitle) {
          setTitle(extractedTitle);
          if (!slug) {
            setSlug(generateSlug(extractedTitle));
          }
        }
      }
      if (!summary) {
        const text = extractText(currentContent);
        if (text) {
          setSummary(text.substring(0, 150).trim() + (text.length > 150 ? "..." : ""));
        }
      }
    }
    setShowSettings(true);
  };

  // Handle confirm & publish submit
  const handlePublishSubmit = async () => {
    if (!title.trim()) {
      toast.danger("Title is required");
      return;
    }
    if (!slug.trim()) {
      toast.danger("Slug is required");
      return;
    }

    const postContentString = JSON.stringify(normalizeJSONContent(currentContent));
    const isNewPost = isNaN(Number(identifier));

    const body = {
      title,
      slug,
      coverImage: coverImage.trim() || undefined,
      summary: summary.trim() || undefined,
      content: postContentString,
      status,
      categoryId: categoryId ? Number(categoryId) : undefined,
      tagIds: tagIds.length > 0 ? tagIds.map(Number) : undefined,
    };

    try {
      if (isNewPost) {
        await createPost(body).unwrap();
      } else {
        await updatePost({ id: Number(identifier), body }).unwrap();
      }

      dispatch(setDraftIdentifier(null));
      dispatch(toggleRichText());
    } catch {
      // Handled globally by transformError
    }
  };

  return {
    showSettings,
    setShowSettings,
    title,
    setTitle,
    slug,
    setSlug,
    categoryId,
    setCategoryId,
    tagIds,
    setTagIds,
    coverImage,
    setCoverImage,
    summary,
    setSummary,
    status,
    setStatus,
    categories,
    tags,
    isPublishing,
    isSlugManuallyEdited,
    setIsSlugManuallyEdited,
    handleTitleChange,
    handleOpenPublish,
    handlePublishSubmit,
  };
}
export type RichTextPublishResult = ReturnType<typeof useRichTextPublish>;
