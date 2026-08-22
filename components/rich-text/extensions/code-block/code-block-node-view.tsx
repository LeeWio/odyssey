"use client";

import React from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { CodeBlock } from "@heroui-pro/react/code-block";
import { Button, Dropdown, Label } from "@heroui/react";
import { useRichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";

const CODE_LANGUAGES = [
  { id: "plain", label: "Plain text", value: "plaintext" },
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

export function CodeBlockNodeView({ node, updateAttributes }: NodeViewProps) {
  const { isReadOnly } = useRichTextEditor();

  const selectedLanguage = (node.attrs.language as string) || "plaintext";
  const selectedItem = CODE_LANGUAGES.find((lang) => lang.value === selectedLanguage);
  const selectedId = selectedItem?.id || "plain";
  const selectedLabel = selectedItem?.label || "Plain text";

  const codeValue = node.textContent;

  const handleLanguageChange = (key: React.Key) => {
    const language = CODE_LANGUAGES.find((item) => item.id === String(key));
    if (language) {
      updateAttributes({ language: language.value });
    }
  };

  return (
    <NodeViewWrapper className="code-block-node-view my-4">
      <CodeBlock className="border-default-200/60 dark:border-default-100/50 bg-content1/50 dark:bg-content1/20 overflow-hidden rounded-xl border shadow-sm">
        <CodeBlock.Header className="border-default-200/60 dark:border-default-100/50 bg-default-100/30 dark:bg-default-50/10 flex items-center justify-between border-b px-4 py-2">
          {isReadOnly ? (
            <span className="text-muted text-xs font-semibold tracking-wider uppercase">
              {selectedLabel}
            </span>
          ) : (
            <Dropdown>
              <Button
                aria-label={`Code language: ${selectedLabel}`}
                size="sm"
                variant="ghost"
                className="text-default-600 hover:text-default-800 h-7 px-2 text-xs font-semibold"
              >
                <span className="uppercase">{selectedLabel}</span>
                <Icon icon="gravity-ui:chevron-down" className="ml-1 size-3.5 opacity-70" />
              </Button>
              <Dropdown.Popover placement="bottom start">
                <Dropdown.Menu
                  aria-label="Choose code language"
                  selectedKeys={new Set([selectedId])}
                  selectionMode="single"
                  onAction={handleLanguageChange}
                >
                  {CODE_LANGUAGES.map((language) => (
                    <Dropdown.Item id={language.id} key={language.id} textValue={language.label}>
                      <Label className="flex-1 cursor-pointer text-xs">{language.label}</Label>
                      <Dropdown.ItemIndicator />
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          )}
          <CodeBlock.CopyButton
            code={codeValue}
            className="text-default-500 hover:text-default-700"
          />
        </CodeBlock.Header>

        {isReadOnly ? (
          <CodeBlock.Code
            code={codeValue}
            language={selectedLanguage}
            className="overflow-x-auto bg-transparent p-4 font-mono text-sm leading-relaxed"
          />
        ) : (
          <pre className="overflow-x-auto bg-transparent p-4 font-mono text-sm leading-relaxed outline-none focus:outline-none">
            <NodeViewContent<"code"> as="code" className="outline-none focus:outline-none" />
          </pre>
        )}
      </CodeBlock>
    </NodeViewWrapper>
  );
}
