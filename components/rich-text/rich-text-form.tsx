"use client";

import {
  Autocomplete,
  EmptyState,
  Input,
  Label,
  ListBox,
  SearchField,
  Select,
  Switch,
  Tag,
  TagGroup,
  TextArea,
  TextField,
  Typography,
  toast,
  useFilter,
} from "@heroui/react";
import { DropZone } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import type { DropZoneProps } from "react-aria-components";
import { type Key, useCallback, useEffect, useRef, useState } from "react";

import { useGetCategoriesQuery } from "@/lib/features/category";
import { useUploadFileMutation } from "@/lib/features/file";
import { useGetAllTagsQuery } from "@/lib/features/tag";
import type { PostRequest, PostStatus } from "@/features/blog";

interface RichTextFormProps {
  data: Partial<PostRequest>;
  onChange: (data: Partial<PostRequest>) => void;
}

interface UploadFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "complete" | "failed";
  progress: number;
}

const MAX_COVER_SIZE = 10 * 1024 * 1024;
const ACCEPTED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

interface ActiveUpload {
  id: string;
  abort: () => void;
}

type DropEvent = Parameters<NonNullable<DropZoneProps["onDrop"]>>[0];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1) : "";
}
type FileFormatColor = "blue" | "gray" | "green" | "orange" | "purple" | "red";
function getFormatColor(ext: string): FileFormatColor {
  const map: Record<string, FileFormatColor> = {
    csv: "green",
    doc: "blue",
    docx: "blue",
    fig: "purple",
    jpeg: "blue",
    jpg: "blue",
    json: "orange",
    mp4: "purple",
    pdf: "red",
    png: "green",
    svg: "green",
    ts: "blue",
    tsx: "blue",
    txt: "gray",
    xlsx: "green",
    zip: "orange",
  };
  return map[ext.toLowerCase()] ?? "gray";
}

