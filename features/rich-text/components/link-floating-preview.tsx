"use client";

import { Button, Separator, Toolbar } from "@heroui/react";

export interface LinkFloatingPreviewProps {
  onEdit: () => void;
  onUnlink: () => void;
}

export function LinkFloatingPreview({ onEdit, onUnlink }: LinkFloatingPreviewProps) {
  return (
    <Toolbar isAttached>
      <Button size="sm" onPress={onEdit} variant="tertiary">
        Edit link
      </Button>

      <Separator orientation="vertical" />

      <button
        type="button"
        onClick={onUnlink}
        className="text-destructive hover:text-destructive/80 px-2 py-1 text-sm"
      >
        Unlink
      </button>
    </Toolbar>
  );
}
