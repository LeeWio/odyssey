"use client";

import { useState, useCallback, useMemo } from "react";
import type { ModalVariants } from "@heroui/react";
import {
  Modal,
  TextArea,
  Button,
  Select,
  ListBox,
  Label,
  TagGroup,
  Tag,
  Autocomplete,
  Input,
  TextField,
  Separator,
  SearchField,
  toast,
} from "@heroui/react";
import { DropZone, CellSwitch } from "@heroui-pro/react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import Image from "next/image";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { selectIsRichTextOpen, toggleRichText } from "@/lib/features/ui/ui-slice";

import { useCreatePostMutation } from "@/lib/features/post/post-api";
import { useGetCategoriesQuery } from "@/lib/features/category/category-api";
import { useGetAllTagsQuery } from "@/lib/features/tag/tag-api";
import { useUploadFileMutation } from "@/lib/features/file/file-api";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ModalContainerProps } from "@heroui/react";

// --- Types & Constants ---

import type { PostStatus } from "@/lib/features/post/post-api";
import { Icon } from "@iconify/react";

interface MetadataState {
  title: string;
  slug: string;
  summary: string;
  coverImage: string;
  categoryId?: number;
  tagIds: number[];
  status: PostStatus;
  isFeatured: boolean;
  seriesId?: number;
  seriesOrder?: number;
}

const ANIMATION_VARIANTS: Variants = {
  initial: (dir: number) => ({
    x: dir > 0 ? "10%" : dir < 0 ? "-10%" : 0,
    opacity: 0,
    rotateY: dir > 0 ? 12 : -12,
    scale: 0.98,
    filter: "blur(8px)",
  }),
  animate: {
    x: 0,
    opacity: 1,
    rotateY: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-10%" : "10%",
    opacity: 0,
    rotateY: dir > 0 ? -12 : 12,
    scale: 0.98,
    filter: "blur(8px)",
    transition: { duration: 0.4, ease: "easeInOut" },
  }),
};

const ITEM_VARIANTS: Variants = {
  initial: { y: 15, opacity: 0, filter: "blur(4px)" },
  animate: { y: 0, opacity: 1, filter: "blur(0px)" },
};

// --- Utilities ---

const generateSlug = (text: string): string => {
  return (
    text
      .toLowerCase()
      .trim()
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, "-")
      // Remove all non-alphanumeric characters except hyphens
      .replace(/[^a-z0-9-]/g, "")
      // Remove multiple consecutive hyphens
      .replace(/-+/g, "-")
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, "")
  );
};

// --- Sub-components (Content Only) ---

const EditorContent = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) => (
  <div className="flex h-full flex-col gap-4">
    <TextField className="flex-1" value={value} onChange={onChange}>
      <Label className="sr-only">Content</Label>
      <TextArea
        className="h-full min-h-[300px] w-full resize-none bg-transparent p-0 text-lg leading-relaxed focus:ring-0"
        placeholder={placeholder}
      />
    </TextField>
  </div>
);

