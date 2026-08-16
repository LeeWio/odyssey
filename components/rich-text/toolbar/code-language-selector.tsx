"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react";
import { Code } from "@gravity-ui/icons";

const CODE_LANGUAGES = [
  { id: "plain", label: "Plain text", value: null },
  { id: "bash", label: "Bash", value: "bash" },
  { id: "css", label: "CSS", value: "css" },
  { id: "html", label: "HTML", value: "html" },
  { id: "javascript", label: "JavaScript", value: "javascript" },
  { id: "json", label: "JSON", value: "json" },
  { id: "markdown", label: "Markdown", value: "markdown" },
  { id: "python", label: "Python", value: "python" },
  { id: "sql", label: "SQL", value: "sql" },
  { id: "typescript", label: "TypeScript", value: "typescript" },
] as const;

export function CodeLanguageSelector() {
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  const codeBlockState = useRichTextEditorState(({ editor: currentEditor }) => ({
    isActive: currentEditor?.isActive("codeBlock") ?? false,
    language: (currentEditor?.getAttributes("codeBlock").language as string | null) ?? null,
  }));

  const selectedLanguage = codeBlockState?.language ?? null;
  const selectedId =
    CODE_LANGUAGES.find((language) => language.value === selectedLanguage)?.id ?? "plain";
  const selectedLabel =
    CODE_LANGUAGES.find((language) => language.id === selectedId)?.label ?? "Plain text";
  const unavailable = isDisabled || isReadOnly || !editor || !codeBlockState?.isActive;
  const trigger = (
    <Button
      aria-label={`Code language: ${selectedLabel}`}
      isDisabled={unavailable}
      size="sm"
      variant="tertiary"
    >
      <Code aria-hidden="true" className="size-4" />
      <span className="text-xs">{selectedLabel}</span>
    </Button>
  );

  if (unavailable) return trigger;

  return (
    <Dropdown>
      {trigger}
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu
          aria-label="Choose code language"
          selectedKeys={new Set([selectedId])}
          selectionMode="single"
          onAction={(key) => {
            const language = CODE_LANGUAGES.find((item) => item.id === String(key));

            if (!editor || !language) return;

            editor
              .chain()
              .focus()
              .updateAttributes("codeBlock", { language: language.value })
              .run();
          }}
        >
          {CODE_LANGUAGES.map((language) => (
            <Dropdown.Item id={language.id} key={language.id} textValue={language.label}>
              <Label className="flex-1">{language.label}</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
