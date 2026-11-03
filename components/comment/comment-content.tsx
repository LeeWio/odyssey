"use client";

import { Button, Typography, toast } from "@heroui/react";
import { useTranslations } from "next-intl";
import { createContext, useContext, useRef, useState } from "react";
import { CommentBody } from "./comment-body";
import { CommentComposerEditor } from "./comment-composer-editor";
import { parseCommentDocument, serializeCommentDocument } from "./comment-document";

interface CommentContentProps {
  content: string;
  isEditing: boolean;
  onEditSave: (newContent: string) => Promise<boolean>;
  onEditCancel: () => void;
  isEdited?: boolean;
  isDeleted?: boolean;
}

interface CommentEditSessionValue {
  formId: string;
  source: string;
  canSave: boolean;
  isSaving: boolean;
  setDocument: (serialized: string, isEmpty: boolean) => void;
  save: () => Promise<void>;
}

const CommentEditSessionContext = createContext<CommentEditSessionValue | null>(null);

export function useCommentEditSession() {
  const session = useContext(CommentEditSessionContext);
  if (!session) {
    throw new Error("useCommentEditSession must be used within a CommentEditSession");
  }
  return session;
}

export function CommentEditSession({
  content,
  formId,
  onEditSave,
  onEditCancel,
  children,
}: {
  content: string;
  formId: string;
  onEditSave: (newContent: string) => Promise<boolean>;
  onEditCancel: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations("Comments");
  const [editedDocument, setEditedDocument] = useState(content);
  const [editorEmpty, setEditorEmpty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const unchanged = editedDocument === content;

  const setDocument = (serialized: string, isEmpty: boolean) => {
    setEditedDocument(serialized);
    setEditorEmpty(isEmpty);
  };

  const save = async () => {
    if (saving.current || editorEmpty || unchanged) return;
    saving.current = true;
    setIsSaving(true);
    try {
      if (await onEditSave(editedDocument)) onEditCancel();
    } catch {
      // The normal mutation path handles API errors and returns false. Keep
      // the draft even if a caller unexpectedly rejects instead.
      toast.danger(t("updateFailed"));
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };

  return (
    <CommentEditSessionContext.Provider
      value={{
        formId,
        source: content,
        setDocument,
        canSave: !editorEmpty && !unchanged,
        isSaving,
        save,
      }}
    >
      {children}
    </CommentEditSessionContext.Provider>
  );
}

export function CommentEditFields() {
  const t = useTranslations("Comments");
  const { isSaving, setDocument, source } = useCommentEditSession();

  return (
    <CommentComposerEditor
      defaultValue={parseCommentDocument(source)}
      isReadOnly={isSaving}
      placeholder={t("editComment")}
      resetKey={source}
      onDocumentChange={(document, isEmpty) =>
        setDocument(serializeCommentDocument(document), isEmpty)
      }
    />
  );
}

// Mount a fresh editor for each edit session. Background refetches must not
// overwrite a user's work; cancelling unmounts and discards that session.
function CommentEditor({
  content,
  onEditSave,
  onEditCancel,
}: Pick<CommentContentProps, "content" | "onEditSave" | "onEditCancel">) {
  const t = useTranslations("Comments");

  return (
    <CommentEditSession
      content={content}
      formId="inline-comment-edit"
      onEditCancel={onEditCancel}
      onEditSave={onEditSave}
    >
      <InlineCommentEditor
        cancelLabel={t("cancel")}
        saveLabel={t("save")}
        onCancel={onEditCancel}
      />
    </CommentEditSession>
  );
}

function InlineCommentEditor({
  cancelLabel,
  saveLabel,
  onCancel,
}: {
  cancelLabel: string;
  saveLabel: string;
  onCancel: () => void;
}) {
  const { canSave, isSaving, save } = useCommentEditSession();

  return (
    <div className="flex w-full flex-col gap-2 pt-1">
      <CommentEditFields />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" isDisabled={isSaving} onPress={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          size="sm"
          variant="primary"
          isPending={isSaving}
          isDisabled={isSaving || !canSave}
          onPress={() => void save()}
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

export function CommentContent({
  content,
  isEditing,
  onEditSave,
  onEditCancel,
  isEdited = false,
  isDeleted = false,
}: CommentContentProps) {
  const t = useTranslations("Comments");
  if (isDeleted) {
    return (
      <Typography color="muted" type="body-sm" className="italic">
        {t("deleted")}
      </Typography>
    );
  }

  if (isEditing) {
    return <CommentEditor content={content} onEditSave={onEditSave} onEditCancel={onEditCancel} />;
  }

  return (
    <div>
      <CommentBody content={content} />
      {isEdited ? (
        <span className="text-muted ml-1.5 text-xs font-normal not-italic">{t("edited")}</span>
      ) : null}
    </div>
  );
}
