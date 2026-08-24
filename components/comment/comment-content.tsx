"use client";

import { Check } from "@gravity-ui/icons";
import { Alert, Button, TextArea, TextField } from "@heroui/react";
import { useEffect, useState } from "react";

interface CommentContentProps {
  content: string;
  isEditing: boolean;
  onEditSave: (newContent: string) => void;
  onEditCancel: () => void;
  isReported?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
}

export function CommentContent({
  content,
  isEditing,
  onEditSave,
  onEditCancel,
  isReported = false,
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

  if (isReported) {
    return (
      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Comment under review</Alert.Title>
          <Alert.Description>
            This comment has been reported to the moderation team.
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  if (isDeleted) {
    return <p className="text-muted text-[15px] leading-[1.45] italic">[Comment deleted]</p>;
  }

  return (
    <p className="text-foreground/90 text-[15px] leading-[1.45] [overflow-wrap:anywhere] whitespace-pre-wrap">
      {content}
      {isEdited && <span className="text-muted ml-2 text-xs">Edited</span>}
    </p>
  );
}
