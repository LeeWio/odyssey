"use client";

import { useState, useMemo } from "react";
import { useDropZonePickerContext } from "@heroui-pro/react";
import {
  Button,
  ProgressCircle,
  ScrollShadow,
  Spinner,
  Popover,
  Autocomplete,
  EmptyState,
  ListBox,
  SearchField,
  Tag,
  TagGroup,
  useFilter,
} from "@heroui/react";
import type { Key } from "@heroui/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "motion/react";
import { ComposerTool, type ComposerToolProps } from "./composer-tool";
import { StockSelector } from "./stock-selector";
import { useGetPublicTagsQuery } from "@/lib/features/tag/tag-api";
import { normalizeMomentTopicSlug } from "../../utils/topic-slug";
import {
  MOMENT_CHARACTER_LIMIT,
  MOMENT_SHORT_FORM_CHARACTER_LIMIT,
} from "../../utils/character-count";

interface SelectedItem {
  key: Key;
  textValue?: string;
}

interface AutocompleteState {
  selectedItems: SelectedItem[];
}

interface AutocompleteValueProps {
  isPlaceholder: boolean;
  state: AutocompleteState;
}

interface PublisherToolbarProps {
  charCount: number;
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  onPublish: () => void;
  onAction?: (actionId: string) => void;
  topics: string[];
  onAddTopic: (topic: string) => void;
  onRemoveTopic: (topic: string) => void;
  onAttachStock?: (symbol: string | null) => void;
  attachedStockSymbol?: string | null;
}

