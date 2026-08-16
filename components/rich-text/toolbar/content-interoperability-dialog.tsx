"use client";

import { Alert, Button, Label, ListBox, Modal, Select, Tabs, TextArea, toast } from "@heroui/react";
import { useRichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

import {
  analyzeContentExport,
  analyzeContentImport,
  canImportContent,
  type ContentImportAnalysis,
  type ContentInteroperabilityFormat,
} from "../utils/content-interoperability";

const FORMAT_OPTIONS: Array<{
  id: ContentInteroperabilityFormat;
  label: string;
  extension: string;
}> = [
  { id: "markdown", label: "Markdown", extension: "md" },
  { id: "html", label: "HTML", extension: "html" },
  { id: "json", label: "Versioned JSON", extension: "json" },
];

export function ContentInteroperabilityDialog() {
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"import" | "export">("import");
  const [format, setFormat] = useState<ContentInteroperabilityFormat>("markdown");
  const [source, setSource] = useState("");
  const [analysis, setAnalysis] = useState<ContentImportAnalysis | null>(null);
  const exportAnalysis = useMemo(
    () => (isOpen && mode === "export" && editor ? analyzeContentExport(editor, format) : null),
    [editor, format, isOpen, mode]
  );
  const warnings = mode === "import" ? analysis?.warnings : exportAnalysis?.warnings;

  const inspectImport = () => {
    if (!editor || !source.trim()) return;
    setAnalysis(analyzeContentImport(editor, format, source));
  };

  const importContent = () => {
    if (!editor || !canImportContent(analysis) || !analysis?.document) return;

    editor.commands.setContent(analysis.document, {
      emitUpdate: true,
      errorOnInvalidContent: true,
    });
    setIsOpen(false);
    setSource("");
    setAnalysis(null);
    toast.success("Content imported.");
  };

  const copyExport = async () => {
    if (!exportAnalysis) return;
    try {
      await navigator.clipboard.writeText(exportAnalysis.source);
      toast.success("Export copied to clipboard.");
    } catch {
      toast.danger("Clipboard access failed. Select and copy the export manually.");
    }
  };

  const downloadExport = () => {
    if (!exportAnalysis) return;
    const selectedFormat = FORMAT_OPTIONS.find((option) => option.id === format)!;
    const mimeType =
      format === "json" ? "application/json" : format === "html" ? "text/html" : "text/markdown";
    const url = URL.createObjectURL(
      new Blob([exportAnalysis.source], { type: `${mimeType};charset=utf-8` })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `odyssey-content.${selectedFormat.extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal>
      <Button
        aria-label="Import or export content"
        isDisabled={!editor || isDisabled || isReadOnly}
        size="sm"
        variant="tertiary"
        onPress={() => setIsOpen(true)}
      >
        <Icon aria-hidden="true" className="size-4" icon="gravity-ui:arrows-rotate-left" />
        Import / export
      </Button>
      <Modal.Backdrop
        isOpen={isOpen}
        variant="blur"
        onOpenChange={(nextIsOpen) => {
          setIsOpen(nextIsOpen);
          if (!nextIsOpen) setAnalysis(null);
        }}
      >
        <Modal.Container size="lg">
          <Modal.Dialog aria-label="Import or export document content">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Content interoperability</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="gap-4">
              <Tabs
                selectedKey={mode}
                variant="secondary"
                onSelectionChange={(key) => {
                  setMode(String(key) as "import" | "export");
                  setAnalysis(null);
                }}
              >
                <Tabs.ListContainer>
                  <Tabs.List aria-label="Content operation">
                    <Tabs.Tab id="import">
                      Import
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="export">
                      Export
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
              </Tabs>

              <Select
                aria-label="Content format"
                className="w-full sm:max-w-64"
                value={format}
                variant="secondary"
                onChange={(key) => {
                  setFormat(String(key) as ContentInteroperabilityFormat);
                  setAnalysis(null);
                }}
              >
                <Label>Format</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {FORMAT_OPTIONS.map((option) => (
                      <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                        {option.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="content-interoperability-source">
                  {mode === "import" ? "Content to import" : "Export preview"}
                </Label>
                <TextArea
                  fullWidth
                  className="min-h-72 resize-y font-mono text-sm"
                  id="content-interoperability-source"
                  placeholder={
                    mode === "import"
                      ? `Paste ${FORMAT_OPTIONS.find((option) => option.id === format)?.label} here…`
                      : undefined
                  }
                  readOnly={mode === "export"}
                  rows={14}
                  value={mode === "import" ? source : (exportAnalysis?.source ?? "")}
                  onChange={(event) => {
                    setSource(event.target.value);
                    setAnalysis(null);
                  }}
                />
              </div>

              <div aria-live="polite" className="flex flex-col gap-2">
                {warnings?.map((warning, index) => (
                  <Alert
                    key={`${warning.code}-${index}`}
                    status={warning.blocking ? "danger" : "warning"}
                  >
                    <Alert.Content>
                      <Alert.Title>
                        {warning.blocking ? "Import blocked" : "Review before continuing"}
                      </Alert.Title>
                      <Alert.Description>{warning.message}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                ))}
                {mode === "import" && analysis && analysis.warnings.length === 0 && (
                  <Alert status="success">
                    <Alert.Content>
                      <Alert.Title>Ready to import</Alert.Title>
                      <Alert.Description>
                        The content passed schema and round-trip checks.
                      </Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              {mode === "import" ? (
                <>
                  <Button isDisabled={!source.trim()} variant="secondary" onPress={inspectImport}>
                    Check content
                  </Button>
                  <Button isDisabled={!canImportContent(analysis)} onPress={importContent}>
                    Import
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onPress={copyExport}>
                    Copy
                  </Button>
                  <Button onPress={downloadExport}>Download</Button>
                </>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
