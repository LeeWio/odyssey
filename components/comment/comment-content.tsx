"use client";

import { Alert, Button, TextArea, TextField, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

interface CommentContentProps {
  content: string;
  isEditing: boolean;
  onEditSave: (newContent: string) => void;
  onEditCancel: () => void;
  isReported?: boolean;
  isEdited?: boolean;
}

export function CommentContent({
  content,
  isEditing,
  onEditSave,
  onEditCancel,
  isReported = false,
  isEdited = false,
}: CommentContentProps) {
  const [editedText, setEditedText] = useState(content);

  useEffect(() => {
    const timer = setTimeout(() => {
      setEditedText(content);
    }, 0);
    return () => clearTimeout(timer);
  }, [content]);

  if (isEditing) {
    return (
      <div className="mt-1 flex w-full flex-col gap-2">
        <TextField isRequired fullWidth name="edit-comment">
          <TextArea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            variant="secondary"
            fullWidth
            maxLength={1000}
            rows={3}
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
            <Icon icon="lucide:check" className="mr-1.5 size-3.5" />
            Save Changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {isReported ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Dialogue Under Review</Alert.Title>
            <Alert.Description>
              This resonance has been flagged and is currently awaiting moderation review.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <div className="wrap-break-word whitespace-pre-wrap">
          <Typography type="body-sm">{content}</Typography>
        </div>
      )}

      {isEdited && !isReported && (
        <span className="text-default-400 mt-1 inline-block font-mono text-[10px] font-semibold tracking-wider select-none">
          (edited)
        </span>
      )}
    </>
  );
}
