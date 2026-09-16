"use client";

import { useMemo } from "react";
import { Modal } from "@heroui/react";
import { DropZone } from "@heroui-pro/react";

import { useAppSelector } from "@/lib/hooks";
import { selectCurrentUser, selectIsAuthenticated, selectUserEmail } from "@/lib/features/auth";
import { useGetCurrentUserQuery } from "@/lib/features/user/user-api";

import { useMomentPublish } from "../../hooks/use-moment-publish";
import { MOMENT_CHARACTER_LIMIT } from "../../utils/character-count";
import { MOMENT_IMAGE_ACCEPT } from "../../utils/media-limits";
import { PublisherHeader } from "./publisher-header";
import { PublisherEditor } from "./publisher-editor";
import { PublisherGallery } from "./publisher-gallery";
import { PublisherToolbar } from "./publisher-toolbar";

import type { MomentResponse } from "@/lib/features/moment";

interface MomentPublisherProps {
  initialMoment?: MomentResponse;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const MomentPublisher = ({ isOpen, onOpenChange, initialMoment }: MomentPublisherProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const email = useAppSelector(selectUserEmail);

  const { data: currentUser } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });

  const userProfile = useMemo(() => {
    if (!isAuthenticated) return null;
    return {
      avatar: currentUser?.avatar,
      email,
      nickname: currentUser?.nickname,
      username: username,
    };
  }, [isAuthenticated, username, email, currentUser]);

  const {
    mediaItems,
    removeMedia,
    updateMediaAlt,
    retryMedia,
    hasIncompleteUploads,
    hasMissingAlt,
    submitBlockReason,
    editorValue,
    setEditorValue,
    charCount,
    setCharCount,
    isEmpty,
    setIsEmpty,
    topics,
    addTopic,
    removeTopic,
    visibility,
    setVisibility,
    isSubmitting,
    handleSelectFiles,
    handleDrop,
    publishMoment,
    attachedStockSymbol,
    setAttachedStockSymbol,
  } = useMomentPublish(() => {
    onOpenChange(false);
  }, initialMoment);

  const isSubmitDisabled =
    (isEmpty && mediaItems.length === 0 && !attachedStockSymbol) ||
    charCount > MOMENT_CHARACTER_LIMIT ||
    isSubmitting ||
    hasIncompleteUploads ||
    hasMissingAlt;

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container size="lg">
          <Modal.Dialog aria-label={initialMoment ? "Edit Moment" : "Moment Publisher"}>
            <DropZone className="w-full border-none bg-transparent p-0 shadow-none">
              <PublisherHeader
                isEditing={!!initialMoment}
                visibility={visibility}
                onVisibilityChange={(value) => {
                  if (value === "public" || value === "followers" || value === "private")
                    setVisibility(value);
                }}
                user={userProfile}
              />

              <Modal.Body className="flex flex-col gap-2">
                <DropZone.Area
                  onDrop={handleDrop}
                  className="flex w-full flex-col gap-2 border-none bg-transparent p-0 outline-none"
                >
                  <PublisherEditor
                    isEditing={!!initialMoment}
                    value={editorValue}
                    onValueChange={(val, details) => {
                      setEditorValue(val);
                      setCharCount(details.characterCount);
                      setIsEmpty(details.isEmpty);
                    }}
                    maxLength={MOMENT_CHARACTER_LIMIT}
                  />

                  <PublisherGallery
                    items={mediaItems}
                    highlightMissingAlt={hasMissingAlt}
                    onRemove={removeMedia}
                    onAltChange={updateMediaAlt}
                    onRetry={retryMedia}
                  />
                </DropZone.Area>

                <PublisherToolbar
                  charCount={charCount}
                  isSubmitting={isSubmitting}
                  isSubmitDisabled={isSubmitDisabled}
                  submitDisabledReason={submitBlockReason}
                  onPublish={publishMoment}
                  isEditing={!!initialMoment}
                  topics={topics}
                  onAddTopic={addTopic}
                  onRemoveTopic={removeTopic}
                  onAttachStock={setAttachedStockSymbol}
                  attachedStockSymbol={attachedStockSymbol}
                />
              </Modal.Body>

              <DropZone.Input
                accept={MOMENT_IMAGE_ACCEPT}
                multiple
                aria-label="Upload moment images"
                onSelect={handleSelectFiles}
              />
            </DropZone>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
