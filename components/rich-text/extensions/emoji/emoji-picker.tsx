"use client";

import { Magnifier } from "@gravity-ui/icons";
import { Button, EmptyState, ScrollShadow, SearchField, Tooltip } from "@heroui/react";
import { EMOJI_CATEGORIES, EMOJI_SKIN_TONES, EmojiPicker } from "@heroui-pro/react";
import emojisList from "emojibase-data/en/compact.json";
import {
  forwardRef,
  type Key,
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

type Emoji = (typeof emojisList)[0];

const emojis: Emoji[] = emojisList.filter(
  (emoji) => typeof emoji.label === "string" && !emoji.label.startsWith("regional indicator")
);

const CATEGORY_GROUP_MAP: Record<string, number> = {
  activities: 6,
  "animals-nature": 3,
  flags: 9,
  "food-drink": 4,
  objects: 7,
  "people-body": 1,
  "smileys-emotion": 0,
  symbols: 8,
  "travel-places": 5,
};

export interface InlineEmojiPickerHandle {
  focusSearch: () => void;
}

interface EmojiPickerContentProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onSkinToneChange: (skinTone: string) => void;
  skinTone: string;
}

function EmojiPickerContent({ inputRef, onSkinToneChange, skinTone }: EmojiPickerContentProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const displayEmojis = useMemo(() => {
    const skinIndex = EMOJI_SKIN_TONES.findIndex((tone) => tone.id === skinTone) - 1;

    if (skinIndex < 0) return emojis;

    return emojis.map((emoji) => {
      const skin = emoji.skins?.[skinIndex];

      if (!skin) return emoji;

      return { ...emoji, unicode: skin.unicode };
    });
  }, [skinTone]);

  const categoryStartIndices = useMemo(() => {
    const indices: Record<string, number> = {};

    for (const [categoryId, groupNum] of Object.entries(CATEGORY_GROUP_MAP)) {
      const index = displayEmojis.findIndex((emoji) => emoji.group === groupNum);

      if (index !== -1) indices[categoryId] = index;
    }

    return indices;
  }, [displayEmojis]);

  const scrollToCategory = (categoryId: string) => {
    const grid = gridRef.current;

    if (!grid) return;
    const index = categoryStartIndices[categoryId];

    if (index === undefined) return;
    const itemSize = 38;
    const itemsPerRow = Math.floor(grid.clientWidth / itemSize);
    const scrollTop = Math.floor(index / itemsPerRow) * itemSize;

    grid.scrollTo({ behavior: "smooth", top: scrollTop });
  };

  return (
    <>
      <SearchField aria-label="Search emoji" variant="secondary">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input ref={inputRef} placeholder="Search emoji..." />
          <EmojiPicker.SkinTonePicker value={skinTone} onChange={onSkinToneChange}>
            <EmojiPicker.SkinToneTrigger className="mr-1" />
            <EmojiPicker.SkinToneContent>
              {EMOJI_SKIN_TONES.map((tone) => (
                <EmojiPicker.SkinToneOption key={tone.id} aria-label={tone.label} id={tone.id}>
                  {tone.emoji}
                </EmojiPicker.SkinToneOption>
              ))}
            </EmojiPicker.SkinToneContent>
          </EmojiPicker.SkinTonePicker>
        </SearchField.Group>
      </SearchField>
      <EmojiPicker.Grid
        ref={gridRef}
        items={displayEmojis}
        renderEmptyState={() => (
          <EmptyState className="flex h-full min-h-20 flex-1 flex-col items-center justify-center gap-2">
            <Magnifier className="text-muted size-5" />
            No emoji found.
          </EmptyState>
        )}
      >
        {(item) => (
          <EmojiPicker.Item
            id={String(item.unicode)}
            textValue={`${item.label || ""} ${Array.isArray(item.tags) ? item.tags.join(" ") : ""}`}
          >
            {item.unicode}
          </EmojiPicker.Item>
        )}
      </EmojiPicker.Grid>
      <EmojiPicker.Footer>
        <ScrollShadow hideScrollBar orientation="horizontal">
          <div className="flex items-center gap-1 overflow-visible px-2 py-0.5 pr-3">
            {EMOJI_CATEGORIES.map(({ emoji, id, label }) => (
              <Tooltip key={emoji} delay={0}>
                <Button
                  excludeFromTabOrder
                  isIconOnly
                  aria-label={label}
                  className="hover:bg-muted/20 flex size-6 shrink-0 items-center justify-center rounded-full rounded-md"
                  variant="ghost"
                  onPress={() => scrollToCategory(id)}
                >
                  <span className="text-base" tabIndex={-1}>
                    {emoji}
                  </span>
                </Button>
                <Tooltip.Content placement="top">
                  <p>{label}</p>
                </Tooltip.Content>
              </Tooltip>
            ))}
          </div>
        </ScrollShadow>
      </EmojiPicker.Footer>
    </>
  );
}

interface InlineEmojiPickerProps {
  onDismiss?: () => void;
  onSelect: (unicode: string) => void;
}

export const InlineEmojiPicker = forwardRef<InlineEmojiPickerHandle, InlineEmojiPickerProps>(
  function InlineEmojiPicker({ onDismiss, onSelect }, ref) {
    const [skinTone, setSkinTone] = useState("default");
    const inputRef = useRef<HTMLInputElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      focusSearch: () => inputRef.current?.focus(),
    }));

    useEffect(() => {
      if (!onDismiss) return;

      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target;

        if (!(target instanceof Node)) return;
        if (pickerRef.current?.contains(target)) return;
        if (
          target instanceof Element &&
          target.closest('[data-slot="emoji-picker-skin-tone-options"]')
        ) {
          return;
        }

        onDismiss();
      };

      document.addEventListener("pointerdown", handlePointerDown, true);
      return () => document.removeEventListener("pointerdown", handlePointerDown, true);
    }, [onDismiss]);

    const handleSkinToneChange = (value: string) => {
      setSkinTone(value);

      if (onDismiss) {
        window.requestAnimationFrame(() => inputRef.current?.focus());
      }
    };

    const handleKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Escape" || !onDismiss) return;

      event.preventDefault();
      event.stopPropagation();
      onDismiss();
    };

    return (
      <EmojiPicker
        key={skinTone}
        aria-label="Inline Emoji"
        selectedKey={null}
        size="md"
        onSelectionChange={(key: Key | null) => {
          if (key !== null) onSelect(String(key));
        }}
      >
        <div
          ref={pickerRef}
          className="emoji-picker__popover emoji-picker__popover--md relative"
          onKeyDownCapture={handleKeyDownCapture}
        >
          <EmojiPicker.Content>
            <EmojiPickerContent
              inputRef={inputRef}
              skinTone={skinTone}
              onSkinToneChange={handleSkinToneChange}
            />
          </EmojiPicker.Content>
        </div>
      </EmojiPicker>
    );
  }
);
