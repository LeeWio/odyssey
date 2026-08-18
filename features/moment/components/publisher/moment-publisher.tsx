"use client";

import { useMemo } from "react";
import { Modal } from "@heroui/react";
import { DropZone } from "@heroui-pro/react";

import { useAppSelector } from "@/lib/hooks";
import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import { useGetCurrentUserQuery } from "@/lib/features/user/user-api";

import { useMomentPublish } from "../../hooks/use-moment-publish";
import { PublisherHeader } from "./publisher-header";
import { PublisherEditor } from "./publisher-editor";
import { PublisherGallery } from "./publisher-gallery";
import { PublisherToolbar } from "./publisher-toolbar";

interface MomentPublisherProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const MomentPublisher = ({ isOpen, onOpenChange }: MomentPublisherProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);

  const { data: currentUser } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });

  const userProfile = useMemo(() => {
    if (!isAuthenticated) return null;
    return {
      avatar: currentUser?.avatar,
      nickname: currentUser?.nickname,
      username: username,
    };
  }, [isAuthenticated, username, currentUser]);

  const {
    editorValue,
    setEditorValue,
    charCount,
    setCharCount,
    isEmpty,
    setIsEmpty,
    attachments,
    visibility,
    setVisibility,
    isSubmitting,
    handleSelectFiles,
    handleDrop,
    handleRemoveAttachment,
    publishMoment,
  } = useMomentPublish(() => {
    // on success callback
    onOpenChange(false);
  });

  const isSubmitDisabled = (isEmpty && attachments.length === 0) || charCount > 280 || isSubmitting;

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <DropZone className="w-full border-none bg-transparent p-0 shadow-none">
              {/* 1. Header */}
              <PublisherHeader
                visibility={visibility}
                onVisibilityChange={setVisibility}
                user={userProfile}
              />

              {/* 2. Body Area */}
              <Modal.Body className="flex flex-col gap-2">
                <DropZone.Area
                  onDrop={handleDrop}
                  className="flex w-full flex-col gap-2 border-none bg-transparent p-0 outline-none"
                >
                  <PublisherEditor
                    value={editorValue}
                    onValueChange={(val, details) => {
                      setEditorValue(val);
                      setCharCount(details.characterCount);
                      setIsEmpty(details.isEmpty);
                    }}
                    maxLength={280}
                  />

                  <PublisherGallery attachments={attachments} onRemove={handleRemoveAttachment} />
                </DropZone.Area>

                {/* 3. Toolbar */}
                <PublisherToolbar
                  charCount={charCount}
                  isSubmitting={isSubmitting}
                  isSubmitDisabled={isSubmitDisabled}
                  onPublish={publishMoment}
                />
              </Modal.Body>

              <DropZone.Input accept="image/*" multiple onSelect={handleSelectFiles} />
            </DropZone>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