const MetadataContent = ({
  metadata,
  onUpdateField,
  categories,
  allTags,
  isLoadingCategories,
  isLoadingTags,
  isUploading,
  onFileUpload,
  onDrop,
}: {
  metadata: MetadataState;
  onUpdateField: <K extends keyof MetadataState>(field: K, value: MetadataState[K]) => void;
  categories: Array<{ id: number; name: string }>;
  allTags: Array<{ id: number; name: string }>;
  isLoadingCategories: boolean;
  isLoadingTags: boolean;
  isUploading: boolean;
  onFileUpload: (files: FileList) => void;
  onDrop: (
    e: React.DragEvent<HTMLDivElement> & {
      items?: Array<{ kind: string; getFile?: () => Promise<File> }>;
    }
  ) => void;
}) => (
  <div className="flex flex-col gap-8">
    <motion.div variants={ITEM_VARIANTS} className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6">
        <TextField
          value={metadata.title}
          onChange={(val) => onUpdateField("title", val)}
          isRequired
        >
          <Label>Post Title</Label>
          <Input placeholder="The future of digital design..." />
        </TextField>

        <TextField value={metadata.slug} onChange={(val) => onUpdateField("slug", val)}>
          <Label>Slug</Label>
          <Input placeholder="my-awesome-post" />
        </TextField>
      </div>

      <TextField value={metadata.summary} onChange={(val) => onUpdateField("summary", val)}>
        <Label>Summary</Label>
        <TextArea placeholder="A brief overview of your post..." />
      </TextField>
    </motion.div>

    <motion.div variants={ITEM_VARIANTS} className="flex flex-col gap-4">
      <Label>Cover Image</Label>
      {metadata.coverImage ? (
        <div className="relative flex h-48 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-white/10 bg-white/5">
          <Image src={metadata.coverImage} alt="Cover" fill className="object-cover opacity-80" />
          <Button
            className="absolute top-2 right-2 z-10"
            isIconOnly
            size="sm"
            variant="danger-soft"
            onPress={() => onUpdateField("coverImage", "")}
          >
            <Icon icon="gravity-ui:xmark" />
          </Button>
        </div>
      ) : (
        <DropZone className="h-48" onDrop={onDrop}>
          <DropZone.Area
            getDropOperation={(types) =>
              ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"].some((t) =>
                types.has(t)
              )
                ? "copy"
                : "cancel"
            }
          >
            <DropZone.Icon>
              <Icon icon="gravity-ui:picture" />
            </DropZone.Icon>
            <DropZone.Label>Drop your images here</DropZone.Label>
            <DropZone.Description>Accepts PNG, JPG, GIF, WebP, and SVG.</DropZone.Description>
            <DropZone.Trigger isDisabled={isUploading}>Select Images</DropZone.Trigger>
          </DropZone.Area>
          <DropZone.Input
            accept="image/*"
            onSelect={(files) => {
              if (files) {
                onFileUpload(files);
              }
            }}
          />
        </DropZone>
      )}
    </motion.div>

    <motion.div variants={ITEM_VARIANTS} className="grid grid-cols-2 gap-6">
      <Select
        placeholder="Select status"
        value={metadata.status}
        onChange={(val) => onUpdateField("status", val as PostStatus)}
      >
        <Label>Status</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="DRAFT" textValue="Draft">
              Draft
            </ListBox.Item>
            <ListBox.Item id="PENDING_REVIEW" textValue="Pending Review">
              Pending Review
            </ListBox.Item>
            <ListBox.Item id="PUBLISHED" textValue="Published">
              Published
            </ListBox.Item>
            <ListBox.Item id="ARCHIVED" textValue="Archived">
              Archived
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>

      <div className="flex items-center">
        <CellSwitch
          isSelected={metadata.isFeatured}
          onChange={(val) => onUpdateField("isFeatured", val)}
        >
          <CellSwitch.Trigger>
            <CellSwitch.Label>Featured Post</CellSwitch.Label>
            <CellSwitch.Control />
          </CellSwitch.Trigger>
        </CellSwitch>
      </div>
    </motion.div>

    <motion.div variants={ITEM_VARIANTS} className="grid grid-cols-2 gap-6">
      <TextField
        type="number"
        value={metadata.seriesId?.toString() || ""}
        onChange={(val) => onUpdateField("seriesId", val ? Number(val) : undefined)}
      >
        <Label className="text-sm font-medium">Series ID (Optional)</Label>
        <Input placeholder="1" />
      </TextField>

      <TextField
        type="number"
        value={metadata.seriesOrder?.toString() || ""}
        onChange={(val) => onUpdateField("seriesOrder", val ? Number(val) : undefined)}
      >
        <Label className="text-sm font-medium">Series Order (Optional)</Label>
        <Input placeholder="1" />
      </TextField>
    </motion.div>

    <motion.div variants={ITEM_VARIANTS} className="grid grid-cols-2 gap-6">
      <Select
        value={metadata.categoryId?.toString()}
        placeholder="Select category"
        onChange={(val) => onUpdateField("categoryId", Number(val))}
      >
        <Label>Category {isLoadingCategories && "(Loading...)"}</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {categories.map((cat) => (
              <ListBox.Item key={cat.id} id={cat.id.toString()} textValue={cat.name}>
                {cat.name}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <Autocomplete
        selectionMode="multiple"
        value={metadata.tagIds.map(String)}
        onChange={(keys) => {
          const newIds = Array.isArray(keys) ? keys.map(Number) : [];
          onUpdateField("tagIds", newIds);
        }}
      >
        <Label>Tags {isLoadingTags && "(Loading...)"}</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value>
            {({ defaultChildren, isPlaceholder, state }) => {
              if (isPlaceholder || state.selectedItems.length === 0) {
                return defaultChildren;
              }
              const selectedItemsKeys = state.selectedItems.map((item) => item.key);
              return (
                <TagGroup
                  size="sm"
                  onRemove={(keys) => {
                    const idsToRemove = Array.from(keys).map(Number);
                    onUpdateField(
                      "tagIds",
                      metadata.tagIds.filter((id) => !idsToRemove.includes(id))
                    );
                  }}
                >
                  <TagGroup.List>
                    {selectedItemsKeys.map((selectedItemKey) => {
                      const tag = allTags.find((t) => t.id.toString() === selectedItemKey);
                      if (!tag) return null;
                      return (
                        <Tag key={tag.id} id={tag.id.toString()}>
                          {tag.name}
                        </Tag>
                      );
                    })}
                  </TagGroup.List>
                </TagGroup>
              );
            }}
          </Autocomplete.Value>
          <Autocomplete.ClearButton />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <Autocomplete.Filter>
            <SearchField autoFocus name="search" variant="secondary">
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search tags..." />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <ListBox>
              {allTags.map((tag) => (
                <ListBox.Item key={tag.id} id={tag.id.toString()} textValue={tag.name}>
                  {tag.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Autocomplete.Filter>
        </Autocomplete.Popover>
      </Autocomplete>
    </motion.div>
  </div>
);

// --- Main Component ---

export interface RichTextProps extends ModalVariants, ModalContainerProps {
  textValue?: string;
  onTextValueChange?: (textValue: string) => void;
  label?: string;
  placeholder?: string;
}

export function RichText({
  textValue = "",
  onTextValueChange,
  size = "cover",
  placement = "auto",
  variant = "transparent",
  scroll = "inside",
  placeholder = "Enter text...",
}: RichTextProps) {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsRichTextOpen);

  const [isPublishStep, setIsPublishStep] = useState(false);
  const [direction, setDirection] = useState(0);

  const [internalValue, setInternalValue] = useState(textValue);
  const [metadata, setMetadata] = useState<MetadataState>({
    title: "",
    slug: "",
    summary: "",
    coverImage: "",
    tagIds: [],
    status: "DRAFT",
    isFeatured: false,
    seriesId: undefined,
    seriesOrder: undefined,
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useGetCategoriesQuery();
  const { data: allTags = [], isLoading: isLoadingTags } = useGetAllTagsQuery();
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();

  const wordCount = useMemo(() => {
    const trimmed = internalValue.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [internalValue]);

  const charCount = useMemo(() => {
    return internalValue.length;
  }, [internalValue]);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevTextValue, setPrevTextValue] = useState(textValue);

  if (isOpen !== prevIsOpen || textValue !== prevTextValue) {
    setPrevIsOpen(isOpen);
    setPrevTextValue(textValue);
    if (isOpen && isOpen !== prevIsOpen) {
      setIsPublishStep(false);
      setDirection(0);
    }
    setInternalValue(textValue);
  }

  const goToStep = useCallback((publish: boolean) => {
    setDirection(publish ? 1 : -1);
    setIsPublishStep(publish);
  }, []);

  const updateMetadataField = useCallback(
    <K extends keyof MetadataState>(field: K, value: MetadataState[K]) => {
      setMetadata((prev) => {
        const next = { ...prev, [field]: value };
        if (field === "title" && !prev.slug && typeof value === "string") {
          next.slug = generateSlug(value);
        }
        return next;
      });
    },
    []
  );

  const handleFileUpload = useCallback(
    async (fileList: FileList) => {
      const file = fileList[0];
      if (!file) return;
      try {
        const response = await uploadFile(file).unwrap();
        updateMetadataField("coverImage", response.fileUrl);
      } catch (error) {
        console.error("Upload failed:", error);
      }
    },
    [uploadFile, updateMetadataField]
  );

  const handleDrop = useCallback(
    async (
      e: React.DragEvent<HTMLDivElement> & {
        items?: Array<{ kind: string; getFile?: () => Promise<File> }>;
      }
    ) => {
      const dropped: File[] = [];
      const items = e.items;
      if (items) {
        for (const item of items) {
          if (item.kind === "file" && item.getFile) dropped.push(await item.getFile());
        }
      }
      if (dropped[0]) {
        try {
          const response = await uploadFile(dropped[0]).unwrap();
          updateMetadataField("coverImage", response.fileUrl);
        } catch (error) {
          console.error("Upload failed:", error);
        }
      }
    },
    [uploadFile, updateMetadataField]
  );

  const handlePublish = useCallback(async () => {
    try {
      const finalSlug = metadata.slug || generateSlug(metadata.title);

      // Client-side validation before sending
      if (!finalSlug || !/^[a-z0-9-]+$/.test(finalSlug)) {
        toast.danger("Slug must only contain lowercase alphanumeric characters and hyphens.");
        return;
      }

      await createPost({
        ...metadata,
        slug: finalSlug,
        content: internalValue,
        status: metadata.status || "PUBLISHED",
      }).unwrap();

      toast.success("Post published successfully.");
      onTextValueChange?.(internalValue);
      dispatch(toggleRichText());
    } catch (error: unknown) {
      console.error("Failed to publish post:", error);
      let errorMessage = "An unexpected error occurred while publishing.";
      if (
        error &&
        typeof error === "object" &&
        "data" in error &&
        error.data &&
        typeof error.data === "object" &&
        "message" in error.data
      ) {
        errorMessage = String(error.data.message);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.danger(errorMessage);
    }
  }, [createPost, internalValue, metadata, onTextValueChange, dispatch]);

  return (
    <>
      <Modal>
        <Modal.Backdrop
          isOpen={isOpen}
          onOpenChange={(open) => {
            if (!open) dispatch(toggleRichText());
          }}
          variant={variant}
        >
          <Modal.Container size={size} placement={placement} scroll={scroll}>
            <Modal.Dialog>
              <Modal.Body>
                <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                  {!isPublishStep ? (
                    <motion.div
                      key="editor"
                      custom={direction}
                      variants={ANIMATION_VARIANTS}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="absolute inset-0 flex flex-col p-6 pb-0"
                    >
                      <EditorContent
                        value={internalValue}
                        onChange={setInternalValue}
                        placeholder={placeholder}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="metadata"
                      custom={direction}
                      variants={ANIMATION_VARIANTS}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="absolute inset-0 flex flex-col overflow-y-auto p-6 pb-0"
                    >
                      <MetadataContent
                        metadata={metadata}
                        onUpdateField={updateMetadataField}
                        categories={categories}
                        allTags={allTags}
                        isLoadingCategories={isLoadingCategories}
                        isLoadingTags={isLoadingTags}
                        isUploading={isUploading}
                        onFileUpload={handleFileUpload}
                        onDrop={handleDrop}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Modal.Body>
              <Modal.Footer className="items-center justify-between">
                <div className="bg-default-100/30 flex items-center gap-3 rounded-full border border-white/5 px-3 py-1 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 pl-1">
                    <AnimatedNumber
                      value={wordCount}
                      className="text-default-700 text-xs font-bold"
                    />
                    <span className="text-default-400 text-[10px] font-medium tracking-wider uppercase">
                      Words
                    </span>
                  </div>

                  <Separator orientation="vertical" className="bg-default-200/50 h-3" />

                  <div className="flex items-center gap-1.5 pr-1">
                    <AnimatedNumber
                      value={charCount}
                      className="text-default-700 text-xs font-bold"
                    />
                    <span className="text-default-400 text-[10px] font-medium tracking-wider uppercase">
                      Chars
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!isPublishStep ? (
                    <>
                      <Button variant="ghost" size="sm" onPress={() => dispatch(toggleRichText())}>
                        Cancel
                      </Button>
                      <Button size="sm" onPress={() => goToStep(true)}>
                        Next Step
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onPress={() => goToStep(false)}>
                        Back
                      </Button>
                      <Button size="sm" onPress={handlePublish} isPending={isCreating}>
                        Publish Now
                      </Button>
                    </>
                  )}
                </div>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

export default RichText;
