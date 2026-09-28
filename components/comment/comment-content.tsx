"use client";

import { Button, TextArea, TextField, Typography, toast } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

interface CommentContentProps {
  content: string;
  isEditing: boolean;
  onEditSave: (newContent: string) => Promise<boolean>;
  onEditCancel: () => void;
  isEdited?: boolean;
  isDeleted?: boolean;
}

// Mount a fresh editor for each edit session. Background refetches must not
// overwrite a user's work; cancelling unmounts and discards that session.
function CommentEditor({
  content,
  onEditSave,
  onEditCancel,
}: Pick<CommentContentProps, "content" | "onEditSave" | "onEditCancel">) {
  const t = useTranslations("Comments");
  const [editedText, setEditedText] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const trimmedText = editedText.trim();
  const unchanged = trimmedText === content.trim();

  const save = async () => {
    if (saving.current || !trimmedText || unchanged) return;
    saving.current = true;
    setIsSaving(true);
    try {
      if (await onEditSave(trimmedText)) onEditCancel();
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
    <div className="flex w-full flex-col gap-2 pt-1">
      <TextField
        isRequired
        fullWidth
        name="edit-comment"
        aria-label={t("editComment")}
        isReadOnly={isSaving}
      >
        <TextArea
          autoFocus
          aria-label={t("editComment")}
          fullWidth
          maxLength={1000}
          rows={3}
          value={editedText}
          variant="secondary"
          onChange={(event) => setEditedText(event.target.value)}
        />
      </TextField>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" isDisabled={isSaving} onPress={onEditCancel}>
          {t("cancel")}
        </Button>
        <Button
          size="sm"
          variant="primary"
          isPending={isSaving}
          isDisabled={isSaving || !trimmedText || unchanged}
          onPress={() => void save()}
        >
          {t("save")}
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
    <Typography
      type="body-sm"
      className="text-foreground/90 leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap"
    >
      {content}
      {isEdited ? (
        <span className="text-muted ml-1.5 text-xs font-normal not-italic">{t("edited")}</span>
      ) : null}
    </Typography>
  );
}
