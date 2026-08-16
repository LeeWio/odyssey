"use client";

import {
  Button,
  CloseButton,
  Input,
  Label,
  Popover,
  Surface,
  Switch,
  TextField,
  Tooltip,
} from "@heroui/react";
import { CellSwitch, useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react";
import { ArrowRight, ChevronDown, ChevronUp, Magnifier } from "@gravity-ui/icons";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

const REGEX_EXAMPLES = [
  { label: "Any middle letter", pattern: "c.t" },
  { label: "Either term", pattern: "cat|tiptap" },
  { label: "Uppercase or lowercase C", pattern: "[Cc]at" },
] as const;

export function FindReplacePopover() {
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  const [isOpen, setIsOpen] = useState(false);
  const findInputRef = useRef<HTMLInputElement>(null);
  const findState = useRichTextEditorState(({ editor: currentEditor }) => {
    const storage = currentEditor?.storage.findAndReplace;

    return {
      caseSensitive: storage?.caseSensitive ?? false,
      currentIndex: storage?.currentIndex ?? null,
      replaceTerm: storage?.replaceTerm ?? "",
      resultCount: storage?.results.length ?? 0,
      searchTerm: storage?.searchTerm ?? "",
      useRegex: storage?.useRegex ?? false,
      wholeWord: storage?.wholeWord ?? false,
    };
  });

  const resultCount = findState?.resultCount ?? 0;
  const currentResult = resultCount > 0 ? (findState?.currentIndex ?? 0) + 1 : 0;
  const unavailable = isDisabled || isReadOnly || !editor;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "f"
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element) || !target.closest('[data-slot="rich-text-editor"]')) {
        return;
      }

      event.preventDefault();
      setIsOpen(true);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const animationFrame = requestAnimationFrame(() => {
      findInputRef.current?.focus();
      findInputRef.current?.select();
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      setIsOpen(false);
      editor?.commands.clearSearch();
    };

    document.addEventListener("keydown", handleEscape, { capture: true });

    return () => document.removeEventListener("keydown", handleEscape, { capture: true });
  }, [editor, isOpen]);

  const handleOpenChange = (nextIsOpen: boolean) => {
    setIsOpen(nextIsOpen);

    if (!nextIsOpen) {
      editor?.commands.clearSearch();
    }
  };

  const navigate = (direction: "next" | "previous") => {
    if (!editor || resultCount === 0) return;

    if (direction === "next") {
      editor.commands.goToNextResult();
    } else {
      editor.commands.goToPreviousResult();
    }
  };

  const handleFindKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleOpenChange(false);
      return;
    }

    if (event.key !== "Enter") return;

    event.preventDefault();
    navigate(event.shiftKey ? "previous" : "next");
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Button aria-label="Find and replace" isDisabled={unavailable} size="sm" variant="tertiary">
        <Magnifier aria-hidden="true" className="size-4" />
        Find
      </Button>
      <Popover.Content
        className="w-[min(23rem,calc(100vw-1rem))] overflow-hidden p-0"
        placement="bottom start"
      >
        <Popover.Dialog className="flex max-h-[min(38rem,calc(100vh-2rem))] flex-col p-0">
          <Popover.Arrow />
          <Popover.Heading className="sr-only">Find and replace</Popover.Heading>

          <div className="flex items-center gap-1 px-4 pt-3">
            <span
              aria-atomic="true"
              aria-live="polite"
              className="text-muted mr-auto text-sm font-medium tabular-nums"
            >
              {currentResult} / {resultCount}
            </span>
            <Tooltip delay={0}>
              <Button
                aria-label="Previous match"
                isDisabled={resultCount === 0}
                isIconOnly
                size="sm"
                variant="tertiary"
                onPress={() => navigate("previous")}
              >
                <ChevronUp aria-hidden="true" className="size-4" />
              </Button>
              <Tooltip.Content>Previous match (Shift+Enter)</Tooltip.Content>
            </Tooltip>
            <Tooltip delay={0}>
              <Button
                aria-label="Next match"
                isDisabled={resultCount === 0}
                isIconOnly
                size="sm"
                variant="tertiary"
                onPress={() => navigate("next")}
              >
                <ChevronDown aria-hidden="true" className="size-4" />
              </Button>
              <Tooltip.Content>Next match (Enter)</Tooltip.Content>
            </Tooltip>
            <CloseButton
              aria-label="Close find and replace"
              onPress={() => handleOpenChange(false)}
            />
          </div>

          <div className="flex flex-col gap-2 px-3 py-3">
            <TextField name="find-text" variant="secondary">
              <Label className="sr-only">Find text</Label>
              <Input
                ref={findInputRef}
                placeholder="Find"
                value={findState?.searchTerm ?? ""}
                onChange={(event) => editor?.commands.setSearchTerm(event.target.value)}
                onKeyDown={handleFindKeyDown}
              />
            </TextField>

            <TextField name="replace-text" variant="secondary">
              <Label className="sr-only">Replace with</Label>
              <Input
                placeholder="Replace"
                value={findState?.replaceTerm ?? ""}
                onChange={(event) => editor?.commands.setReplaceTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Escape") return;

                  event.preventDefault();
                  handleOpenChange(false);
                }}
              />
            </TextField>

            <div className="flex flex-col gap-1 pt-1">
              <CellSwitch
                aria-label="Match case"
                isSelected={findState?.caseSensitive ?? false}
                variant="secondary"
                onChange={(selected) => editor?.commands.setCaseSensitive(selected)}
              >
                <CellSwitch.Trigger>
                  <CellSwitch.Label>
                    <span aria-hidden="true" className="mr-2 text-xs font-semibold">
                      Aa
                    </span>
                    Match case
                  </CellSwitch.Label>
                  <CellSwitch.Control />
                </CellSwitch.Trigger>
              </CellSwitch>
              <CellSwitch
                aria-label="Whole words"
                isDisabled={findState?.useRegex ?? false}
                isSelected={findState?.wholeWord ?? false}
                variant="secondary"
                onChange={(selected) => editor?.commands.setWholeWord(selected)}
              >
                <CellSwitch.Trigger>
                  <CellSwitch.Label>
                    <span aria-hidden="true" className="mr-2 text-xs font-semibold underline">
                      ab
                    </span>
                    Whole words
                  </CellSwitch.Label>
                  <CellSwitch.Control />
                </CellSwitch.Trigger>
              </CellSwitch>
            </div>
          </div>

          <div className="border-border border-t px-3 py-3">
            <Switch
              aria-label="Use regular expression"
              className="w-full"
              isSelected={findState?.useRegex ?? false}
              onChange={(selected) => editor?.commands.setUseRegex(selected)}
            >
              <Switch.Content className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm font-medium">
                Use regular expression
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Content>
            </Switch>
          </div>

          {findState?.useRegex ? (
            <div className="border-border min-h-0 overflow-y-auto border-t px-3 py-3">
              <Surface className="flex flex-col gap-1 rounded-2xl p-2" variant="secondary">
                <p className="text-muted px-2 py-1 text-sm font-medium">Try a search pattern</p>
                {REGEX_EXAMPLES.map((example) => (
                  <Button
                    key={example.pattern}
                    className="h-auto w-full justify-between px-2 py-2 font-normal"
                    variant="tertiary"
                    onPress={() => {
                      editor?.commands.setSearchTerm(example.pattern);
                      findInputRef.current?.focus();
                    }}
                  >
                    <span className="min-w-0 text-left text-sm">
                      {example.label}:{" "}
                      <code className="bg-default rounded-md px-1.5 py-0.5 font-mono text-xs">
                        {example.pattern}
                      </code>
                    </span>
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
                  </Button>
                ))}
              </Surface>
            </div>
          ) : null}

          <div className="border-border flex justify-end gap-1 border-t px-3 py-3">
            <Button
              isDisabled={resultCount === 0}
              size="sm"
              variant="tertiary"
              onPress={() => editor?.commands.replace()}
            >
              Replace
            </Button>
            <Button
              isDisabled={resultCount === 0}
              size="sm"
              variant="secondary"
              onPress={() => editor?.commands.replaceAll()}
            >
              Replace all
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
