"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { Key } from "@heroui/react";
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
  SearchField,
  EmptyState,
  useFilter,
  TextField,
  type ModalContainerProps
} from "@heroui/react";
import { DropZone } from "@heroui-pro/react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import Image from "next/image";

// API Hooks
import { useCreatePostMutation } from "@/lib/features/post/post-api";
import { useGetCategoriesQuery } from "@/lib/features/category/category-api";
import { useGetAllTagsQuery } from "@/lib/features/tag/tag-api";
import { useUploadFileMutation } from "@/lib/features/file/file-api";

// --- Types & Constants ---

export type HeroUIModalSize = ModalContainerProps["size"];

export interface RichTextProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  size?: HeroUIModalSize;
}

type Step = "editor" | "metadata";

interface MetadataState {
  title: string;
  slug: string;
  summary: string;
  coverImage: string;
  categoryId?: number;
  tagIds: number[];
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
    }
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-10%" : "10%",
    opacity: 0,
    rotateY: dir > 0 ? -12 : 12,
    scale: 0.98,
    filter: "blur(8px)",
    transition: { duration: 0.4, ease: "easeInOut" }
  }),
};

const ITEM_VARIANTS: Variants = {
  initial: { y: 15, opacity: 0, filter: "blur(4px)" },
  animate: { y: 0, opacity: 1, filter: "blur(0px)" },
};

// --- Utilities ---

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// --- Sub-components (Content Only) ---

