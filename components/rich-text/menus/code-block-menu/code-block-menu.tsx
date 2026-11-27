"use client";

import { Pencil, Plus, TrashBin } from "@gravity-ui/icons";
import {
  Button,
  Input,
  Label,
  ListBox,
  Popover,
  Select,
  Switch,
  TextField,
  Tooltip,
} from "@heroui/react";
import { RichTextEditor, useRichTextEditor } from "@heroui-pro/react/rich-text-editor";
import { isNodeSelection } from "@tiptap/core";
import { useTranslations } from "next-intl";
import { useCallback, useLayoutEffect, useState } from "react";
import { CODE_BLOCK_CHROMES } from "../../code-block/code-block-chrome";
import { CODE_BLOCK_FRAMES } from "../../code-block/code-block-frame";
import { HIGHLIGHTED_CODE_BLOCK } from "../../code-block/code-block-schema";
import {
  CODE_LANGUAGES,
  EMPTY_SNIPPET,
  resolveCodeLanguage,
  type CodeSnippet,
} from "../../code-block/code-snippets";
import { BubbleMenu } from "../bubble-menu";
import type { ShouldShowProps } from "../types";
import type { CodeBlockMenuTarget } from "./code-block-menu-provider";

export const CODE_BLOCK_MENU_KEY = "code-block-menu";

type NameAction = "add" | "rename";

