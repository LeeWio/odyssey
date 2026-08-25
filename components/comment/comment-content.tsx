"use client";

import { Check } from "@gravity-ui/icons";
import { Button, Chip, TextArea, TextField, Typography } from "@heroui/react";
import { useEffect, useState } from "react";

interface CommentContentProps {
  content: string;
  isEditing: boolean;
  onEditSave: (newContent: string) => void;
  onEditCancel: () => void;
  isEdited?: boolean;
  isDeleted?: boolean;
}

export function CommentContent({
  content,
  isEditing,
  onEditSave,
  onEditCancel,
  isEdited = false,
  isDeleted = false,
}: CommentContentProps) {
  const [editedText, setEditedText] = useState(content);

  useEffect(() => {
    const timer = setTimeout(() => setEditedText(content), 0);

    return () => clearTimeout(timer);
  }, [content]);

  if (isEditing) {
    return (
      <div className="flex w-full flex-col gap-2 pt-1">
        <TextField isRequired fullWidth name="edit-comment" aria-label="Edit comment">
          <TextArea
            autoFocus
            fullWidth
            maxLength={1000}
            rows={3}
            value={editedText}
            variant="secondary"
            onChange={(event) => setEditedText(event.target.value)}
          />
        </TextField>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onPress={onEditCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            isDisabled={!editedText.trim() || editedText.trim() === content}
            onPress={() => onEditSave(editedText.trim())}
          >
            <Check />
            Save
          </Button>
        </div>
      </div>
    );
  }

  if (isDeleted) {
    return (
      <Chip size="sm" variant="soft">
        Comment deleted
      </Chip>
    );
  }

  return (
    <Typography type="body" className="[overflow-wrap:anywhere] whitespace-pre-wrap">
      {content}
      {isEdited && (
        <Chip size="sm" variant="soft" className="ml-2 inline-flex align-middle">
          Edited
        </Chip>
      )}
    </Typography>
  );
}