export const PublisherToolbar = ({
  charCount,
  isSubmitting,
  isSubmitDisabled,
  onPublish,
  onAction,
  topics,
  onAddTopic,
  onRemoveTopic,
  onAttachStock,
  attachedStockSymbol,
}: PublisherToolbarProps) => {
  const { openFilePicker } = useDropZonePickerContext();
  const { contains } = useFilter({ sensitivity: "base" });

  const [inputValue, setInputValue] = useState("");
  const { data: publicTags = [] } = useGetPublicTagsQuery();

  const items = useMemo(() => {
    return publicTags.map((tag) => ({
      id: tag.slug,
      name: tag.name,
    }));
  }, [publicTags]);

  const normalizedInput = useMemo(() => normalizeMomentTopicSlug(inputValue), [inputValue]);
  const hasExactMatch = useMemo(() => {
    if (!normalizedInput) return true;
    return items.some(
      (item) => item.id === normalizedInput || item.id.toLowerCase() === inputValue.toLowerCase()
    );
  }, [normalizedInput, items, inputValue]);

  const tools: ComposerToolProps[] = [
    { id: "image", icon: "gravity-ui:picture", label: "Image" },
    { id: "video", icon: "gravity-ui:video", label: "Video" },
    { id: "poll", icon: "gravity-ui:seal-check", label: "Poll" },
    { id: "emoji", icon: "gravity-ui:face-smile", label: "Emoji" },
    { id: "topic", icon: "gravity-ui:hashtag", label: "Topic" },
    { id: "location", icon: "gravity-ui:map-pin", label: "Location" },
  ];

  const handleRemoveTags = (keys: Set<Key>) => {
    keys.forEach((key) => onRemoveTopic(String(key)));
  };

  const warningThreshold = MOMENT_CHARACTER_LIMIT - 200;
  const isLongForm = charCount > MOMENT_SHORT_FORM_CHARACTER_LIMIT;
  const percentage = Math.min(
    (isLongForm
      ? (charCount - MOMENT_SHORT_FORM_CHARACTER_LIMIT) /
        (MOMENT_CHARACTER_LIMIT - MOMENT_SHORT_FORM_CHARACTER_LIMIT)
      : charCount / MOMENT_SHORT_FORM_CHARACTER_LIMIT) * 100,
    100
  );
  const charColor =
    charCount < warningThreshold
      ? "accent"
      : charCount < MOMENT_CHARACTER_LIMIT
        ? "warning"
        : "danger";

  return (
    <div className="flex w-full flex-col gap-3">
      <ScrollShadow
        hideScrollBar
        variant="fade"
        className="flex flex-row gap-3"
        orientation="horizontal"
      >
        {tools.map((tool) => {
          if (tool.id === "topic") {
            return (
              <Popover key={tool.id}>
                <Popover.Trigger>
                  <Button size="sm" variant="tertiary" isDisabled={tool.disabled}>
                    <Icon icon={tool.icon} className="size-5" />
                    {tool.label}
                  </Button>
                </Popover.Trigger>
                <Popover.Content placement="bottom" className="w-75">
                  <Popover.Dialog>
                    <Popover.Heading>Attach Topics</Popover.Heading>

                    <Autocomplete
                      aria-label="Select topics"
                      className="mt-2 w-full"
                      placeholder="Search or create a topic..."
                      selectionMode="multiple"
                      value={topics}
                      onChange={(keys) => {
                        const targetKeys = (keys as string[]) || [];
                        // Add newly selected keys
                        for (const key of targetKeys) {
                          if (!topics.includes(key)) {
                            onAddTopic(key);
                          }
                        }
                        // Remove unselected keys
                        for (const topic of topics) {
                          if (!targetKeys.includes(topic)) {
                            onRemoveTopic(topic);
                          }
                        }
                      }}
                    >
                      <Autocomplete.Trigger>
                        <Autocomplete.Value>
                          {({ isPlaceholder, state }: AutocompleteValueProps) => {
                            if (
                              isPlaceholder ||
                              !state.selectedItems ||
                              state.selectedItems.length === 0
                            ) {
                              return (
                                <span className="text-muted-foreground px-1 text-sm">
                                  Select topics
                                </span>
                              );
                            }

                            const selectedKeysList = state.selectedItems.map(
                              (item: SelectedItem) => item.key
                            );

                            return (
                              <TagGroup size="sm" onRemove={handleRemoveTags}>
                                <TagGroup.List className="flex flex-wrap gap-1">
                                  {selectedKeysList.map((key: Key) => {
                                    const matchedItem = items.find((it) => it.id === key);
                                    const displayName = matchedItem
                                      ? matchedItem.name
                                      : String(key);
                                    return (
                                      <Tag key={key} id={key}>
                                        #{displayName}
                                      </Tag>
                                    );
                                  })}
                                </TagGroup.List>
                              </TagGroup>
                            );
                          }}
                        </Autocomplete.Value>
                        <Autocomplete.Indicator />
                      </Autocomplete.Trigger>

                      <Autocomplete.Popover>
                        <Autocomplete.Filter
                          filter={contains}
                          inputValue={inputValue}
                          onInputChange={setInputValue}
                        >
                          <SearchField autoFocus name="search" variant="secondary">
                            <SearchField.Group>
                              <SearchField.SearchIcon />
                              <SearchField.Input placeholder="Type to filter..." />
                              <SearchField.ClearButton />
                            </SearchField.Group>
                          </SearchField>

                          <ListBox
                            renderEmptyState={() => (
                              <EmptyState>No predefined topics found.</EmptyState>
                            )}
                          >
                            {items.map((item) => (
                              <ListBox.Item key={item.id} id={item.id} textValue={item.name}>
                                #{item.name}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}

                            {normalizedInput && !hasExactMatch && (
                              <ListBox.Item
                                key={normalizedInput}
                                id={normalizedInput}
                                textValue={normalizedInput}
                              >
                                Create topic: #{normalizedInput}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            )}
                          </ListBox>
                        </Autocomplete.Filter>
                      </Autocomplete.Popover>
                    </Autocomplete>
                  </Popover.Dialog>
                </Popover.Content>
              </Popover>
            );
          }

          return (
            <ComposerTool
              key={tool.id}
              {...tool}
              onClick={() => {
                if (tool.id === "image") {
                  openFilePicker();
                } else if (onAction) {
                  onAction(tool.id);
                }
              }}
            />
          );
        })}
        {onAttachStock && (
          <StockSelector onSelect={onAttachStock} attachedStockSymbol={attachedStockSymbol} />
        )}
      </ScrollShadow>

      {/* 2. Divider-free footer row with metrics & share button */}
      <div className="flex w-full flex-row items-center justify-between gap-3 pt-1">
        {/* Left: Selected topics with ScrollShadow & max-width */}
        {topics.length > 0 && (
          <ScrollShadow
            hideScrollBar
            variant="fade"
            orientation="horizontal"
            className="flex max-w-45 flex-row sm:max-w-60"
          >
            <TagGroup aria-label="Attached topics" size="sm" onRemove={handleRemoveTags}>
              <TagGroup.List className="flex flex-row flex-nowrap gap-1.5">
                {topics.map((topic) => {
                  const matchedItem = items.find((it) => it.id === topic);
                  const displayName = matchedItem ? matchedItem.name : topic;
                  return (
                    <Tag
                      key={topic}
                      id={topic}
                      textValue={displayName}
                      className="animate-fade-in shrink-0 select-none"
                    >
                      #{displayName}
                    </Tag>
                  );
                })}
              </TagGroup.List>
            </TagGroup>
          </ScrollShadow>
        )}

        {/* Left metrics Area */}
        <div className="flex flex-1 flex-row items-center justify-start">
          <AnimatePresence>
            {charCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6, x: -5 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.6, x: -5 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 26,
                }}
                className="flex flex-row items-center gap-2"
              >
                <ProgressCircle
                  aria-label="Character limit"
                  size="sm"
                  value={percentage}
                  color={charColor}
                  className="size-5"
                >
                  <ProgressCircle.Track strokeWidth={3}>
                    <ProgressCircle.TrackCircle strokeWidth={3} />
                    <ProgressCircle.FillCircle strokeWidth={3} strokeLinecap="round" />
                  </ProgressCircle.Track>
                </ProgressCircle>
                {(charCount >= MOMENT_SHORT_FORM_CHARACTER_LIMIT - 40 ||
                  charCount >= warningThreshold) && (
                  <span
                    className={`font-mono text-xs font-medium ${
                      charCount >= MOMENT_CHARACTER_LIMIT ? "text-danger" : "text-warning"
                    }`}
                  >
                    {charCount >= warningThreshold
                      ? MOMENT_CHARACTER_LIMIT - charCount
                      : `${charCount}/${MOMENT_CHARACTER_LIMIT}`}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button variant="primary" onPress={onPublish} isDisabled={isSubmitDisabled} size="sm">
          {isSubmitting ? (
            <Spinner size="sm" color="current" className="mr-1.5" />
          ) : (
            <Icon icon="gravity-ui:location-arrow-fill" className="size-4" />
          )}
          {isSubmitting ? "Sharing..." : "Share"}
        </Button>
      </div>
    </div>
  );
};
