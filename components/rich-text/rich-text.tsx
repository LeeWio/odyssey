"use client";

import { useState, useRef } from "react";
import {
  useAutosavePostMutation,
  useCreatePostMutation,
  useUpdatePostMutation,
  type PostStatus,
} from "@/lib/features/post/post-api";
import { useGetCategoriesQuery } from "@/lib/features/category/category-api";
import { useGetAllTagsQuery } from "@/lib/features/tag/tag-api";
import { useAppDispatch } from "@/lib/hooks";
import { setDraftIdentifier, toggleRichText } from "@/lib/features/ui/ui-slice";
import { RichTextEditor } from "@heroui-pro/react";
import {
  Button,
  Modal,
  TextField,
  Label,
  Input,
  TextArea,
  Select,
  ListBox,
  toast,
  Spinner,
  Tooltip,
  Form,
} from "@heroui/react";
import type { JSONContent } from "@tiptap/react";
import { useDebouncedCallback } from "use-debounce";
import { TextMenu } from "./menus/text-menu/text-menu";
import { ExtensionKit } from "./extensions/extension-kit";
import { FixedToolbar } from "./toolbar/fixed-toolbar";
import { SuggestionToolbar } from "./toolbar/suggestion-toolbar";
import { LinkMenu } from "./menus/link-menu/link-menu";
import { Icon } from "@iconify/react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

// Register useGSAP plugin for React animation
gsap.registerPlugin(useGSAP);

interface RichTextProps {
  identifier: string;
  initialValue?: JSONContent;
  onChange?: (value: JSONContent) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

/**
 * Helper to extract the first heading or paragraph text from Tiptap JSON content as a default Title
 */
const findFirstHeading = (json: JSONContent): string => {
  if (!json.content) return "";
  for (const node of json.content) {
    if (node.type === "heading" && node.content && node.content[0]?.text) {
      return node.content[0].text;
    }
  }
  for (const node of json.content) {
    if (node.type === "paragraph" && node.content && node.content[0]?.text) {
      return node.content[0].text;
    }
  }
  return "";
};

/**
 * Helper to generate URL slug from title string
 */
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
};

/**
 * Helper to extract full text content from Tiptap JSON
 */
const extractText = (json: JSONContent): string => {
  if (!json.content) return "";
  let text = "";
  const traverse = (node: JSONContent) => {
    if (node.text) {
      text += node.text + " ";
    }
    if (node.content) {
      node.content.forEach(traverse);
    }
  };
  json.content.forEach(traverse);
  return text.trim();
};

