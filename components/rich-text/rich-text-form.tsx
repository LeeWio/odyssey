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
  useFilter,
} from "@heroui/react";
import { type Key, useCallback } from "react";

import { useGetCategoriesQuery } from "@/lib/features/category";
import { useGetColumnsQuery } from "@/lib/features/column";
import { useGetAllTagsQuery } from "@/lib/features/tag";
import type { PostRequest } from "@/lib/features/post";

interface RichTextFormProps {
  data: Partial<PostRequest>;
  onChange: (data: Partial<PostRequest>) => void;
  step: "article" | "organize" | "publish";
}

export function RichTextForm({ data, onChange, step }: RichTextFormProps) {
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: columns = [] } = useGetColumnsQuery();
  const { data: tags = [] } = useGetAllTagsQuery();

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
  if (step === "article") {
    return (
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
    );
  }

  if (step === "organize") {
    return (
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

        <Select
          className="w-full"
          placeholder="No column"
          value={data.seriesId}
          onChange={(key) => handleFieldChange("seriesId", key ? Number(key) : undefined)}
        >
          <Label className="text-sm font-medium">Column</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {columns.map((column) => (
                <ListBox.Item key={column.id} id={column.id} textValue={column.name}>
                  {column.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        {data.seriesId ? (
          <TextField className="w-full">
            <Label>Column order</Label>
            <Input
              min={0}
              type="number"
              value={String(data.seriesOrder ?? 0)}
              onChange={(event) => handleFieldChange("seriesOrder", Number(event.target.value))}
            />
          </TextField>
        ) : null}

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
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <Typography className="text-sm font-medium">Featured Article</Typography>
        <Typography className="text-muted-foreground text-xs">Pin this post to the top</Typography>
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
  );
}