function SnippetNameAction({
  action,
  initialName = "",
  onConfirm,
}: {
  action: NameAction;
  initialName?: string;
  onConfirm: (name: string) => void;
}) {
  const t = useTranslations("CodeBlock");
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const trimmedName = name.trim();
  const label = t(action === "add" ? "addSnippet" : "renameSnippet");
  const trigger =
    action === "add" ? (
      <Button aria-label={label} size="sm" variant="ghost">
        <Plus aria-hidden="true" />
        {t("confirmAdd")}
      </Button>
    ) : (
      <Tooltip isDisabled={isOpen}>
        <Button aria-label={label} isIconOnly size="sm" variant="ghost">
          <Pencil aria-hidden="true" />
        </Button>
        <Tooltip.Content>{label}</Tooltip.Content>
      </Tooltip>
    );

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (open) setName(initialName);
        setIsOpen(open);
      }}
    >
      {trigger}
      <Popover.Content isNonModal placement="top" className="w-72 max-w-[calc(100dvw-2rem)]">
        <Popover.Dialog className="flex flex-col gap-3">
          <Popover.Heading>{label}</Popover.Heading>
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const submittedName = new FormData(event.currentTarget).get("snippetName");
              const nextName = typeof submittedName === "string" ? submittedName.trim() : "";
              if (!nextName) return;
              setIsOpen(false);
              onConfirm(nextName);
            }}
          >
            <TextField autoFocus name="snippetName" value={name} onChange={setName}>
              <Label>{t("snippetName")}</Label>
              <Input
                maxLength={80}
                placeholder={t("snippetNamePlaceholder")}
                variant="secondary"
                onFocus={action === "rename" ? (event) => event.currentTarget.select() : undefined}
              />
            </TextField>
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="ghost" onPress={() => setIsOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" size="sm" isDisabled={!trimmedName}>
                {t(action === "add" ? "confirmAdd" : "save")}
              </Button>
            </div>
          </form>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

function CodeBlockMenuActions({
  snippets,
  selectedIndex,
  chrome,
  frame,
  showLineNumbers,
  onSnippetsChange,
  onChromeChange,
  onFrameChange,
  onLineNumbersChange,
}: CodeBlockMenuTarget) {
  const t = useTranslations("CodeBlock");
  const snippet = snippets[selectedIndex]!;
  const languageId = resolveCodeLanguage(snippet.language);
  const unknownLanguage = languageId ? null : snippet.language;

  const updateSnippet = (changes: Partial<CodeSnippet>) =>
    onSnippetsChange(
      snippets.map((item, index) => (index === selectedIndex ? { ...item, ...changes } : item)),
      selectedIndex
    );

  return (
    <>
      <RichTextEditor.ToolbarGroup aria-label={t("snippets")}>
        {chrome === "segment" && (
          <SnippetNameAction
            action="add"
            onConfirm={(name) =>
              onSnippetsChange([...snippets, { ...EMPTY_SNIPPET, name }], snippets.length)
            }
          />
        )}
        <SnippetNameAction
          action="rename"
          initialName={snippet.name}
          onConfirm={(name) => updateSnippet({ name })}
        />
        {snippets.length > 1 && (
          <Tooltip>
            <Button
              aria-label={t("removeSnippet")}
              isIconOnly
              size="sm"
              variant="danger-soft"
              onPress={() =>
                onSnippetsChange(
                  snippets.filter((_, index) => index !== selectedIndex),
                  Math.max(0, selectedIndex - 1)
                )
              }
            >
              <TrashBin aria-hidden="true" />
            </Button>
            <Tooltip.Content>{t("removeSnippet")}</Tooltip.Content>
          </Tooltip>
        )}
      </RichTextEditor.ToolbarGroup>
      <Select
        aria-label={t("language")}
        className="w-28"
        value={languageId ?? (unknownLanguage ? "custom" : "plain")}
        variant="secondary"
        onChange={(key) => {
          if (typeof key === "string" && key !== "custom") {
            updateSnippet({ language: key === "plain" ? null : key });
          }
        }}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="plain" textValue={t("plainText")}>
              {t("plainText")}
              <ListBox.ItemIndicator />
            </ListBox.Item>
            {unknownLanguage && (
              <ListBox.Item id="custom" textValue={unknownLanguage}>
                {unknownLanguage}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
            {Object.entries(CODE_LANGUAGES).map(([language, label]) => (
              <ListBox.Item id={language} key={language} textValue={label}>
                {label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      <Select
        aria-label={t("chrome")}
        className="w-28"
        value={chrome}
        variant="secondary"
        onChange={(key) => {
          const option = CODE_BLOCK_CHROMES.find((chrome) => chrome === key);
          if (option) onChromeChange(option);
        }}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {CODE_BLOCK_CHROMES.map((option) => (
              <ListBox.Item
                key={option}
                id={option}
                isDisabled={snippets.length > 1 && option !== "segment"}
                textValue={t(`chromeOptions.${option}`)}
              >
                {t(`chromeOptions.${option}`)}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      <Select
        aria-label={t("frame")}
        className="w-24"
        value={frame}
        variant="secondary"
        onChange={(key) => {
          const option = CODE_BLOCK_FRAMES.find((frame) => frame === key);
          if (option) onFrameChange(option);
        }}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {CODE_BLOCK_FRAMES.map((option) => (
              <ListBox.Item key={option} id={option} textValue={t(`frameOptions.${option}`)}>
                {t(`frameOptions.${option}`)}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      <Switch size="sm" isSelected={showLineNumbers} onChange={onLineNumbersChange}>
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Label>{t("showLineNumbers")}</Label>
        </Switch.Content>
      </Switch>
    </>
  );
}

export function CodeBlockMenu({ target }: { target: CodeBlockMenuTarget | null }) {
  const t = useTranslations("CodeBlock");
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  const shouldShow = useCallback(
    ({ state, view }: ShouldShowProps) =>
      !isDisabled &&
      !isReadOnly &&
      !view.dragging &&
      isNodeSelection(state.selection) &&
      state.selection.node.type.name === HIGHLIGHTED_CODE_BLOCK,
    [isDisabled, isReadOnly]
  );
  const scrollTarget = editor?.view.dom.closest<HTMLElement>(
    '[data-slot="rich-text-editor-content"]'
  );

  useLayoutEffect(() => {
    if (target) editor?.commands.setMeta(CODE_BLOCK_MENU_KEY, "updatePosition");
  }, [editor, target]);

  return (
    <BubbleMenu
      aria-label={t("menu")}
      options={{
        placement: "bottom",
        scrollTarget: scrollTarget ?? undefined,
        shift: { padding: 12 },
      }}
      pluginKey={CODE_BLOCK_MENU_KEY}
      shouldShow={shouldShow}
      toolbarProps={{ className: "max-w-[calc(100dvw-1.5rem)] flex-wrap justify-center" }}
      updateDelay={0}
    >
      {target && <CodeBlockMenuActions {...target} />}
    </BubbleMenu>
  );
}