export function RichTextForm({ data, onChange }: RichTextFormProps) {
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: tags = [] } = useGetAllTagsQuery();
  const [uploadFile] = useUploadFileMutation();

  const { contains } = useFilter({ sensitivity: "base" });

  const handleFieldChange = useCallback(
    (field: keyof PostRequest, value: string | number | boolean | number[] | undefined) => {
      onChange({ ...data, [field]: value });
    },
    [data, onChange]
  );

  const handleTagChange = (keys: Key | Key[] | null) => {
    const numericKeys = Array.isArray(keys) ? keys.map(Number) : keys ? [Number(keys)] : [];
    handleFieldChange("tagIds", numericKeys);
  };

  const onRemoveTags = (keys: Set<Key>) => {
    const currentTagIds = data.tagIds || [];
    handleFieldChange(
      "tagIds",
      currentTagIds.filter((id) => !keys.has(id))
    );
  };
  const [files, setFiles] = useState<UploadFile[]>([]);
  const activeUploadRef = useRef<ActiveUpload | null>(null);

  useEffect(() => {
    return () => {
      activeUploadRef.current?.abort();
      activeUploadRef.current = null;
    };
  }, []);

  const uploadCover = useCallback(
    async (file: File) => {
      if (!ACCEPTED_COVER_TYPES.has(file.type)) {
        toast.danger("Cover image must be JPEG, PNG, GIF, or WebP.");
        return;
      }

      if (file.size > MAX_COVER_SIZE) {
        toast.danger("Cover image must be 10 MB or smaller.");
        return;
      }

      activeUploadRef.current?.abort();

      const id = `${Date.now()}-${file.name}`;
      const request = uploadFile(file);

      activeUploadRef.current = {
        id,
        abort: request.abort,
      };
      setFiles([
        {
          id,
          name: file.name,
          progress: 0,
          size: file.size,
          status: "uploading",
        },
      ]);

      const progressInterval = setInterval(() => {
        setFiles((currentFiles) =>
          currentFiles.map((f) => {
            if (f.id === id && f.status === "uploading") {
              const increment = Math.max(1, Math.random() * 15);
              const nextProgress = Math.min(95, f.progress + increment);
              return { ...f, progress: Math.floor(nextProgress) };
            }
            return f;
          })
        );
      }, 300);

      try {
        const response = await request.unwrap();
        clearInterval(progressInterval);

        if (activeUploadRef.current?.id !== id) return;

        setFiles([
          {
            id,
            name: file.name,
            progress: 100,
            size: file.size,
            status: "complete",
          },
        ]);
        handleFieldChange("coverImage", response.fileUrl);
      } catch {
        clearInterval(progressInterval);

        if (activeUploadRef.current?.id !== id) return;

        setFiles([
          {
            id,
            name: file.name,
            progress: 0,
            size: file.size,
            status: "failed",
          },
        ]);
      } finally {
        clearInterval(progressInterval);
        if (activeUploadRef.current?.id === id) {
          activeUploadRef.current = null;
        }
      }
    },
    [handleFieldChange, uploadFile]
  );

  const handleSelect = useCallback(
    (fileList: FileList) => {
      const file = fileList.item(0);
      if (file) void uploadCover(file);
    },
    [uploadCover]
  );

  const handleDrop = useCallback(
    async (e: DropEvent) => {
      for (const item of e.items) {
        if (item.kind === "file" && item.getFile) {
          await uploadCover(await item.getFile());
          break;
        }
      }
    },
    [uploadCover]
  );

  const handleRemove = useCallback(
    (id: string) => {
      if (activeUploadRef.current?.id === id) {
        activeUploadRef.current.abort();
        activeUploadRef.current = null;
      }

      setFiles([]);
      handleFieldChange("coverImage", undefined);
    },
    [handleFieldChange]
  );
  return (
    <div className="flex h-full w-full scrollbar-none flex-col overflow-y-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Icon icon="gravity-ui:picture" />
          <Typography color="muted" type="body-sm">
            Cover Media
          </Typography>
        </div>

        <DropZone className="w-full">
          <DropZone.Area onDrop={handleDrop}>
            <DropZone.Icon />
            <DropZone.Label>Drag files here or click to browse</DropZone.Label>
            <DropZone.Description>
              Supports JPEG, PNG, PDF, and MP4 up to 50 MB.
            </DropZone.Description>
            <DropZone.Trigger>Select File</DropZone.Trigger>
          </DropZone.Area>
          <DropZone.Input
            accept="image/jpeg,image/png,image/gif,image/webp"
            onSelect={handleSelect}
          />
          {files.length > 0 && (
            <DropZone.FileList>
              {files.map((file) => {
                const ext = getExtension(file.name).toUpperCase();
                return (
                  <DropZone.FileItem key={file.id} status={file.status}>
                    <DropZone.FileFormatIcon
                      color={getFormatColor(ext.toLowerCase())}
                      format={ext}
                    />
                    <DropZone.FileInfo>
                      <DropZone.FileName>{file.name}</DropZone.FileName>
                      <DropZone.FileMeta>
                        {formatFileSize(file.size)}
                        {file.status === "uploading" && ` | ${file.progress}%`}
                        {file.status === "complete" && (
                          <span className="text-success"> | 100%</span>
                        )}
                      </DropZone.FileMeta>
                      {file.status === "uploading" && (
                        <DropZone.FileProgress value={file.progress}>
                          <DropZone.FileProgressTrack>
                            <DropZone.FileProgressFill />
                          </DropZone.FileProgressTrack>
                        </DropZone.FileProgress>
                      )}
                    </DropZone.FileInfo>
                    <DropZone.FileRemoveTrigger
                      aria-label={`Remove ${file.name}`}
                      onPress={() => handleRemove(file.id)}
                    />
                  </DropZone.FileItem>
                );
              })}
            </DropZone.FileList>
          )}
        </DropZone>
      </div>

      {/* Content Section */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 px-1">
          <Icon icon="gravity-ui:file-text" className="text-muted-foreground" />
          <Typography className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Article Content
          </Typography>
        </div>
        <div className="flex flex-col gap-6">
          <TextField isRequired className="w-full">
            <Label>Title</Label>
            <Input
              placeholder="The art of design..."
              value={data.title || ""}
              onChange={(e) => handleFieldChange("title", e.target.value)}
            />
          </TextField>

          <TextField isRequired className="w-full">
            <Label>Slug</Label>
            <Input
              placeholder="art-of-design"
              value={data.slug || ""}
              onChange={(e) => handleFieldChange("slug", e.target.value)}
            />
          </TextField>

          <TextField className="w-full">
            <Label>Summary</Label>
            <TextArea
              placeholder="In this article, we explore..."
              rows={3}
              value={data.summary || ""}
              onChange={(e) => handleFieldChange("summary", e.target.value)}
            />
          </TextField>
        </div>
      </div>

      {/* Categorization Section */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 px-1">
          <Icon icon="gravity-ui:tag" className="text-muted-foreground" />
          <Typography className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Categorization
          </Typography>
        </div>
        <div className="flex flex-col gap-6">
          <Select
            className="w-full"
            placeholder="Select category"
            value={data.categoryId}
            onChange={(key) => handleFieldChange("categoryId", key ? Number(key) : undefined)}
          >
            <Label className="text-sm font-medium">Category</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {categories.map((cat) => (
                  <ListBox.Item key={cat.id} id={cat.id} textValue={cat.name}>
                    {cat.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Autocomplete
            className="w-full"
            placeholder="Add tags..."
            selectionMode="multiple"
            value={data.tagIds || []}
            onChange={handleTagChange}
          >
            <Label className="text-sm font-medium">Tags</Label>
            <Autocomplete.Trigger>
              <Autocomplete.Value>
                {({ defaultChildren, isPlaceholder, state }) => {
                  if (isPlaceholder || state.selectedItems.length === 0) {
                    return defaultChildren;
                  }

                  const selectedItemsKeys = state.selectedItems.map((item) => item.key);

                  return (
                    <TagGroup size="sm" onRemove={onRemoveTags}>
                      <TagGroup.List>
                        {selectedItemsKeys.map((selectedItemKey) => {
                          const tag = tags.find((t) => t.id === selectedItemKey);
                          if (!tag) return null;
                          return (
                            <Tag key={tag.id} id={tag.id}>
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
              <Autocomplete.Filter filter={contains}>
                <SearchField autoFocus name="search">
                  <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder="Search tags..." />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
                <ListBox renderEmptyState={() => <EmptyState>No tags found</EmptyState>}>
                  {tags.map((tag) => (
                    <ListBox.Item key={tag.id} id={tag.id} textValue={tag.name}>
                      {tag.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Autocomplete.Filter>
            </Autocomplete.Popover>
          </Autocomplete>
        </div>
      </div>

      {/* Publishing Settings */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 px-1">
          <Icon icon="gravity-ui:circle-check" className="text-muted-foreground" />
          <Typography className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Publishing Settings
          </Typography>
        </div>
        <div className="flex flex-col gap-6">
          <Select
            className="w-full"
            placeholder="Select status"
            value={data.status || "DRAFT"}
            onChange={(key) => handleFieldChange("status", key as PostStatus)}
          >
            <Label className="text-sm font-medium">Visibility</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="DRAFT" textValue="Draft">
                  Draft
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="PUBLISHED" textValue="Published">
                  Published
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="ARCHIVED" textValue="Archived">
                  Archived
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>

          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex flex-col gap-1">
              <Typography className="text-sm font-medium">Featured Article</Typography>
              <Typography className="text-muted-foreground text-xs">
                Pin this post to the top
              </Typography>
            </div>
            <Switch
              isSelected={data.isFeatured || false}
              onChange={(selected) => handleFieldChange("isFeatured", selected)}
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Content>
            </Switch>
          </div>
        </div>
      </div>
    </div>
  );
}