const EditorContent = ({ 
  value, 
  onChange, 
  placeholder 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  placeholder: string;
}) => (
  <TextArea
    fullWidth
    aria-label="Content Editor"
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="h-full min-h-[500px]"
  />
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
  onDrop
}: {
  metadata: MetadataState;
  onUpdateField: <K extends keyof MetadataState>(f: K, v: MetadataState[K]) => void;
  categories: any[];
  allTags: any[];
  isLoadingCategories: boolean;
  isLoadingTags: boolean;
  isUploading: boolean;
  onFileUpload: (files: FileList) => void;
  onDrop: (e: any) => void;
}) => {
  const { contains } = useFilter({ sensitivity: "base" });

  const onRemoveTags = useCallback((keys: Set<Key>) => {
    onUpdateField("tagIds", metadata.tagIds.filter((id) => !keys.has(id)));
  }, [metadata.tagIds, onUpdateField]);

  const handleTagChange = useCallback((keys: Key[] | null) => {
    const ids = (keys || []).map(k => parseInt(k.toString(), 10)).filter(id => !isNaN(id));
    onUpdateField("tagIds", ids);
  }, [onUpdateField]);

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Cover Image Section */}
      <motion.section variants={ITEM_VARIANTS} className="flex flex-col gap-3">
        <Label className="text-sm font-semibold text-foreground/80">Cover Image</Label>
        {metadata.coverImage ? (
          <div className="group relative h-56 w-full overflow-hidden rounded-2xl border-2 border-dashed border-divider bg-content2 transition-colors hover:border-primary/50">
            <Image src={metadata.coverImage} alt="Cover" fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <Button size="sm" variant="danger" className="absolute right-4 top-4 shadow-lg" onPress={() => onUpdateField("coverImage", "")}>
              Remove Image
            </Button>
          </div>
        ) : (
          <DropZone>
            <DropZone.Area onDrop={onDrop} className="h-56">
              <DropZone.Icon className="text-primary" />
              <DropZone.Label className="text-base font-medium">
                {isUploading ? "Uploading..." : "Click or drag cover image"}
              </DropZone.Label>
              <DropZone.Description>Optimized for 16:9 aspect ratio</DropZone.Description>
              <DropZone.Trigger isDisabled={isUploading}>Browse Files</DropZone.Trigger>
            </DropZone.Area>
            <DropZone.Input onSelect={onFileUpload} />
          </DropZone>
        )}
      </motion.section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div variants={ITEM_VARIANTS} className="flex flex-col gap-6">
          <TextField name="title" value={metadata.title} onChange={(v) => onUpdateField("title", v)}>
            <Label className="font-semibold">Post Title</Label>
            <Input placeholder="Enter an engaging title..." variant="secondary" />
          </TextField>
          <TextField name="slug" value={metadata.slug} onChange={(v) => onUpdateField("slug", v)}>
            <Label className="font-semibold">URL Slug</Label>
            <Input placeholder="post-url-slug" variant="secondary" />
          </TextField>
          <TextField name="summary" value={metadata.summary} onChange={(v) => onUpdateField("summary", v)}>
            <Label className="font-semibold">Summary</Label>
            <TextArea placeholder="Briefly describe what this post is about..." rows={4} variant="secondary" />
          </TextField>
        </motion.div>

        <motion.div variants={ITEM_VARIANTS} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Select
              className="w-full"
              placeholder={isLoadingCategories ? "Loading..." : "Select a category"}
              selectionMode="single"
              value={metadata.categoryId?.toString()}
              onChange={(key) => onUpdateField("categoryId", key ? parseInt(key.toString(), 10) : undefined)}
              variant="secondary"
            >
              <Label className="font-semibold">Category</Label>
              <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {categories.map((cat) => (
                    <ListBox.Item key={cat.id} id={cat.id.toString()} textValue={cat.name}>
                      {cat.name}<ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Autocomplete
              className="w-full"
              placeholder={isLoadingTags ? "Loading..." : "Select tags"}
              selectionMode="multiple"
              value={metadata.tagIds.map(id => id.toString())}
              onChange={(keys) => handleTagChange(keys as Key[] | null)}
              variant="secondary"
            >
              <Label className="font-semibold">Tags</Label>
              <Autocomplete.Trigger>
                <Autocomplete.Value>
                  {({ defaultChildren, isPlaceholder, state }) => {
                    if (isPlaceholder || state.selectedItems.length === 0) return defaultChildren;
                    const keys = state.selectedItems.map((item) => item.key);
                    return (
                      <TagGroup size="sm" onRemove={onRemoveTags}>
                        <TagGroup.List>
                          {keys.map((key) => {
                            const tag = allTags.find((t) => t.id.toString() === key.toString());
                            return tag ? <Tag key={tag.id} id={tag.id}>{tag.name}</Tag> : null;
                          })}
                        </TagGroup.List>
                      </TagGroup>
                    );
                  }}
                </Autocomplete.Value>
                <Autocomplete.ClearButton /><Autocomplete.Indicator />
              </Autocomplete.Trigger>
              <Autocomplete.Popover>
                <Autocomplete.Filter filter={contains}>
                  <SearchField autoFocus name="search" variant="secondary">
                    <SearchField.Group><SearchField.SearchIcon /><SearchField.Input placeholder="Search tags..." /><SearchField.ClearButton /></SearchField.Group>
                  </SearchField>
                  <ListBox renderEmptyState={() => <EmptyState>No tags found</EmptyState>}>
                    {allTags.map((tag) => (
                      <ListBox.Item key={tag.id} id={tag.id.toString()} textValue={tag.name}>
                        {tag.name}<ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Autocomplete.Filter>
              </Autocomplete.Popover>
            </Autocomplete>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// --- Main Component ---

export function RichText({
  value = "",
  onChange,
  label = "Edit Content",
  placeholder = "Enter text...",
  size = "cover",
}: RichTextProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("editor");
  const [direction, setDirection] = useState(0);
  
  const [internalValue, setInternalValue] = useState(value);
  const [metadata, setMetadata] = useState<MetadataState>({
    title: "",
    slug: "",
    summary: "",
    coverImage: "",
    tagIds: [],
  });

  // API Hooks
  const { data: categories = [], isLoading: isLoadingCategories } = useGetCategoriesQuery();
  const { data: allTags = [], isLoading: isLoadingTags } = useGetAllTagsQuery();
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();

  useEffect(() => {
    if (metadata.title && !metadata.slug) {
      setMetadata(prev => ({ ...prev, slug: generateSlug(metadata.title) }));
    }
  }, [metadata.title, metadata.slug]);

  useEffect(() => {
    if (isOpen) {
      setInternalValue(value);
      setStep("editor");
      setDirection(0);
    }
  }, [isOpen, value]);

  const goToStep = useCallback((newStep: Step) => {
    setDirection(newStep === "metadata" ? 1 : -1);
    setStep(newStep);
  }, []);

  const updateMetadataField = useCallback(<K extends keyof MetadataState>(field: K, value: MetadataState[K]) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFileUpload = useCallback(async (fileList: FileList) => {
    const file = fileList[0];
    if (!file) return;
    try {
      const response = await uploadFile(file).unwrap();
      updateMetadataField("coverImage", response.fileUrl);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  }, [uploadFile, updateMetadataField]);

  const handleDrop = useCallback(async (e: any) => {
    const dropped: File[] = [];
    for (const item of e.items) {
      if (item.kind === "file" && item.getFile) dropped.push(await item.getFile());
    }
    if (dropped[0]) {
      try {
        const response = await uploadFile(dropped[0]).unwrap();
        updateMetadataField("coverImage", response.fileUrl);
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }
  }, [uploadFile, updateMetadataField]);

  const handlePublish = useCallback(async () => {
    try {
      await createPost({
        ...metadata,
        slug: metadata.slug || generateSlug(metadata.title),
        content: internalValue,
        status: "PUBLISHED",
      }).unwrap();
      onChange?.(internalValue);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to publish post:", error);
    }
  }, [createPost, internalValue, metadata, onChange]);

  return (
    <>
      <Button onPress={() => setIsOpen(true)} variant="secondary">{label}</Button>

      <Modal>
        <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
          <Modal.Container size={size}>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{step === "editor" ? label : "Publish Settings"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="p-0">
                <div className="relative w-full h-[600px] overflow-hidden" style={{ perspective: "1200px" }}>
                  <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                    {step === "editor" ? (
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
                        className="absolute inset-0 flex flex-col p-6 pb-0 overflow-y-auto"
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
                </div>
              </Modal.Body>
              <Modal.Footer>
                {step === "editor" ? (
                  <>
                    <Button variant="ghost" onPress={() => setIsOpen(false)}>Cancel</Button>
                    <Button onPress={() => goToStep("metadata")}>Next</Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onPress={() => goToStep("editor")}>Back</Button>
                    <Button isPending={isCreating} onPress={handlePublish}>Publish Now</Button>
                  </>
                )}
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

export default RichText;
