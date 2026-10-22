"use client";

import { Button } from "@heroui/react";
import type { Editor, JSONContent } from "@tiptap/react";
import { useMemo, useState } from "react";

import { RichText } from "@/components/rich-text/rich-text";
import { RICH_TEXT_DOCUMENT_FIXTURE } from "@/components/rich-text/testing/rich-text-document.fixture";
import { RICH_TEXT_TYPOGRAPHY_FIXTURE } from "@/components/rich-text/testing/rich-text-typography.fixture";
import { ArticleBody } from "@/features/blog/reader/article/article-body";
import {
  clearRichTextDraft,
  readRichTextDraft,
  saveRichTextDraft,
} from "@/components/rich-text/utils/editor-draft";

const TEST_DRAFT_ID = "browser-smoke";

export default function RichTextTestClient({ typography = false }: { typography?: boolean }) {
  const initialContent = useMemo<JSONContent>(
    () =>
      typography
        ? RICH_TEXT_TYPOGRAPHY_FIXTURE
        : (readRichTextDraft(TEST_DRAFT_ID)?.content ?? RICH_TEXT_DOCUMENT_FIXTURE),
    [typography]
  );
  const [reading, setReading] = useState(false);
  const [previewContent, setPreviewContent] = useState(initialContent);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [status, setStatus] = useState("Loading editor");
  const [schemaNodes, setSchemaNodes] = useState("");

  const saveDraft = () => {
    if (!editor) return;

    const saved = saveRichTextDraft(TEST_DRAFT_ID, editor.getJSON(), {
      slug: "browser-smoke",
      status: "DRAFT",
      title: "Browser smoke test",
    });
    setStatus(saved ? "Draft saved" : "Draft save failed");
  };

  const restoreDraft = () => {
    const draft = readRichTextDraft(TEST_DRAFT_ID);

    if (!editor || !draft) {
      setStatus("No draft found");
      return;
    }

    editor.commands.setContent(draft.content, {
      emitUpdate: true,
      errorOnInvalidContent: true,
    });
    setStatus("Draft restored");
  };

  return (
    <main className="bg-background text-foreground mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-center gap-2">
        {typography ? (
          <Button
            data-testid="toggle-reading"
            size="sm"
            variant="secondary"
            onPress={() => {
              if (!reading && editor) setPreviewContent(editor.getJSON());
              setReading(!reading);
            }}
          >
            {reading ? "Edit specimen" : "Read specimen"}
          </Button>
        ) : null}
        <Button data-testid="save-draft" size="sm" variant="secondary" onPress={saveDraft}>
          Save test draft
        </Button>
        <Button
          data-testid="clear-editor"
          size="sm"
          variant="secondary"
          onPress={() => {
            editor?.commands.clearContent();
            setStatus("Editor cleared");
          }}
        >
          Clear editor
        </Button>
        <Button data-testid="restore-draft" size="sm" variant="secondary" onPress={restoreDraft}>
          Restore test draft
        </Button>
        <Button
          data-testid="clear-draft"
          size="sm"
          variant="secondary"
          onPress={() => {
            clearRichTextDraft(TEST_DRAFT_ID);
            setStatus("Draft cleared");
          }}
        >
          Clear test draft
        </Button>
        <output data-testid="draft-status">{status}</output>
        <output className="sr-only" data-testid="schema-nodes">
          {schemaNodes}
        </output>
      </header>

      <section className="border-separator min-h-[70vh] flex-1 overflow-hidden rounded-2xl border">
        {reading ? (
          <ArticleBody
            content={JSON.stringify(previewContent)}
            contentType="JSON"
            showTableOfContents={false}
          />
        ) : (
          <RichText
            content={typography ? previewContent : initialContent}
            onContentError={(error) => setStatus(`Content error: ${error.message}`)}
            onReady={(readyEditor) => {
              setEditor(readyEditor);
              setSchemaNodes(Object.keys(readyEditor.schema.nodes).sort().join(","));
              setStatus("Editor ready");
            }}
          />
        )}
      </section>
    </main>
  );
}
