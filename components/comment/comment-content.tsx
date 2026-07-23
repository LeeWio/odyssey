"use client";

import React, { useState, useEffect } from "react";
import { Button, TextArea, TextField, Typography, Alert } from "@heroui/react";
import { Icon } from "@iconify/react";

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
  }, [content, isEditing]);

  if (isEditing) {
    return (
      <div className="mt-1 flex w-full flex-col gap-2">
        <TextField isRequired name="edit-comment">
          <TextArea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            variant="secondary"
            className="w-full resize-none text-sm"
            maxLength={1000}
            rows={3}
          />
        </TextField>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full font-semibold transition-all duration-150 ease-out active:scale-[0.96]"
            onPress={onEditCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="rounded-full font-semibold transition-all duration-150 ease-out active:scale-[0.96]"
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
    <div className="w-full pr-2">
      {isReported ? (
        <Alert status="danger" className="border-danger/20 mt-1 rounded-2xl p-3 shadow-none">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title className="text-xs leading-none font-bold">
              Dialogue Under Review
            </Alert.Title>
            <Alert.Description className="mt-1 text-[11px] leading-relaxed opacity-90">
              This resonance has been flagged and is currently awaiting moderation review.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <Typography
          type="body-sm"
          className="text-foreground/90 text-sm leading-relaxed break-words whitespace-pre-wrap"
        >
          {content}
        </Typography>
      )}

      {isEdited && !isReported && (
        <span className="text-default-400 mt-1 inline-block font-mono text-[10px] font-semibold tracking-wider select-none">
          (edited)
        </span>
      )}
    </div>
  );
}