export function RichText({
  identifier,
  initialValue,
  onChange,
  isFullscreen = false,
  onToggleFullscreen,
}: RichTextProps) {
  const dispatch = useAppDispatch();

  // 1. Editor state & Debounced Autosave
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

  // 2. Publish Settings & Forms state
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

  // Mutation for post publishing
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

  // 3. Magical layout split animation using GSAP
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLFormElement>(null);

  useGSAP(
    () => {
      if (showSettings) {
        const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.5 } });

        tl.to(settingsRef.current, {
          width: 440,
          autoAlpha: 1,
        }).fromTo(
          ".publish-form-field",
          { x: 20, opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.05, duration: 0.4 },
          "-=0.3"
        );
      } else {
        gsap.to(settingsRef.current, {
          width: 0,
          autoAlpha: 0,
          duration: 0.4,
          ease: "power3.inOut",
        });
      }
    },
    { dependencies: [showSettings], scope: containerRef }
  );

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

    const postContentString = JSON.stringify(currentContent || {});
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
      // Handled globally
    }
  };

  return (
    <RichTextEditor
      extensions={ExtensionKit}
      className="flex h-full flex-1 flex-col overflow-hidden"
      defaultValue={initialValue}
      onValueChange={handleValueChange}
    >
      <Modal.Header className="flex flex-row items-center justify-between">
        <FixedToolbar />

        <div className="flex items-center gap-2">
          {onToggleFullscreen && (
            <Tooltip delay={0}>
              <Button
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                isIconOnly
                variant="tertiary"
                onPress={onToggleFullscreen}
              >
                <Icon
                  icon={isFullscreen ? "gravity-ui:fullscreen-exit" : "gravity-ui:fullscreen"}
                />
              </Button>
              <Tooltip.Content>
                {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              </Tooltip.Content>
            </Tooltip>
          )}

          <Tooltip delay={0}>
            <Button
              aria-label={showSettings ? "Back to Edit" : "Publish"}
              isIconOnly
              variant={showSettings ? "secondary" : "tertiary"}
              onPress={() => (showSettings ? setShowSettings(false) : handleOpenPublish())}
            >
              <Icon icon={showSettings ? "gravity-ui:arrow-left" : "gravity-ui:paper-plane"} />
            </Button>
            <Tooltip.Content>{showSettings ? "Back to Edit" : "Publish"}</Tooltip.Content>
          </Tooltip>
        </div>

        <SuggestionToolbar />
        <TextMenu />
        <LinkMenu />
      </Modal.Header>

      <Modal.Body ref={containerRef} className="relative flex flex-1 flex-row overflow-hidden">
        <RichTextEditor.Content />

        <Form
          ref={settingsRef}
          className="flex h-full shrink-0 flex-col"
          style={{ width: 0, opacity: 0, overflow: "hidden" }}
          onSubmit={(e) => {
            e.preventDefault();
            handlePublishSubmit();
          }}
        >
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
            {/* Title Field */}
            <TextField
              name="title"
              isRequired
              value={title}
              onChange={handleTitleChange}
              className="publish-form-field flex flex-col gap-1.5"
            >
              <Label className="text-sm font-medium">Title</Label>
              <Input
                fullWidth
                placeholder="Enter post title..."
                variant="secondary"
                className="mt-1 h-10"
              />
            </TextField>

            {/* Slug Field */}
            <TextField
              name="slug"
              isRequired
              value={slug}
              onChange={(val) => {
                setSlug(generateSlug(val));
                setIsSlugManuallyEdited(true);
              }}
              className="publish-form-field flex flex-col gap-1.5"
            >
              <Label className="text-sm font-medium">Slug</Label>
              <Input
                fullWidth
                placeholder="e.g. my-first-post"
                variant="secondary"
                className="mt-1 h-10"
              />
            </TextField>

            {/* Category Select */}
            <Select
              placeholder="Select a category"
              variant="secondary"
              value={categoryId}
              onChange={(key) => setCategoryId(key as string)}
              className="publish-form-field flex w-full flex-col gap-1.5"
            >
              <Label className="text-sm font-medium">Category</Label>
              <Select.Trigger className="mt-1">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {categories.map((c) => (
                    <ListBox.Item key={c.id} id={c.id.toString()} textValue={c.name}>
                      {c.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            {/* Tags Multiple Select */}
            <Select
              placeholder="Select tags"
              selectionMode="multiple"
              variant="secondary"
              value={tagIds}
              onChange={(keys) => setTagIds(keys as string[])}
              className="publish-form-field flex w-full flex-col gap-1.5"
            >
              <Label className="text-sm font-medium">Tags</Label>
              <Select.Trigger className="mt-1">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox selectionMode="multiple">
                  {tags.map((t) => (
                    <ListBox.Item key={t.id} id={t.id.toString()} textValue={t.name}>
                      {t.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            {/* Summary Text Area */}
            <TextField name="summary" className="publish-form-field flex flex-col gap-1.5">
              <Label className="text-sm font-medium">Summary</Label>
              <TextArea
                fullWidth
                className="mt-1 min-h-24 resize-y"
                maxLength={240}
                placeholder="Enter a brief summary..."
                variant="secondary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </TextField>

            {/* Status Select */}
            <Select
              placeholder="Select status"
              variant="secondary"
              value={status}
              onChange={(val) => setStatus(val as PostStatus)}
              className="publish-form-field flex w-full flex-col gap-1.5"
            >
              <Label className="text-sm font-medium">Status</Label>
              <Select.Trigger className="mt-1">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="PUBLISHED" textValue="Published">
                    Published (Visible to everyone)
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="DRAFT" textValue="Draft">
                    Draft (Only administrators)
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="publish-form-field bg-background/50 flex shrink-0 flex-col p-6 select-none">
            <Button
              type="submit"
              variant="primary"
              className="flex h-11 w-full items-center justify-center gap-2 font-bold shadow-md"
              isDisabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Spinner size="sm" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Publish</span>
                  <Icon icon="gravity-ui:paper-plane" className="size-4" />
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>

      <Modal.Footer className="flex items-center justify-between">
        <div className="text-default-400 flex items-center gap-2 text-xs select-none">
          {isAutosaving && (
            <>
              <span className="bg-warning h-2 w-2 animate-pulse rounded-full" />
              <span>Saving draft...</span>
            </>
          )}
          {isAutosaveSuccess && !isAutosaving && (
            <>
              <span className="text-success h-2.5 w-2.5 font-bold">✓</span>
              <span className="text-success-600">Draft saved</span>
            </>
          )}
          {isAutosaveError && (
            <>
              <span className="bg-danger h-2 w-2 rounded-full" />
              <span className="text-danger-500">Failed to save draft</span>
            </>
          )}
          {!isAutosaving && !isAutosaveSuccess && !isAutosaveError && (
            <>
              <span className="bg-default-300 h-2 w-2 rounded-full" />
              <span>Ready</span>
            </>
          )}
        </div>

        <RichTextEditor.CharacterCount showWords />
      </Modal.Footer>
    </RichTextEditor>
  );
}
