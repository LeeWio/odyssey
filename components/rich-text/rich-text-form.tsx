"use client";

import {
  Autocomplete,
  Button,
  EmptyState,
  Input,
  Label,
  ListBox,
  SearchField,
  Select,
  Spinner,
  Switch,
  Tag,
  TagGroup,
  TextArea,
  TextField,
  Typography,
  useFilter,
} from "@heroui/react";
import Image from "next/image";
import { DropZone, useDropZonePickerContext } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { type Key, useCallback } from "react";

import { useGetCategoriesQuery } from "@/lib/features/category/category-api";
import { useUploadFileMutation } from "@/lib/features/file/file-api";
import { useGetAllTagsQuery } from "@/lib/features/tag/tag-api";
import type { PostRequest, PostStatus } from "@/lib/features/post/post-api";

interface RichTextFormProps {
  data: Partial<PostRequest>;
  onChange: (data: Partial<PostRequest>) => void;
}

function DropZoneTrigger() {
  const { openFilePicker } = useDropZonePickerContext();
  return (
    <Button className="mt-4" variant="secondary" size="sm" onPress={openFilePicker}>
      <Icon icon="gravity-ui:picture" className="mr-2" />
      Choose Image
    </Button>
  );
}

export function RichTextForm({ data, onChange }: RichTextFormProps) {
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: tags = [] } = useGetAllTagsQuery();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();

  const { contains } = useFilter({ sensitivity: "base" });

  const handleFieldChange = useCallback(
    (field: keyof PostRequest, value: string | number | boolean | number[] | undefined) => {
      onChange({ ...data, [field]: value });
    },
    [data, onChange]
  );

  const handleDrop = useCallback(
    async (e: { items: Array<{ kind: string; getFile?: () => Promise<File> }> }) => {
      const item = e.items.find((i) => i.kind === "file");
      if (item?.getFile) {
        const file = await item.getFile();
        try {
          const res = await uploadFile(file).unwrap();
          handleFieldChange("coverImage", res.fileUrl);
        } catch (error) {
          console.error("Upload failed", error);
        }
      }
    },
    [uploadFile, handleFieldChange]
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

  return (
    <div className="flex h-full w-full scrollbar-none flex-col gap-10 overflow-y-auto p-6 md:p-10 lg:p-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-12">
        {/* Cover Image Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <Icon icon="gravity-ui:picture" className="text-accent" />
            <Typography className="text-muted text-sm font-semibold tracking-wider uppercase">
              Cover Media
            </Typography>
          </div>
          <DropZone className="group border-border/50 bg-surface-secondary/50 hover:border-accent/50 hover:bg-surface-secondary relative aspect-video w-full overflow-hidden rounded-3xl border-2 border-dashed transition-all">
            <DropZone.Area
              onDrop={handleDrop}
              className="flex h-full w-full flex-col items-center justify-center p-0"
            >
              {data.coverImage ? (
                <div className="relative h-full w-full">
                  <Image
                    fill
                    src={data.coverImage}
                    alt="Cover Preview"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex size-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
                        <Icon icon="gravity-ui:cloud-arrow-up-in" className="size-7" />
                      </div>
                      <Typography className="font-medium text-white">
                        Drop to replace cover
                      </Typography>
                      <DropZoneTrigger />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="bg-surface-tertiary text-muted group-hover:bg-accent/10 group-hover:text-accent flex size-20 items-center justify-center rounded-full transition-colors">
                    <Icon icon="gravity-ui:picture" className="size-10" />
                  </div>
                  <div>
                    <Typography className="text-lg font-semibold">
                      Add a compelling cover
                    </Typography>
                    <Typography className="text-muted text-sm">
                      PNG, JPG, WebP up to 10MB
                    </Typography>
                  </div>
                  <DropZoneTrigger />
                </div>
              )}
            </DropZone.Area>
            <DropZone.Input accept="image/*" />
          </DropZone>
          {isUploading && (
            <div className="text-accent flex items-center gap-2 px-2 text-xs">
              <Spinner size="sm" />
              <span>Uploading cover image...</span>
            </div>
          )}
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
    </div>
  );
}
